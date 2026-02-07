/**
 * TactileNav — 全局常量
 *
 * 点阵规格：31行 × 21列，共 651 个触点
 * 物理尺寸：约 7.75cm(高) × 5.25cm(宽)，触点间距 2.5mm
 *
 * 坐标约定（0-based，行优先展开）
 *   grid[651]  →  grid[i] = grid[r][c],  i = r * GRID_COLS + c
 *
 *   行方向（r）：前后轴
 *     r=0  → 最前方（远场）
 *     r=20 → 自身位置
 *     r=30 → 最后方
 *
 *   列方向（c）：左右轴
 *     c=0  → 最左侧
 *     c=10 → 自身位置
 *     c=20 → 最右侧
 *
 *   自身点：(r=20, c=10)
 *
 * 距离映射（前方 r=0..19，共 20 行）
 *   远场区 r=0..4   （5行）：每行 50cm，覆盖 2.5-4.5m
 *   中场区 r=5..14  （10行）：每行 20cm，覆盖 0.5-2.5m
 *   近场区 r=15..19 （5行）：每行 10cm，覆盖 0-0.5m
 *
 * 距离映射（后方 r=21..30，共 10 行）
 *   靠内 r=21..25（5行）：每行 10cm，覆盖 0-0.5m
 *   靠外 r=26..30（5行）：每行 20cm，覆盖 0.5-1.5m
 *
 * level ∈ {0, 1, 2}
 *   0 = 常平（无障碍，安全通行）
 *   1 = 中等凸起（远端/低威胁障碍，提醒注意）
 *   2 = 完全凸起（近距离高风险，需立即避让）
 */

export const MODE_MAP  = 0;   // 地图模式（俯视图，全方位态势感知）
export const MODE_ZOOM = 1;   // 放大模式（侧视图，局部细节识别）

export const MODE_NAMES = {
  [MODE_MAP]:  "MAP",
  [MODE_ZOOM]: "ZOOM"
};

export const DEFAULT_FPS = {
  [MODE_MAP]:  5,   // 地图模式 5Hz
  [MODE_ZOOM]: 2    // 放大模式 2Hz
};

export const GRID_ROWS = 31;
export const GRID_COLS = 21;
export const GRID_SIZE = GRID_ROWS * GRID_COLS; // 651

// 自身点位置（0-based）
export const SELF_R = 20;
export const SELF_C = 10;
export const SELF_INDEX = SELF_R * GRID_COLS + SELF_C;
