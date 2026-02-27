/**
 * TactileNav — 全局常量
 *
 * 基于方案A布局：3×5 DIY中心 + 15盲文模组
 * 
 * Pin编号顺序（grid一维数组）：
 *   [0-35]   前方盲文 F1-F6（每个6pin）
 *   [36-53]  左侧盲文 L1-L3（每个6pin）
 *   [54-71]  右侧盲文 R1-R3（每个6pin）
 *   [72-89]  后方盲文 B1-B3（每个6pin）
 *   [90-104] DIY核心区（3列×5行=15pin）
 *
 * 盲文pin: 值 0/1（二值）
 * DIY pin: 值 0/1/2（三档）
 *
 * 以后改布局只改下面 CONFIG 区域。
 */

// ═══════════════════════════════════════
//  CONFIG — 改这里
// ═══════════════════════════════════════

// 盲文模组：每个模组 2列×3行 = 6 pin
export const MODULE_PIN_COLS = 2;
export const MODULE_PIN_ROWS = 3;
export const PINS_PER_MODULE = MODULE_PIN_COLS * MODULE_PIN_ROWS;  // 6

// 各区域模组数量
export const FRONT_MODULES = 6;   // 前方：2行×3列
export const LEFT_MODULES  = 3;   // 左侧：3个
export const RIGHT_MODULES = 3;   // 右侧：3个
export const BACK_MODULES  = 3;   // 后方：1行×3列
export const TOTAL_MODULES = FRONT_MODULES + LEFT_MODULES + RIGHT_MODULES + BACK_MODULES;  // 15

// DIY核心区
export const DIY_COLS = 3;
export const DIY_ROWS = 5;
export const DIY_PINS = DIY_COLS * DIY_ROWS;  // 15

// 用户位置（DIY区内，从0开始）
export const DIY_USER_ROW = 3;   // 第4行（0-based）
export const DIY_USER_COL = 1;   // 第2列（0-based）

// ═══════════════════════════════════════
//  自动计算
// ═══════════════════════════════════════

// 各区域在grid中的起始索引
export const FRONT_START = 0;
export const LEFT_START  = FRONT_START + FRONT_MODULES * PINS_PER_MODULE;   // 36
export const RIGHT_START = LEFT_START  + LEFT_MODULES  * PINS_PER_MODULE;   // 54
export const BACK_START  = RIGHT_START + RIGHT_MODULES * PINS_PER_MODULE;   // 72
export const DIY_START   = BACK_START  + BACK_MODULES  * PINS_PER_MODULE;   // 90

export const BRAILLE_PINS = TOTAL_MODULES * PINS_PER_MODULE;  // 90
export const GRID_SIZE = BRAILLE_PINS + DIY_PINS;              // 105

// 用户位置在grid中的索引
export const SELF_INDEX = DIY_START + DIY_USER_ROW * DIY_COLS + DIY_USER_COL;  // 100

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
 * 判断 grid index 是否在 DIY 核心区
 */
export function isDiyPin(index) {
  return index >= DIY_START && index < DIY_START + DIY_PINS;
}

/**
 * 判断 grid index 是否在盲文区
 */
export function isBraillePin(index) {
  return index >= 0 && index < BRAILLE_PINS;
}

/**
 * 获取某个 grid index 属于哪个区域
 * 返回 'front' / 'left' / 'right' / 'back' / 'diy'
 */
export function getPinZone(index) {
  if (index < LEFT_START)  return 'front';
  if (index < RIGHT_START) return 'left';
  if (index < BACK_START)  return 'right';
  if (index < DIY_START)   return 'back';
  if (index < GRID_SIZE)   return 'diy';
  return null;
}

/**
 * 获取某个 grid index 所在的模组编号（盲文区）
 * 返回 'F1'-'F6', 'L1'-'L3', 'R1'-'R3', 'B1'-'B3'，DIY区返回null
 */
export function getModuleId(index) {
  const zone = getPinZone(index);
  if (zone === 'diy') return null;

  const prefixes = { front: 'F', left: 'L', right: 'R', back: 'B' };
  const starts   = { front: FRONT_START, left: LEFT_START, right: RIGHT_START, back: BACK_START };

  const offset = index - starts[zone];
  const moduleNum = Math.floor(offset / PINS_PER_MODULE) + 1;
  return prefixes[zone] + moduleNum;
}

/**
 * 获取所有 DIY 区的 grid index
 */
export function getDiyIndices() {
  const indices = [];
  for (let i = DIY_START; i < DIY_START + DIY_PINS; i++) {
    indices.push(i);
  }
  return indices;
}

/**
 * 获取所有盲文区的 grid index
 */
export function getBrailleIndices() {
  const indices = [];
  for (let i = 0; i < BRAILLE_PINS; i++) {
    indices.push(i);
  }
  return indices;
}