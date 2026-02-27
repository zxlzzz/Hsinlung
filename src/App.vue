<!--
  App.vue — 根组件（Part 3: 前端界面）

  包含四个标签页：
    - 状态页：查看连接/电量/模式等基础信息
    - 调试页：运行控制、模式切换、参数调节
    - 演示页：大字号展示运行状态和点阵可视化
    - 点阵测试：独立的 105-pin 物理布局交互测试工具

  TODO（UI 组）：
    - 无障碍适配：支持 TalkBack/VoiceOver，字号≥18sp，对比度≥4.5:1
    - 配置页：刷新频率、阈值参数、语音播报开关
    - 适配移动端响应式布局
-->
<template>
  <div class="app">
    <div class="topbar">
      <div class="topbar-title">灵触·随行</div>
      <div class="topbar-sub">TactileNav MVP — 触觉导航系统</div>
    </div>

    <div class="tabs">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        :class="['tab-btn', { active: activeTab === tab.id }]"
        @click="activeTab = tab.id"
      >
        {{ tab.label }}
      </button>
    </div>

    <StatusPage v-if="activeTab === 'status'" />
    <DebugPage  v-if="activeTab === 'debug'" />
    <DemoPage   v-if="activeTab === 'demo'" />

    <!-- 点阵测试工具：独立于 core 层，直接操控 105-pin 物理布局 -->
    <div v-if="activeTab === 'test'" class="test-wrap">
      <DotMatrix
        v-model="testState"
        :lift="10"
        :shadow="20"
      />
      <ControlPanel
        v-model="testState"
      />
    </div>
  </div>
</template>

<script>
import StatusPage   from "./components/StatusPage.vue";
import DebugPage    from "./components/DebugPage.vue";
import DemoPage     from "./components/DemoPage.vue";
import DotMatrix    from "./test/DotMatrix.vue";
import ControlPanel from "./test/ControlPanel.vue";
import { GRID_SIZE } from "./core/constants.js";

export default {
  name: "App",
  components: { StatusPage, DebugPage, DemoPage, DotMatrix, ControlPanel },
  data() {
    return {
      activeTab: "status",
      tabs: [
        { id: "status", label: "状态" },
        { id: "debug",  label: "调试" },
        { id: "demo",   label: "演示" },
        { id: "test",   label: "点阵测试" }
      ],
      // 1D 扁平数组，长度 = GRID_SIZE (105)
      // 格式与 HardwareLayer.set_frame() / AlgorithmLayer 输出完全一致
      testState: new Array(GRID_SIZE).fill(0)
    };
  }
};
</script>

<style scoped>
.test-wrap {
  display: flex;
  gap: 20px;
  align-items: flex-start;
  padding: 16px 0;
}
@media (max-width: 1200px) {
  .test-wrap {
    flex-direction: column;
    align-items: center;
  }
}
</style>
