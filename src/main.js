/**
 * main.js — 应用入口
 *
 * 职责
 *   1. 初始化 core 三层（Hardware → Algorithm → Integration）
 *   2. 创建 Vue app，provide 全局响应式 state + integration 实例
 *   3. Integration.onStateChange → 更新 reactive state → Vue 自动触发组件更新
 *   4. 预设演示数据（放大模式占位字符）
 *   5. 暴露到 window 方便控制台调试
 */

import { createApp, reactive } from "vue";
import { HardwareLayer }  from "./core/HardwareLayer.js";
import { AlgorithmLayer } from "./core/AlgorithmLayer.js";
import { Integration }    from "./core/Integration.js";
import App                 from "./App.vue";

// ── 初始化 core ──
const hardware    = new HardwareLayer();
const algorithm   = new AlgorithmLayer();
const integration = new Integration(hardware, algorithm);

// ── 预设演示内容（放大模式两个占位字符） ──
algorithm.set_zoom_content({
  left:  [0, 2, 2, 0, 0, 2],  // 左字符占位
  right: [2, 2, 2, 2, 0, 0]   // 右字符占位
});

// ── 全局响应式状态 ──
const state = reactive({
  running:    false,
  mode:       0,
  modeName:   "MAP",
  fps:        5,
  measuredFps: 0,
  latency:    0,
  seq:        0,
  connected:  true,
  errors:     [],
  lastGrid:   new Array(15).fill(0)
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

// ── 控制台调试 ──
window.hw  = hardware;
window.alg = algorithm;
window.int = integration;
console.log("[TactileNav] 初始化完成。控制台可用: window.hw / window.alg / window.int");