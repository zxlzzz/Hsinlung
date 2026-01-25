export const GRID_H = 3;
export const GRID_W = 5;
export const GRID_LEN = GRID_H * GRID_W;
export const GRID_SELF = { r: 1, c: 2 };

export const MODES = {
  MAP: 0,
  ZOOM: 1,
};

export const LEVELS = {
  OFF: 0,
  MID: 1,
  HIGH: 2,
};

export const DEFAULT_REFRESH_HZ = {
  [MODES.MAP]: 5,
  [MODES.ZOOM]: 2,
};

/**
 * @typedef {Object} CoreDeps
 * @property {Object} algo
 * @property {Object} hw
 */

/**
 * @typedef {Object} RuntimeFrame
 * @property {number} seq
 * @property {number[]} grid
 */

export function create_empty_grid() {
  return Array.from({ length: GRID_LEN }, () => LEVELS.OFF);
}

export function createCore({ algo, hw }) {
  function start() {
    void algo;
    void hw;
  }

  function stop() {}

  function set_mode(mode) {
    void mode;
  }

  function toggle_mode() {}

  function tick() {}

  function on_error(message) {
    void message;
  }

  return {
    start,
    stop,
    set_mode,
    toggle_mode,
    tick,
    on_error,
  };
}
