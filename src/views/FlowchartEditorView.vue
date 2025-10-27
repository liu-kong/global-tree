<template>
  <div class="flowchart-editor-view">
    <div class="editor-header">
      <div class="header-left">
        <button class="btn btn-text" @click="goBack">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" style="width: 16px; height: 16px;">
            <path d="M19 12H5M12 19l-7-7 7-7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          返回管理
        </button>
        <h2>流程图编辑器</h2>
      </div>
      <div class="header-controls">
        <button class="btn btn-secondary" @click="toggleSnapline" :class="{ active: snaplineEnabled }">
          {{ snaplineEnabled ? '对齐线开' : '对齐线关' }}
        </button>
        <button class="btn btn-primary" @click="saveGraph">保存</button>
        <button class="btn btn-secondary" @click="exportGraph">导出</button>
        <button class="btn btn-secondary" @click="clearGraph">清空</button>
        <button class="btn btn-secondary" @click="fitToView">适应视图</button>
      </div>
    </div>

    <div class="editor-content">
      <X6FlowchartEditor 
        ref="flowchartEditorRef"
        :width="'100%'" 
        :height="'100%'" 
        @ready="onGraphReady" 
      />
      
      <!-- 右侧控制面板 -->
      <FlowchartControlPanel
        :editor-ref="flowchartEditorRef"
        @grid-change="handleGridChange"
        @background-change="handleBackgroundChange"
        @snapline-change="handleSnaplineChange"
        @selection-change="handleSelectionChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { Graph } from '@antv/x6'
import X6FlowchartEditor from '@/components/flowchart/X6FlowchartEditor.vue'
import FlowchartControlPanel from '@/components/flowchart/FlowchartControlPanel.vue'

const router = useRouter()
const flowchartEditorRef = ref<InstanceType<typeof X6FlowchartEditor>>()
let graph: Graph | null = null

// 对齐线状态
const snaplineEnabled = ref(true)

// 图表准备就绪
const onGraphReady = (graphInstance: Graph) => {
  graph = graphInstance
  console.log('Flowchart graph ready:', graph)
  
  // 可以在这里进行额外的配置或操作
  setupGraphEvents()
}

// 设置图表事件
const setupGraphEvents = () => {
  if (!graph) return

  // 监听节点添加事件
  graph.on('node:added', ({ node }) => {
    console.log('Node added:', node)
  })

  // 监听边添加事件
  graph.on('edge:added', ({ edge }) => {
    console.log('Edge added:', edge)
  })

  // 监听节点删除事件
  graph.on('node:removed', ({ node }) => {
    console.log('Node removed:', node)
  })

  // 监听边删除事件
  graph.on('edge:removed', ({ edge }) => {
    console.log('Edge removed:', edge)
  })

  // 监听选择变化事件
  graph.on('selection:changed', ({ selected }) => {
    console.log('Selection changed:', selected)
  })
}

// 功能方法
const goBack = () => {
  router.push('/editor')
}

const saveGraph = () => {
  if (graph) {
    const data = graph.toJSON()
    console.log('保存的图形数据:', data)
    
    // 这里可以调用API保存到服务器
    localStorage.setItem('flowchart-data', JSON.stringify(data))
    alert('流程图已保存')
  }
}

const exportGraph = () => {
  if (graph) {
    try {
      const data = graph.toJSON()
      const dataStr = JSON.stringify(data, null, 2)
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
      
      const link = document.createElement('a')
      link.download = `flowchart-${new Date().toISOString().slice(0, 10)}.json`
      link.href = dataUri
      link.click()
      
      alert('流程图已导出')
    } catch (error) {
      console.error('导出失败:', error)
      alert('导出失败')
    }
  }
}

const clearGraph = () => {
  if (graph) {
    graph.clearCells()
    alert('流程图已清空')
  }
}

const fitToView = () => {
  if (graph) {
    graph.zoomToFit({ padding: 20 })
    alert('已适应视图')
  }
}

// 处理网格配置变更
const handleGridChange = (config: any) => {
  if (flowchartEditorRef.value) {
    flowchartEditorRef.value.setGridConfig(config)
  }
}

// 处理背景配置变更
const handleBackgroundChange = (config: any) => {
  if (flowchartEditorRef.value) {
    flowchartEditorRef.value.setBackgroundConfig(config)
  }
}

// 动态背景更新处理
const handleDynamicBackgroundUpdate = (config: any) => {
  if (flowchartEditorRef.value) {
    flowchartEditorRef.value.handleDynamicBackgroundUpdate(config)
  }
}

// 处理对齐线配置变更
const handleSnaplineChange = (config: any) => {
  if (flowchartEditorRef.value) {
    flowchartEditorRef.value.setSnaplineConfig(config)
    // 更新对齐线状态
    snaplineEnabled.value = config.enabled !== false
  }
}

// 处理选择配置变更
const handleSelectionChange = (config: any) => {
  if (flowchartEditorRef.value) {
    flowchartEditorRef.value.setSelectionConfig(config)
    console.log('Selection config updated:', config)
  }
}

// 切换对齐线开关
const toggleSnapline = () => {
  snaplineEnabled.value = !snaplineEnabled.value
  
  // 发送对齐线配置变更
  handleSnaplineChange({
    enabled: snaplineEnabled.value,
    tolerance: 10,
    sharp: false,
    resizing: false,
    clean: true,
  })
}

// 加载保存的数据
const loadSavedData = () => {
  try {
    const savedData = localStorage.getItem('flowchart-data')
    if (savedData && graph) {
      const data = JSON.parse(savedData)
      graph.fromJSON(data)
      console.log('Loaded saved data:', data)
    }
  } catch (error) {
    console.error('加载保存数据失败:', error)
  }
}

// 禁用浏览器缩放功能
const disableBrowserZoom = () => {
  // 禁用 Ctrl + 滚轮缩放
  const preventWheelZoom = (e: WheelEvent) => {
    if (e.ctrlKey) {
      e.preventDefault()
      console.log('Browser zoom disabled - use canvas zoom instead')
    }
  }

  // 禁用 Ctrl + '+' / Ctrl + '-' 缩放
  const preventKeyboardZoom = (e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && (e.key === '+' || e.key === '-' || e.key === '0' || e.key === '=')) {
      e.preventDefault()
      console.log('Browser zoom disabled - use canvas zoom instead')
    }
  }

  // 禁用触摸板缩放手势
  const preventTouchZoom = (e: TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault()
      console.log('Browser zoom disabled - use canvas zoom instead')
    }
  }

  // 添加事件监听器
  document.addEventListener('wheel', preventWheelZoom, { passive: false })
  document.addEventListener('keydown', preventKeyboardZoom, { passive: false })
  document.addEventListener('touchstart', preventTouchZoom, { passive: false })

  // 设置viewport防止移动端缩放
  const viewport = document.querySelector('meta[name="viewport"]')
  if (viewport) {
    viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no')
  }

  // 返回清理函数
  return () => {
    document.removeEventListener('wheel', preventWheelZoom)
    document.removeEventListener('keydown', preventKeyboardZoom)
    document.removeEventListener('touchstart', preventTouchZoom)
    
    // 恢复viewport设置
    if (viewport) {
      viewport.setAttribute('content', 'width=device-width, initial-scale=1.0')
    }
  }
}

// 组件挂载时禁用浏览器缩放
onMounted(() => {
  const cleanup = disableBrowserZoom()
  
  // 组件卸载时清理事件监听器
  onUnmounted(() => {
    cleanup()
  })
})
</script>

<style scoped>
.flowchart-editor-view {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
}

.editor-header {
  background: white;
  padding: 16px 24px;
  border-bottom: 1px solid #e8e8e8;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  position: relative;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-left h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #262626;
}

.header-controls {
  display: flex;
  gap: 8px;
}

.editor-content {
  flex: 1;
  display: flex;
  overflow: hidden;
  position: relative;
}

/* 为右侧控制面板留出空间 */
.editor-content::after {
  content: '';
  position: absolute;
  right: 0;
  top: 0;
  width: 300px;
  height: 100%;
  pointer-events: none;
  z-index: 999;
}

/* 按钮样式 */
.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.btn-primary {
  background: #1890ff;
  color: white;
}

.btn-primary:hover {
  background: #40a9ff;
}

.btn-secondary {
  background: #f5f5f5;
  color: #333;
  border: 1px solid #e8e8e8;
}

.btn-secondary:hover {
  background: #e8e8e8;
}

.btn-secondary.active {
  background: #1890ff;
  color: white;
  border-color: #1890ff;
}

.btn-secondary.active:hover {
  background: #40a9ff;
}

.btn-text {
  background: transparent;
  color: #333;
  border: 1px solid transparent;
}

.btn-text:hover {
  background: #f0f0f0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .editor-header {
    padding: 12px 16px;
  }
  
  .header-controls {
    flex-wrap: wrap;
    gap: 4px;
  }
  
  .header-controls .btn {
    padding: 4px 8px;
    font-size: 12px;
  }
  
  .header-left h2 {
    font-size: 16px;
  }
}

@media (max-width: 480px) {
  .header-left {
    gap: 8px;
  }
  
  .header-controls {
    display: none;
  }
}
</style>
