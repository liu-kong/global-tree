<template>
  <div 
    :class="['x6-menu', className]" 
    @click="handleMenuClick"
  >
    <slot></slot>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

// 定义props
interface Props {
  className?: string
  hasIcon?: boolean
  onClick?: (name: string) => void
}

const props = withDefaults(defineProps<Props>(), {
  className: '',
  hasIcon: false,
})

// 快捷键映射
const hotkeyMap = new Map<string, () => void>()

// 注册快捷键
const registerHotkey = (hotkey: string, handler: () => void) => {
  hotkeyMap.set(hotkey.toLowerCase(), handler)
  
  // 监听键盘事件
  const handleKeydown = (e: KeyboardEvent) => {
    const key = getKeyString(e)
    if (hotkeyMap.has(key)) {
      e.preventDefault()
      hotkeyMap.get(key)?.()
    }
  }
  
  document.addEventListener('keydown', handleKeydown)
  
  // 返回清理函数
  return () => {
    document.removeEventListener('keydown', handleKeydown)
    hotkeyMap.delete(hotkey)
  }
}

// 取消注册快捷键
const unregisterHotkey = (hotkey: string, handler: () => void) => {
  const key = hotkey.toLowerCase()
  if (hotkeyMap.get(key) === handler) {
    hotkeyMap.delete(key)
  }
}

// 获取按键字符串
const getKeyString = (e: KeyboardEvent): string => {
  const parts: string[] = []
  
  if (e.ctrlKey || e.metaKey) {
    parts.push('cmd')
  }
  if (e.shiftKey) {
    parts.push('shift')
  }
  if (e.altKey) {
    parts.push('alt')
  }
  
  let key = e.key.toLowerCase()
  if (key === ' ') {
    key = 'space'
  } else if (key === 'escape') {
    key = 'esc'
  }
  
  parts.push(key)
  return parts.join('+')
}

// 处理菜单点击
const handleMenuClick = (e: Event) => {
  const target = e.target as HTMLElement
  const menuItem = target.closest('.x6-menu-item')
  
  if (menuItem) {
    const name = menuItem.getAttribute('data-name')
    if (name && props.onClick) {
      props.onClick(name)
    }
  }
}

// 暴露方法给父组件
defineExpose({
  registerHotkey,
  unregisterHotkey,
})

// 生命周期
onUnmounted(() => {
  hotkeyMap.clear()
})
</script>

<style scoped>
.x6-menu {
  background: #fff;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  padding: 4px 0;
  min-width: 120px;
  box-shadow: 0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 9px 28px 8px rgba(0, 0, 0, 0.05);
  z-index: 1000;
}

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

.x6-menu-item-icon {
  margin-right: 8px;
  font-size: 14px;
  width: 14px;
  text-align: center;
}

.x6-menu-item-text {
  flex: 1;
}

.x6-menu-item-hotkey {
  margin-left: 8px;
  font-size: 12px;
  color: #8c8c8c;
}

.x6-menu-divider {
  height: 1px;
  background-color: #f0f0f0;
  margin: 4px 0;
}

.x6-submenu {
  position: relative;
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

.x6-submenu:hover .x6-submenu-children {
  display: block;
}
</style>
