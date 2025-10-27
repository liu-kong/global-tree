<template>
  <div class="mindmap-editor">
    <div class="editor-header">
      <div class="header-left">
        <a-button @click="goBack" type="text">
          <template #icon>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" style="width: 16px; height: 16px;">
              <path d="M19 12H5M12 19l-7-7 7-7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </template>
          返回管理
        </a-button>
        <h2>思维导图编辑器</h2>
      </div>
      <div class="header-controls">
        <a-button @click="addRootNode">添加根节点</a-button>
        <a-button @click="expandAll">全部展开</a-button>
        <a-button @click="collapseAll">全部折叠</a-button>
        <a-button @click="saveGraph">保存</a-button>
        <a-button @click="exportGraph">导出</a-button>
        <a-button @click="clearGraph">清空</a-button>
      </div>
    </div>

    <div class="editor-content">
      <div class="mindmap-sidebar">
        <h3>节点样式</h3>
        <div class="style-controls">
          <div class="control-group">
            <label>节点颜色</label>
            <div class="color-palette">
              <div 
                v-for="color in nodeColors" 
                :key="color"
                :class="['color-item', { active: selectedColor === color }]"
                :style="{ backgroundColor: color }"
                @click="selectColor(color)"
              ></div>
            </div>
          </div>
          
          <div class="control-group">
            <label>布局方向</label>
            <a-select v-model:value="layoutDirection" style="width: 100%">
              <a-select-option value="LR">从左到右</a-select-option>
              <a-select-option value="RL">从右到左</a-select-option>
              <a-select-option value="TB">从上到下</a-select-option>
              <a-select-option value="BT">从下到上</a-select-option>
            </a-select>
          </div>

          <div class="control-group">
            <label>节点间距</label>
            <a-slider v-model:value="nodeSpacing" :min="50" :max="200" />
          </div>
        </div>

        <h3>快捷操作</h3>
        <div class="quick-actions">
          <a-button @click="addChildNode" block style="margin-bottom: 8px">
            添加子节点
          </a-button>
          <a-button @click="addSiblingNode" block style="margin-bottom: 8px">
            添加同级节点
          </a-button>
          <a-button @click="deleteSelectedNode" block danger>
            删除选中节点
          </a-button>
        </div>
      </div>
      
      <div class="editor-main">
        <div id="mindmap-container" class="graph-container"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { MindmapScene } from '../plugins/scenes/mindmap'

const router = useRouter()

// 响应式数据
const selectedColor = ref('#1890ff')
const layoutDirection = ref('LR')
const nodeSpacing = ref(100)
const selectedNode = ref<any>(null)

// 节点颜色选项
const nodeColors = [
  '#1890ff', '#52c41a', '#fa8c16', '#f5222d', 
  '#722ed1', '#13c2c2', '#eb2f96', '#faad14'
]

let mindmapScene: MindmapScene | null = null

// 初始化思维导图编辑器
const initMindmapScene = async () => {
  const container = document.getElementById('mindmap-container')!
  
  try {
    mindmapScene = new MindmapScene(container, {
      renderer: { type: 'x6' },
      width: container.offsetWidth,
      height: container.offsetHeight
    })
    
    await mindmapScene.initialize(container, {
      renderer: { type: 'x6' },
      width: container.offsetWidth,
      height: container.offsetHeight
    })
    
    // 创建示例思维导图
    await mindmapScene.render()
    
    // 绑定事件
    bindMindmapEvents()
    
    message.success('思维导图编辑器初始化成功')
  } catch (error) {
    console.error('思维导图编辑器初始化失败:', error)
    message.error('思维导图编辑器初始化失败')
  }
}

// 绑定思维导图事件
const bindMindmapEvents = () => {
  if (!mindmapScene) return

  mindmapScene.on('node:click', (e: any) => {
    selectedNode.value = e.node
    const nodeData = e.node.getData()
    if (nodeData && nodeData.color) {
      selectedColor.value = nodeData.color
    }
  })

  mindmapScene.on('node:dblclick', (e: any) => {
    const nodeData = e.node.getData()
    if (nodeData) {
      const newLabel = prompt('请输入节点名称:', nodeData.label || '')
      if (newLabel && newLabel !== nodeData.label) {
        nodeData.label = newLabel
        mindmapScene!.render()
      }
    }
  })

  mindmapScene.on('canvas:click', () => {
    selectedNode.value = null
  })
}

// 功能方法
const goBack = () => {
  router.push('/editor')
}

const selectColor = (color: string) => {
  selectedColor.value = color
  if (selectedNode.value) {
    const nodeData = selectedNode.value.getData()
    if (nodeData) {
      nodeData.color = color
      mindmapScene?.render()
    }
  }
}

const addRootNode = () => {
  if (!mindmapScene) return
  
  const currentData = mindmapScene.getData()
  const newRoot = {
    id: `root-${Date.now()}`,
    type: 'topic' as const,
    label: '新根节点',
    width: 160,
    height: 50,
    color: selectedColor.value,
  }
  
  if (currentData.children) {
    currentData.children.push(newRoot)
  } else {
    currentData.children = [newRoot]
  }
  
  mindmapScene.setData(currentData)
  message.success('根节点已添加')
}

const addChildNode = () => {
  if (!selectedNode.value) {
    message.warning('请先选择一个节点')
    return
  }
  
  const parentData = selectedNode.value.getData()
  const newChild = {
    id: `node-${Date.now()}`,
    type: parentData.type === 'topic' ? 'topic-branch' as const : 'topic-child' as const,
    label: '新子节点',
    width: parentData.type === 'topic' ? 100 : 60,
    height: parentData.type === 'topic' ? 40 : 30,
    color: selectedColor.value,
  }
  
  if (parentData.children) {
    parentData.children.push(newChild)
  } else {
    parentData.children = [newChild]
  }
  
  mindmapScene?.render()
  message.success('子节点已添加')
}

const addSiblingNode = () => {
  if (!selectedNode.value) {
    message.warning('请先选择一个节点')
    return
  }
  
  const currentData = mindmapScene?.getData()
  const newSibling = {
    id: `node-${Date.now()}`,
    type: 'topic-branch' as const,
    label: '新同级节点',
    width: 100,
    height: 40,
    color: selectedColor.value,
  }
  
  if (currentData && currentData.children) {
    currentData.children.push(newSibling)
    mindmapScene?.setData(currentData)
  }
  
  message.success('同级节点已添加')
}

const deleteSelectedNode = () => {
  if (!selectedNode.value) {
    message.warning('请先选择要删除的节点')
    return
  }
  
  const nodeData = selectedNode.value.getData()
  const currentData = mindmapScene?.getData()
  
  if (currentData && currentData.children) {
    const removeNode = (children: any[], nodeId: string): boolean => {
      for (let i = 0; i < children.length; i++) {
        if (children[i].id === nodeId) {
          children.splice(i, 1)
          return true
        }
        if (children[i].children && removeNode(children[i].children, nodeId)) {
          return true
        }
      }
      return false
    }
    
    if (removeNode(currentData.children, nodeData.id)) {
      mindmapScene?.setData(currentData)
      selectedNode.value = null
      message.success('节点已删除')
    }
  }
}

const expandAll = () => {
  // X6 思维导图默认是展开的
  message.success('已展开所有节点')
}

const collapseAll = () => {
  // X6 思维导图暂不支持折叠
  message.info('当前版本不支持折叠功能')
}

const saveGraph = () => {
  const data = mindmapScene?.getData()
  console.log('保存思维导图数据:', data)
  message.success('思维导图已保存')
}

const exportGraph = () => {
  // X6 导出功能
  if (mindmapScene) {
    const graph = (mindmapScene as any).graph
    if (graph && graph.downloadPNG) {
      graph.downloadPNG('mindmap', {
        backgroundColor: '#fff',
        padding: 20
      })
      message.success('思维导图已导出')
    } else {
      message.info('导出功能暂不可用')
    }
  }
}

const clearGraph = () => {
  if (mindmapScene) {
    const emptyData = {
      id: '1',
      type: 'topic' as const,
      label: '中心主题',
      width: 160,
      height: 50,
      children: []
    }
    mindmapScene.setData(emptyData)
    message.warning('思维导图已清空')
  }
}

// 生命周期
onMounted(() => {
  initMindmapScene()
  
  // 监听窗口大小变化
  window.addEventListener('resize', () => {
    const container = document.getElementById('mindmap-container')
    if (container && mindmapScene) {
      mindmapScene.setConfig({
        width: container.offsetWidth,
        height: container.offsetHeight
      })
    }
  })
})

onUnmounted(() => {
  if (mindmapScene) {
    mindmapScene.destroy()
  }
})
</script>

<style scoped>
.mindmap-editor {
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
}

.header-controls {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.editor-content {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.mindmap-sidebar {
  width: 280px;
  background: white;
  border-right: 1px solid #e8e8e8;
  padding: 16px;
  overflow-y: auto;
}

.editor-main {
  flex: 1;
  position: relative;
}

.graph-container {
  width: 100%;
  height: 100%;
  background: white;
}

/* 样式控制面板 */
.style-controls {
  margin-bottom: 24px;
}

.control-group {
  margin-bottom: 20px;
}

.control-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #333;
}

.color-palette {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.color-item {
  width: 30px;
  height: 30px;
  border-radius: 4px;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.3s ease;
}

.color-item:hover {
  transform: scale(1.1);
}

.color-item.active {
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

.quick-actions {
  display: flex;
  flex-direction: column;
}

/* 通用样式 */
h3 {
  margin: 0 0 16px 0;
  color: #333;
  font-size: 16px;
  font-weight: 600;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .mindmap-sidebar {
    width: 240px;
  }
  
  .header-controls {
    flex-wrap: wrap;
  }
}
</style>
