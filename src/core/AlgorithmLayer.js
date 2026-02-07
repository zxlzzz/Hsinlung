/**
 * AlgorithmLayer — 算法层（占位实现）
 *
 * 对外接口
 *   set_zoom_content({ left, right })   预设放大模式要显示的双字符内容
 *   produce_grid_map()  -> grid[15]     地图模式当前帧（MVP 阶段返回虚拟数据）
 *   produce_grid_zoom() -> grid[15]     放大模式当前帧（从 _zoomContent 生成）
 *
 * TODO（队友）
 *   produce_grid_map：接入摄像头 + 深度估计算法，替换随机占位数据
 */

import {
  GRID_SIZE, GRID_COLS,
  SELF_R, SELF_C, SELF_INDEX
} from "./constants.js";

export class AlgorithmLayer {
  constructor() {
    // 放大模式内容状态
    // left / right 各为 3×2 = 6 个点，行优先展开，值 ∈ {0, 2}
    this._zoomContent = {
      left:  new Array(6).fill(0),
      right: new Array(6).fill(0)
    };
  }

  /**
   * 预设放大模式内容
   * @param {Object} content
   * @param {number[]} content.left   长度 6，值 ∈ {0, 2}，3×2 左字符（行优先）
   * @param {number[]} content.right  长度 6，值 ∈ {0, 2}，3×2 右字符（行优先）
   */
  set_zoom_content(content) {
    if (!content) return;
    if (content.left  && content.left.length  === 6) this._zoomContent.left  = [...content.left];
    if (content.right && content.right.length === 6) this._zoomContent.right = [...content.right];
  }

  /**
   * 地图模式：返回当前一帧 grid[15]
   * MVP 占位：随机生成障碍物分布，自身点固定为 0
   * @returns {number[]}
   */
  produce_grid_map() {
    // TODO（队友）：替换为摄像头 + 深度估计输出
    const grid = Array.from({ length: GRID_SIZE }, () =>
      Math.random() < 0.3 ? (Math.random() < 0.5 ? 1 : 2) : 0
    );
    grid[SELF_INDEX] = 0; // 自身点固定为 0
    return grid;
  }

  /**
   * 放大模式：根据 _zoomContent 生成 grid[15]
   *   左字符 → c=0..1
   *   分隔列 → c=2 全 0
   *   右字符 → c=3..4
   * @returns {number[]}
   */
  produce_grid_zoom() {
    const grid = new Array(GRID_SIZE).fill(0);
    const { left, right } = this._zoomContent;

    // 左字符：r=0..2, c=0..1
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 2; c++) {
        grid[r * GRID_COLS + c] = left[r * 2 + c] || 0;
      }
    }
    // 分隔列 c=2 已默认为 0

    // 右字符：r=0..2, c=3..4
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 2; c++) {
        grid[r * GRID_COLS + (c + 3)] = right[r * 2 + c] || 0;
      }
    }
    return grid;
  }
}