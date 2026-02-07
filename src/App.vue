<!--
  App.vue — 根组件（Part 3: 前端界面）

  包含三个标签页：
    - 状态页：查看连接/电量/模式等基础信息
    - 调试页：运行控制、模式切换、参数调节
    - 演示页：大字号展示运行状态和点阵可视化

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
  </div>
</template>

<script>
import StatusPage from "./components/StatusPage.vue";
import DebugPage  from "./components/DebugPage.vue";
import DemoPage   from "./components/DemoPage.vue";

export default {
  name: "App",
  components: { StatusPage, DebugPage, DemoPage },
  data() {
    return {
      activeTab: "status",
      tabs: [
        { id: "status", label: "状态" },
        { id: "debug",  label: "调试" },
        { id: "demo",   label: "演示" }
      ]
    };
  }
};
</script>
