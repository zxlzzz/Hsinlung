<!--
  GridPreview — 90pin 触觉点阵可视化

  按 5行×3列 模组布局展示（M1-M15）
  每模组：3列×2行 = 6 pin
  所有pin: level 0=暗, 1=亮（二值）
-->
<template>
  <div class="grid-preview">
    <div class="module-layout">
      <div
        v-for="(mod, mi) in modules"
        :key="mi"
        class="module-block"
        :style="{ gridRow: mod.row + 1, gridColumn: mod.col + 1 }"
      >
        <div class="module-label">{{ mod.id }}</div>
        <div class="module-pins">
          <div
            v-for="pin in mod.pins"
            :key="pin.index"
            :class="dotClass(pin.index)"
            :title="dotTitle(pin.index)"
          ></div>
        </div>
      </div>
    </div>

    <!-- 图例 -->
    <div class="grid-legend">
      <div class="legend-item"><div class="legend-dot l0"></div><span>Level 0</span></div>
      <div class="legend-item"><div class="legend-dot l1"></div><span>Level 1</span></div>
    </div>
  </div>
</template>

<script>
import {
  GRID_SIZE, PINS_PER_MODULE, TOTAL_MODULES, MODULE_COLS,
  getModuleId, getModuleRC
} from "../core/constants.js";

function buildModules() {
  const mods = [];
  for (let m = 0; m < TOTAL_MODULES; m++) {
    const { row, col } = getModuleRC(m);
    const pins = [];
    for (let p = 0; p < PINS_PER_MODULE; p++) {
      pins.push({ index: m * PINS_PER_MODULE + p });
    }
    mods.push({ id: `M${m + 1}`, row, col, pins });
  }
  return mods;
}

export default {
  name: "GridPreview",

  props: {
    grid: {
      type: Array,
      default: () => new Array(GRID_SIZE).fill(0)
    }
  },

  computed: {
    modules() { return buildModules(); }
  },

  methods: {
    dotClass(index) {
      const level = this.grid[index] || 0;
      return ["grid-dot", level === 1 ? "lit" : ""].filter(Boolean).join(" ");
    },

    dotTitle(index) {
      const level = this.grid[index] || 0;
      return `#${index} [${getModuleId(index)}] level=${level}`;
    }
  }
};
</script>

<style scoped>
.grid-preview { display: flex; flex-direction: column; align-items: center; gap: 8px; }

.module-layout {
  display: grid;
  grid-template-columns: repeat(3, auto);
  grid-template-rows: repeat(5, auto);
  gap: 6px;
}

.module-block { text-align: center; }
.module-label { font-size: 8px; color: #475569; margin-bottom: 2px; }
.module-pins {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2px;
}

.grid-dot {
  width: 10px; height: 10px; border-radius: 50%;
  background: #1e293b; border: 1px solid #334155;
  transition: all 0.15s;
}
.grid-dot.lit { background: #ffffff; border-color: #c4c8d4; }

.grid-legend {
  display: flex; gap: 12px; margin-top: 8px; font-size: 10px; color: #94a3b8;
}
.legend-item { display: flex; align-items: center; gap: 4px; }
.legend-dot { width: 8px; height: 8px; border-radius: 50%; }
.legend-dot.l0 { background: #1e293b; border: 1px solid #334155; }
.legend-dot.l1 { background: #ffffff; border: 1px solid #c4c8d4; }
</style>
