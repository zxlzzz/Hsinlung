<template>
  <div class="page">
    <!-- BLE连接 -->
    <div class="card">
      <div class="card-title">蓝牙连接</div>
      <div class="debug-row">
        <span class="debug-label">设备状态</span>
        <span :class="state.connected ? 'val ok' : 'val err'">
          {{ state.connected ? "已连接" : "未连接" }}
        </span>
      </div>
      <div class="debug-row">
        <span class="debug-label">连接 / 断开</span>
        <button
          v-if="!state.connected"
          class="btn primary"
          @click="connectBLE"
          :disabled="connecting"
        >
          {{ connecting ? "连接中..." : "连接盲杖" }}
        </button>
        <button
          v-else
          class="btn danger"
          @click="disconnectBLE"
        >
          断开
        </button>
      </div>
    </div>

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
    </div>
  </div>
</template>

<script>
export default {
  name: "DebugPage",
  inject: ["state", "integration"],

  data() {
    return {
      inputFps: 5,
      connecting: false
    };
  },

  methods: {
    async connectBLE() {
      this.connecting = true;
      await this.integration.hw.connect();
      this.connecting = false;
    },
    disconnectBLE() {
      this.integration.hw.disconnect();
    },
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