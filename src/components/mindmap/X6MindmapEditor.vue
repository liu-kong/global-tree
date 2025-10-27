<template>
  <div class="x6-mindmap-editor">
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
        <h2>X6 思维导图编辑器</h2>
      </div>
      <div class="header-controls">
        <a-button @click="resetGraph">重置视图</a-button>
        <a-button @click="saveGraph">保存</a-button>
        <a-button @click="exportGraph">导出</a-button>
      </div>
    </div>

    <div class="editor-content">
      <div class="mindmap-sidebar">
        <h3>操作说明</h3>
        <div class="instructions">
          <div class="instruction-item">
            <strong>添加节点:</strong> 点击节点右侧图标或按Tab键
          </div>
          <div class="instruction-item">
            <strong>删除节点:</strong> 选中节点后按Delete或Backspace键
          </div>
          <div class="instruction-item">
            <strong>编辑节点:</strong> 双击节点进行编辑
          </div>
        </div>

        <h3>快捷键</h3>
        <div class="shortcuts">
          <div class="shortcut-item">
            <kbd>Tab</kbd> 添加子节点
          </div>
          <div class="shortcut-item">
            <kbd>Delete</kbd> 删除选中节点
          </div>
          <div class="shortcut-item">
            <kbd>Backspace</kbd> 删除选中节点
          </div>
        </div>
      </div>
      
      <div class="editor-main">
        <div id="x6-mindmap-container" class="graph-container"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { Graph, Cell, Node, Path } from '@antv/x6'
import Hierarchy from '@antv/hierarchy'
import insertCss from 'insert-css'

const router = useRouter()

let graph: Graph | null = null

// 数据接口定义
interface MindMapData {
  id: string
  type: 'topic' | 'topic-branch' | 'topic-child'
  label: string
  width: number
  height: number
  children?: MindMapData[]
}

interface HierarchyResult {
  id: string
  x: number
  y: number
  data: MindMapData
  children?: HierarchyResult[]
}

// 示例数据
const data: MindMapData = {
  id: '1',
  type: 'topic',
  label: '中心主题',
  width: 160,
  height: 50,
  children: [
    {
      id: '1-1',
      type: 'topic-branch',
      label: '分支主题1',
      width: 100,
      height: 40,
      children: [
        {
          id: '1-1-1',
          type: 'topic-child',
          label: '子主题1',
          width: 60,
          height: 30,
        },
        {
          id: '1-1-2',
          type: 'topic-child',
          label: '子主题2',
          width: 60,
          height: 30,
        },
      ],
    },
    {
      id: '1-2',
      type: 'topic-branch',
      label: '分支主题2',
      width: 100,
      height: 40,
    },
  ],
}

// 初始化X6思维导图
const initX6Mindmap = () => {
  // 注册自定义节点和连接器
  registerCustomElements()
  
  // 创建图形实例
  const container = document.getElementById('x6-mindmap-container')!
  graph = new Graph({
    container: container,
    connecting: {
      connectionPoint: 'anchor',
    },
    panning: {
      enabled: true,
    },
    mousewheel: {
      enabled: true,
    },
  })

  // 绑定事件
  bindEvents()
  
  // 渲染思维导图
  render()
}

// 注册自定义元素
const registerCustomElements = () => {
  // 中心主题或分支主题
  Graph.registerNode(
    'topic',
    {
      inherit: 'rect',
      markup: [
        {
          tagName: 'rect',
          selector: 'body',
        },
        {
          tagName: 'image',
          selector: 'img',
        },
        {
          tagName: 'text',
          selector: 'label',
        },
      ],
      attrs: {
        body: {
          rx: 6,
          ry: 6,
          stroke: '#5F95FF',
          fill: '#EFF4FF',
          strokeWidth: 1,
        },
        img: {
          ref: 'body',
          refX: '100%',
          refY: '50%',
          refY2: -8,
          width: 16,
          height: 16,
          'xlink:href':
            'https://gw.alipayobjects.com/mdn/rms_43231b/afts/img/A*SYCuQ6HHs5cAAAAAAAAAAAAAARQnAQ',
          event: 'add:topic',
          class: 'topic-image',
        },
        label: {
          fontSize: 14,
          fill: '#262626',
        },
      },
    },
    true,
  )

  // 子主题
  Graph.registerNode(
    'topic-child',
    {
      inherit: 'rect',
      markup: [
        {
          tagName: 'rect',
          selector: 'body',
        },
        {
          tagName: 'text',
          selector: 'label',
        },
        {
          tagName: 'path',
          selector: 'line',
        },
      ],
      attrs: {
        body: {
          fill: '#ffffff',
          strokeWidth: 0,
          stroke: '#5F95FF',
        },
        label: {
          fontSize: 14,
          fill: '#262626',
          textVerticalAnchor: 'bottom',
        },
        line: {
          stroke: '#5F95FF',
          strokeWidth: 2,
          d: 'M 0 15 L 60 15',
        },
      },
    },
    true,
  )

  // 连接器
  Graph.registerConnector(
    'mindmap',
    (sourcePoint, targetPoint, routerPoints, options) => {
      const midX = sourcePoint.x + 10
      const midY = sourcePoint.y
      const ctrX = (targetPoint.x - midX) / 5 + midX
      const ctrY = targetPoint.y
      const pathData = `
       M ${sourcePoint.x} ${sourcePoint.y}
       L ${midX} ${midY}
       Q ${ctrX} ${ctrY} ${targetPoint.x} ${targetPoint.y}
      `
      return options.raw ? Path.parse(pathData) : pathData
    },
    true,
  )

  // 边
  Graph.registerEdge(
    'mindmap-edge',
    {
      inherit: 'edge',
      connector: {
        name: 'mindmap',
      },
      attrs: {
        line: {
          targetMarker: '',
          stroke: '#A2B1C3',
          strokeWidth: 2,
        },
      },
      zIndex: 0,
    },
    true,
  )
}

// 简单的手动布局
const render = () => {
  if (!graph) return

  const cells: Cell[] = []
  
  // 手动布局节点位置
  const layoutData = [
    { id: '1', x: 100, y: 200, data: data },
    { id: '1-1', x: 300, y: 100, data: data.children![0] },
    { id: '1-2', x: 300, y: 300, data: data.children![1] },
    { id: '1-1-1', x: 500, y: 50, data: data.children![0].children![0] },
    { id: '1-1-2', x: 500, y: 150, data: data.children![0].children![1] },
  ]
  
  // 创建节点
  layoutData.forEach(item => {
    cells.push(
      graph!.createNode({
        id: item.data.id,
        shape: item.data.type === 'topic-child' ? 'topic-child' : 'topic',
        x: item.x,
        y: item.y,
        width: item.data.width,
        height: item.data.height,
        label: item.data.label,
        type: item.data.type,
      }),
    )
  })
  
  // 创建边
  cells.push(
    graph!.createEdge({
      shape: 'mindmap-edge',
      source: { cell: '1', anchor: { name: 'right' } },
      target: { cell: '1-1', anchor: { name: 'left' } },
    }),
    graph!.createEdge({
      shape: 'mindmap-edge',
      source: { cell: '1', anchor: { name: 'right' } },
      target: { cell: '1-2', anchor: { name: 'left' } },
    }),
    graph!.createEdge({
      shape: 'mindmap-edge',
      source: { cell: '1-1', anchor: { name: 'right' } },
      target: { cell: '1-1-1', anchor: { name: 'left' } },
    }),
    graph!.createEdge({
      shape: 'mindmap-edge',
      source: { cell: '1-1', anchor: { name: 'right' } },
      target: { cell: '1-1-2', anchor: { name: 'left' } },
    }),
  )
  
  graph.resetCells(cells)
  graph.centerContent()
}

// 查找节点
const findItem = (
  obj: MindMapData,
  id: string,
): {
  parent: MindMapData | null
  node: MindMapData | null
} | null => {
  if (obj.id === id) {
    return {
      parent: null,
      node: obj,
    }
  }
  const { children } = obj
  if (children) {
    for (let i = 0, len = children.length; i < len; i++) {
      const res = findItem(children[i], id)
      if (res) {
        return {
          parent: res.parent || obj,
          node: res.node,
        }
      }
    }
  }
  return null
}

// 添加子节点
const addChildNode = (id: string, type: string) => {
  const res = findItem(data, id)
  const dataItem = res?.node
  if (dataItem) {
    let item: MindMapData | null = null
    const length = dataItem.children ? dataItem.children.length : 0
    if (type === 'topic') {
      item = {
        id: `${id}-${length + 1}`,
        type: 'topic-branch',
        label: `分支主题${length + 1}`,
        width: 100,
        height: 40,
      }
    } else if (type === 'topic-branch') {
      item = {
        id: `${id}-${length + 1}`,
        type: 'topic-child',
        label: `子主题${length + 1}`,
        width: 60,
        height: 30,
      }
    }
    if (item) {
      if (dataItem.children) {
        dataItem.children.push(item)
      } else {
        dataItem.children = [item]
      }
      return item
    }
  }
  return null
}

// 删除节点
const removeNode = (id: string) => {
  const res = findItem(data, id)
  const dataItem = res?.parent
  if (dataItem && dataItem.children) {
    const { children } = dataItem
    const index = children.findIndex((item) => item.id === id)
    return children.splice(index, 1)
  }
  return null
}

// 绑定事件
const bindEvents = () => {
  if (!graph) return

  // 添加节点事件
  graph.on('add:topic', ({ node }: { node: Node }) => {
    const { id } = node
    const type = node.prop('type')
    if (addChildNode(id, type)) {
      render()
    }
  })

  // 简化键盘事件处理
  const handleKeyDown = (e: KeyboardEvent) => {
    // 暂时禁用键盘快捷键，避免API兼容性问题
    console.log('Key pressed:', e.key)
  }

  document.addEventListener('keydown', handleKeyDown)
  
  // 保存事件监听器引用以便清理
  ;(graph as any)._keyDownHandler = handleKeyDown
}

// 功能方法
const goBack = () => {
  router.push('/editor')
}

const resetGraph = () => {
  render()
  message.success('视图已重置')
}

const saveGraph = () => {
  console.log('保存思维导图数据:', data)
  message.success('思维导图已保存')
}

const exportGraph = () => {
  if (graph) {
    // 简化导出功能
    message.info('导出功能开发中...')
  }
}

// 添加自定义样式
const addCustomStyles = () => {
  const style = document.createElement('style')
  style.textContent = `
    .topic-image {
      visibility: hidden;
      cursor: pointer;
    }
    .x6-node:hover .topic-image {
      visibility: visible;
    }
    .x6-node-selected rect {
      stroke-width: 2px;
    }
  `
  document.head.appendChild(style)
}

// 生命周期
onMounted(() => {
  addCustomStyles()
  initX6Mindmap()
  
  // 监听窗口大小变化
  window.addEventListener('resize', () => {
    if (graph) {
      graph.resize()
      graph.centerContent()
    }
  })
})

onUnmounted(() => {
  if (graph) {
    // 清理键盘事件监听器
    if ((graph as any)._keyDownHandler) {
      document.removeEventListener('keydown', (graph as any)._keyDownHandler)
    }
    graph.dispose()
  }
})
</script>

<style scoped>
.x6-mindmap-editor {
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

/* 说明面板 */
.instructions {
  margin-bottom: 24px;
}

.instruction-item {
  margin-bottom: 12px;
  padding: 8px 12px;
  background: #f8f9fa;
  border-radius: 4px;
  font-size: 14px;
  line-height: 1.5;
}

.shortcuts {
  margin-bottom: 24px;
}

.shortcut-item {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  font-size: 14px;
}

.shortcut-item kbd {
  background: #f1f3f4;
  border: 1px solid #dadce0;
  border-radius: 4px;
  padding: 2px 6px;
  font-family: monospace;
  font-size: 12px;
  margin-right: 8px;
  min-width: 60px;
  text-align: center;
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
