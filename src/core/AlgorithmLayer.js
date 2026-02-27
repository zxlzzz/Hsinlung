/**
 * AlgorithmLayer — 算法层
 *
 * 改动：适配105pin扁平grid
 *   grid[0-89]  盲文区：随机生成 0/1
 *   grid[90-104] DIY区：随机生成 0/1/2
 *   grid[SELF_INDEX] 固定为 0
 *
 * TODO（算法组）：替换 produce_grid_map/zoom 为实际深度估计输出
 */

import { GRID_SIZE, SELF_INDEX, isDiyPin } from "./constants.js";

export class AlgorithmLayer {
  constructor() {}

  produce_grid_map() {
    const grid = new Array(GRID_SIZE);
    for (let i = 0; i < GRID_SIZE; i++) {
      if (isDiyPin(i)) {
        // DIY区：三档
        grid[i] = Math.random() < 0.25 ? (Math.random() < 0.5 ? 1 : 2) : 0;
      } else {
        // 盲文区：二值
        grid[i] = Math.random() < 0.25 ? 1 : 0;
      }
    }
    grid[SELF_INDEX] = 0;
    return grid;
  }

  produce_grid_zoom() {
    return new Array(GRID_SIZE).fill(0);
  }
}