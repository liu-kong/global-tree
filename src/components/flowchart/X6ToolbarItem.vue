<template>
  <div 
    :class="[
      'x6-toolbar-item',
      {
        active: active,
        disabled: disabled,
        hidden: hidden
      }
    ]"
    :data-name="name"
    :data-value="value || undefined"
    :title="tooltipAsTitle ? tooltip : undefined"
    @click="handleClick"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <span v-if="icon || $slots.icon" class="x6-toolbar-item-icon">
      <slot name="icon">{{ icon }}</slot>
    </span>
    <span v-if="text || $slots.default" class="x6-toolbar-item-text">
      <slot>{{ text }}</slot>
    </span>
    
    <!-- 下拉菜单 -->
    <div 
      v-if="dropdown || $slots.dropdown" 
      class="x6-toolbar-item-dropdown"
      @click.stop="toggleDropdown"
    >
      <span v-if="dropdownArrow" class="x6-toolbar-item-dropdown-arrow">▼</span>
      <div 
        v-show="showDropdown" 
        class="x6-toolbar-item-dropdown-content"
        @click.stop
      >
        <slot name="dropdown">{{ dropdown }}</slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

// 定义props
interface Props {
  className?: string
  name?: string
  icon?: string
  text?: string | any
  hidden?: boolean
  disabled?: boolean
  active?: boolean
  tooltip?: string
  tooltipProps?: any
  tooltipAsTitle?: boolean
  dropdown?: any
  dropdownArrow?: boolean
  onClick?: (name?: string) => void
}

const props = withDefaults(defineProps<Props>(), {
  className: '',
  hidden: false,
  disabled: false,
  active: false,
  tooltipAsTitle: false,
  dropdownArrow: true,
})

// 下拉菜单状态
const showDropdown = ref(false)

// 处理点击事件
const handleClick = (e: Event) => {
  e.stopPropagation()
  
  if (props.disabled) {
    return
  }
  
  if (props.onClick) {
    props.onClick(props.name)
  }
  
  // 关闭下拉菜单
  showDropdown.value = false
}

// 处理鼠标进入
const handleMouseEnter = (e: Event) => {
  if (props.disabled || !props.tooltip || props.tooltipAsTitle) {
    return
  }
  
  // 这里可以集成tooltip组件
  // 暂时使用简单的title属性
}

// 处理鼠标离开
const handleMouseLeave = () => {
  // 延迟关闭下拉菜单，以便用户可以移动到下拉内容
  setTimeout(() => {
    showDropdown.value = false
  }, 200)
}

// 切换下拉菜单
const toggleDropdown = (e: Event) => {
  e.stopPropagation()
  if (!props.disabled) {
    showDropdown.value = !showDropdown.value
  }
}

// 点击外部关闭下拉菜单
const handleClickOutside = (e: Event) => {
  const target = e.target as HTMLElement
  if (!target.closest('.x6-toolbar-item')) {
    showDropdown.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.x6-toolbar-item {
  display: flex;
  align-items: center;
  padding: 6px 8px;
  cursor: pointer;
  transition: all 0.2s;
  border-radius: 4px;
  font-size: 14px;
  color: #262626;
  user-select: none;
  position: relative;
  white-space: nowrap;
}

.x6-toolbar-item:hover {
  background-color: #f5f5f5;
}

.x6-toolbar-item.active {
  background-color: #1890ff;
  color: #fff;
}

.x6-toolbar-item.disabled {
  color: #bfbfbf;
  cursor: not-allowed;
  opacity: 0.6;
}

.x6-toolbar-item.disabled:hover {
  background-color: transparent;
}

.x6-toolbar-item.hidden {
  display: none;
}

.x6-toolbar-item-icon {
  margin-right: 6px;
  font-size: 14px;
  width: 14px;
  text-align: center;
  flex-shrink: 0;
}

.x6-toolbar-item-text {
  font-size: 14px;
  white-space: nowrap;
}

.x6-toolbar-item-dropdown {
  position: relative;
  margin-left: 4px;
}

.x6-toolbar-item-dropdown-arrow {
  font-size: 10px;
  color: #8c8c8c;
  transition: transform 0.2s;
}

.x6-toolbar-item-dropdown:hover .x6-toolbar-item-dropdown-arrow {
  transform: rotate(180deg);
}

.x6-toolbar-item-dropdown-content {
  position: absolute;
  top: 100%;
  left: 0;
  background: #fff;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  padding: 4px 0;
  min-width: 120px;
  box-shadow: 0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 9px 28px 8px rgba(0, 0, 0, 0.05);
  z-index: 1000;
  margin-top: 2px;
}

/* 确保下拉菜单不会超出视窗 */
.x6-toolbar-item-dropdown-content {
  max-height: 80vh;
  overflow-y: auto;
}

/* 当下拉菜单会超出右边界时，显示在左侧 */
.x6-toolbar-item-dropdown-content {
  left: 0;
}

.x6-toolbar-item-dropdown-content.right-align {
  left: auto;
  right: 0;
}
</style>
