<template>
  <div class="page">
    <!-- 设备状态卡 -->
    <div class="card">
      <div class="card-title">设备状态</div>
      <div class="stat-row">
        <span class="stat-label">连接状态</span>
        <span :class="['val', state.connected ? 'ok' : 'err']">
          {{ state.connected ? "已连接" : "未连接" }}
        </span>
      </div>
      <div class="stat-row">
        <span class="stat-label">当前模式</span>
        <span class="val">{{ state.modeName || "—" }}</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">帧率（实测 / 目标）</span>
        <span class="val">
          {{ state.running ? state.measuredFps : "—" }} / {{ state.fps }} Hz
        </span>
      </div>
      <div class="stat-row">
        <span class="stat-label">单帧延迟</span>
        <span class="val">
          {{ state.running ? (state.latency + " ms") : "—" }}
        </span>
      </div>
    </div>

    <!-- 错误信息卡 -->
    <div class="card">
      <div class="card-title">错误信息</div>
      <div v-if="state.errors.length === 0">
        <span class="val ok">无错误</span>
      </div>
      <div v-else class="error-list">
        <div
          v-for="(err, i) in state.errors"
          :key="i"
          class="err-item"
        >
          [{{ err.time }}] {{ err.msg }}
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "StatusPage",
  inject: ["state"]
};
</script>