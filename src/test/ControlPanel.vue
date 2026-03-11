<!--
  ControlPanel.vue — 90-pin 交互控制台

  与 DotMatrix.vue 共享同一个 1D flat grid（v-model），
  提供：
    • 按 5行×3列 模组布局排列的可点击 pin 格（M1-M15）
    • 所有pin：click 循环 0 ↔ 1
    • 预设动画：Module Scan / Row Sweep / Wave / All Flash
    • Play / Pause / Step + 速度滑块
    • Clear / Random

  Props:
    modelValue  Array  必须，1D flat grid, length = GRID_SIZE (90)
  Emits:
    update:modelValue
-->
<template>
  <div class="panel">

    <!-- 标题栏 -->
    <div class="row">
      <div class="title">Console</div>
      <div class="hint">
        click: 0 ↔ 1 &nbsp;|&nbsp; 5行×3列 · 15模组 · 90 pin
      </div>
    </div>

    <!-- 物理布局交互网格 -->
    <div class="grid-layout">
      <div class="module-layout">
        <div
          v-for="(mod, mi) in modules"
          :key="mi"
          class="mod-block"
          :style="{ gridRow: mod.row + 1, gridColumn: mod.col + 1 }"
        >
          <div class="mod-id">{{ mod.id }}</div>
          <div class="mod-grid">
            <button
              v-for="pin in mod.pins"
              :key="pin.index"
              class="cell"
              :class="cellClass(pin.index)"
              :title="pinTitle(pin.index)"
              @click="handleClick(pin.index)"
              type="button"
            />
          </div>
        </div>
      </div>
    </div>

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
      <div>Frame: {{ frameIndex }} | {{ TOTAL_MODULES }} 模组 × {{ PINS_PER_MODULE }} pin = {{ GRID_SIZE }} 总计</div>
      <div class="mono">{{ selectedPresetName }}</div>
    </div>

  </div>
</template>

<script setup>
import { onBeforeUnmount, ref, computed, watch } from "vue";
import {
  GRID_SIZE, PINS_PER_MODULE, TOTAL_MODULES, MODULE_ROWS, MODULE_COLS,
  getModuleRC, getModuleId, getPinRC
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

// ---------- 静态模组数据 ----------

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

// ---------- 格子渲染 ----------

function cellClass(index) {
  const level = props.modelValue?.[index] ?? 0;
  return { [`level-${level}`]: true };
}

function pinTitle(index) {
  const level = props.modelValue?.[index] ?? 0;
  return `#${index} [${getModuleId(index)}] level=${level}`;
}

// ---------- 交互 ----------

function makeEmpty() { return new Array(GRID_SIZE).fill(0); }

function setState(next) { emit("update:modelValue", next); }

function handleClick(index) {
  const next = props.modelValue.slice();
  next[index] = next[index] === 0 ? 1 : 0;
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
    next[i] = Math.random() < 0.3 ? 1 : 0;
  }
  setState(next);
}

// ---------- 预设动画 ----------

/**
 * Module Scan：M1→M15 逐模组点亮
 */
function makeModuleScanFrames() {
  const frames = [];
  for (let m = 0; m < TOTAL_MODULES; m++) {
    const f = makeEmpty();
    const base = m * PINS_PER_MODULE;
    for (let p = 0; p < PINS_PER_MODULE; p++) f[base + p] = 1;
    frames.push(f);
  }
  frames.push(makeEmpty());
  return frames;
}

/**
 * Row Sweep：按模组行依次全亮（5行，每行3个模组）
 */
function makeRowSweepFrames() {
  const frames = [];
  for (let r = 0; r < MODULE_ROWS; r++) {
    const f = makeEmpty();
    for (let c = 0; c < MODULE_COLS; c++) {
      const base = (r * MODULE_COLS + c) * PINS_PER_MODULE;
      for (let p = 0; p < PINS_PER_MODULE; p++) f[base + p] = 1;
    }
    frames.push(f);
    frames.push(makeEmpty());
  }
  return frames;
}

/**
 * Wave：对角波穿越 10行×9列 物理针格
 */
function makeWaveFrames() {
  const TOTAL_ROWS = MODULE_ROWS * 2;  // 10
  const TOTAL_COLS = MODULE_COLS * 3;  // 9
  const steps = TOTAL_ROWS + TOTAL_COLS - 1;  // 18
  const frames = [];
  for (let step = 0; step < steps; step++) {
    const f = makeEmpty();
    for (let i = 0; i < GRID_SIZE; i++) {
      const { row, col } = getPinRC(i);
      if (row + col === step) f[i] = 1;
    }
    frames.push(f);
  }
  frames.push(makeEmpty());
  return frames;
}

/**
 * All Flash：全部 pin 同时亮灭闪烁
 */
function makeAllFlashFrames() {
  const allOn = new Array(GRID_SIZE).fill(1);
  const frames = [];
  for (let n = 0; n < 6; n++) {
    frames.push(allOn.slice());
    frames.push(makeEmpty());
  }
  return frames;
}

const presets = [
  { name: "Module Scan", frames: makeModuleScanFrames() },
  { name: "Row Sweep",   frames: makeRowSweepFrames()   },
  { name: "Wave",        frames: makeWaveFrames()        },
  { name: "All Flash",   frames: makeAllFlashFrames()    },
];

const selectedPresetName = ref(presets[0].name);
const selectedPreset = computed(
  () => presets.find(p => p.name === selectedPresetName.value) ?? presets[0]
);

// ---------- 播放控制 ----------

function applyPresetFirstFrame() {
  stop();
  frameIndex.value = 0;
  setState(selectedPreset.value.frames[0].slice());
}

function stepOnce() {
  const frames = selectedPreset.value.frames;
  frameIndex.value = (frameIndex.value + 1) % frames.length;
  setState(frames[frameIndex.value].slice());
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

/* ── 布局容器 ── */
.grid-layout {
  padding: 12px;
  border: 1px solid #eef0f5;
  border-radius: 10px;
  background: #fafbfc;
  margin-bottom: 14px;
}

.module-layout {
  display: grid;
  grid-template-columns: repeat(3, auto);
  grid-template-rows: repeat(5, auto);
  gap: 6px;
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
  grid-template-columns: repeat(3, 1fr);
  gap: 2px;
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
}
.cell:hover {
  transform: scale(1.2);
  box-shadow: 0 3px 8px rgba(0,0,0,0.12);
}
.cell.level-0 { background: #f1f3f7; }
.cell.level-1 { background: #374151; border-color: #374151; }

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
