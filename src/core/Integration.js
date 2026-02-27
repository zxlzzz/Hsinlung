/**
 * Integration — 系统集成层
 *
 * 改动：无逻辑变化，只是 constants.js 导出名没变所以直接兼容。
 * 原样保留，放这里是为了确保和新 constants.js 一起能跑。
 */

import { MODE_MAP, MODE_ZOOM, MODE_NAMES, DEFAULT_FPS } from "./constants.js";

export class Integration {
  constructor(hardware, algorithm) {
    this.hw  = hardware;
    this.alg = algorithm;

    this._mode    = MODE_MAP;
    this._running = false;
    this._seq     = 0;
    this._fps     = DEFAULT_FPS[MODE_MAP];

    this._timerID       = null;
    this._lastTickTime  = 0;
    this._measuredFps   = 0;
    this._lastLatency   = 0;

    this._errors = [];
    this._onStateChange = null;

    this.hw._registerCallbacks(
      (event) => this._handleButtonEvent(event),
      (event) => this._handleError(event)
    );
  }

  start() {
    if (this._running) return;
    this._running      = true;
    this._seq          = 0;
    this._lastTickTime = 0;
    this._measuredFps  = 0;
    this._startTimer();
    this._notify();
  }

  stop() {
    if (!this._running) return;
    this._running = false;
    this._stopTimer();
    this._notify();
  }

  set_mode(mode) {
    if (mode !== MODE_MAP && mode !== MODE_ZOOM) return;
    this._mode = mode;
    this._fps  = DEFAULT_FPS[mode];
    if (this._running) this._restartTimer();
    this._notify();
  }

  toggle_mode() {
    this.set_mode(this._mode === MODE_MAP ? MODE_ZOOM : MODE_MAP);
  }

  tick() {
    if (!this._running) return;
    const t0 = performance.now();
    this._seq++;
    const grid = (this._mode === MODE_MAP)
      ? this.alg.produce_grid_map()
      : this.alg.produce_grid_zoom();
    this.hw.set_frame(this._seq, grid);
    const now = performance.now();
    if (this._lastTickTime > 0) {
      const interval = now - this._lastTickTime;
      this._measuredFps = interval > 0 ? Math.round(1000 / interval) : 0;
    }
    this._lastTickTime = now;
    this._lastLatency  = Math.round(now - t0);
    this._notify();
  }

  on_error(msg) {
    this._errors.push({ time: new Date().toLocaleTimeString(), msg });
    if (this._errors.length > 20) this._errors.shift();
    this._notify();
  }

  get_stats() {
    return {
      running:     this._running,
      mode:        this._mode,
      modeName:    MODE_NAMES[this._mode],
      fps:         this._fps,
      measuredFps: this._measuredFps,
      latency:     this._lastLatency,
      seq:         this._seq,
      connected:   this.hw.isConnected(),
      errors:      [...this._errors],
      lastGrid:    this.hw.getLastFrame().grid
    };
  }

  onStateChange(fn) { this._onStateChange = fn; }

  set_fps(fps) {
    const val = Math.max(1, Math.min(30, fps));
    this._fps = val;
    if (this._running) this._restartTimer();
    this._notify();
  }

  simulate_button() { this.hw.on_button_event(1); }

  _handleButtonEvent(event) { if (event.value === 1) this.toggle_mode(); }
  _handleError(event) { this.on_error(event.value); }

  _startTimer() {
    this._stopTimer();
    this._timerID = setInterval(() => this.tick(), 1000 / this._fps);
  }
  _stopTimer() {
    if (this._timerID !== null) { clearInterval(this._timerID); this._timerID = null; }
  }
  _restartTimer() { this._startTimer(); }
  _notify() { if (this._onStateChange) this._onStateChange(this.get_stats()); }
}