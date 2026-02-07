<template>
  <div class="wrap">
    <DotMatrix 
      v-model="state" 
      :rows="rows" 
      :cols="cols" 
      :size="8" 
      :gap="6" 
      :lift="10" 
      :shadow="20" 
    />
    <ControlPanel 
      v-model="state" 
      :rows="rows" 
      :cols="cols" 
    />
  </div>
</template>

<script setup>
import { ref } from "vue";
import DotMatrix from "./test/DotMatrix.vue";
import ControlPanel from "./test/ControlPanel.vue";

const rows = 21;
const cols = 31;

// 初始化 31×21 的空数组 (所有点都是 0)
const state = ref(
  Array.from({ length: rows }, () => 
    Array.from({ length: cols }, () => 0)
  )
);

// 【供外部调用】直接替换整个数组
function updateState(newState) {
  if (!Array.isArray(newState) || newState.length !== rows) {
    console.error(`Invalid state: expected ${rows}×${cols} array`);
    return;
  }
  
  // 验证并复制
  const validated = newState.map((row, r) => {
    if (!Array.isArray(row) || row.length !== cols) {
      console.error(`Invalid row ${r}: expected ${cols} columns`);
      return Array(cols).fill(0);
    }
    return row.map(v => Math.max(0, Math.min(2, v ?? 0))); // 确保值在 0-2
  });
  
  state.value = validated;
}

// 暴露给外部使用（如果需要在父组件中调用）
defineExpose({
  updateState,
  state,
});
</script>

<style scoped>
.wrap {
  display: flex;
  gap: 20px;
  align-items: flex-start;
  padding: 24px;
  background: linear-gradient(135deg, #f0f2f5 0%, #e5e7eb 100%);
  min-height: 100vh;
}

@media (max-width: 1200px) {
  .wrap {
    flex-direction: column;
    align-items: center;
  }
}
</style>