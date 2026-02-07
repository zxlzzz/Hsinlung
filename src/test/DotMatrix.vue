<template>
  <div class="matrix" :style="gridStyle">
    <div
      v-for="(cell, idx) in flatCells"
      :key="idx"
      class="dotWrap"
    >
      <div
        class="dot"
        :class="dotClass(cell)"
        :style="dotStyle(cell)"
      >
        <!-- 高光层 -->
        <div class="highlight" :style="highlightStyle(cell)" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  rows: { type: Number, default: 21 },
  cols: { type: Number, default: 31 },

  // 2D number array: state[r][c] = 0/1/2
  modelValue: { type: Array, required: true },

  // 外观参数
  size: { type: Number, default: 8 },      // 点直径(px) - 缩小以适应31x21
  gap: { type: Number, default: 6 },       // 点间距(px)
  lift: { type: Number, default: 10 },     // 最大起伏高度(px)
  shadow: { type: Number, default: 20 },   // 最大阴影强度(px)
});

const gridStyle = computed(() => ({
  gridTemplateColumns: `repeat(${props.cols}, ${props.size + props.gap}px)`,
  gridTemplateRows: `repeat(${props.rows}, ${props.size + props.gap}px)`,
}));

const flatCells = computed(() => {
  const out = [];
  for (let r = 0; r < props.rows; r++) {
    for (let c = 0; c < props.cols; c++) {
      const val = props.modelValue?.[r]?.[c] ?? 0;
      out.push(Math.max(0, Math.min(2, val))); // 限制在 0-2
    }
  }
  return out;
});

function dotClass(level) {
  return {
    'level-0': level === 0,
    'level-1': level === 1,
    'level-2': level === 2,
  };
}

function dotStyle(level) {
  // 根据三级高度计算位移和阴影
  const ratio = level / 2; // 0, 0.5, 1
  const y = -props.lift * ratio;
  
  // 阴影：level 0 最浅，level 2 最深
  const blur = props.shadow * (0.3 + ratio * 0.7);
  const spread = Math.floor(props.lift * 0.4 * ratio);
  const alpha = 0.12 + ratio * 0.22; // 0.12 → 0.34

  return {
    width: `${props.size}px`,
    height: `${props.size}px`,
    transform: `translateY(${y}px)`,
    boxShadow: `
      0 ${Math.max(1, Math.floor(spread * 0.8))}px ${blur}px rgba(0,0,0,${alpha}),
      0 ${Math.max(0, Math.floor(spread * 0.3))}px ${Math.floor(blur * 0.5)}px rgba(0,0,0,${alpha * 0.6})
    `,
  };
}

function highlightStyle(level) {
  // 高光强度随高度增加
  const ratio = level / 2;
  const opacity = 0.15 + ratio * 0.35; // 0.15 → 0.5
  
  return {
    opacity: opacity,
    background: `radial-gradient(circle at 30% 25%, rgba(255,255,255,${opacity}), transparent 60%)`,
  };
}
</script>

<style scoped>
.matrix {
  display: grid;
  align-items: center;
  justify-content: center;

  padding: 20px;
  border-radius: 16px;
  background: linear-gradient(145deg, #f8f9fb 0%, #f3f4f6 100%);
  border: 1px solid #e6e8ee;
  box-shadow: 
    inset 0 1px 2px rgba(255,255,255,0.8),
    0 4px 12px rgba(0,0,0,0.04);
}

.dotWrap {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
}

.dot {
  position: relative;
  border-radius: 999px;
  background: #ffffff;
  border: 1px solid #d8dbe3;

  /* 更流畅的贝塞尔曲线 */
  transition: 
    transform 220ms cubic-bezier(0.34, 1.56, 0.64, 1),
    box-shadow 220ms cubic-bezier(0.34, 1.56, 0.64, 1),
    background 180ms ease,
    border-color 180ms ease;
}

.dot.level-0 {
  background: #fafbfc;
  border-color: #e3e6ee;
}

.dot.level-1 {
  background: #fcfcfd;
  border-color: #d0d4de;
}

.dot.level-2 {
  background: #ffffff;
  border-color: #c4c8d4;
}

.highlight {
  position: absolute;
  inset: 0;
  border-radius: 999px;
  pointer-events: none;
  transition: opacity 220ms cubic-bezier(0.34, 1.56, 0.64, 1);
}
</style>