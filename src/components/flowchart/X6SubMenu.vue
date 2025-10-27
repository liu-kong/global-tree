<template>
  <div 
    :class="[
      'x6-submenu',
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
    <span class="x6-submenu-arrow">▶</span>
    
    <div class="x6-submenu-children">
      <slot name="children"></slot>
    </div>
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
.x6-submenu {
  position: relative;
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

.x6-submenu:hover {
  background-color: #f5f5f5;
}

.x6-submenu:hover .x6-submenu-children {
  display: block;
}

.x6-submenu.active {
  background-color: #e6f7ff;
  color: #1890ff;
}

.x6-submenu.disabled {
  color: #bfbfbf;
  cursor: not-allowed;
}

.x6-submenu.disabled:hover {
  background-color: transparent;
}

.x6-submenu.disabled:hover .x6-submenu-children {
  display: none;
}

.x6-submenu.hidden {
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

.x6-submenu-arrow {
  margin-left: 8px;
  font-size: 10px;
  color: #8c8c8c;
  transition: transform 0.2s;
  flex-shrink: 0;
}

.x6-submenu:hover .x6-submenu-arrow {
  transform: rotate(90deg);
}

.x6-submenu-children {
  position: absolute;
  left: 100%;
  top: 0;
  background: #fff;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  padding: 4px 0;
  min-width: 120px;
  box-shadow: 0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 9px 28px 8px rgba(0, 0, 0, 0.05);
  z-index: 1001;
  display: none;
}

/* 确保子菜单不会超出视窗 */
.x6-submenu-children {
  max-height: 80vh;
  overflow-y: auto;
}

/* 当子菜单会超出右边界时，显示在左侧 */
.x6-submenu:nth-last-child(1) .x6-submenu-children {
  left: auto;
  right: 100%;
}
</style>
