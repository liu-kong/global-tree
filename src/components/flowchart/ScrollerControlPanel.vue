<template>
  <div class="scroller-control-panel">
    <h3 class="panel-title">滚动器控制</h3>
    
    <!-- 滚动器开关 -->
    <div class="control-section">
      <div class="control-item">
        <label class="control-label">
          <input 
            type="checkbox" 
            v-model="scrollerConfig.enabled"
            @change="handleScrollerChange"
          />
          启用滚动器
        </label>
      </div>
    </div>

    <!-- 平移控制 -->
    <div class="control-section" v-if="scrollerConfig.enabled">
      <h4 class="section-title">平移控制</h4>
      <div class="control-item">
        <label class="control-label">
          <input 
            type="checkbox" 
            v-model="scrollerConfig.pannable"
            @change="handleScrollerChange"
          />
          启用画布平移
        </label>
      </div>
    </div>

    <!-- 自动调整大小 -->
    <div class="control-section" v-if="scrollerConfig.enabled">
      <h4 class="section-title">自动调整</h4>
      <div class="control-item">
        <label class="control-label">
          <input 
            type="checkbox" 
            v-model="scrollerConfig.autoResize"
            @change="handleScrollerChange"
          />
          自动调整画布大小
        </label>
      </div>
    </div>

    <!-- 滚动控制 -->
    <div class="control-section" v-if="scrollerConfig.enabled">
      <h4 class="section-title">滚动控制</h4>
      
      <!-- 滚动到指定位置 -->
      <div class="control-item">
        <label class="control-label">滚动到位置</label>
        <div class="position-inputs">
          <input 
            type="number" 
            v-model.number="scrollPosition.x"
            placeholder="X坐标"
            class="position-input"
          />
          <input 
            type="number" 
            v-model.number="scrollPosition.y"
            placeholder="Y坐标"
            class="position-input"
          />
          <button 
            @click="scrollToPoint"
            class="btn btn-primary btn-sm"
          >
            滚动
          </button>
        </div>
      </div>

      <!-- 滚动到内容中心 -->
      <div class="control-item">
        <button 
          @click="scrollToContent"
          class="btn btn-secondary btn-sm"
        >
          滚动到内容中心
        </button>
      </div>

      <!-- 缩放控制 -->
      <div class="control-item">
        <label class="control-label">缩放控制</label>
        <div class="zoom-controls">
          <button 
            @click="zoomIn"
            class="btn btn-secondary btn-sm"
          >
            放大
          </button>
          <button 
            @click="zoomOut"
            class="btn btn-secondary btn-sm"
          >
            缩小
          </button>
          <button 
            @click="zoomToFit"
            class="btn btn-secondary btn-sm"
          >
            适应画布
          </button>
          <button 
            @click="resetZoom"
            class="btn btn-secondary btn-sm"
          >
            重置缩放
          </button>
        </div>
      </div>
    </div>

    <!-- 缩放范围控制 -->
    <div class="control-section" v-if="scrollerConfig.enabled">
      <h4 class="section-title">缩放范围</h4>
      
      <div class="control-item">
        <label class="control-label">最小缩放</label>
        <input 
          type="number" 
          v-model.number="scrollerConfig.minScale"
          :min="0.01"
          :max="1"
          :step="0.01"
          :disabled="!scrollerConfig.enabled"
          @change="handleScaleChange"
          class="scale-input"
        />
      </div>
      
      <div class="control-item">
        <label class="control-label">最大缩放</label>
        <input 
          type="number" 
          v-model.number="scrollerConfig.maxScale"
          :min="1"
          :max="100"
          :step="0.1"
          :disabled="!scrollerConfig.enabled"
          @change="handleScaleChange"
          class="scale-input"
        />
      </div>
    </div>

    <!-- 状态信息 -->
    <div class="control-section" v-if="scrollerConfig.enabled">
      <h4 class="section-title">状态信息</h4>
      <div class="status-info">
        <div class="status-item">
          <span class="status-label">滚动位置:</span>
          <span class="status-value">
            X: {{ scrollerState?.scrollbarPosition?.left || 0 }}, 
            Y: {{ scrollerState?.scrollbarPosition?.top || 0 }}
          </span>
        </div>
        <div class="status-item">
          <span class="status-label">平移状态:</span>
          <span class="status-value" :class="{ active: scrollerState?.pannable }">
            {{ scrollerState?.pannable ? '启用' : '禁用' }}
          </span>
        </div>
        <div class="status-item">
          <span class="status-label">自动调整:</span>
          <span class="status-value" :class="{ active: scrollerState?.autoResize }">
            {{ scrollerState?.autoResize ? '启用' : '禁用' }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue'

// 定义props
interface Props {
  editorRef?: any
}

const props = defineProps<Props>()

// 滚动器配置
const scrollerConfig = reactive({
  enabled: true,
  pannable: true,
  autoResize: true,
  minScale: 0.01,
  maxScale: 100,
})

// 滚动位置
const scrollPosition = reactive({
  x: 0,
  y: 0,
})

// 滚动器状态
const scrollerState = ref<any>(null)

// 处理滚动器配置变更
const handleScrollerChange = () => {
  if (!props.editorRef?.value) return
  
  const config = {
    enabled: scrollerConfig.enabled,
    pannable: scrollerConfig.pannable,
    autoResize: scrollerConfig.autoResize,
  }
  
  props.editorRef.value.setScrollerConfig(config)
  console.log('Scroller config changed:', config)
}

// 处理缩放范围变更
const handleScaleChange = () => {
  if (!props.editorRef?.value?.graph) return
  
  const graph = props.editorRef.value.graph
  
  // 设置缩放范围
  graph.options.scaling = {
    ...graph.options.scaling,
    min: scrollerConfig.minScale,
    max: scrollerConfig.maxScale,
  }
  
  console.log('Scale range changed:', {
    min: scrollerConfig.minScale,
    max: scrollerConfig.maxScale,
  })
}

// 滚动到指定位置
const scrollToPoint = () => {
  if (!props.editorRef?.value) return
  
  const config = {
    enabled: true,
    scrollToPoint: {
      x: scrollPosition.x,
      y: scrollPosition.y,
    },
    scrollOptions: {
      animation: { duration: 300 }
    }
  }
  
  props.editorRef.value.setScrollerConfig(config)
  console.log('Scroll to point:', scrollPosition)
}

// 滚动到内容中心
const scrollToContent = () => {
  if (!props.editorRef?.value) return
  
  const config = {
    enabled: true,
    scrollToContent: true,
    scrollOptions: {
      animation: { duration: 300 }
    }
  }
  
  props.editorRef.value.setScrollerConfig(config)
  console.log('Scroll to content')
}

// 放大
const zoomIn = () => {
  if (!props.editorRef?.value?.graph) return
  
  const graph = props.editorRef.value.graph
  graph.zoom(0.1)
  console.log('Zoom in')
}

// 缩小
const zoomOut = () => {
  if (!props.editorRef?.value?.graph) return
  
  const graph = props.editorRef.value.graph
  graph.zoom(-0.1)
  console.log('Zoom out')
}

// 适应画布
const zoomToFit = () => {
  if (!props.editorRef?.value?.graph) return
  
  const graph = props.editorRef.value.graph
  graph.zoomToFit({ padding: 20 })
  console.log('Zoom to fit')
}

// 重置缩放
const resetZoom = () => {
  if (!props.editorRef?.value?.graph) return
  
  const graph = props.editorRef.value.graph
  graph.scale(1)
  graph.centerContent()
  console.log('Reset zoom')
}

// 更新滚动器状态
const updateScrollerState = () => {
  if (!props.editorRef?.value) return
  
  const state = props.editorRef.value.getScrollerState()
  scrollerState.value = state
  
  if (state) {
    scrollerConfig.pannable = state.pannable
    scrollerConfig.autoResize = state.autoResize
  }
}

// 监听编辑器引用变化
watch(() => props.editorRef?.value, (newRef) => {
  if (newRef) {
    updateScrollerState()
  }
}, { immediate: true })

// 组件挂载后更新状态
onMounted(() => {
  updateScrollerState()
})
</script>

<style scoped>
.scroller-control-panel {
  padding: 16px;
  background: #fff;
  border-radius: 6px;
}

.panel-title {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: #262626;
  border-bottom: 1px solid #f0f0f0;
  padding-bottom: 8px;
}

.control-section {
  margin-bottom: 20px;
}

.section-title {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 500;
  color: #595959;
}

.control-item {
  margin-bottom: 12px;
}

.control-label {
  display: flex;
  align-items: center;
  font-size: 13px;
  color: #262626;
  cursor: pointer;
  margin-bottom: 8px;
}

.control-label input[type="checkbox"] {
  margin-right: 8px;
}

.position-inputs {
  display: flex;
  gap: 8px;
  align-items: center;
}

.position-input {
  width: 80px;
  padding: 4px 8px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 12px;
}

.position-input:focus {
  outline: none;
  border-color: #1890ff;
}

.scale-input {
  width: 100px;
  padding: 4px 8px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 12px;
}

.scale-input:focus {
  outline: none;
  border-color: #1890ff;
}

.scale-input:disabled {
  background-color: #f5f5f5;
  color: #ccc;
  cursor: not-allowed;
}

.zoom-controls {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.status-info {
  background: #f5f5f5;
  padding: 12px;
  border-radius: 4px;
  font-size: 12px;
}

.status-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
}

.status-item:last-child {
  margin-bottom: 0;
}

.status-label {
  color: #595959;
}

.status-value {
  color: #262626;
  font-weight: 500;
}

.status-value.active {
  color: #52c41a;
}

.btn {
  padding: 4px 8px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  background: #fff;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}

.btn:hover {
  border-color: #40a9ff;
  color: #40a9ff;
}

.btn-primary {
  background: #1890ff;
  border-color: #1890ff;
  color: #fff;
}

.btn-primary:hover {
  background: #40a9ff;
  border-color: #40a9ff;
}

.btn-secondary {
  background: #fff;
  border-color: #d9d9d9;
  color: #262626;
}

.btn-secondary:hover {
  border-color: #40a9ff;
  color: #40a9ff;
}

.btn-sm {
  padding: 2px 6px;
  font-size: 11px;
}
</style>
