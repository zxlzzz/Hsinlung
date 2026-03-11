/**
 * AlgorithmLayer — 算法层
 *
 * 适配90pin扁平grid（15模组，5行×3列，每模组2行×3列）
 * 所有pin：值 0/1（二值）
 *
 * TODO（算法组）：替换 produce_grid_map/zoom 为实际深度估计输出
 */

import { GRID_SIZE } from "./constants.js";

export class AlgorithmLayer {
  constructor() {}

  produce_grid_map() {
    const grid = new Array(GRID_SIZE);
    for (let i = 0; i < GRID_SIZE; i++) {
      grid[i] = Math.random() < 0.25 ? 1 : 0;
    }
    return grid;
  }

  produce_grid_zoom() {
    return new Array(GRID_SIZE).fill(0);
  }
}
