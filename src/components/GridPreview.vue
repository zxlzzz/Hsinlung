<!--
  GridPreview — 31×21 触觉点阵可视化组件

  Props:
    grid  number[651]  当前帧数据，值 ∈ {0, 1, 2}

  渲染规则:
    level 0 → 暗色空点（无障碍）
    level 1 → 蓝色中亮（注意）
    level 2 → 高亮放大（危险）
    自身点 (20, 10) → 橙色边框标记
-->
<template>
  <div class="grid-preview">
    <div class="grid-container">
      <div v-for="(row, ri) in gridRows" :key="ri" class="grid-row">
        <div
          v-for="cell in row"
          :key="cell.c"
          :class="dotClass(cell)"
          :title="dotTitle(cell)"
        ></div>
      </div>
    </div>
    <div class="grid-legend">
      <div class="legend-item">
        <div class="legend-dot l0"></div><span>Level 0 (常平)</span>
      </div>
      <div class="legend-item">
        <div class="legend-dot l1"></div><span>Level 1 (中凸)</span>
      </div>
      <div class="legend-item">
        <div class="legend-dot l2"></div><span>Level 2 (全凸)</span>
      </div>
      <div class="legend-item">
        <div class="legend-dot self-dot"></div><span>自身点</span>
      </div>
    </div>
  </div>
</template>

<script>
import { GRID_ROWS, GRID_COLS, SELF_R, SELF_C } from "../core/constants.js";

export default {
  name: "GridPreview",

  props: {
    grid: {
      type: Array,
      default: () => new Array(GRID_ROWS * GRID_COLS).fill(0)
    }
  },

  computed: {
    gridRows() {
      const rows = [];
      for (let r = 0; r < GRID_ROWS; r++) {
        const row = [];
        for (let c = 0; c < GRID_COLS; c++) {
          row.push({
            r, c,
            level: this.grid[r * GRID_COLS + c] || 0,
            isSelf: (r === SELF_R && c === SELF_C)
          });
        }
        rows.push(row);
      }
      return rows;
    }
  },

  methods: {
    dotClass(cell) {
      return [
        "grid-dot",
        cell.level === 2 ? "high" : cell.level === 1 ? "mid" : "",
        cell.isSelf ? "self" : ""
      ].filter(Boolean).join(" ");
    },
    dotTitle(cell) {
      return `(${cell.r},${cell.c}) level=${cell.level}${cell.isSelf ? " [自身]" : ""}`;
    }
  }
};
</script>
