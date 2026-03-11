<!--
  DotMatrix.vue — 90-pin 触觉点阵 3D 可视化

  按 5行×3列 模组布局展示（M1-M15）
  每模组：3列×2行 = 6 pin（横置）
  所有pin：值 0/1，显示为灰色/白色凸起效果

  Props:
    modelValue  Array  必须，1D flat grid, length = GRID_SIZE (90)
    size        Number 点直径(px)，默认10
    gap         Number 点间距(px)，默认4
    lift        Number 最大起伏高度(px)，默认8
    shadow      Number 最大阴影模糊(px)，默认16
-->
<template>
  <div class="matrix-preview">
    <div class="module-layout">
      <div
        v-for="(mod, mi) in modules"
        :key="mi"
        class="module-block"
        :style="{ gridRow: mod.row + 1, gridColumn: mod.col + 1 }"
      >
        <div class="module-id">{{ mod.id }}</div>
        <div class="module-grid">
          <div v-for="pin in mod.pins" :key="pin.index" class="dot-wrap">
            <div class="dot" :class="dotClasses(pin.index)" :style="dotStyle(pin.index)">
              <div class="highlight" :style="highlightStyle(pin.index)" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 图例 -->
    <div class="legend-row">
      <div class="legend-item"><span class="leg-dot lvl-0"></span>Level 0</div>
      <div class="legend-item"><span class="leg-dot lvl-1"></span>Level 1</div>
    </div>
  </div>
</template>

<script setup>
import {
  PINS_PER_MODULE, TOTAL_MODULES, getModuleRC
} from "../core/constants.js";

const props = defineProps({
  modelValue: { type: Array, required: true },
  size:   { type: Number, default: 10 },
  gap:    { type: Number, default: 4 },
  lift:   { type: Number, default: 8 },
  shadow: { type: Number, default: 16 },
});

// ---------- 静态模组数据（只算一次） ----------

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

const modules = buildModules();

// ---------- 渲染辅助函数 ----------

function getLevel(index) {
  return Math.max(0, Math.min(1, props.modelValue?.[index] ?? 0));
}

function dotClasses(index) {
  return { [`level-${getLevel(index)}`]: true };
}

function dotStyle(index) {
  const ratio  = getLevel(index);
  const y      = -props.lift * ratio;
  const blur   = props.shadow * (0.3 + ratio * 0.7);
  const spread = Math.floor(props.lift * 0.4 * ratio);
  const alpha  = 0.12 + ratio * 0.22;

  return {
    width:  `${props.size}px`,
    height: `${props.size}px`,
    transform: `translateY(${y}px)`,
    boxShadow: ratio > 0
      ? `0 ${Math.max(1, Math.floor(spread * 0.8))}px ${blur}px rgba(0,0,0,${alpha}),` +
        `0 ${Math.max(0, Math.floor(spread * 0.3))}px ${Math.floor(blur * 0.5)}px rgba(0,0,0,${alpha * 0.6})`
      : 'none',
  };
}

function highlightStyle(index) {
  const ratio = getLevel(index);
  const op = 0.10 + ratio * 0.35;
  return {
    opacity:    op,
    background: `radial-gradient(circle at 30% 25%, rgba(255,255,255,${op + 0.1}), transparent 65%)`,
  };
}
</script>

<style scoped>
.matrix-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 20px;
  border-radius: 16px;
  background: linear-gradient(145deg, #f8f9fb 0%, #f3f4f6 100%);
  border: 1px solid #e6e8ee;
  box-shadow:
    inset 0 1px 2px rgba(255,255,255,0.8),
    0 4px 12px rgba(0,0,0,0.04);
  width: fit-content;
}

.module-layout {
  display: grid;
  grid-template-columns: repeat(3, auto);
  grid-template-rows: repeat(5, auto);
  gap: 8px;
}

.module-block { text-align: center; }

.module-id {
  font-size: 8px;
  color: #475569;
  margin-bottom: 3px;
  font-family: ui-monospace, monospace;
}

.module-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 4px;
}

.dot-wrap {
  display: grid;
  place-items: center;
}

.dot {
  position: relative;
  border-radius: 999px;
  transition:
    transform 220ms cubic-bezier(0.34, 1.56, 0.64, 1),
    box-shadow 220ms cubic-bezier(0.34, 1.56, 0.64, 1),
    background 180ms ease,
    border-color 180ms ease;
}

.dot.level-0 { background: #c8cdd8; border: 1px solid #a8aeba; }
.dot.level-1 { background: #ffffff; border: 1px solid #c4c8d4; }

.highlight {
  position: absolute;
  inset: 0;
  border-radius: 999px;
  pointer-events: none;
  transition: opacity 220ms cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* 图例 */
.legend-row {
  display: flex;
  gap: 10px;
  margin-top: 6px;
  padding-top: 8px;
  border-top: 1px solid #e6e8ee;
  font-size: 10px;
  color: #64748b;
  justify-content: center;
}
.legend-item { display: flex; align-items: center; gap: 4px; }
.leg-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
.leg-dot.lvl-0 { background: #c8cdd8; border: 1px solid #a8aeba; }
.leg-dot.lvl-1 { background: #ffffff; border: 1px solid #c4c8d4; }
</style>
