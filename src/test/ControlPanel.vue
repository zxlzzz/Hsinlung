<!--
  ControlPanel.vue — 105-pin 交互控制台

  与 DotMatrix.vue 共享同一个 1D flat grid（v-model），
  提供：
    • 按物理分区排列的可点击 pin 格
    • 盲文点：click 循环 0 ↔ 1
    • DIY点：click 循环 0 → 1 → 2 → 0
    • SELF_INDEX (用户位置，★) 不可点击，始终保持 0
    • 预设动画：Zone Sweep / Module Scan / DIY Levels / All Flash
    • Play / Pause / Step + 速度滑块
    • Clear / Random

  Props:
    modelValue  Array  必须，1D flat grid, length = GRID_SIZE (105)
  Emits:
    update:modelValue
-->
<template>
  <div class="panel">

    <!-- 标题栏 -->
    <div class="row">
      <div class="title">Console</div>
      <div class="hint">
        盲文点 click: 0↔1 &nbsp;|&nbsp; DIY点 click: 0→1→2→0 &nbsp;|&nbsp; ★ 用户位置锁定
      </div>
    </div>

    <!-- 物理分区交互网格 -->
    <div class="grid-layout">

      <!-- 前方 F1-F6 -->
      <div class="zone-wrap">
        <div class="zone-label">前方 (F1-F6)</div>
        <div class="zone-row">
          <div v-for="(mod, mi) in frontModules" :key="'f'+mi" class="mod-block">
            <div class="mod-id">{{ mod.id }}</div>
            <div class="mod-grid">
              <button
                v-for="pin in mod.pins" :key="pin.index"
                class="cell"
                :class="cellClass(pin.index)"
                :disabled="pin.index === SELF_INDEX"
                :title="pinTitle(pin.index)"
                @click="handleClick(pin.index)"
                type="button"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- 中间行 -->
      <div class="middle-row">

        <!-- 左侧 L1-L3 -->
        <div class="zone-wrap">
          <div class="zone-label">左 (L1-L3)</div>
          <div class="zone-side">
            <div v-for="(mod, mi) in leftModules" :key="'l'+mi" class="mod-block">
              <div class="mod-id">{{ mod.id }}</div>
              <div class="mod-grid">
                <button
                  v-for="pin in mod.pins" :key="pin.index"
                  class="cell"
                  :class="cellClass(pin.index)"
                  :disabled="pin.index === SELF_INDEX"
                  :title="pinTitle(pin.index)"
                  @click="handleClick(pin.index)"
                  type="button"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- DIY核心区 3×5 -->
        <div class="zone-wrap">
          <div class="zone-label">DIY核心 (3×5)</div>
          <div class="diy-grid">
            <button
              v-for="pin in diyPins" :key="pin.index"
              class="cell diy"
              :class="cellClass(pin.index)"
              :disabled="pin.index === SELF_INDEX"
              :title="pinTitle(pin.index)"
              @click="handleClick(pin.index)"
              type="button"
            >
              <span v-if="pin.index === SELF_INDEX" class="self-mark">★</span>
            </button>
          </div>
        </div>

        <!-- 右侧 R1-R3 -->
        <div class="zone-wrap">
          <div class="zone-label">右 (R1-R3)</div>
          <div class="zone-side">
            <div v-for="(mod, mi) in rightModules" :key="'r'+mi" class="mod-block">
              <div class="mod-id">{{ mod.id }}</div>
              <div class="mod-grid">
                <button
                  v-for="pin in mod.pins" :key="pin.index"
                  class="cell"
                  :class="cellClass(pin.index)"
                  :disabled="pin.index === SELF_INDEX"
                  :title="pinTitle(pin.index)"
                  @click="handleClick(pin.index)"
                  type="button"
                />
              </div>
            </div>
          </div>
        </div>

      </div>

      <!-- 后方 B1-B3 -->
      <div class="zone-wrap">
        <div class="zone-label">后方 (B1-B3)</div>
        <div class="zone-row">
          <div v-for="(mod, mi) in backModules" :key="'b'+mi" class="mod-block">
            <div class="mod-id">{{ mod.id }}</div>
            <div class="mod-grid">
              <button
                v-for="pin in mod.pins" :key="pin.index"
                class="cell"
                :class="cellClass(pin.index)"
                :disabled="pin.index === SELF_INDEX"
                :title="pinTitle(pin.index)"
                @click="handleClick(pin.index)"
                type="button"
              />
            </div>
          </div>
        </div>
      </div>

    </div><!-- /grid-layout -->

    <!-- 动画控制 -->
    <div class="controls">
      <div class="left">
        <label class="label">Preset</label>
        <select v-model="selectedPresetName" class="select">
          <option v-for="p in presets" :key="p.name" :value="p.name">{{ p.name }}</option>
        </select>
        <button class="btn" type="button" @click="applyPresetFirstFrame">Load</button>
        <button class="btn" type="button" @click="stepOnce">Step</button>
        <button class="btn" type="button" @click="togglePlay">
          {{ playing ? "Pause" : "Play" }}
        </button>
      </div>

      <div class="right">
        <label class="label">Speed</label>
        <input class="range" type="range" min="80" max="600" step="20" v-model.number="intervalMs" />
        <div class="ms">{{ intervalMs }}ms</div>
        <button class="btn danger" type="button" @click="clearAll">Clear</button>
        <button class="btn" type="button" @click="randomize">Random</button>
      </div>
    </div>

    <!-- 底栏 -->
    <div class="footer">
      <div>Frame: {{ frameIndex }} | 盲文 {{ BRAILLE_PINS }} pins + DIY {{ DIY_PINS }} pins = {{ GRID_SIZE }} 总计</div>
      <div class="mono">{{ selectedPresetName }}</div>
    </div>

  </div>
</template>

<script setup>
import { onBeforeUnmount, ref, computed, watch } from "vue";
import {
  GRID_SIZE, BRAILLE_PINS, DIY_PINS,
  PINS_PER_MODULE, TOTAL_MODULES,
  FRONT_MODULES, LEFT_MODULES, RIGHT_MODULES, BACK_MODULES,
  FRONT_START, LEFT_START, RIGHT_START, BACK_START, DIY_START,
  SELF_INDEX, isDiyPin, getPinZone, getModuleId
} from "../core/constants.js";

const props = defineProps({
  modelValue: { type: Array, required: true },
});
const emit = defineEmits(["update:modelValue"]);

// ---------- 响应式状态 ----------
const intervalMs  = ref(200);
const playing     = ref(false);
const frameIndex  = ref(0);
let   timer       = null;

// ---------- 静态区域/模组数据 ----------

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

// ---------- 格子渲染 ----------

function cellClass(index) {
  const level = props.modelValue?.[index] ?? 0;
  return {
    [`level-${level}`]: true,
    'is-diy':  isDiyPin(index),
    'is-self': index === SELF_INDEX,
  };
}

function pinTitle(index) {
  const level = props.modelValue?.[index] ?? 0;
  const mod   = getModuleId(index) ?? 'DIY';
  const self  = index === SELF_INDEX ? ' ★用户' : '';
  return `#${index} [${mod}] level=${level}${self}`;
}

// ---------- 交互 ----------

function cloneGrid(grid) {
  return grid.slice();
}

function makeEmpty() {
  return new Array(GRID_SIZE).fill(0);
}

function setState(next) {
  emit("update:modelValue", next);
}

function handleClick(index) {
  if (index === SELF_INDEX) return;

  const next = cloneGrid(props.modelValue);
  const cur  = next[index] ?? 0;

  if (isDiyPin(index)) {
    next[index] = (cur + 1) % 3;    // 0 → 1 → 2 → 0
  } else {
    next[index] = cur === 0 ? 1 : 0; // 0 ↔ 1
  }
  setState(next);
}

function clearAll() {
  stop();
  frameIndex.value = 0;
  setState(makeEmpty());
}

function randomize() {
  stop();
  frameIndex.value = 0;
  const next = makeEmpty();
  for (let i = 0; i < GRID_SIZE; i++) {
    if (i === SELF_INDEX) continue;
    if (isDiyPin(i)) {
      next[i] = Math.random() < 0.3 ? (Math.random() < 0.5 ? 1 : 2) : 0;
    } else {
      next[i] = Math.random() < 0.3 ? 1 : 0;
    }
  }
  setState(next);
}

// ---------- 预设动画（针对 105-pin 实际布局） ----------

/**
 * Zone Sweep：每个区域依次全亮，再熄灭
 * 顺序：前 → 左 → 右 → 后 → DIY
 */
function makeZoneSweepFrames() {
  const zones = [
    { start: FRONT_START, end: LEFT_START,  maxLevel: 1 },
    { start: LEFT_START,  end: RIGHT_START, maxLevel: 1 },
    { start: RIGHT_START, end: BACK_START,  maxLevel: 1 },
    { start: BACK_START,  end: DIY_START,   maxLevel: 1 },
    { start: DIY_START,   end: GRID_SIZE,   maxLevel: 2 },
  ];
  const frames = [];
  for (const z of zones) {
    const f = makeEmpty();
    for (let i = z.start; i < z.end; i++) {
      if (i !== SELF_INDEX) f[i] = z.maxLevel;
    }
    frames.push(f);
    frames.push(makeEmpty()); // 间隔帧
  }
  return frames;
}

/**
 * Module Scan：逐模组点亮（F1→F6→L1→L3→R1→R3→B1→B3，最后 DIY区）
 */
function makeModuleScanFrames() {
  const frames = [];
  for (let m = 0; m < TOTAL_MODULES; m++) {
    const f = makeEmpty();
    const base = m * PINS_PER_MODULE;
    for (let p = 0; p < PINS_PER_MODULE; p++) f[base + p] = 1;
    frames.push(f);
  }
  // DIY区作为最后一帧
  const fDiy = makeEmpty();
  for (let i = DIY_START; i < GRID_SIZE; i++) {
    if (i !== SELF_INDEX) fDiy[i] = 2;
  }
  frames.push(fDiy);
  frames.push(makeEmpty());
  return frames;
}

/**
 * DIY Levels：展示 DIY 核心区三个电平等级
 * 0级全灭 → 全1 → 全2 → 棋盘(1/2交替)
 */
function makeDiyLevelsFrames() {
  const frames = [];

  frames.push(makeEmpty()); // 全灭

  const f1 = makeEmpty();
  for (let i = DIY_START; i < GRID_SIZE; i++) {
    if (i !== SELF_INDEX) f1[i] = 1;
  }
  frames.push(f1);

  const f2 = makeEmpty();
  for (let i = DIY_START; i < GRID_SIZE; i++) {
    if (i !== SELF_INDEX) f2[i] = 2;
  }
  frames.push(f2);

  // 棋盘：DIY区奇偶交替 1/2
  const f3 = makeEmpty();
  for (let p = 0; p < DIY_PINS; p++) {
    const idx = DIY_START + p;
    if (idx !== SELF_INDEX) f3[idx] = (p % 2 === 0) ? 2 : 1;
  }
  frames.push(f3);

  frames.push(makeEmpty());
  return frames;
}

/**
 * All Flash：全部 pin 同时亮灭闪烁
 */
function makeAllFlashFrames() {
  const allOn = makeEmpty();
  for (let i = 0; i < GRID_SIZE; i++) {
    if (i === SELF_INDEX) continue;
    allOn[i] = isDiyPin(i) ? 2 : 1;
  }
  const frames = [];
  for (let n = 0; n < 6; n++) {
    frames.push(allOn.slice());
    frames.push(makeEmpty());
  }
  return frames;
}

// presets 在 script setup 顶层定义（函数已在上方声明，此处可安全调用）
const presets = [
  { name: "Zone Sweep",  frames: makeZoneSweepFrames()  },
  { name: "Module Scan", frames: makeModuleScanFrames() },
  { name: "DIY Levels",  frames: makeDiyLevelsFrames()  },
  { name: "All Flash",   frames: makeAllFlashFrames()   },
];

const selectedPresetName = ref(presets[0].name);
const selectedPreset = computed(
  () => presets.find(p => p.name === selectedPresetName.value) ?? presets[0]
);

// ---------- 播放控制 ----------

function applyPresetFirstFrame() {
  stop();
  frameIndex.value = 0;
  setState(cloneGrid(selectedPreset.value.frames[0]));
}

function stepOnce() {
  const frames = selectedPreset.value.frames;
  frameIndex.value = (frameIndex.value + 1) % frames.length;
  setState(cloneGrid(frames[frameIndex.value]));
}

function play() {
  if (timer) return;
  playing.value = true;
  timer = setInterval(stepOnce, intervalMs.value);
}

function stop() {
  playing.value = false;
  if (timer) { clearInterval(timer); timer = null; }
}

function togglePlay() {
  playing.value ? stop() : play();
}

watch(intervalMs, () => {
  if (!playing.value) return;
  stop();
  play();
});

watch(selectedPresetName, () => {
  frameIndex.value = 0;
});

onBeforeUnmount(() => stop());
</script>

<style scoped>
.panel {
  padding: 16px;
  border-radius: 12px;
  background: #ffffff;
  border: 1px solid #e6e8ee;
  box-shadow: 0 10px 30px rgba(0,0,0,0.06);
  width: fit-content;
}

.row {
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin-bottom: 10px;
}
.title { font-weight: 650; font-size: 15px; color: #111827; }
.hint  { color: #6b7280; font-size: 11px; }

/* ── 区域布局 ── */
.grid-layout {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 12px;
  border: 1px solid #eef0f5;
  border-radius: 10px;
  background: #fafbfc;
  margin-bottom: 14px;
}

.zone-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}
.zone-label {
  font-size: 9px;
  color: #64748b;
  font-weight: 500;
}
.zone-row  { display: flex; gap: 6px; flex-wrap: wrap; justify-content: center; }
.zone-side { display: flex; flex-direction: column; gap: 4px; align-items: center; }

.middle-row {
  display: flex;
  gap: 14px;
  align-items: center;
}

.mod-block { text-align: center; }
.mod-id {
  font-size: 8px;
  color: #94a3b8;
  margin-bottom: 2px;
  font-family: ui-monospace, monospace;
}
.mod-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 2px;
}
.diy-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 3px;
}

/* ── 格子按钮 ── */
.cell {
  width: 14px;
  height: 14px;
  border-radius: 3px;
  border: 1px solid #e3e6ee;
  background: #f8f9fa;
  cursor: pointer;
  padding: 0;
  transition: transform 80ms ease, box-shadow 80ms ease, background 80ms ease;
  display: grid;
  place-items: center;
  position: relative;
}
.cell:hover:not(:disabled) {
  transform: scale(1.2);
  box-shadow: 0 3px 8px rgba(0,0,0,0.12);
}
.cell:disabled { cursor: default; }

/* DIY格子稍大 */
.cell.diy { width: 18px; height: 18px; border-radius: 4px; }

/* 盲文点颜色 (level 0/1) */
.cell.level-0 { background: #f1f3f7; }
.cell.level-1 { background: #374151; border-color: #374151; }

/* DIY点颜色 (level 0/1/2)，覆盖盲文样式 */
.cell.is-diy.level-0 { background: #f1f3f7; }
.cell.is-diy.level-1 { background: #3b82f6; border-color: #2563eb; }
.cell.is-diy.level-2 { background: #ef4444; border-color: #dc2626; }

/* 用户位置：橙色边框 */
.cell.is-self {
  border: 2px solid #f59e0b !important;
  background: #1e293b !important;
  cursor: default;
}
.self-mark {
  font-size: 7px;
  color: #f59e0b;
  line-height: 1;
}

/* ── 控制区 ── */
.controls {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}
.left, .right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.label  { font-size: 12px; color: #6b7280; font-weight: 500; }
.select {
  height: 32px;
  border-radius: 8px;
  border: 1px solid #e3e6ee;
  padding: 0 10px;
  background: #fff;
  font-size: 13px;
}
.btn {
  height: 32px;
  padding: 0 12px;
  border-radius: 8px;
  border: 1px solid #e3e6ee;
  background: #fff;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: all 120ms ease;
}
.btn:hover  { box-shadow: 0 6px 16px rgba(0,0,0,0.08); border-color: #d0d4de; }
.btn.danger { border-color: #fecaca; color: #dc2626; }
.btn.danger:hover { background: #fef2f2; }

.range { width: 100px; }
.ms {
  width: 54px;
  text-align: right;
  font-size: 12px;
  color: #6b7280;
  font-family: ui-monospace, monospace;
}

/* ── 底栏 ── */
.footer {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #f0f1f5;
  display: flex;
  justify-content: space-between;
  color: #6b7280;
  font-size: 11px;
}
.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-weight: 600;
  color: #4b5563;
}
</style>
