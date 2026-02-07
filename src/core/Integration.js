/**
 * Integration — 集成层
 *
 * 职责
 *   生命周期管理    start() / stop()
 *   模式切换        set_mode(mode) / toggle_mode()
 *   定时帧驱动      内部 setInterval 调用 tick()，帧率随模式自动同步
 *   事件路由        硬件 button event → 决策 → toggle_mode
 *   错误汇聚        硬件 report_error → 本层 on_error → 推入错误日志
 *   状态监控        记录帧率、延迟，暴露 get_stats() 供 UI 拉取
 *
 * 对外接口
 *   start() / stop()
 *   set_mode(mode) / toggle_mode()
 *   set_fps(fps)            调试页手动修改帧率
 *   simulate_button()       调试页模拟硬件按钮
 *   get_stats()             返回当前全状态快照
 *   onStateChange(fn)       注册状态变更回调（供 Vue 响应式层桥接）
 */

import { MODE_MAP, MODE_ZOOM, MODE_NAMES, DEFAULT_FPS } from "./constants.js";

export class Integration {
  constructor(hardware, algorithm) {
    this.hw  = hardware;
    this.alg = algorithm;

    // ── 核心状态 ──
    this._mode    = MODE_MAP;
    this._running = false;
    this._seq     = 0;
    this._fps     = DEFAULT_FPS[MODE_MAP];

    // ── 定时器 ──
    this._timerID = null;

    // ── 监控数据 ──
    this._lastTickTime  = 0;
    this._measuredFps   = 0;
    this._lastLatency   = 0;

    // ── 错误日志（最近 20 条）──
    this._errors = [];

    // ── UI 回调 ──
    this._onStateChange = null;

    // 注册硬件回调
    this.hw._registerCallbacks(
      (event) => this._handleButtonEvent(event),
      (event) => this._handleError(event)
    );
  }

  // ════════════════════════════════════════════
  // 生命周期
  // ════════════════════════════════════════════

  start() {
    if (this._running) return;
    this._running = true;
    this._seq     = 0;
    this._lastTickTime = 0;
    this._measuredFps  = 0;
    this._startTimer();
    console.log("[INT] started");
    this._notify();
  }

  stop() {
    if (!this._running) return;
    this._running = false;
    this._stopTimer();
    console.log("[INT] stopped");
    this._notify();
  }

  // ════════════════════════════════════════════
  // 模式切换
  // ════════════════════════════════════════════

  /**
   * 直接设置模式
   * @param {number} mode  MODE_MAP(0) 或 MODE_ZOOM(1)
   */
  set_mode(mode) {
    if (mode !== MODE_MAP && mode !== MODE_ZOOM) return;
    this._mode = mode;
    this._fps  = DEFAULT_FPS[mode];
    if (this._running) this._restartTimer();
    console.log(`[INT] mode → ${MODE_NAMES[mode]}, fps → ${this._fps}`);
    this._notify();
  }

  /** MAP ↔ ZOOM 切换 */
  toggle_mode() {
    this.set_mode(this._mode === MODE_MAP ? MODE_ZOOM : MODE_MAP);
  }

  // ════════════════════════════════════════════
  // 帧驱动
  // ════════════════════════════════════════════

  /**
   * 每帧回调：拉算法数据 → 推硬件
   * 由内部 setInterval 驱动，不需外部手动调用
   */
  tick() {
    if (!this._running) return;

    const t0 = performance.now();
    this._seq++;

    const grid = (this._mode === MODE_MAP)
      ? this.alg.produce_grid_map()
      : this.alg.produce_grid_zoom();

    this.hw.set_frame(this._seq, grid);

    // 监控计算
    const now = performance.now();
    if (this._lastTickTime > 0) {
      const interval = now - this._lastTickTime;
      this._measuredFps = interval > 0 ? Math.round(1000 / interval) : 0;
    }
    this._lastTickTime = now;
    this._lastLatency  = Math.round(now - t0);

    this._notify();
  }

  // ════════════════════════════════════════════
  // 错误处理
  // ════════════════════════════════════════════

  /**
   * 错误入口
   * @param {string} msg
   */
  on_error(msg) {
    this._errors.push({
      time: new Date().toLocaleTimeString(),
      msg
    });
    if (this._errors.length > 20) this._errors.shift();
    console.warn("[INT] error:", msg);
    this._notify();
  }

  // ════════════════════════════════════════════
  // 状态查询 & 调试接口
  // ════════════════════════════════════════════

  /**
   * 全状态快照（供 UI 拉取）
   */
  get_stats() {
    return {
      running:    this._running,
      mode:       this._mode,
      modeName:   MODE_NAMES[this._mode],
      fps:        this._fps,
      measuredFps: this._measuredFps,
      latency:    this._lastLatency,
      seq:        this._seq,
      connected:  true,  // TODO（队友）：接入实际 BLE 连接状态
      errors:     [...this._errors],
      lastGrid:   this.hw.getLastFrame().grid
    };
  }

  /** 注册状态变更回调 */
  onStateChange(fn) {
    this._onStateChange = fn;
  }

  /** 调试：手动设置帧率 */
  set_fps(fps) {
    const val = Math.max(1, Math.min(30, fps));
    this._fps = val;
    if (this._running) this._restartTimer();
    this._notify();
  }

  /** 调试：模拟硬件按钮触发 */
  simulate_button() {
    this.hw.on_button_event(1);
  }

  // ════════════════════════════════════════════
  // 内部
  // ════════════════════════════════════════════

  _handleButtonEvent(event) {
    // 集成层决策：value=1 → toggle
    if (event.value === 1) this.toggle_mode();
  }

  _handleError(event) {
    this.on_error(event.value);
  }

  _startTimer() {
    this._stopTimer();
    this._timerID = setInterval(() => this.tick(), 1000 / this._fps);
  }

  _stopTimer() {
    if (this._timerID !== null) {
      clearInterval(this._timerID);
      this._timerID = null;
    }
  }

  _restartTimer() {
    this._startTimer();
  }

  _notify() {
    if (this._onStateChange) this._onStateChange(this.get_stats());
  }
}