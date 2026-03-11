/**
 * TactileNav — 全局常量
 *
 * 基于灵触·随行方案：15模组，5行×3列布局
 * 每模组：2行×3列 = 6pin（横置）
 *
 * Pin编号顺序（grid一维数组）：
 *   [0-5]   M1  (行0, 列0)
 *   [6-11]  M2  (行0, 列1)
 *   [12-17] M3  (行0, 列2)
 *   [18-23] M4  (行1, 列0)
 *   ...
 *   [84-89] M15 (行4, 列2)
 *
 * 所有pin: 值 0/1（二值）
 *
 * 以后改布局只改下面 CONFIG 区域。
 */

// ═══════════════════════════════════════
//  CONFIG — 改这里
// ═══════════════════════════════════════

// 每模组：3列×2行 = 6 pin（横置）
export const MODULE_PIN_COLS = 3;
export const MODULE_PIN_ROWS = 2;
export const PINS_PER_MODULE = MODULE_PIN_COLS * MODULE_PIN_ROWS;  // 6

// 布局结构：5行×3列 = 15模组
export const MODULE_ROWS = 5;
export const MODULE_COLS = 3;
export const TOTAL_MODULES = MODULE_ROWS * MODULE_COLS;  // 15

// ═══════════════════════════════════════
//  自动计算
// ═══════════════════════════════════════

export const GRID_SIZE = TOTAL_MODULES * PINS_PER_MODULE;  // 90

// 模式
export const MODE_MAP  = 0;
export const MODE_ZOOM = 1;

export const MODE_NAMES = {
  [MODE_MAP]:  "MAP",
  [MODE_ZOOM]: "ZOOM"
};

export const DEFAULT_FPS = {
  [MODE_MAP]:  5,
  [MODE_ZOOM]: 2
};

// ═══════════════════════════════════════
//  辅助函数
// ═══════════════════════════════════════

/**
 * 获取某个 grid index 所在的模组编号
 * 返回 'M1'-'M15'
 */
export function getModuleId(index) {
  const moduleIndex = Math.floor(index / PINS_PER_MODULE);
  return `M${moduleIndex + 1}`;
}

/**
 * 获取模组的行列位置（0-based）
 * @param {number} moduleIndex 0-14
 * @returns {{ row: number, col: number }}
 */
export function getModuleRC(moduleIndex) {
  return {
    row: Math.floor(moduleIndex / MODULE_COLS),
    col: moduleIndex % MODULE_COLS
  };
}

/**
 * 获取某个 grid index 在全局物理网格中的行列位置
 * 全局物理网格：10行（MODULE_ROWS×MODULE_PIN_ROWS）× 9列（MODULE_COLS×MODULE_PIN_COLS）
 * @returns {{ row: number, col: number }}
 */
export function getPinRC(index) {
  const moduleIndex = Math.floor(index / PINS_PER_MODULE);
  const pinOffset   = index % PINS_PER_MODULE;
  const modRow = Math.floor(moduleIndex / MODULE_COLS);
  const modCol = moduleIndex % MODULE_COLS;
  const pinRow = Math.floor(pinOffset / MODULE_PIN_COLS);
  const pinCol = pinOffset % MODULE_PIN_COLS;
  return {
    row: modRow * MODULE_PIN_ROWS + pinRow,
    col: modCol * MODULE_PIN_COLS + pinCol
  };
}
