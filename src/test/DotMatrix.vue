<!--
  DotMatrix.vue — 105-pin 触觉点阵 3D 可视化

  按真实物理分区展示：前方 / 左侧 / DIY核心 / 右侧 / 后方
  数据格式：1D 扁平数组，长度 = GRID_SIZE (105)
    grid[0-89]  盲文区：0/1 二值，显示为灰色/白色凸起效果
    grid[90-104] DIY区：0/1/2 三档，显示为深色/蓝色/红色，带高度效果
    grid[SELF_INDEX=100] 用户位置，橙色标记

  Props:
    modelValue  Array  必须，1D flat grid
    size        Number 盲文点直径(px)，默认10
    diySize     Number DIY点直径(px)，默认14
    gap         Number 点间距(px)，默认4
    lift        Number 最大起伏高度(px)，默认8
    shadow      Number 最大阴影模糊(px)，默认16
-->
<template>
  <div class="matrix-preview">

    <!-- 前方 F1-F6 -->
    <div class="zone-label">前方 (F1-F6)</div>
    <div class="zone-row">
      <div v-for="(mod, mi) in frontModules" :key="'f'+mi" class="module-block">
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

    <!-- 中间行：左侧 + DIY核心 + 右侧 -->
    <div class="middle-row">

      <!-- 左侧 L1-L3 -->
      <div class="side-section">
        <div class="zone-label">左 (L1-L3)</div>
        <div v-for="(mod, mi) in leftModules" :key="'l'+mi" class="module-block">
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

      <!-- DIY核心区 3×5 -->
      <div class="diy-section">
        <div class="zone-label">DIY核心 (3×5)</div>
        <div class="diy-grid">
          <div v-for="pin in diyPins" :key="pin.index" class="dot-wrap">
            <div class="dot diy-dot" :class="dotClasses(pin.index)" :style="dotStyle(pin.index)">
              <div class="highlight" :style="highlightStyle(pin.index)" />
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧 R1-R3 -->
      <div class="side-section">
        <div class="zone-label">右 (R1-R3)</div>
        <div v-for="(mod, mi) in rightModules" :key="'r'+mi" class="module-block">
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

    </div>

    <!-- 后方 B1-B3 -->
    <div class="zone-label">后方 (B1-B3)</div>
    <div class="zone-row">
      <div v-for="(mod, mi) in backModules" :key="'b'+mi" class="module-block">
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
      <div class="legend-item"><span class="leg-dot braille-0"></span>盲文 0</div>
      <div class="legend-item"><span class="leg-dot braille-1"></span>盲文 1</div>
      <div class="legend-item"><span class="leg-dot diy-1"></span>DIY 1</div>
      <div class="legend-item"><span class="leg-dot diy-2"></span>DIY 2</div>
      <div class="legend-item"><span class="leg-dot user-pos"></span>用户位置</div>
    </div>

  </div>
</template>

<script setup>
import {
  PINS_PER_MODULE,
  FRONT_MODULES, LEFT_MODULES, RIGHT_MODULES, BACK_MODULES,
  FRONT_START, LEFT_START, RIGHT_START, BACK_START, DIY_START,
  DIY_PINS, SELF_INDEX, isDiyPin
} from "../core/constants.js";

const props = defineProps({
  // 1D flat array, length = GRID_SIZE (105)
  modelValue: { type: Array, required: true },

  size:    { type: Number, default: 10 },   // 盲文点直径 (px)
  diySize: { type: Number, default: 14 },   // DIY点直径 (px)
  gap:     { type: Number, default: 4 },    // 点间距 (px)
  lift:    { type: Number, default: 8 },    // 最大起伏高度 (px)
  shadow:  { type: Number, default: 16 },   // 最大阴影模糊 (px)
});

// ---------- 静态区域/模组数据（基于常量，只算一次） ----------

function buildModules(start, count, prefix) {
  const mods = [];
  for (let m = 0; m < count; m++) {
    const pins = [];
    for (let p = 0; p < PINS_PER_MODULE; p++) {
      pins.push({ index: start + m * PINS_PER_MODULE + p });
    }
    mods.push({ id: prefix + (m + 1), pins });
  }
  return mods;
}

const frontModules = buildModules(FRONT_START, FRONT_MODULES, 'F');
const leftModules  = buildModules(LEFT_START,  LEFT_MODULES,  'L');
const rightModules = buildModules(RIGHT_START, RIGHT_MODULES, 'R');
const backModules  = buildModules(BACK_START,  BACK_MODULES,  'B');

const diyPins = [];
for (let i = 0; i < DIY_PINS; i++) {
  diyPins.push({ index: DIY_START + i });
}

// ---------- 渲染辅助函数 ----------

function getLevel(index) {
  const raw = props.modelValue?.[index] ?? 0;
  return isDiyPin(index)
    ? Math.max(0, Math.min(2, raw))
    : Math.max(0, Math.min(1, raw));
}

function dotClasses(index) {
  const level = getLevel(index);
  return {
    [`level-${level}`]: true,
    'diy-dot':  isDiyPin(index),
    'is-self':  index === SELF_INDEX,
  };
}

function dotStyle(index) {
  const level   = getLevel(index);
  const diy     = isDiyPin(index);
  const ratio   = diy ? level / 2 : level;   // 0 / 0.5 / 1
  const sz      = diy ? props.diySize : props.size;
  const y       = -props.lift * ratio;
  const blur    = props.shadow * (0.3 + ratio * 0.7);
  const spread  = Math.floor(props.lift * 0.4 * ratio);
  const alpha   = 0.12 + ratio * 0.22;

  return {
    width:  `${sz}px`,
    height: `${sz}px`,
    transform: `translateY(${y}px)`,
    boxShadow: ratio > 0
      ? `0 ${Math.max(1, Math.floor(spread * 0.8))}px ${blur}px rgba(0,0,0,${alpha}),` +
        `0 ${Math.max(0, Math.floor(spread * 0.3))}px ${Math.floor(blur * 0.5)}px rgba(0,0,0,${alpha * 0.6})`
      : 'none',
  };
}

function highlightStyle(index) {
  const level = getLevel(index);
  const ratio = isDiyPin(index) ? level / 2 : level;
  const op    = 0.10 + ratio * 0.35;
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

.zone-label {
  font-size: 10px;
  color: #64748b;
  font-weight: 500;
  letter-spacing: 0.02em;
}

.zone-row {
  display: flex;
  gap: 8px;
  justify-content: center;
  flex-wrap: wrap;
}

.middle-row {
  display: flex;
  gap: 16px;
  align-items: center;
}

.side-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.diy-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.module-block {
  text-align: center;
}

.module-id {
  font-size: 8px;
  color: #475569;
  margin-bottom: 3px;
  font-family: ui-monospace, monospace;
}

.module-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 4px;
}

.diy-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
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

/* 盲文点：物理凸起感（灰/白） */
.dot.level-0 { background: #c8cdd8; border: 1px solid #a8aeba; }
.dot.level-1 { background: #ffffff; border: 1px solid #c4c8d4; }

/* DIY点：语义配色（暗/蓝/红），覆盖盲文点样式 */
.dot.diy-dot.level-0 { background: #1e293b; border: 1px solid #334155; }
.dot.diy-dot.level-1 { background: #3b82f6; border: 1px solid #60a5fa; }
.dot.diy-dot.level-2 { background: #ef4444; border: 1px solid #f87171; }

/* 用户位置：橙色高亮 */
.dot.is-self {
  border: 2px solid #f59e0b !important;
  box-shadow: 0 0 6px rgba(245,158,11,0.5) !important;
}

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
  flex-wrap: wrap;
  justify-content: center;
}
.legend-item { display: flex; align-items: center; gap: 4px; }
.leg-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
.leg-dot.braille-0 { background: #c8cdd8; border: 1px solid #a8aeba; }
.leg-dot.braille-1 { background: #ffffff; border: 1px solid #c4c8d4; }
.leg-dot.diy-1     { background: #3b82f6; }
.leg-dot.diy-2     { background: #ef4444; }
.leg-dot.user-pos  { background: #1e293b; border: 2px solid #f59e0b; }
</style>
