/**
 * main.js — 应用入口
 * 改动：无，GRID_SIZE 从新 constants.js 导入，值自动为105
 */

import { createApp, reactive } from "vue";
import { HardwareLayer }  from "./core/HardwareLayer.js";
import { AlgorithmLayer } from "./core/AlgorithmLayer.js";
import { Integration }    from "./core/Integration.js";
import { GRID_SIZE }      from "./core/constants.js";
import App                 from "./App.vue";

const hardware    = new HardwareLayer();
const algorithm   = new AlgorithmLayer();
const integration = new Integration(hardware, algorithm);

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

integration.onStateChange((stats) => {
  Object.assign(state, stats);
});

const app = createApp(App);
app.provide("state",       state);
app.provide("integration", integration);
app.mount("#app");