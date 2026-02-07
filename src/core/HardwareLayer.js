/**
 * HardwareLayer — 硬件通信层（Part 2: BLE 与点阵驱动）
 *
 * 本层负责与盲杖硬件的 BLE 通信，接收集成层发送的 grid 数据并驱动触觉点阵。
 *
 * ═══════════════════════════════════════════
 * 对外接口
 * ═══════════════════════════════════════════
 *   set_frame(seq, grid)         发送一帧数据到硬件
 *   on_button_event(value)       模拟/接收硬件按钮事件
 *   report_error(msg)            上报硬件错误
 *   _registerCallbacks(onBtn, onErr)  注册事件回调（供集成层调用）
 *   getLastFrame()               调试：获取上一帧快照
 *   isConnected()                查询 BLE 连接状态
 *
 * ═══════════════════════════════════════════
 * TODO（硬件组）需要实现的内容
 * ═══════════════════════════════════════════
 *
 * 1. BLE 连接管理
 *    - 实现 BLE 5.0 GATT 服务：GridData / ButtonEvent / ErrorStatus / DeviceInfo
 *    - 连接参数：间隔 15-30ms
 *    - 自动重连：断连后 <3秒 恢复
 *
 * 2. 数据传输
 *    - grid[651] 分包发送（单次 BLE 传输上限 20-244 字节）
 *    - 帧序号(seq)校验，检测丢包与乱序
 *    - 仅传输状态变化的触点（差分更新），降低带宽
 *
 * 3. 硬件事件接收
 *    - 按钮事件：短按/长按/双击 → 方向键 + 功能按钮
 *    - 错误状态：电量低/驱动异常/传感器故障
 *
 * 4. 容错与降级
 *    - 断连时点阵复位至安全状态（全 Level 0）
 *    - 电量 <20% 时降低刷新频率
 *
 * 参考文档：初赛文档.md §2.1.3, §2.1.5
 */

import { GRID_SIZE } from "./constants.js";

export class HardwareLayer {
  constructor() {
    this._onButtonEvent = null;
    this._onError       = null;
    this._lastSeq       = 0;
    this._lastGrid      = new Array(GRID_SIZE).fill(0);
    this._connected     = false;

    // TODO（硬件组）：初始化 BLE 适配器，扫描并连接设备
  }

  /**
   * 发送一帧数据到硬件点阵
   * @param {number}   seq   帧编号（从 1 递增）
   * @param {number[]} grid  长度 651，值 ∈ {0, 1, 2}
   */
  set_frame(seq, grid) {
    if (!grid || grid.length !== GRID_SIZE) {
      this.report_error("set_frame: grid 长度异常，期望 " + GRID_SIZE + "，实际 " + (grid ? grid.length : "null"));
      return;
    }
    this._lastSeq  = seq;
    this._lastGrid = [...grid];

    // TODO（硬件组）：替换为实际 BLE Write 逻辑
    //   1. 将 grid 按 GATT MTU 分包
    //   2. 写入 GridData 特征值
    //   3. 等待确认或检测超时
  }

  /**
   * 硬件按钮事件（模拟或从 BLE 接收）
   * @param {number} value  1=模式切换, 其他值预留给方向键
   */
  on_button_event(value) {
    const event = { type: "button", value };
    if (this._onButtonEvent) this._onButtonEvent(event);
  }

  /**
   * 硬件错误上报
   * @param {string} msg
   */
  report_error(msg) {
    const event = { type: "error", value: msg };
    if (this._onError) this._onError(event);
  }

  /**
   * 注册事件回调（由集成层调用）
   */
  _registerCallbacks(onButton, onError) {
    this._onButtonEvent = onButton;
    this._onError       = onError;
  }

  /**
   * 调试：获取上一帧数据快照
   */
  getLastFrame() {
    return { seq: this._lastSeq, grid: [...this._lastGrid] };
  }

  /**
   * 查询连接状态
   * TODO（硬件组）：返回实际 BLE 连接状态
   */
  isConnected() {
    return this._connected;
  }
}
