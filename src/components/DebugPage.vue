<template>
  <div class="page">
    <!-- 运行控制 -->
    <div class="card">
      <div class="card-title">运行控制</div>
      <div class="debug-row">
        <span class="debug-label">启动 / 停止</span>
        <button
          :class="['btn', state.running ? 'danger' : 'primary']"
          @click="toggleRunning"
        >
          {{ state.running ? "停止" : "启动" }}
        </button>
      </div>
      <div class="debug-row">
        <span class="debug-label">切换模式</span>
        <button class="btn secondary" @click="toggleMode">
          切换 → {{ state.modeName === 'MAP' ? 'ZOOM' : 'MAP' }}
        </button>
      </div>
      <div class="debug-row">
        <span class="debug-label">模拟按钮</span>
        <button class="btn secondary" @click="simulateButton">
          模拟硬件按钮
        </button>
      </div>
    </div>

    <!-- 参数调节 -->
    <div class="card">
      <div class="card-title">参数调节</div>
      <div class="debug-row">
        <span class="debug-label">帧率 (Hz)</span>
        <input
          type="number"
          v-model.number="inputFps"
          min="1"
          max="30"
          class="input-number"
        >
        <button class="btn secondary" @click="applyFps">设置</button>
        <span class="hint">当前: {{ state.fps }} Hz</span>
      </div>
      <!-- TODO（队友）：摄像头开关、分辨率选择 -->
    </div>
  </div>
</template>

<script>
export default {
  name: "DebugPage",

  inject: ["state", "integration"],

  data() {
    return {
      inputFps: 5
    };
  },

  methods: {
    toggleRunning() {
      this.state.running ? this.integration.stop() : this.integration.start();
    },
    toggleMode() {
      this.integration.toggle_mode();
    },
    simulateButton() {
      this.integration.simulate_button();
    },
    applyFps() {
      const val = parseInt(this.inputFps, 10);
      if (!isNaN(val)) this.integration.set_fps(val);
    }
  }
};
</script>