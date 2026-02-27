/**
 * HardwareLayer — 硬件通信层（Web Bluetooth 实现）
 *
 * 基于105pin扁平grid：
 *   grid[0-89]  = 盲文区，值限制为 0/1
 *   grid[90-104] = DIY区，值 0/1/2
 *
 * 接口签名与原版完全兼容，Integration.js 不需要改。
 */

import { GRID_SIZE, isDiyPin } from "./constants.js";

const SERVICE_UUID      = "0000ffe0-0000-1000-8000-00805f9b34fb";
const CHAR_TACTILE_UUID = "0000ffe1-0000-1000-8000-00805f9b34fb";
const CHAR_MODE_UUID    = "0000ffe2-0000-1000-8000-00805f9b34fb";
const CHAR_STATUS_UUID  = "0000ffe3-0000-1000-8000-00805f9b34fb";

const FRAME_FULL = 0x01;
const FRAME_DIFF = 0x02;
const CMD_MODE   = 0x10;
const FULL_FRAME_INTERVAL = 10;
const DIFF_THRESHOLD = 0.5;

export class HardwareLayer {
  constructor() {
    this._onButtonEvent = null;
    this._onError       = null;
    this._lastSeq       = 0;
    this._lastGrid      = new Array(GRID_SIZE).fill(0);
    this._connected     = false;

    this._device      = null;
    this._server      = null;
    this._charTactile = null;
    this._charMode    = null;
    this._charStatus  = null;

    this._prevSentGrid = new Array(GRID_SIZE).fill(0);
    this._framesSinceFullFrame = 999;

    this._sending   = false;
    this._sendQueue = [];
    this._deviceStatus = { battery: -1, errorCode: 0, lastSeq: 0 };
  }

  // ══════════════ BLE 连接 ══════════════

  async connect() {
    if (!navigator.bluetooth) {
      this.report_error("浏览器不支持 Web Bluetooth，请用 Android Chrome");
      return false;
    }
    try {
      this._device = await navigator.bluetooth.requestDevice({
        filters: [{ namePrefix: "LingChu" }],
        optionalServices: [SERVICE_UUID]
      });
      this._device.addEventListener("gattserverdisconnected", () => this._onDisconnected());

      this._server = await this._device.gatt.connect();
      const svc = await this._server.getPrimaryService(SERVICE_UUID);
      this._charTactile = await svc.getCharacteristic(CHAR_TACTILE_UUID);
      this._charMode    = await svc.getCharacteristic(CHAR_MODE_UUID);

      try {
        this._charStatus = await svc.getCharacteristic(CHAR_STATUS_UUID);
        await this._charStatus.startNotifications();
        this._charStatus.addEventListener("characteristicvaluechanged",
          (e) => this._onStatusNotify(e.target.value));
      } catch (_) {}

      this._connected = true;
      this._prevSentGrid = new Array(GRID_SIZE).fill(0);
      this._framesSinceFullFrame = 999;
      console.log("[BLE] 已连接:", this._device.name);
      return true;
    } catch (err) {
      if (err.name !== "NotFoundError") this.report_error("BLE连接失败: " + err.message);
      return false;
    }
  }

  disconnect() {
    if (this._device && this._device.gatt.connected) this._device.gatt.disconnect();
    this._onDisconnected();
  }

  _onDisconnected() {
    this._connected = false;
    this._charTactile = this._charMode = this._charStatus = null;
    this._sending = false;
    this._sendQueue = [];
    console.log("[BLE] 已断开");
    this._tryReconnect();
  }

  async _tryReconnect() {
    if (!this._device) return;
    for (let i = 1; i <= 3; i++) {
      console.log(`[BLE] 重连 ${i}/3...`);
      await new Promise(r => setTimeout(r, 2000));
      try {
        this._server = await this._device.gatt.connect();
        const svc = await this._server.getPrimaryService(SERVICE_UUID);
        this._charTactile = await svc.getCharacteristic(CHAR_TACTILE_UUID);
        this._charMode    = await svc.getCharacteristic(CHAR_MODE_UUID);
        try {
          this._charStatus = await svc.getCharacteristic(CHAR_STATUS_UUID);
          await this._charStatus.startNotifications();
          this._charStatus.addEventListener("characteristicvaluechanged",
            (e) => this._onStatusNotify(e.target.value));
        } catch (_) {}
        this._connected = true;
        this._framesSinceFullFrame = 999;
        console.log("[BLE] 重连成功");
        return;
      } catch (_) {}
    }
    this.report_error("自动重连失败，请手动重新连接");
  }

  // ══════════════ 帧编码 ══════════════

  _packGrid(grid) {
    const byteLen = Math.ceil(GRID_SIZE / 4);
    const packed = new Uint8Array(byteLen);
    for (let i = 0; i < GRID_SIZE; i++) {
      const byteIdx = i >> 2;
      const shift = (3 - (i & 3)) * 2;
      packed[byteIdx] |= (grid[i] & 0x03) << shift;
    }
    return packed;
  }

  _xor(data, from, to) {
    let x = 0;
    for (let i = from; i <= to; i++) x ^= data[i];
    return x;
  }

  _buildFullFrame(seq, mode, grid) {
    const gridBytes = this._packGrid(grid);
    const frame = new Uint8Array(4 + gridBytes.length + 1);
    frame[0] = FRAME_FULL;
    frame[1] = seq & 0xFF;
    frame[2] = mode;
    frame[3] = 0x00;
    frame.set(gridBytes, 4);
    frame[frame.length - 1] = this._xor(frame, 4, frame.length - 2);
    return frame;
  }

  _buildDiffFrame(seq, changes) {
    const len = 4 + changes.length * 3 + 1;
    const frame = new Uint8Array(len);
    frame[0] = FRAME_DIFF;
    frame[1] = seq & 0xFF;
    frame[2] = (changes.length >> 8) & 0xFF;
    frame[3] = changes.length & 0xFF;
    for (let i = 0; i < changes.length; i++) {
      const off = 4 + i * 3;
      frame[off]     = (changes[i].index >> 8) & 0xFF;
      frame[off + 1] = changes[i].index & 0xFF;
      frame[off + 2] = changes[i].value & 0xFF;
    }
    frame[len - 1] = this._xor(frame, 4, len - 2);
    return frame;
  }

  _buildModeCmd(mode, direction = 0) {
    const f = new Uint8Array(4);
    f[0] = CMD_MODE; f[1] = mode; f[2] = direction;
    f[3] = f[0] ^ f[1] ^ f[2];
    return f;
  }

  // ══════════════ 发送队列 ══════════════

  async _enqueue(char, data) {
    return new Promise((resolve, reject) => {
      this._sendQueue.push({ char, data, resolve, reject });
      this._flush();
    });
  }

  async _flush() {
    if (this._sending || this._sendQueue.length === 0) return;
    this._sending = true;
    while (this._sendQueue.length > 0) {
      const { char, data, resolve, reject } = this._sendQueue.shift();
      try {
        await char.writeValueWithoutResponse(data.buffer);
        resolve();
      } catch (err) { reject(err); }
    }
    this._sending = false;
  }

  // ══════════════ 对外接口 ══════════════

  set_frame(seq, grid) {
    if (!grid || grid.length !== GRID_SIZE) {
      this.report_error("grid长度异常: " + (grid ? grid.length : "null"));
      return;
    }

    // 盲文区强制限制为0/1
    const safeGrid = [...grid];
    for (let i = 0; i < GRID_SIZE; i++) {
      if (!isDiyPin(i) && safeGrid[i] > 1) safeGrid[i] = 1;
    }

    this._lastSeq  = seq;
    this._lastGrid = safeGrid;

    if (!this._connected || !this._charTactile) return;

    this._framesSinceFullFrame++;
    let frame;

    if (this._framesSinceFullFrame >= FULL_FRAME_INTERVAL) {
      frame = this._buildFullFrame(seq, 0, safeGrid);
      this._framesSinceFullFrame = 0;
      this._prevSentGrid = [...safeGrid];
    } else {
      const changes = [];
      for (let i = 0; i < GRID_SIZE; i++) {
        if (safeGrid[i] !== this._prevSentGrid[i]) {
          changes.push({ index: i, value: safeGrid[i] });
        }
      }
      if (changes.length === 0) return;
      if (changes.length / GRID_SIZE > DIFF_THRESHOLD) {
        frame = this._buildFullFrame(seq, 0, safeGrid);
        this._framesSinceFullFrame = 0;
      } else {
        frame = this._buildDiffFrame(seq, changes);
      }
      this._prevSentGrid = [...safeGrid];
    }

    this._enqueue(this._charTactile, frame).catch((err) => {
      this.report_error("发送失败: " + err.message);
    });
  }

  sendModeCommand(mode, direction = 0) {
    if (!this._connected || !this._charMode) return;
    this._enqueue(this._charMode, this._buildModeCmd(mode, direction)).catch((err) => {
      this.report_error("模式指令发送失败: " + err.message);
    });
  }

  on_button_event(value) {
    if (this._onButtonEvent) this._onButtonEvent({ type: "button", value });
  }

  report_error(msg) {
    console.error("[HW]", msg);
    if (this._onError) this._onError({ type: "error", value: msg });
  }

  _registerCallbacks(onButton, onError) {
    this._onButtonEvent = onButton;
    this._onError       = onError;
  }

  getLastFrame() {
    return { seq: this._lastSeq, grid: [...this._lastGrid] };
  }

  isConnected() {
    return this._connected;
  }

  getStatus() {
    return { ...this._deviceStatus };
  }

  _onStatusNotify(dataView) {
    if (dataView.byteLength < 5 || dataView.getUint8(0) !== 0x20) return;
    this._deviceStatus = {
      battery:   dataView.getUint8(1),
      errorCode: dataView.getUint8(2),
      lastSeq:   dataView.getUint8(3)
    };
    if (this._deviceStatus.battery > 0 && this._deviceStatus.battery < 20)
      this.report_error("电量低: " + this._deviceStatus.battery + "%");
    if (this._deviceStatus.errorCode !== 0)
      this.report_error("设备错误: 0x" + this._deviceStatus.errorCode.toString(16));
  }
}