<template>
  <div 
    :class="[
      'x6-menu-item',
      {
        active: active,
        disabled: disabled,
        hidden: hidden
      }
    ]"
    :data-name="name"
    @click="handleClick"
  >
    <span v-if="icon || $slots.icon" class="x6-menu-item-icon">
      <slot name="icon">{{ icon }}</slot>
    </span>
    <span class="x6-menu-item-text">
      <slot>{{ text }}</slot>
    </span>
    <span v-if="hotkey" class="x6-menu-item-hotkey">
      {{ hotkey }}
    </span>
    <slot name="children"></slot>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, inject } from 'vue'

// 定义props
interface Props {
  className?: string
  name?: string
  icon?: string
  text?: string
  hotkey?: string
  active?: boolean
  hidden?: boolean
  disabled?: boolean
  onClick?: () => void
}

const props = withDefaults(defineProps<Props>(), {
  className: '',
  active: false,
  hidden: false,
  disabled: false,
})

// 注入父级菜单的快捷键注册方法
const registerHotkey = inject<(hotkey: string, handler: () => void) => void>('registerHotkey')
const unregisterHotkey = inject<(hotkey: string, handler: () => void) => void>('unregisterHotkey')

// 处理点击事件
const handleClick = (e: Event) => {
  e.stopPropagation()
  
  if (props.disabled) {
    return
  }
  
  if (props.onClick) {
    props.onClick()
  }
}

// 注册快捷键
let hotkeyCleanup: (() => void) | null = null

onMounted(() => {
  if (props.hotkey && props.name && registerHotkey) {
    const handler = () => {
      if (!props.disabled) {
        handleClick(new Event('hotkey'))
      }
    }
    
    registerHotkey(props.hotkey, handler)
    
    // 保存清理函数
    hotkeyCleanup = () => {
      if (unregisterHotkey) {
        unregisterHotkey(props.hotkey!, handler)
      }
    }
  }
})

// 清理快捷键
import { onUnmounted } from 'vue'
onUnmounted(() => {
  if (hotkeyCleanup) {
    hotkeyCleanup()
  }
})
</script>

<style scoped>
.x6-menu-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  cursor: pointer;
  transition: background-color 0.2s;
  font-size: 14px;
  color: #262626;
  text-decoration: none;
  user-select: none;
}

.x6-menu-item:hover {
  background-color: #f5f5f5;
}

.x6-menu-item.active {
  background-color: #e6f7ff;
  color: #1890ff;
}

.x6-menu-item.disabled {
  color: #bfbfbf;
  cursor: not-allowed;
}

.x6-menu-item.disabled:hover {
  background-color: transparent;
}

.x6-menu-item.hidden {
  display: none;
}

.x6-menu-item-icon {
  margin-right: 8px;
  font-size: 14px;
  width: 14px;
  text-align: center;
  flex-shrink: 0;
}

.x6-menu-item-text {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.x6-menu-item-hotkey {
  margin-left: 8px;
  font-size: 12px;
  color: #8c8c8c;
  flex-shrink: 0;
}
</style>
