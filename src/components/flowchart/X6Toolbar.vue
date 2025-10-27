<template>
  <div 
    :class="[
      'x6-toolbar',
      {
        'x6-toolbar-small': size === 'small',
        'x6-toolbar-big': size === 'big',
        'x6-toolbar-hover': hoverEffect
      }
    ]"
    :style="style"
    @click="handleToolbarClick"
  >
    <div class="x6-toolbar-content">
      <slot></slot>
    </div>
    <div v-if="extra || $slots.extra" class="x6-toolbar-extra">
      <slot name="extra">{{ extra }}</slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

// 定义props
interface Props {
  className?: string
  extra?: string
  size?: 'small' | 'big'
  align?: 'left' | 'right'
  hoverEffect?: boolean
  onClick?: (name: string, value?: any) => void
  style?: any
}

const props = withDefaults(defineProps<Props>(), {
  className: '',
  size: 'small',
  align: 'left',
  hoverEffect: false,
})

// 处理工具栏点击
const handleToolbarClick = (e: Event) => {
  const target = e.target as HTMLElement
  const toolbarItem = target.closest('.x6-toolbar-item')
  
  if (toolbarItem) {
    const name = toolbarItem.getAttribute('data-name')
    const value = toolbarItem.getAttribute('data-value')
    
    if (name && props.onClick) {
      props.onClick(name, value)
    }
  }
}
</script>

<style scoped>
.x6-toolbar {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  background: #fff;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  gap: 8px;
  user-select: none;
}

.x6-toolbar.x6-toolbar-small {
  padding: 4px 8px;
  gap: 4px;
}

.x6-toolbar.x6-toolbar-big {
  padding: 12px 16px;
  gap: 12px;
}

.x6-toolbar-content {
  display: flex;
  align-items: center;
  gap: inherit;
  flex: 1;
}

.x6-toolbar-extra {
  margin-left: auto;
  display: flex;
  align-items: center;
}

.x6-toolbar.x6-toolbar-hover .x6-toolbar-item:hover {
  background-color: #f5f5f5;
  border-radius: 4px;
}

.x6-toolbar.x6-toolbar-hover .x6-toolbar-item.active:hover {
  background-color: #e6f7ff;
}
</style>
