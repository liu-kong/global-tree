<template>
  <div class="flowchart-control-panel" :class="{ collapsed: isCollapsed }">
    <!-- 收缩/展开按钮 -->
    <div class="panel-toggle" @click="togglePanel">
      <svg 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        class="toggle-icon"
        :class="{ rotated: isCollapsed }"
      >
        <path d="M15 18l-6-6 6-6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </div>

    <!-- 面板内容 -->
    <div class="panel-content" v-show="!isCollapsed">
      <!-- 面板标题 -->
      <div class="panel-header">
        <h2>编辑器</h2>
      </div>

      <!-- 控制选项卡 -->
      <div class="panel-tabs">
        <button 
          v-for="tab in tabs" 
          :key="tab.key"
          class="tab-button"
          :class="{ active: activeTab === tab.key }"
          @click="activeTab = tab.key"
        >
          {{ tab.label }}
        </button>
      </div>

      <!-- 控制面板内容 -->
      <div class="panel-body">
        <!-- 网格控制 -->
        <GridControlPanel 
          v-if="activeTab === 'grid'"
          @grid-change="handleGridChange"
        />

        <!-- 背景控制 -->
        <BackgroundControlPanel 
          v-else-if="activeTab === 'style'"
          :editor-ref="editorRef"
          @background-change="handleBackgroundChange"
          @dynamic-background-update="handleDynamicBackgroundUpdate"
        />

        <!-- 对齐线控制 -->
        <SnaplineControlPanel 
          v-else-if="activeTab === 'snapline'"
          @snapline-change="handleSnaplineChange"
        />

        <!-- 滚动器控制 -->
        <ScrollerControlPanel 
          v-else-if="activeTab === 'scroller'"
          :editor-ref="editorRef"
        />

        <!-- 键盘快捷键控制 -->
        <KeyboardControlPanel 
          v-else-if="activeTab === 'keyboard'"
          :graph="editorRef?.graph"
        />

        <!-- 选择控制 -->
        <SelectionControlPanel 
          v-else-if="activeTab === 'selection'"
          :graph="editorRef?.graph"
          @selection-change="handleSelectionChange"
        />

        <!-- 画布拖拽控制 -->
        <PanningControlPanel 
          v-else-if="activeTab === 'panning'"
          :graph="editorRef?.graph"
          @panning-change="handlePanningChange"
        />

        <!-- 历史记录控制 -->
        <HistoryControlPanel 
          v-else-if="activeTab === 'history'"
          :graph="editorRef?.graph"
        />

        <!-- 其他控制面板（预留） -->
        <div v-else-if="activeTab === 'layout'" class="placeholder-panel">
          <p>布局控制面板</p>
          <p class="placeholder-text">功能开发中...</p>
        </div>

        <div v-else-if="activeTab === 'export'" class="placeholder-panel">
          <p>导出控制面板</p>
          <p class="placeholder-text">功能开发中...</p>
        </div>


      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import GridControlPanel from './GridControlPanel.vue'
import BackgroundControlPanel from './BackgroundControlPanel.vue'
import SnaplineControlPanel from './SnaplineControlPanel.vue'
import ScrollerControlPanel from './ScrollerControlPanel.vue'
import KeyboardControlPanel from './KeyboardControlPanel.vue'
import HistoryControlPanel from './HistoryControlPanel.vue'
import SelectionControlPanel from './SelectionControlPanel.vue'
import PanningControlPanel from './PanningControlPanel.vue'

// 定义props和事件
interface Props {
  editorRef?: any
}

const props = defineProps<Props>()

const emit = defineEmits<{
  gridChange: [config: any]
  backgroundChange: [config: any]
  snaplineChange: [config: any]
}>()

// 响应式数据
const isCollapsed = ref(false)
const activeTab = ref('grid')

// 选项卡配置
const tabs = [
  { key: 'grid', label: '网格' },
  { key: 'style', label: '样式' },
  { key: 'snapline', label: '对齐线' },
  { key: 'selection', label: '选择' },
  { key: 'panning', label: '画布拖拽' },
  { key: 'scroller', label: '滚动器' },
  { key: 'keyboard', label: '快捷键' },
  { key: 'history', label: '历史记录' },
  { key: 'layout', label: '布局' },
  { key: 'export', label: '导出' },
]

// 切换面板收缩状态
const togglePanel = () => {
  isCollapsed.value = !isCollapsed.value
  
  // 保存收缩状态到本地存储
  localStorage.setItem('flowchart-control-panel-collapsed', String(isCollapsed.value))
}

// 处理网格配置变更
const handleGridChange = (config: any) => {
  emit('gridChange', config)
}

// 处理背景配置变更
const handleBackgroundChange = (config: any) => {
  emit('backgroundChange', config)
}

// 动态背景更新处理
const handleDynamicBackgroundUpdate = (config: any) => {
  if (props.editorRef) {
    props.editorRef.handleDynamicBackgroundUpdate(config)
  }
}

// 处理对齐线配置变更
const handleSnaplineChange = (config: any) => {
  emit('snaplineChange', config)
}

// 处理选择配置变更
const handleSelectionChange = (config: any) => {
  // 这里可以添加选择配置变更的处理逻辑
  console.log('Selection config changed:', config)
}

// 处理画布拖拽配置变更
const handlePanningChange = (config: any) => {
  // 这里可以添加画布拖拽配置变更的处理逻辑
  console.log('Panning config changed:', config)
}

// 从本地存储加载状态
const loadState = () => {
  try {
    const collapsed = localStorage.getItem('flowchart-control-panel-collapsed')
    if (collapsed !== null) {
      isCollapsed.value = collapsed === 'true'
    }
  } catch (error) {
    console.warn('Failed to load panel state:', error)
  }
}

// 初始化
onMounted(() => {
  loadState()
})
</script>

<style scoped>
.flowchart-control-panel {
  position: fixed;
  right: 0;
  top: 60px;
  width: 300px;
  height: calc(100vh - 60px);
  background: #fafafa;
  border-left: 1px solid #e8e8e8;
  transition: transform 0.3s ease;
  display: flex;
  flex-direction: column;
  z-index: 100;
  box-shadow: -2px 0 8px rgba(0, 0, 0, 0.1);
}

.flowchart-control-panel.collapsed {
  transform: translateX(260px);
}

.panel-toggle {
  position: absolute;
  left: -16px;
  top: 50%;
  transform: translateY(-50%);
  width: 32px;
  height: 32px;
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 10;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
}

.panel-toggle:hover {
  background: #f0f0f0;
  border-color: #1890ff;
}

.toggle-icon {
  width: 16px;
  height: 16px;
  transition: transform 0.3s ease;
}

.toggle-icon.rotated {
  transform: rotate(180deg);
}

.panel-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.panel-header {
  padding: 16px;
  background: #fff;
  border-bottom: 1px solid #e8e8e8;
  flex-shrink: 0;
}

.panel-header h2 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #262626;
}

.panel-tabs {
  display: flex;
  background: #fff;
  border-bottom: 1px solid #e8e8e8;
  flex-shrink: 0;
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: thin;
  scrollbar-color: #ccc transparent;
}

.panel-tabs::-webkit-scrollbar {
  height: 4px;
}

.panel-tabs::-webkit-scrollbar-track {
  background: transparent;
}

.panel-tabs::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 2px;
}

.panel-tabs::-webkit-scrollbar-thumb:hover {
  background: #999;
}

.tab-button {
  flex: 0 0 auto;
  padding: 12px 16px;
  border: none;
  background: transparent;
  font-size: 12px;
  color: #666;
  cursor: pointer;
  transition: all 0.2s ease;
  border-bottom: 2px solid transparent;
  white-space: nowrap;
  min-width: 60px;
}

.tab-button:hover {
  color: #1890ff;
  background: #f6ffed;
}

.tab-button.active {
  color: #1890ff;
  border-bottom-color: #1890ff;
  background: #f6ffed;
}

.panel-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.placeholder-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  text-align: center;
}

.placeholder-panel p {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #666;
}

.placeholder-text {
  font-size: 12px !important;
  color: #999 !important;
}

/* 滚动条样式 */
.panel-body::-webkit-scrollbar {
  width: 6px;
}

.panel-body::-webkit-scrollbar-track {
  background: #f0f0f0;
}

.panel-body::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 3px;
}

.panel-body::-webkit-scrollbar-thumb:hover {
  background: #999;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .flowchart-control-panel {
    width: 280px;
  }
}

@media (max-width: 768px) {
  .flowchart-control-panel {
    width: 100%;
    height: 200px;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    border-left: none;
    border-top: 1px solid #e8e8e8;
  }
  
  .flowchart-control-panel.collapsed {
    width: 100%;
    height: 40px;
  }
  
  .panel-toggle {
    left: 50%;
    top: -16px;
    transform: translateX(-50%);
  }
  
  .panel-tabs {
    flex-wrap: wrap;
  }
  
  .tab-button {
    flex: 1;
    min-width: 60px;
  }
}

/* 动画效果 */
.flowchart-control-panel {
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
  }
  to {
    transform: translateX(0);
  }
}
</style>
