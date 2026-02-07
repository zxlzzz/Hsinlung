<template>
  <div class="grid-preview">
    <div v-for="(row, ri) in rows" :key="ri" class="grid-row">
      <div
        v-for="cell in row"
        :key="cell.c"
        :class="dotClass(cell)"
        :title="dotTitle(cell)"
      ></div>
    </div>
    <!-- 图例 -->
    <div class="grid-legend">
      <div class="legend-item">
        <div class="legend-dot l0"></div><span>未凸起</span>
      </div>
      <div class="legend-item">
        <div class="legend-dot l1"></div><span>中（level 1）</span>
      </div>
      <div class="legend-item">
        <div class="legend-dot l2"></div><span>高（level 2）</span>
      </div>
      <div class="legend-item">
        <div class="legend-dot self-dot"></div><span>自身点</span>
      </div>
    </div>
  </div>
</template>

<script>
/**
 * GridPreview — 3×5 触觉点阵可视化组件
 *
 * Props
 *   grid  number[15]  当前帧数据，值 ∈ {0,1,2}
 *
 * 渲染规则
 *   level 0 → 暗色空点
 *   level 1 → 中亮（仅地图模式会用到）
 *   level 2 → 高亮
 *   自身点 (1,2) → 橙色边框标记
 */
export default {
  name: "GridPreview",

  props: {
    grid: {
      type: Array,
      default: () => new Array(15).fill(0)
    }
  },

  computed: {
    rows() {
      const rows = [];
      for (let r = 0; r < 3; r++) {
        const row = [];
        for (let c = 0; c < 5; c++) {
          row.push({
            r, c,
            level: this.grid[r * 5 + c] || 0,
            isSelf: (r === 1 && c === 2)
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