/**
 * TactileNav — 全局常量
 *
 * 坐标约定（均 0-based）
 *   grid[15]，row-major：grid_flat[i] = grid[r][c], i = r*5 + c
 *   r = 0..2  上=前方, 下=后方
 *   c = 0..4  左=左侧, 右=右侧
 *   自身点：(1, 2)
 *
 * level ∈ {0, 1, 2}
 *   mode=MAP  时三档均可用；自身位置固定为 0
 *   mode=ZOOM 时仅用 {0, 2}
 *
 * 放大模式区域划分
 *   左字符：r=0..2, c=0..1 (3×2)
 *   分隔列：c=2，全为 0
 *   右字符：r=0..2, c=3..4 (3×2)
 */

export const MODE_MAP  = 0;   // 地图模式
export const MODE_ZOOM = 1;   // 放大模式

export const MODE_NAMES = {
  [MODE_MAP]:  "MAP",
  [MODE_ZOOM]: "ZOOM"
};

export const DEFAULT_FPS = {
  [MODE_MAP]:  5,
  [MODE_ZOOM]: 2
};

export const GRID_ROWS = 3;
export const GRID_COLS = 5;
export const GRID_SIZE = GRID_ROWS * GRID_COLS; // 15

export const SELF_R = 1;
export const SELF_C = 2;
export const SELF_INDEX = SELF_R * GRID_COLS + SELF_C; // 7

// 放大模式字符区域（用于生成和校验）
export const ZOOM_LEFT  = { rStart: 0, rEnd: 2, cStart: 0, cEnd: 1 }; // 3×2
export const ZOOM_RIGHT = { rStart: 0, rEnd: 2, cStart: 3, cEnd: 4 }; // 3×2
export const ZOOM_SEP_COL = 2; // 分隔列