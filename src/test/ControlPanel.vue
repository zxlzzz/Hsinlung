<template>
  <div class="panel">
    <div class="row">
      <div class="title">Console</div>
      <div class="hint">Click: 0→1→2→0. Use presets for animation.</div>
    </div>

    <div class="grid" :style="gridStyle">
      <button
        v-for="(cell, idx) in flatCells"
        :key="idx"
        class="cell"
        :class="`level-${cell}`"
        @click="cycleByIndex(idx)"
        type="button"
        :title="`${indexToRC(idx)} [${cell}]`"
      >
        <span class="levelDot" />
      </button>
    </div>

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

    <div class="footer">
      <div>Frame: {{ frameIndex }} | Cells: {{ rows }}×{{ cols }}</div>
      <div class="mono">{{ selectedPresetName }}</div>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, ref, watch } from "vue";

const props = defineProps({
  rows: { type: Number, default: 21 },
  cols: { type: Number, default: 31 },
  modelValue: { type: Array, required: true },
});

const emit = defineEmits(["update:modelValue"]);

const intervalMs = ref(200);
const playing = ref(false);
const frameIndex = ref(0);
let timer = null;

const gridStyle = computed(() => ({
  gridTemplateColumns: `repeat(${props.cols}, 16px)`,
  gridTemplateRows: `repeat(${props.rows}, 16px)`,
}));

function cloneState(state) {
  return state.map(row => row.slice());
}

function makeEmpty() {
  return Array.from({ length: props.rows }, () => 
    Array.from({ length: props.cols }, () => 0)
  );
}

function setState(next) {
  emit("update:modelValue", next);
}

const flatCells = computed(() => {
  const out = [];
  for (let r = 0; r < props.rows; r++) {
    for (let c = 0; c < props.cols; c++) {
      out.push(props.modelValue?.[r]?.[c] ?? 0);
    }
  }
  return out;
});

function indexToRC(idx) {
  const r = Math.floor(idx / props.cols);
  const c = idx % props.cols;
  return `r${r} c${c}`;
}

// 循环切换：0 → 1 → 2 → 0
function cycleByIndex(idx) {
  const r = Math.floor(idx / props.cols);
  const c = idx % props.cols;

  const next = cloneState(props.modelValue);
  next[r][c] = (next[r][c] + 1) % 3;
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
  const next = makeEmpty().map(row => 
    row.map(() => Math.floor(Math.random() * 3))
  );
  setState(next);
}

/* 预设动画 - 针对 31×21 优化 */
const presets = [
  {
    name: "Wave",
    frames: makeWaveFrames(),
  },
  {
    name: "Scanner",
    frames: makeScannerFrames(),
  },
  {
    name: "Ripple",
    frames: makeRippleFrames(),
  },
  {
    name: "Cascade",
    frames: makeCascadeFrames(),
  },
];

const selectedPresetName = ref(presets[0].name);
const selectedPreset = computed(() => 
  presets.find(p => p.name === selectedPresetName.value) ?? presets[0]
);

function applyPresetFirstFrame() {
  stop();
  frameIndex.value = 0;
  setState(cloneState(selectedPreset.value.frames[0]));
}

function stepOnce() {
  const frames = selectedPreset.value.frames;
  frameIndex.value = (frameIndex.value + 1) % frames.length;
  setState(cloneState(frames[frameIndex.value]));
}

function tick() {
  stepOnce();
}

function play() {
  if (timer) return;
  playing.value = true;
  timer = setInterval(tick, intervalMs.value);
}

function stop() {
  playing.value = false;
  if (timer) clearInterval(timer);
  timer = null;
}

function togglePlay() {
  if (playing.value) stop();
  else play();
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

/* ---------- Preset generators ---------- */

function makeWaveFrames() {
  const frames = [];
  const total = props.cols + props.rows - 1;
  
  for (let t = 0; t < total; t++) {
    const s = makeEmpty();
    for (let r = 0; r < props.rows; r++) {
      for (let c = 0; c < props.cols; c++) {
        const dist = Math.abs((r + c) - t);
        if (dist === 0) s[r][c] = 2;
        else if (dist === 1) s[r][c] = 1;
      }
    }
    frames.push(s);
  }
  
  // 回弹
  for (let t = total - 2; t >= 1; t--) {
    frames.push(cloneState(frames[t]));
  }
  return frames;
}

function makeScannerFrames() {
  const frames = [];
  
  // 横向扫描
  for (let c = 0; c < props.cols; c++) {
    const s = makeEmpty();
    for (let r = 0; r < props.rows; r++) {
      s[r][c] = 2;
      if (c > 0) s[r][c - 1] = 1;
      if (c < props.cols - 1) s[r][c + 1] = 1;
    }
    frames.push(s);
  }
  
  // 回扫
  for (let c = props.cols - 2; c >= 1; c--) {
    frames.push(cloneState(frames[c]));
  }
  return frames;
}

function makeRippleFrames() {
  const frames = [];
  const centerR = Math.floor(props.rows / 2);
  const centerC = Math.floor(props.cols / 2);
  const maxDist = Math.max(centerR, centerC, props.rows - centerR, props.cols - centerC);
  
  for (let wave = 0; wave <= maxDist + 3; wave++) {
    const s = makeEmpty();
    for (let r = 0; r < props.rows; r++) {
      for (let c = 0; c < props.cols; c++) {
        const dist = Math.abs(r - centerR) + Math.abs(c - centerC);
        if (dist === wave) s[r][c] = 2;
        else if (dist === wave - 1) s[r][c] = 1;
      }
    }
    frames.push(s);
  }
  
  return frames;
}

function makeCascadeFrames() {
  const frames = [];
  
  // 从左上到右下的级联效果
  for (let start = 0; start < props.rows + props.cols; start++) {
    const s = makeEmpty();
    for (let r = 0; r < props.rows; r++) {
      for (let c = 0; c < props.cols; c++) {
        const sum = r + c;
        if (sum === start) s[r][c] = 2;
        else if (sum === start - 1) s[r][c] = 1;
      }
    }
    frames.push(s);
  }
  
  return frames;
}
</script>

<style scoped>
.panel {
  padding: 16px;
  border-radius: 12px;
  background: #ffffff;
  border: 1px solid #e6e8ee;
  box-shadow: 0 10px 30px rgba(0,0,0,0.06);
  width: fit-content;
  max-width: 680px;
}

.row {
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin-bottom: 10px;
}

.title {
  font-weight: 650;
  font-size: 15px;
  color: #111827;
}

.hint {
  color: #6b7280;
  font-size: 11px;
}

.grid {
  display: grid;
  gap: 3px;
  padding: 12px;
  border: 1px solid #eef0f5;
  border-radius: 10px;
  background: #fafbfc;
  margin-bottom: 14px;
  max-height: 420px;
  overflow-y: auto;
}

.cell {
  width: 16px;
  height: 16px;
  border-radius: 4px;
  border: 1px solid #e3e6ee;
  background: #ffffff;
  cursor: pointer;
  transition: transform 100ms ease, box-shadow 100ms ease, background 100ms ease;
  display: grid;
  place-items: center;
  padding: 0;
}

.cell:hover {
  transform: scale(1.15);
  box-shadow: 0 4px 10px rgba(0,0,0,0.12);
}

.cell.level-0 {
  background: #f8f9fa;
}

.cell.level-1 {
  background: #9ca3af;
}

.cell.level-2 {
  background: #111827;
}

.levelDot {
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: currentColor;
  opacity: 0.6;
}

.cell.level-0 .levelDot {
  display: none;
}

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

.label {
  font-size: 12px;
  color: #6b7280;
  font-weight: 500;
}

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

.btn:hover {
  box-shadow: 0 6px 16px rgba(0,0,0,0.08);
  border-color: #d0d4de;
}

.btn.danger {
  border-color: #fecaca;
  color: #dc2626;
}

.btn.danger:hover {
  background: #fef2f2;
}

.range {
  width: 100px;
}

.ms {
  width: 54px;
  text-align: right;
  font-size: 12px;
  color: #6b7280;
  font-family: ui-monospace, monospace;
}

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