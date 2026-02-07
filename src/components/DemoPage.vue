<template>
  <div class="page">
    <div class="card demo-card">
      <div class="demo-mode-label">{{ modeLabel }}</div>
      <div class="demo-hint">{{ hintText }}</div>
      <GridPreview :grid="state.lastGrid" />
    </div>
  </div>
</template>

<script>
import GridPreview from "./GridPreview.vue";

export default {
  name: "DemoPage",

  inject: ["state"],

  components: { GridPreview },

  computed: {
    modeLabel() {
      return this.state.modeName === "MAP" ? "地图模式" : "放大模式（双字符）";
    },
    hintText() {
      if (!this.state.running) return "未启动，请在调试页点击启动";
      return this.state.modeName === "MAP"
        ? "实时环境感知 → 触觉点阵输出"
        : "显示预设盲文字符（左 / 右各一个）";
    }
  }
};
</script>