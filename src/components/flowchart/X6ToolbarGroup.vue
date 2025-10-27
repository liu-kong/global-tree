<template>
  <div 
    :class="[
      'x6-toolbar-group',
      {
        'x6-toolbar-group-vertical': vertical,
        'x6-toolbar-group-align-right': align === 'right'
      }
    ]"
    :style="style"
  >
    <slot></slot>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

// 定义props
interface Props {
  className?: string
  vertical?: boolean
  align?: 'left' | 'right'
  style?: any
}

const props = withDefaults(defineProps<Props>(), {
  className: '',
  vertical: false,
  align: 'left',
})
</script>

<style scoped>
.x6-toolbar-group {
  display: flex;
  align-items: center;
  gap: 4px;
}

.x6-toolbar-group.x6-toolbar-group-vertical {
  flex-direction: column;
  align-items: stretch;
  gap: 2px;
}

.x6-toolbar-group.x6-toolbar-group-align-right {
  margin-left: auto;
}

/* 为工具栏组内的项目提供统一的样式 */
.x6-toolbar-group :deep(.x6-toolbar-item) {
  margin: 0;
}

/* 垂直组内的项目样式调整 */
.x6-toolbar-group.x6-toolbar-group-vertical :deep(.x6-toolbar-item) {
  justify-content: flex-start;
  text-align: left;
}

/* 组之间的分隔线 */
.x6-toolbar-group:not(:last-child) {
  margin-right: 8px;
  padding-right: 8px;
  border-right: 1px solid #f0f0f0;
}

.x6-toolbar-group.x6-toolbar-group-vertical:not(:last-child) {
  margin-right: 8px;
  padding-right: 8px;
  border-right: 1px solid #f0f0f0;
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}
</style>
