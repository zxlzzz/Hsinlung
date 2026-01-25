<template>
  <div class="app">
    <header class="header">
      <div class="title">MVP UI</div>
      <div class="subtitle">Demo-only, logic TBD</div>
    </header>

    <section class="panel">
      <div class="row">
        <span class="label">Mode</span>
        <span class="value">{{ modeLabel }}</span>
        <button type="button" class="button" @click="toggleMode">Toggle</button>
      </div>

      <div class="row">
        <span class="label">Seq</span>
        <span class="value">#{{ seq }}</span>
        <button type="button" class="button" @click="nextSeq">Tick</button>
      </div>
    </section>

    <section class="panel">
      <div class="grid">
        <div
          v-for="(level, index) in grid"
          :key="index"
          class="cell"
          :data-level="level"
        >
          {{ level }}
        </div>
      </div>
      <div class="hint">Grid size: {{ GRID_H }} x {{ GRID_W }} (flat length {{ GRID_LEN }})</div>
    </section>
  </div>
</template>

<script setup>
import { computed, ref } from "vue";
import { GRID_H, GRID_W, GRID_LEN, MODES, LEVELS } from "./core/index.js";

const mode = ref(MODES.MAP);
const seq = ref(1);
const grid = ref(Array.from({ length: GRID_LEN }, () => LEVELS.OFF));

const modeLabel = computed(() => (mode.value === MODES.MAP ? "MAP" : "ZOOM"));

function toggleMode() {
  mode.value = mode.value === MODES.MAP ? MODES.ZOOM : MODES.MAP;
}

function nextSeq() {
  seq.value += 1;
  grid.value = grid.value.map(() => (Math.random() > 0.7 ? LEVELS.HIGH : LEVELS.OFF));
}
</script>

<style scoped>
:root {
  color-scheme: light;
}

.app {
  font-family: "Segoe UI", sans-serif;
  background: #f7f2ec;
  min-height: 100vh;
  padding: 32px;
  color: #1d1b19;
}

.header {
  margin-bottom: 24px;
}

.title {
  font-size: 28px;
  font-weight: 600;
}

.subtitle {
  color: #6d6a66;
}

.panel {
  background: #fff;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.08);
  margin-bottom: 20px;
}

.row {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 12px;
}

.label {
  min-width: 60px;
  color: #6d6a66;
}

.value {
  font-weight: 600;
}

.button {
  margin-left: auto;
  border: none;
  background: #1d1b19;
  color: #fff;
  padding: 8px 14px;
  border-radius: 999px;
  cursor: pointer;
}

.grid {
  display: grid;
  grid-template-columns: repeat(5, 48px);
  grid-template-rows: repeat(3, 48px);
  gap: 8px;
  margin-top: 8px;
}

.cell {
  background: #e9dfd4;
  display: grid;
  place-items: center;
  border-radius: 10px;
  font-size: 14px;
}

.cell[data-level="1"] {
  background: #f1b674;
}

.cell[data-level="2"] {
  background: #d56a28;
  color: #fff;
}

.hint {
  margin-top: 12px;
  color: #6d6a66;
  font-size: 13px;
}
</style>
