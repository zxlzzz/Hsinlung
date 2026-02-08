/**
 * main.js — 应用入口
 *
 * 职责：
 *   1. 初始化 core 三层（Hardware → Algorithm → Integration）
 *   2. 创建 Vue app，provide 全局响应式 state + integration 实例
 *   3. Integration.onStateChange → 更新 reactive state → Vue 自动触发组件更新
 */

import { createApp, reactive } from "vue";
import { HardwareLayer }  from "./core/HardwareLayer.js";
import { AlgorithmLayer } from "./core/AlgorithmLayer.js";
import { Integration }    from "./core/Integration.js";
import { GRID_SIZE }      from "./core/constants.js";
import App                 from "./App.vue";

// ── 初始化 core 三层 ──
const hardware    = new HardwareLayer();
const algorithm   = new AlgorithmLayer();
const integration = new Integration(hardware, algorithm);

// ── 全局响应式状态 ──
const state = reactive({
  running:     false,
  mode:        0,
  modeName:    "MAP",
  fps:         5,
  measuredFps: 0,
  latency:     0,
  seq:         0,
  connected:   false,
  errors:      [],
  lastGrid:    new Array(GRID_SIZE).fill(0)
});

// ── 桥接：集成层状态变更 → reactive state ──
integration.onStateChange((stats) => {
  Object.assign(state, stats);
});

// ── 创建 Vue app ──
const app = createApp(App);

// provide：所有子组件可通过 inject 获取
app.provide("state",       state);
app.provide("integration", integration);

app.mount("#app");
