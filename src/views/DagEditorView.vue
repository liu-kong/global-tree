<template>
  <div class="dag-editor">
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
        <h2>RAG/DAG 编辑器</h2>
      </div>
      <div class="header-controls">
        <a-button @click="saveGraph">保存</a-button>
        <a-button @click="exportGraph">导出</a-button>
        <a-button @click="clearGraph">清空</a-button>
      </div>
    </div>

    <div class="editor-content">
      <div class="dag-sidebar">
        <h3>AI 节点面板</h3>
        <div class="ai-node-palette">
          <div 
            v-for="nodeType in aiNodeTypes" 
            :key="nodeType.type"
            class="ai-palette-node"
            draggable="true"
            @dragstart="onAiDragStart($event, nodeType)"
          >
            <div :class="`ai-node-icon ${nodeType.type}`"></div>
            <span>{{ nodeType.label }}</span>
          </div>
        </div>

        <h3>工作流状态</h3>
        <div class="workflow-status">
          <div class="status-item">
            <span class="status-label">状态:</span>
            <span :class="`status-value ${isRunning ? 'running' : 'idle'}`">
              {{ isRunning ? '运行中' : '空闲' }}
            </span>
          </div>
          <div class="status-item">
            <span class="status-label">节点数:</span>
            <span class="status-value">{{ aiNodeCount }}</span>
          </div>
          <div class="status-item">
            <span class="status-label">连接数:</span>
            <span class="status-value">{{ aiEdgeCount }}</span>
          </div>
        </div>

        <a-button 
          type="primary" 
          @click="runAiWorkflow" 
          :disabled="isRunning"
          style="width: 100%; margin-top: 16px"
        >
          {{ isRunning ? '运行中...' : '运行工作流' }}
        </a-button>
      </div>
      
      <div class="editor-main">
        <div id="dag-container" class="graph-container"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { Graph, Shape } from '@antv/x6'

const router = useRouter()

// 响应式数据
const isRunning = ref(false)
const aiNodeCount = ref(0)
const aiEdgeCount = ref(0)

// AI 节点类型
const aiNodeTypes = [
  { 
    type: 'data', 
    label: '数据节点', 
    shape: 'ai-data-node',
    defaultConfig: { source: 'csv', format: 'tabular' }
  },
  { 
    type: 'model', 
    label: '模型节点', 
    shape: 'ai-model-node',
    defaultConfig: { algorithm: 'neural_network', parameters: {} }
  },
  { 
    type: 'process', 
    label: '处理节点', 
    shape: 'ai-process-node',
    defaultConfig: { method: 'default' }
  },
  { 
    type: 'output', 
    label: '输出节点', 
    shape: 'ai-output-node',
    defaultConfig: { format: 'json', destination: 'api' }
  }
]

let aiDagGraph: Graph | null = null

// 初始化 DAG 编辑器
const initDagGraph = () => {
  const container = document.getElementById('dag-container')!
  
  // 清理现有内容
  container.innerHTML = ''
  
  // 添加样式
  const style = document.createElement('style')
  style.textContent = `
    #dag-container {
      width: 100%;
      height: 100%;
      background: white;
    }
  `
  document.head.appendChild(style)
  
  // 注册 AI 节点类型
  registerAiNodes()
  
  aiDagGraph = new Graph({
    container: container,
    grid: {
      size: 20,
      visible: true,
      type: 'doubleMesh',
      args: [
        {
          color: '#eee',
          thickness: 1,
        },
        {
          color: '#ddd',
          thickness: 1,
          factor: 4,
        },
      ],
    },
    panning: {
      enabled: true,
    },
    mousewheel: {
      enabled: true,
      zoomAtMousePosition: true,
      modifiers: 'ctrl',
      minScale: 0.5,
      maxScale: 3,
    },
    connecting: {
      router: {
        name: 'manhattan',
        args: {
          padding: 10,
        },
      },
      connector: {
        name: 'rounded',
        args: {
          radius: 8,
        },
      },
      anchor: 'center',
      connectionPoint: 'anchor',
      allowBlank: false,
      snap: {
        radius: 20,
      },
      createEdge() {
        return new Shape.Edge({
          attrs: {
            line: {
              stroke: '#A2B1C3',
              strokeWidth: 2,
              targetMarker: {
                name: 'classic',
                size: 8,
              },
            },
          },
          zIndex: 0,
        })
      },
      validateConnection({ targetMagnet }) {
        return !!targetMagnet
      },
    },
    highlighting: {
      magnetAvailable: {
        name: 'stroke',
        args: {
          attrs: {
            fill: '#fff',
            stroke: '#31d0c6',
            strokeWidth: 4,
          },
        },
      },
    },
  })

  // 创建默认的 AI DAG
  createDefaultAiDag()
  
  // 绑定事件
  bindAiDagEvents()
}

// 注册 AI 节点
const registerAiNodes = () => {
  Graph.registerNode(
    'ai-data-node',
    {
      inherit: 'rect',
      width: 120,
      height: 60,
      attrs: {
        body: {
          strokeWidth: 2,
          stroke: '#1890ff',
          fill: '#e6f7ff',
          rx: 8,
          ry: 8,
        },
        text: {
          fontSize: 14,
          fill: '#262626',
          fontWeight: 'bold',
          textAnchor: 'middle',
          textVerticalAnchor: 'middle',
        },
      },
      ports: {
        groups: {
          port: {
            position: 'absolute',
            attrs: {
              circle: {
                magnet: true,
                r: 6,
                stroke: '#1890ff',
                strokeWidth: 2,
                fill: '#fff',
                style: {
                  visibility: 'hidden',
                },
              },
            },
          },
        },
        items: [
          { group: 'port', args: { x: 0, y: 0.5 } },
          { group: 'port', args: { x: 1, y: 0.5 } },
          { group: 'port', args: { x: 0.5, y: 0 } },
          { group: 'port', args: { x: 0.5, y: 1 } },
        ],
      },
    },
    true,
  )

  Graph.registerNode(
    'ai-model-node',
    {
      inherit: 'ellipse',
      width: 140,
      height: 80,
      attrs: {
        body: {
          strokeWidth: 2,
          stroke: '#52c41a',
          fill: '#f6ffed',
        },
        text: {
          fontSize: 14,
          fill: '#262626',
          fontWeight: 'bold',
          textAnchor: 'middle',
          textVerticalAnchor: 'middle',
        },
      },
      ports: {
        groups: {
          port: {
            position: 'absolute',
            attrs: {
              circle: {
                magnet: true,
                r: 6,
                stroke: '#52c41a',
                strokeWidth: 2,
                fill: '#fff',
                style: {
                  visibility: 'hidden',
                },
              },
            },
          },
        },
        items: [
          { group: 'port', args: { x: 0, y: 0.5 } },
          { group: 'port', args: { x: 1, y: 0.5 } },
          { group: 'port', args: { x: 0.5, y: 0 } },
          { group: 'port', args: { x: 0.5, y: 1 } },
        ],
      },
    },
    true,
  )

  Graph.registerNode(
    'ai-process-node',
    {
      inherit: 'rect',
      width: 100,
      height: 50,
      attrs: {
        body: {
          strokeWidth: 2,
          stroke: '#fa8c16',
          fill: '#fff7e6',
          rx: 4,
          ry: 4,
        },
        text: {
          fontSize: 12,
          fill: '#262626',
          fontWeight: 'bold',
          textAnchor: 'middle',
          textVerticalAnchor: 'middle',
        },
      },
      ports: {
        groups: {
          port: {
            position: 'absolute',
            attrs: {
              circle: {
                magnet: true,
                r: 6,
                stroke: '#fa8c16',
                strokeWidth: 2,
                fill: '#fff',
                style: {
                  visibility: 'hidden',
                },
              },
            },
          },
        },
        items: [
          { group: 'port', args: { x: 0, y: 0.5 } },
          { group: 'port', args: { x: 1, y: 0.5 } },
          { group: 'port', args: { x: 0.5, y: 0 } },
          { group: 'port', args: { x: 0.5, y: 1 } },
        ],
      },
    },
    true,
  )

  Graph.registerNode(
    'ai-output-node',
    {
      inherit: 'polygon',
      width: 120,
      height: 60,
      attrs: {
        body: {
          strokeWidth: 2,
          stroke: '#722ed1',
          fill: '#f9f0ff',
          refPoints: '0,10 10,0 20,0 30,10 30,20 20,30 10,30 0,20',
        },
        text: {
          fontSize: 14,
          fill: '#262626',
          fontWeight: 'bold',
          textAnchor: 'middle',
          textVerticalAnchor: 'middle',
        },
      },
      ports: {
        groups: {
          port: {
            position: 'absolute',
            attrs: {
              circle: {
                magnet: true,
                r: 6,
                stroke: '#722ed1',
                strokeWidth: 2,
                fill: '#fff',
                style: {
                  visibility: 'hidden',
                },
              },
            },
          },
        },
        items: [
          { group: 'port', args: { x: 0, y: 0.5 } },
          { group: 'port', args: { x: 1, y: 0.5 } },
          { group: 'port', args: { x: 0.5, y: 0 } },
          { group: 'port', args: { x: 0.5, y: 1 } },
        ],
      },
    },
    true,
  )
}

// 创建默认 AI DAG
const createDefaultAiDag = () => {
  if (!aiDagGraph) return

  const nodes = [
    {
      id: 'data-input',
      shape: 'ai-data-node',
      x: 50,
      y: 150,
      label: '数据输入',
    },
    {
      id: 'data-preprocessing',
      shape: 'ai-process-node',
      x: 250,
      y: 80,
      label: '数据预处理',
    },
    {
      id: 'feature-engineering',
      shape: 'ai-process-node',
      x: 250,
      y: 220,
      label: '特征工程',
    },
    {
      id: 'model-training',
      shape: 'ai-model-node',
      x: 450,
      y: 150,
      label: '模型训练',
    },
    {
      id: 'model-evaluation',
      shape: 'ai-process-node',
      x: 670,
      y: 150,
      label: '模型评估',
    },
    {
      id: 'model-output',
      shape: 'ai-output-node',
      x: 850,
      y: 150,
      label: '模型输出',
    },
  ]

  const edges = [
    { id: 'input-preprocessing', source: 'data-input', target: 'data-preprocessing' },
    { id: 'input-feature', source: 'data-input', target: 'feature-engineering' },
    { id: 'preprocessing-model', source: 'data-preprocessing', target: 'model-training' },
    { id: 'feature-model', source: 'feature-engineering', target: 'model-training' },
    { id: 'model-evaluation', source: 'model-training', target: 'model-evaluation' },
    { id: 'evaluation-output', source: 'model-evaluation', target: 'model-output' },
  ]

  const cells = [...nodes.map(node => aiDagGraph!.createNode(node)), 
                ...edges.map(edge => aiDagGraph!.createEdge(edge))]
  
  aiDagGraph.resetCells(cells)
  aiDagGraph.centerContent()
  
  // 更新计数
  aiNodeCount.value = nodes.length
  aiEdgeCount.value = edges.length
}

// 绑定 AI DAG 事件
const bindAiDagEvents = () => {
  if (!aiDagGraph) return

  // 节点悬停显示连接点
  aiDagGraph.on('node:mouseenter', ({ node }) => {
    const ports = document.querySelectorAll('.x6-port-body') as NodeListOf<SVGElement>
    ports.forEach(port => {
      port.style.visibility = 'visible'
    })
  })

  aiDagGraph.on('node:mouseleave', ({ node }) => {
    const ports = document.querySelectorAll('.x6-port-body') as NodeListOf<SVGElement>
    ports.forEach(port => {
      port.style.visibility = 'hidden'
    })
  })

  // 更新计数
  aiDagGraph.on('node:added', () => {
    aiNodeCount.value = aiDagGraph!.getNodes().length
  })

  aiDagGraph.on('node:removed', () => {
    aiNodeCount.value = aiDagGraph!.getNodes().length
  })

  aiDagGraph.on('edge:added', () => {
    aiEdgeCount.value = aiDagGraph!.getEdges().length
  })

  aiDagGraph.on('edge:removed', () => {
    aiEdgeCount.value = aiDagGraph!.getEdges().length
  })
}

// 事件处理
const onAiDragStart = (event: DragEvent, nodeType: any) => {
  if (event.dataTransfer) {
    event.dataTransfer.setData('application/json', JSON.stringify(nodeType))
  }
}

// 功能方法
const goBack = () => {
  router.push('/editor')
}

const saveGraph = () => {
  message.success('DAG 图已保存')
}

const exportGraph = () => {
  message.success('DAG 图已导出')
}

const clearGraph = () => {
  if (aiDagGraph) {
    aiDagGraph.clearCells()
    aiNodeCount.value = 0
    aiEdgeCount.value = 0
    message.warning('DAG 图已清空')
  }
}

const runAiWorkflow = async () => {
  if (!aiDagGraph || isRunning.value) return

  isRunning.value = true
  message.info('开始运行 AI 工作流...')

  try {
    const nodes = aiDagGraph.getNodes()
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i]
      
      // 高亮当前执行的节点
      node.attr('body/stroke', '#ff4d4f')
      node.attr('body/strokeWidth', 4)
      
      // 模拟执行时间
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // 恢复原始样式
      const nodeType = node.shape
      const originalColor = getAiNodeColor(nodeType)
      node.attr('body/stroke', originalColor)
      node.attr('body/strokeWidth', 2)
    }

    message.success('AI 工作流执行完成!')
  } catch (error) {
    message.error('工作流执行失败')
  } finally {
    isRunning.value = false
  }
}

const getAiNodeColor = (nodeType: string): string => {
  const colorMap: { [key: string]: string } = {
    'ai-data-node': '#1890ff',
    'ai-model-node': '#52c41a',
    'ai-process-node': '#fa8c16',
    'ai-output-node': '#722ed1',
  }
  return colorMap[nodeType] || '#666'
}

// 生命周期
onMounted(() => {
  initDagGraph()
  
  // 设置拖放事件
  const container = document.getElementById('dag-container')!
  
  container.addEventListener('dragover', (e) => {
    e.preventDefault()
  })
  
  container.addEventListener('drop', (e) => {
    e.preventDefault()
    const data = e.dataTransfer?.getData('application/json')
    if (data && aiDagGraph) {
      const nodeData = JSON.parse(data)
      const rect = container.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      
      const newNode = aiDagGraph.createNode({
        shape: nodeData.shape,
        label: nodeData.label,
        x: x - 60,
        y: y - 30,
      })
      
      aiDagGraph.addNode(newNode)
    }
  })
})

onUnmounted(() => {
  if (aiDagGraph) {
    aiDagGraph.dispose()
  }
})
</script>

<style scoped>
.dag-editor {
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
}

.editor-content {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.dag-sidebar {
  width: 250px;
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

/* AI 节点面板样式 */
.ai-node-palette {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 24px;
}

.ai-palette-node {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: 1px solid #e8e8e8;
  border-radius: 6px;
  cursor: move;
  transition: all 0.3s ease;
}

.ai-palette-node:hover {
  border-color: #1890ff;
  background: #f0f8ff;
}

.ai-node-icon {
  width: 24px;
  height: 24px;
  border: 2px solid;
  background: #f0f8ff;
}

.ai-node-icon.data {
  border-color: #1890ff;
  background: #e6f7ff;
  border-radius: 4px;
}

.ai-node-icon.model {
  border-color: #52c41a;
  background: #f6ffed;
  border-radius: 50%;
}

.ai-node-icon.process {
  border-color: #fa8c16;
  background: #fff7e6;
  border-radius: 2px;
}

.ai-node-icon.output {
  border-color: #722ed1;
  background: #f9f0ff;
  clip-path: polygon(0 25%, 25% 0, 75% 0, 100% 25%, 100% 75%, 75% 100%, 25% 100%, 0 75%);
}

.workflow-status {
  background: #f8f9fa;
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 16px;
}

.status-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.status-item:last-child {
  margin-bottom: 0;
}

.status-label {
  color: #666;
  font-size: 14px;
}

.status-value {
  font-weight: bold;
  font-size: 14px;
}

.status-value.running {
  color: #52c41a;
}

.status-value.idle {
  color: #fa8c16;
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
  .dag-sidebar {
    width: 200px;
  }
  
  .header-controls {
    flex-wrap: wrap;
  }
}
</style>
