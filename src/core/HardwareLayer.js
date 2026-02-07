/**
 * HardwareLayer — 硬件层（MVP 阶段模拟实现）
 *
 * 实际项目中此层对接真实 BLE 设备；此处模拟逻辑供联调使用。
 *
 * 对外接口
 *   set_frame(seq, grid)      接收一帧并（模拟）推送到点阵
 *   on_button_event(value)    模拟硬件按钮按下，触发回调
 *   report_error(msg)         模拟硬件报错，触发回调
 *
 * 内部
 *   _registerCallbacks()      由集成层调用，注册 onButton / onError 回调
 *   getLastFrame()            调试用，获取上一帧快照
 */

import { GRID_SIZE } from "./constants.js";

export class HardwareLayer {
  constructor() {
    this._onButtonEvent = null;
    this._onError       = null;
    this._lastSeq       = 0;
    this._lastGrid      = new Array(GRID_SIZE).fill(0);
  }

  /**
   * 接收一帧数据并映射到点阵
   * @param {number}   seq   帧编号（从 1 开始）
   * @param {number[]} grid  长度 15，值 ∈ {0,1,2}
   */
  set_frame(seq, grid) {
    if (!grid || grid.length !== GRID_SIZE) {
      this.report_error("set_frame: grid 长度异常");
      return;
    }
    this._lastSeq  = seq;
    this._lastGrid = [...grid];
    // TODO（队友）：此处替换为实际 BLE Write 逻辑
    console.log(`[HW] frame #${seq} →`, grid);
  }

  /**
   * 模拟按钮事件推送
   * @param {number} value  当前仅定义 1 = 切换模式
   */
  on_button_event(value) {
    const event = { type: "button", value };
    console.log("[HW] button event →", event);
    if (this._onButtonEvent) this._onButtonEvent(event);
  }

  /**
   * 硬件主动报错
   * @param {string} msg
   */
  report_error(msg) {
    const event = { type: "error", value: msg };
    console.log("[HW] error →", event);
    if (this._onError) this._onError(event);
  }

  /** 集成层注册回调（内部使用） */
  _registerCallbacks(onButton, onError) {
    this._onButtonEvent = onButton;
    this._onError       = onError;
  }

  /** 调试：获取上一帧 */
  getLastFrame() {
    return { seq: this._lastSeq, grid: [...this._lastGrid] };
  }
}