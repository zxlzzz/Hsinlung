<!--
  GridPreview — 105pin 触觉点阵可视化
  
  按区域分块显示：前方 / 左侧 / DIY核心 / 右侧 / 后方
  盲文区: level 0=暗, 1=亮
  DIY区: level 0=暗, 1=蓝, 2=红
  用户位置: 橙色标记
-->
<template>
  <div class="grid-preview">
    <!-- 前方 F1-F6 -->
    <div class="zone-label">前方 (F1-F6)</div>
    <div class="zone front-zone">
      <div v-for="(mod, mi) in frontModules" :key="'f'+mi" class="module-block">
        <div class="module-label">{{ mod.id }}</div>
        <div class="module-pins">
          <div
            v-for="pin in mod.pins"
            :key="pin.index"
            :class="dotClass(pin)"
            :title="dotTitle(pin)"
          ></div>
        </div>
      </div>
    </div>

    <!-- 中间行：左侧 + DIY + 右侧 -->
    <div class="middle-row">
      <!-- 左侧 L1-L3 -->
      <div class="side-zone">
        <div class="zone-label">左 (L1-L3)</div>
        <div v-for="(mod, mi) in leftModules" :key="'l'+mi" class="module-block">
          <div class="module-label">{{ mod.id }}</div>
          <div class="module-pins">
            <div
              v-for="pin in mod.pins"
              :key="pin.index"
              :class="dotClass(pin)"
              :title="dotTitle(pin)"
            ></div>
          </div>
        </div>
      </div>

      <!-- DIY核心区 -->
      <div class="diy-zone">
        <div class="zone-label">DIY核心 (3×5)</div>
        <div class="diy-grid">
          <div
            v-for="pin in diyPins"
            :key="pin.index"
            :class="dotClass(pin)"
            :title="dotTitle(pin)"
          ></div>
        </div>
      </div>

      <!-- 右侧 R1-R3 -->
      <div class="side-zone">
        <div class="zone-label">右 (R1-R3)</div>
        <div v-for="(mod, mi) in rightModules" :key="'r'+mi" class="module-block">
          <div class="module-label">{{ mod.id }}</div>
          <div class="module-pins">
            <div
              v-for="pin in mod.pins"
              :key="pin.index"
              :class="dotClass(pin)"
              :title="dotTitle(pin)"
            ></div>
          </div>
        </div>
      </div>
    </div>

    <!-- 后方 B1-B3 -->
    <div class="zone-label">后方 (B1-B3)</div>
    <div class="zone back-zone">
      <div v-for="(mod, mi) in backModules" :key="'b'+mi" class="module-block">
        <div class="module-label">{{ mod.id }}</div>
        <div class="module-pins">
          <div
            v-for="pin in mod.pins"
            :key="pin.index"
            :class="dotClass(pin)"
            :title="dotTitle(pin)"
          ></div>
        </div>
      </div>
    </div>

    <!-- 图例 -->
    <div class="grid-legend">
      <div class="legend-item"><div class="legend-dot l0"></div><span>Level 0</span></div>
      <div class="legend-item"><div class="legend-dot l1"></div><span>Level 1</span></div>
      <div class="legend-item"><div class="legend-dot l2"></div><span>Level 2 (DIY)</span></div>
      <div class="legend-item"><div class="legend-dot self-dot"></div><span>用户位置</span></div>
    </div>
  </div>
</template>

<script>
import {
  GRID_SIZE, PINS_PER_MODULE, MODULE_PIN_COLS, MODULE_PIN_ROWS,
  FRONT_MODULES, LEFT_MODULES, RIGHT_MODULES, BACK_MODULES,
  FRONT_START, LEFT_START, RIGHT_START, BACK_START, DIY_START,
  DIY_COLS, DIY_ROWS, DIY_PINS, SELF_INDEX, isDiyPin, getModuleId
} from "../core/constants.js";

function buildModules(start, count, prefix) {
  const modules = [];
  for (let m = 0; m < count; m++) {
    const pins = [];
    for (let p = 0; p < PINS_PER_MODULE; p++) {
      const index = start + m * PINS_PER_MODULE + p;
      pins.push({ index, pinInModule: p });
    }
    modules.push({ id: prefix + (m + 1), pins });
  }
  return modules;
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
    frontModules() { return buildModules(FRONT_START, FRONT_MODULES, 'F'); },
    leftModules()  { return buildModules(LEFT_START,  LEFT_MODULES,  'L'); },
    rightModules() { return buildModules(RIGHT_START, RIGHT_MODULES, 'R'); },
    backModules()  { return buildModules(BACK_START,  BACK_MODULES,  'B'); },

    diyPins() {
      const pins = [];
      for (let i = 0; i < DIY_PINS; i++) {
        pins.push({ index: DIY_START + i });
      }
      return pins;
    }
  },

  methods: {
    dotClass(pin) {
      const level = this.grid[pin.index] || 0;
      const isSelf = pin.index === SELF_INDEX;
      const diy = isDiyPin(pin.index);
      return [
        "grid-dot",
        diy ? "diy-dot" : "braille-dot",
        level === 2 ? "high" : level === 1 ? "mid" : "",
        isSelf ? "self" : ""
      ].filter(Boolean).join(" ");
    },

    dotTitle(pin) {
      const level = this.grid[pin.index] || 0;
      const isSelf = pin.index === SELF_INDEX;
      const modId = getModuleId(pin.index);
      const zone = modId ? modId : "DIY";
      return `#${pin.index} [${zone}] level=${level}${isSelf ? " ★用户" : ""}`;
    }
  }
};
</script>

<style scoped>
.grid-preview { display: flex; flex-direction: column; align-items: center; gap: 8px; }

.zone-label { font-size: 10px; color: #64748b; margin-top: 4px; }

.zone, .back-zone, .front-zone { display: flex; gap: 6px; justify-content: center; }

.middle-row { display: flex; gap: 12px; align-items: center; }
.side-zone { display: flex; flex-direction: column; gap: 4px; align-items: center; }
.diy-zone { display: flex; flex-direction: column; align-items: center; }

.module-block { text-align: center; }
.module-label { font-size: 8px; color: #475569; margin-bottom: 2px; }
.module-pins {
  display: grid;
  grid-template-columns: repeat(2, 1fr); /* 2列 per module */
  gap: 2px;
}

.diy-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr); /* 3列 DIY */
  gap: 4px;
}

.grid-dot {
  width: 10px; height: 10px; border-radius: 50%;
  background: #1e293b; border: 1px solid #334155;
  transition: all 0.15s;
}

.grid-dot.mid { background: #3b82f6; border-color: #60a5fa; }
.grid-dot.high { background: #ef4444; border-color: #f87171; transform: scale(1.2); }
.grid-dot.self { border: 2px solid #f59e0b; box-shadow: 0 0 4px #f59e0b88; }

.diy-dot { width: 14px; height: 14px; }

.grid-legend {
  display: flex; gap: 12px; margin-top: 8px; font-size: 10px; color: #94a3b8;
}
.legend-item { display: flex; align-items: center; gap: 4px; }
.legend-dot { width: 8px; height: 8px; border-radius: 50%; }
.legend-dot.l0 { background: #1e293b; border: 1px solid #334155; }
.legend-dot.l1 { background: #3b82f6; }
.legend-dot.l2 { background: #ef4444; }
.legend-dot.self-dot { background: #1e293b; border: 2px solid #f59e0b; }
</style>