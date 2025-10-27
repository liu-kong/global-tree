<template>
  <div class="panning-control-panel">
    <div class="panel-section">
      <h3 class="section-title">画布拖拽</h3>
      
      <!-- 基础拖拽控制 -->
      <div class="control-group">
        <div class="control-item">
          <label class="control-label">
            <input 
              type="checkbox" 
              v-model="config.enabled"
              @change="updateConfig"
            />
            启用画布拖拽
          </label>
          <p class="control-desc">允许拖拽移动整个画布</p>
        </div>
      </div>

      <!-- 拖拽触发方式 -->
      <div class="control-group" v-if="config.enabled">
        <h4 class="group-title">触发方式</h4>
        <div class="control-item">
          <label class="control-label">拖拽触发方式</label>
          <select 
            v-model="config.triggerType" 
            @change="updateConfig"
            class="control-select"
          >
            <option value="left">左键拖拽</option>
            <option value="right">右键拖拽</option>
            <option value="middle">中键拖拽</option>
            <option value="ctrl">Ctrl+左键拖拽</option>
            <option value="shift">Shift+左键拖拽</option>
            <option value="alt">Alt+左键拖拽</option>
          </select>
          <p class="control-desc">选择触发画布拖拽的鼠标操作</p>
        </div>
      </div>

      <!-- 拖拽限制 -->
      <div class="control-group" v-if="config.enabled">
        <h4 class="group-title">拖拽限制</h4>
        <div class="control-item">
          <label class="control-label">
            <input 
              type="checkbox" 
              v-model="config.restrictBounds"
              @change="updateConfig"
            />
            限制边界
          </label>
          <p class="control-desc">限制画布拖拽范围</p>
        </div>
        
        <div class="control-item" v-if="config.restrictBounds">
          <label class="control-label">边界限制模式</label>
          <select 
            v-model="config.boundMode" 
            @change="updateConfig"
            class="control-select"
          >
            <option value="content">内容边界</option>
            <option value="viewport">视口边界</option>
            <option value="custom">自定义边界</option>
          </select>
        </div>
      </div>

      <!-- 拖拽性能 -->
      <div class="control-group" v-if="config.enabled">
        <h4 class="group-title">性能优化</h4>
        <div class="control-item">
          <label class="control-label">
            <input 
              type="checkbox" 
              v-model="config.optimized"
              @change="updateConfig"
            />
            优化模式
          </label>
          <p class="control-desc">启用拖拽性能优化</p>
        </div>
        
        <div class="control-item" v-if="config.optimized">
          <label class="control-label">更新频率</label>
          <div class="slider-container">
            <input 
              type="range" 
              v-model="config.updateRate"
              min="16" 
              max="100" 
              step="16"
              @change="updateConfig"
              class="control-slider"
            />
            <span class="slider-value">{{ config.updateRate }}ms</span>
          </div>
          <p class="control-desc">拖拽更新频率（毫秒）</p>
        </div>
      </div>

      <!-- 拖拽样式 -->
      <div class="control-group" v-if="config.enabled">
        <h4 class="group-title">视觉效果</h4>
        <div class="control-item">
          <label class="control-label">
            <input 
              type="checkbox" 
              v-model="config.showCursor"
              @change="updateConfig"
            />
            显示拖拽光标
          </label>
          <p class="control-desc">拖拽时显示特殊光标</p>
        </div>
        
        <div class="control-item">
          <label class="control-label">
            <input 
              type="checkbox" 
              v-model="config.showIndicator"
              @change="updateConfig"
            />
            显示拖拽指示器
          </label>
          <p class="control-desc">显示拖拽位置指示</p>
        </div>
      </div>

      <!-- 预设配置 -->
      <div class="control-group">
        <h4 class="group-title">预设配置</h4>
        <div class="preset-buttons">
          <button 
            @click="applyPreset('default')"
            class="preset-btn"
            :class="{ active: currentPreset === 'default' }"
          >
            默认配置
          </button>
          <button 
            @click="applyPreset('touch')"
            class="preset-btn"
            :class="{ active: currentPreset === 'touch' }"
          >
            触摸优化
          </button>
          <button 
            @click="applyPreset('performance')"
            class="preset-btn"
            :class="{ active: currentPreset === 'performance' }"
          >
            性能优先
          </button>
          <button 
            @click="applyPreset('restricted')"
            class="preset-btn"
            :class="{ active: currentPreset === 'restricted' }"
          >
            严格限制
          </button>
        </div>
      </div>

      <!-- 快捷操作 -->
      <div class="control-group">
        <h4 class="group-title">快捷操作</h4>
        <div class="action-buttons">
          <button 
            @click="resetToCenter"
            class="action-btn"
          >
            重置到中心
          </button>
          <button 
            @click="fitToContent"
            class="action-btn"
          >
            适应内容
          </button>
          <button 
            @click="togglePanning"
            class="action-btn"
            :class="{ active: config.enabled }"
          >
            {{ config.enabled ? '禁用拖拽' : '启用拖拽' }}
          </button>
        </div>
      </div>

      <!-- 状态信息 -->
      <div class="control-group">
        <h4 class="group-title">状态信息</h4>
        <div class="status-info">
          <div class="status-item">
            <span class="status-label">拖拽状态:</span>
            <span class="status-value" :class="{ active: config.enabled }">
              {{ config.enabled ? '已启用' : '已禁用' }}
            </span>
          </div>
          <div class="status-item">
            <span class="status-label">触发方式:</span>
            <span class="status-value">{{ getTriggerTypeLabel(config.triggerType) }}</span>
          </div>
          <div class="status-item">
            <span class="status-label">当前位置:</span>
            <span class="status-value">{{ currentPosition }}</span>
          </div>
          <div class="status-item">
            <span class="status-label">拖拽次数:</span>
            <span class="status-value">{{ dragCount }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, watch } from 'vue'

// 定义props
interface Props {
  graph?: any
}

const props = defineProps<Props>()

// 定义emits
const emit = defineEmits<{
  panningChange: [config: any]
}>()

// 响应式数据
const config = reactive({
  enabled: true,
  triggerType: 'left', // left, right, middle, ctrl, shift, alt
  restrictBounds: false,
  boundMode: 'content', // content, viewport, custom
  optimized: false,
  updateRate: 16, // 毫秒
  showCursor: true,
  showIndicator: false,
  customBounds: {
    x: -1000,
    y: -1000,
    width: 2000,
    height: 2000
  }
})

const currentPreset = ref('default')
const currentPosition = ref('0, 0')
const dragCount = ref(0)
let isDragging = ref(false)
let dragStartPos = ref({ x: 0, y: 0 })
let lastUpdatePos = ref({ x: 0, y: 0 })
let updateTimer: number | null = null

// 预设配置
const presets = {
  default: {
    enabled: true,
    triggerType: 'left',
    restrictBounds: false,
    boundMode: 'content',
    optimized: false,
    updateRate: 16,
    showCursor: true,
    showIndicator: false
  },
  touch: {
    enabled: true,
    triggerType: 'left',
    restrictBounds: true,
    boundMode: 'content',
    optimized: true,
    updateRate: 32,
    showCursor: true,
    showIndicator: true
  },
  performance: {
    enabled: true,
    triggerType: 'middle',
    restrictBounds: false,
    boundMode: 'viewport',
    optimized: true,
    updateRate: 100,
    showCursor: false,
    showIndicator: false
  },
  restricted: {
    enabled: true,
    triggerType: 'ctrl',
    restrictBounds: true,
    boundMode: 'custom',
    optimized: false,
    updateRate: 16,
    showCursor: true,
    showIndicator: true
  }
}

// 获取触发方式标签
const getTriggerTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    left: '左键拖拽',
    right: '右键拖拽',
    middle: '中键拖拽',
    ctrl: 'Ctrl+左键',
    shift: 'Shift+左键',
    alt: 'Alt+左键'
  }
  return labels[type] || type
}

// 更新配置
const updateConfig = () => {
  emit('panningChange', { ...config })
  applyPanningConfig()
}

// 应用拖拽配置
const applyPanningConfig = () => {
  if (!props.graph) return

  try {
    // 移除现有的事件监听器
    removePanningListeners()

    if (!config.enabled) {
      // 禁用拖拽
      disablePanning()
      return
    }

    // 启用拖拽
    enablePanning()

    console.log('Panning config applied:', config)
  } catch (error) {
    console.error('Failed to apply panning config:', error)
  }
}

// 启用拖拽
const enablePanning = () => {
  if (!props.graph) return

  const container = props.graph.container
  if (!container) return

  // 设置拖拽光标
  if (config.showCursor) {
    container.style.cursor = getCursorForTrigger(config.triggerType)
  }

  // 添加事件监听器
  container.addEventListener('mousedown', handleMouseDown)
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)

  // 防止右键菜单
  if (config.triggerType === 'right') {
    container.addEventListener('contextmenu', preventContextMenu)
  }
}

// 禁用拖拽
const disablePanning = () => {
  if (!props.graph) return

  const container = props.graph.container
  if (!container) return

  // 恢复默认光标
  container.style.cursor = ''

  // 移除事件监听器
  removePanningListeners()
}

// 移除拖拽监听器
const removePanningListeners = () => {
  if (!props.graph) return

  const container = props.graph.container
  if (!container) return

  container.removeEventListener('mousedown', handleMouseDown)
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', handleMouseUp)
  container.removeEventListener('contextmenu', preventContextMenu)

  if (updateTimer) {
    clearTimeout(updateTimer)
    updateTimer = null
  }
}

// 获取触发方式对应的光标
const getCursorForTrigger = (triggerType: string) => {
  const cursors: Record<string, string> = {
    left: 'grab',
    right: 'grab',
    middle: 'grab',
    ctrl: 'grab',
    shift: 'grab',
    alt: 'grab'
  }
  return cursors[triggerType] || 'default'
}

// 检查是否应该触发拖拽
const shouldTriggerPanning = (e: MouseEvent) => {
  switch (config.triggerType) {
    case 'left':
      return e.button === 0 && !e.ctrlKey && !e.shiftKey && !e.altKey
    case 'right':
      return e.button === 2
    case 'middle':
      return e.button === 1
    case 'ctrl':
      return e.button === 0 && e.ctrlKey && !e.shiftKey && !e.altKey
    case 'shift':
      return e.button === 0 && !e.ctrlKey && e.shiftKey && !e.altKey
    case 'alt':
      return e.button === 0 && !e.ctrlKey && !e.shiftKey && e.altKey
    default:
      return false
  }
}

// 阻止右键菜单
const preventContextMenu = (e: MouseEvent) => {
  e.preventDefault()
  return false
}

// 处理鼠标按下
const handleMouseDown = (e: MouseEvent) => {
  if (!shouldTriggerPanning(e)) return

  e.preventDefault()
  isDragging.value = true
  dragStartPos.value = { x: e.clientX, y: e.clientY }
  
  // 更新光标
  if (config.showCursor && props.graph?.container) {
    props.graph.container.style.cursor = 'grabbing'
  }

  // 显示拖拽指示器
  if (config.showIndicator) {
    showDragIndicator(e.clientX, e.clientY)
  }
}

// 处理鼠标移动
const handleMouseMove = (e: MouseEvent) => {
  if (!isDragging.value) return

  e.preventDefault()

  const deltaX = e.clientX - dragStartPos.value.x
  const deltaY = e.clientY - dragStartPos.value.y

  // 应用边界限制
  let finalDeltaX = deltaX
  let finalDeltaY = deltaY

  if (config.restrictBounds) {
    const bounds = getRestrictedBounds()
    const currentPos = getCurrentPosition()
    
    finalDeltaX = Math.max(bounds.minX - currentPos.x, Math.min(bounds.maxX - currentPos.x, deltaX))
    finalDeltaY = Math.max(bounds.minY - currentPos.y, Math.min(bounds.maxY - currentPos.y, deltaY))
  }

  // 性能优化：限制更新频率
  if (config.optimized) {
    if (updateTimer) {
      clearTimeout(updateTimer)
    }
    
    updateTimer = window.setTimeout(() => {
      applyPanning(finalDeltaX, finalDeltaY)
      updateTimer = null
    }, config.updateRate)
  } else {
    applyPanning(finalDeltaX, finalDeltaY)
  }

  // 更新拖拽指示器
  if (config.showIndicator) {
    updateDragIndicator(e.clientX, e.clientY)
  }
}

// 处理鼠标释放
const handleMouseUp = (e: MouseEvent) => {
  if (!isDragging.value) return

  isDragging.value = false
  dragCount.value++

  // 恢复光标
  if (config.showCursor && props.graph?.container) {
    props.graph.container.style.cursor = getCursorForTrigger(config.triggerType)
  }

  // 隐藏拖拽指示器
  if (config.showIndicator) {
    hideDragIndicator()
  }

  // 清理定时器
  if (updateTimer) {
    clearTimeout(updateTimer)
    updateTimer = null
  }

  // 更新当前位置
  updateCurrentPosition()
}

// 应用拖拽
const applyPanning = (deltaX: number, deltaY: number) => {
  if (!props.graph) return

  try {
    // 使用X6的translate方法
    props.graph.translate(deltaX, deltaY)
    lastUpdatePos.value = { x: deltaX, y: deltaY }
  } catch (error) {
    console.error('Failed to apply panning:', error)
  }
}

// 获取限制边界
const getRestrictedBounds = () => {
  if (!props.graph) return { minX: -1000, minY: -1000, maxX: 1000, maxY: 1000 }

  switch (config.boundMode) {
    case 'content': {
      const bbox = props.graph.getContentBBox()
      return {
        minX: -bbox.width,
        minY: -bbox.height,
        maxX: bbox.width,
        maxY: bbox.height
      }
    }
    case 'viewport': {
      const container = props.graph.container
      if (container) {
        return {
          minX: -container.clientWidth / 2,
          minY: -container.clientHeight / 2,
          maxX: container.clientWidth / 2,
          maxY: container.clientHeight / 2
        }
      }
      break
    }
    case 'custom':
      return {
        minX: config.customBounds.x,
        minY: config.customBounds.y,
        maxX: config.customBounds.x + config.customBounds.width,
        maxY: config.customBounds.y + config.customBounds.height
      }
  }
  
  return { minX: -1000, minY: -1000, maxX: 1000, maxY: 1000 }
}

// 获取当前位置
const getCurrentPosition = () => {
  if (!props.graph) return { x: 0, y: 0 }

  try {
    const matrix = props.graph.matrix()
    return { x: matrix.e || 0, y: matrix.f || 0 }
  } catch (error) {
    return { x: 0, y: 0 }
  }
}

// 更新当前位置显示
const updateCurrentPosition = () => {
  const pos = getCurrentPosition()
  currentPosition.value = `${Math.round(pos.x)}, ${Math.round(pos.y)}`
}

// 显示拖拽指示器
const showDragIndicator = (x: number, y: number) => {
  // 创建或更新拖拽指示器
  let indicator = document.getElementById('panning-indicator')
  if (!indicator) {
    indicator = document.createElement('div')
    indicator.id = 'panning-indicator'
    indicator.style.cssText = `
      position: fixed;
      width: 20px;
      height: 20px;
      border: 2px solid #1890ff;
      border-radius: 50%;
      background: rgba(24, 144, 255, 0.2);
      pointer-events: none;
      z-index: 9999;
      transform: translate(-50%, -50%);
      transition: none;
    `
    document.body.appendChild(indicator)
  }
  
  indicator.style.left = x + 'px'
  indicator.style.top = y + 'px'
  indicator.style.display = 'block'
}

// 更新拖拽指示器
const updateDragIndicator = (x: number, y: number) => {
  const indicator = document.getElementById('panning-indicator')
  if (indicator) {
    indicator.style.left = x + 'px'
    indicator.style.top = y + 'px'
  }
}

// 隐藏拖拽指示器
const hideDragIndicator = () => {
  const indicator = document.getElementById('panning-indicator')
  if (indicator) {
    indicator.style.display = 'none'
  }
}

// 应用预设配置
const applyPreset = (presetName: string) => {
  const preset = presets[presetName as keyof typeof presets]
  if (preset) {
    Object.assign(config, preset)
    currentPreset.value = presetName
    updateConfig()
  }
}

// 重置到中心
const resetToCenter = () => {
  if (!props.graph) return

  try {
    props.graph.centerContent()
    updateCurrentPosition()
    console.log('Reset to center')
  } catch (error) {
    console.error('Failed to reset to center:', error)
  }
}

// 适应内容
const fitToContent = () => {
  if (!props.graph) return

  try {
    props.graph.zoomToFit({ padding: 20 })
    updateCurrentPosition()
    console.log('Fit to content')
  } catch (error) {
    console.error('Failed to fit to content:', error)
  }
}

// 切换拖拽状态
const togglePanning = () => {
  config.enabled = !config.enabled
  updateConfig()
}

// 监听graph变化
watch(() => props.graph, (newGraph) => {
  if (newGraph) {
    applyPanningConfig()
    updateCurrentPosition()
  }
}, { immediate: true })

// 定期更新位置信息
let positionUpdateInterval: number

onMounted(() => {
  positionUpdateInterval = window.setInterval(() => {
    if (!isDragging.value) {
      updateCurrentPosition()
    }
  }, 1000)
})

onUnmounted(() => {
  removePanningListeners()
  if (positionUpdateInterval) {
    clearInterval(positionUpdateInterval)
  }
  hideDragIndicator()
})
</script>

<style scoped>
.panning-control-panel {
  padding: 16px;
  background: #fafafa;
  border-radius: 6px;
}

.panel-section {
  margin-bottom: 16px;
}

.section-title {
  margin: 0 0 16px 0;
  font-size: 14px;
  font-weight: 600;
  color: #262626;
  border-bottom: 1px solid #e8e8e8;
  padding-bottom: 8px;
}

.control-group {
  margin-bottom: 20px;
}

.group-title {
  margin: 0 0 12px 0;
  font-size: 12px;
  font-weight: 500;
  color: #595959;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.control-item {
  margin-bottom: 12px;
}

.control-label {
  display: flex;
  align-items: center;
  font-size: 12px;
  color: #262626;
  margin-bottom: 4px;
  cursor: pointer;
}

.control-label input[type="checkbox"] {
  margin-right: 8px;
}

.control-desc {
  font-size: 11px;
  color: #8c8c8c;
  margin: 0;
  line-height: 1.4;
}

.control-select {
  width: 100%;
  padding: 4px 8px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 12px;
  background: #fff;
  margin-top: 4px;
}

.control-select:focus {
  border-color: #1890ff;
  outline: none;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

.slider-container {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
}

.control-slider {
  flex: 1;
  height: 4px;
  border-radius: 2px;
  background: #d9d9d9;
  outline: none;
  -webkit-appearance: none;
}

.control-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #1890ff;
  cursor: pointer;
  border: 2px solid #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.control-slider::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #1890ff;
  cursor: pointer;
  border: 2px solid #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.slider-value {
  font-size: 12px;
  color: #1890ff;
  font-weight: 500;
  min-width: 40px;
  text-align: right;
}

.preset-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.preset-btn {
  padding: 6px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  background: #fff;
  font-size: 11px;
  color: #262626;
  cursor: pointer;
  transition: all 0.2s ease;
}

.preset-btn:hover {
  border-color: #1890ff;
  color: #1890ff;
}

.preset-btn.active {
  background: #1890ff;
  border-color: #1890ff;
  color: #fff;
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.action-btn {
  padding: 8px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  background: #fff;
  font-size: 12px;
  color: #262626;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-btn:hover {
  border-color: #1890ff;
  color: #1890ff;
}

.action-btn.active {
  background: #1890ff;
  border-color: #1890ff;
  color: #fff;
}

.status-info {
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  padding: 12px;
}

.status-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-size: 11px;
}

.status-item:last-child {
  margin-bottom: 0;
}

.status-label {
  color: #8c8c8c;
}

.status-value {
  color: #262626;
  font-weight: 500;
}

.status-value.active {
  color: #52c41a;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .preset-buttons {
    grid-template-columns: 1fr;
  }
  
  .action-buttons {
    flex-direction: row;
    flex-wrap: wrap;
  }
  
  .action-btn {
    flex: 1;
    min-width: 80px;
  }
}
</style>
