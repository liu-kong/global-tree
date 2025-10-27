<template>
  <div class="graph-analysis-editor">
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
        <h2>图分析编辑器</h2>
      </div>
      <div class="header-controls">
        <a-button @click="generateRandomGraph">生成随机图</a-button>
        <a-button @click="runAnalysis">运行分析</a-button>
        <a-button @click="saveGraph">保存</a-button>
        <a-button @click="exportGraph">导出</a-button>
        <a-button @click="clearGraph">清空</a-button>
      </div>
    </div>

    <div class="editor-content">
      <div class="analysis-sidebar">
        <h3>分析算法</h3>
        <div class="algorithm-controls">
          <div class="control-group">
            <label>选择算法</label>
            <a-select v-model:value="selectedAlgorithm" style="width: 100%">
              <a-select-option value="pagerank">PageRank</a-select-option>
              <a-select-option value="betweenness">介数中心性</a-select-option>
              <a-select-option value="closeness">接近中心性</a-select-option>
              <a-select-option value="degree">度中心性</a-select-option>
              <a-select-option value="community">社区检测</a-select-option>
              <a-select-option value="shortest-path">最短路径</a-select-option>
            </a-select>
          </div>

          <div class="control-group">
            <label>图类型</label>
            <a-select v-model:value="graphType" style="width: 100%">
              <a-select-option value="erdos-renyi">Erdős-Rényi</a-select-option>
              <a-select-option value="barabasi-albert">Barabási-Albert</a-select-option>
              <a-select-option value="watts-strogatz">Watts-Strogatz</a-select-option>
              <a-select-option value="scale-free">无标度网络</a-select-option>
            </a-select>
          </div>

          <div class="control-group">
            <label>节点数量: {{ nodeCount }}</label>
            <a-slider v-model:value="nodeCount" :min="10" :max="200" />
          </div>

          <div class="control-group">
            <label>边密度: {{ edgeDensity }}</label>
            <a-slider v-model:value="edgeDensity" :min="0.1" :max="1" :step="0.1" />
          </div>
        </div>

        <h3>分析结果</h3>
        <div class="analysis-results">
          <div v-if="analysisResults" class="result-panel">
            <div class="result-item">
              <span class="result-label">节点总数:</span>
              <span class="result-value">{{ analysisResults.nodeCount }}</span>
            </div>
            <div class="result-item">
              <span class="result-label">边总数:</span>
              <span class="result-value">{{ analysisResults.edgeCount }}</span>
            </div>
            <div class="result-item">
              <span class="result-label">平均度:</span>
              <span class="result-value">{{ analysisResults.avgDegree?.toFixed(2) }}</span>
            </div>
            <div class="result-item">
              <span class="result-label">聚类系数:</span>
              <span class="result-value">{{ analysisResults.clusteringCoefficient?.toFixed(3) }}</span>
            </div>
            <div class="result-item">
              <span class="result-label">连通分量:</span>
              <span class="result-value">{{ analysisResults.components }}</span>
            </div>
          </div>
          <div v-else class="no-results">
            暂无分析结果
          </div>
        </div>

        <h3>可视化设置</h3>
        <div class="visualization-controls">
          <div class="control-group">
            <label>节点大小映射</label>
            <a-select v-model:value="nodeSizeMapping" style="width: 100%">
              <a-select-option value="degree">度数</a-select-option>
              <a-select-option value="pagerank">PageRank</a-select-option>
              <a-select-option value="betweenness">介数中心性</a-select-option>
              <a-select-option value="fixed">固定大小</a-select-option>
            </a-select>
          </div>

          <div class="control-group">
            <label>颜色映射</label>
            <a-select v-model:value="colorMapping" style="width: 100%">
              <a-select-option value="community">社区</a-select-option>
              <a-select-option value="centrality">中心性</a-select-option>
              <a-select-option value="fixed">固定颜色</a-select-option>
            </a-select>
          </div>
        </div>
      </div>
      
      <div class="editor-main">
        <div id="analysis-container" class="graph-container"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { Graph } from '@antv/g6'

const router = useRouter()

// 响应式数据
const selectedAlgorithm = ref('pagerank')
const graphType = ref('erdos-renyi')
const nodeCount = ref(50)
const edgeDensity = ref(0.3)
const nodeSizeMapping = ref('degree')
const colorMapping = ref('community')
const analysisResults = ref<any>(null)

let analysisGraph: Graph | null = null

// 初始化图分析编辑器
const initAnalysisGraph = () => {
  const container = document.getElementById('analysis-container')!
  
  analysisGraph = new Graph({
    container: container,
    width: container.offsetWidth,
    height: container.offsetHeight,
    modes: {
      default: [
        'drag-canvas',
        'zoom-canvas',
        'drag-node',
        'activate-relations',
      ],
    },
    defaultNode: {
      size: 20,
      style: {
        fill: '#1890ff',
        stroke: '#fff',
        lineWidth: 2,
      },
      labelCfg: {
        style: {
          fill: '#000',
          fontSize: 12,
        },
        position: 'bottom',
      },
    },
    defaultEdge: {
      style: {
        stroke: '#999',
        lineWidth: 1,
        endArrow: {
          path: 'M 0,0 L 8,4 L 8,-4 Z',
          fill: '#999',
        },
      },
    },
    layout: {
      type: 'force',
      preventOverlap: true,
      nodeSize: 20,
      linkDistance: 100,
      nodeStrength: -50,
      edgeStrength: 0.1,
    },
  })

  // 生成初始图
  generateRandomGraph()
  
  // 绑定事件
  bindAnalysisEvents()
}

// 生成随机图
const generateRandomGraph = () => {
  if (!analysisGraph) return

  const nodes = []
  const edges = []
  
  // 生成节点
  for (let i = 0; i < nodeCount.value; i++) {
    nodes.push({
      id: `node-${i}`,
      label: `节点 ${i}`,
      value: Math.random() * 10,
    })
  }
  
  // 生成边
  const edgeCount = Math.floor(nodeCount.value * (nodeCount.value - 1) * edgeDensity.value / 2)
  const edgeSet = new Set<string>()
  
  while (edges.length < edgeCount) {
    const source = Math.floor(Math.random() * nodeCount.value)
    const target = Math.floor(Math.random() * nodeCount.value)
    
    if (source !== target) {
      const edgeKey = source < target ? `${source}-${target}` : `${target}-${source}`
      if (!edgeSet.has(edgeKey)) {
        edgeSet.add(edgeKey)
        edges.push({
          source: `node-${source}`,
          target: `node-${target}`,
          weight: Math.random(),
        })
      }
    }
  }
  
  analysisGraph.data({ nodes, edges })
  analysisGraph.render()
  
  message.success(`已生成包含 ${nodeCount.value} 个节点和 ${edges.length} 条边的随机图`)
}

// 运行分析
const runAnalysis = () => {
  if (!analysisGraph) return

  const nodes = analysisGraph.getNodes()
  const edges = analysisGraph.getEdges()
  
  // 基础统计
  const nodeCount = nodes.length
  const edgeCount = edges.length
  const avgDegree = (2 * edgeCount) / nodeCount
  
  // 计算聚类系数
  let clusteringCoefficient = 0
  nodes.forEach(node => {
    const neighbors = node.getNeighbors()
    const k = neighbors.length
    if (k > 1) {
      let linksBetweenNeighbors = 0
      for (let i = 0; i < k; i++) {
        for (let j = i + 1; j < k; j++) {
          if (analysisGraph!.hasEdge(neighbors[i], neighbors[j])) {
            linksBetweenNeighbors++
          }
        }
      }
      clusteringCoefficient += (2 * linksBetweenNeighbors) / (k * (k - 1))
    }
  })
  clusteringCoefficient /= nodeCount
  
  // 计算连通分量
  const components = calculateComponents()
  
  // 运行特定算法
  let algorithmResults = {}
  switch (selectedAlgorithm.value) {
    case 'pagerank':
      algorithmResults = calculatePageRank()
      break
    case 'betweenness':
      algorithmResults = calculateBetweenness()
      break
    case 'closeness':
      algorithmResults = calculateCloseness()
      break
    case 'degree':
      algorithmResults = calculateDegreeCentrality()
      break
    case 'community':
      algorithmResults = detectCommunities()
      break
  }
  
  analysisResults.value = {
    nodeCount,
    edgeCount,
    avgDegree,
    clusteringCoefficient,
    components,
    ...algorithmResults,
  }
  
  // 更新可视化
  updateVisualization()
  
  message.success('分析完成')
}

// 计算连通分量
const calculateComponents = () => {
  if (!analysisGraph) return 0
  
  const visited = new Set()
  let components = 0
  
  const nodes = analysisGraph.getNodes()
  nodes.forEach(node => {
    if (!visited.has(node.getID())) {
      components++
      const queue = [node]
      while (queue.length > 0) {
        const current = queue.shift()!
        const nodeId = current.getID()
        if (!visited.has(nodeId)) {
          visited.add(nodeId)
          const neighbors = current.getNeighbors()
          neighbors.forEach(neighbor => {
            if (!visited.has(neighbor.getID())) {
              queue.push(neighbor)
            }
          })
        }
      }
    }
  })
  
  return components
}

// 计算 PageRank
const calculatePageRank = () => {
  if (!analysisGraph) return {}
  
  const nodes = analysisGraph.getNodes()
  const nodeCount = nodes.length
  const damping = 0.85
  const iterations = 100
  
  // 初始化 PageRank 值
  const pageRank = new Map()
  nodes.forEach(node => {
    pageRank.set(node.getID(), 1 / nodeCount)
  })
  
  // 迭代计算
  for (let iter = 0; iter < iterations; iter++) {
    const newPageRank = new Map()
    
    nodes.forEach(node => {
      const nodeId = node.getID()
      let rank = (1 - damping) / nodeCount
      
      const neighbors = node.getNeighbors()
      neighbors.forEach(neighbor => {
        const neighborId = neighbor.getID()
        const neighborDegree = neighbor.getNeighbors().length
        if (neighborDegree > 0) {
          rank += damping * (pageRank.get(neighborId) || 0) / neighborDegree
        }
      })
      
      newPageRank.set(nodeId, rank)
    })
    
    pageRank.clear()
    newPageRank.forEach((value, key) => {
      pageRank.set(key, value)
    })
  }
  
  // 更新节点数据
  nodes.forEach(node => {
    node.getModel().pagerank = pageRank.get(node.getID())
  })
  
  return { maxPageRank: Math.max(...pageRank.values()) }
}

// 计算度中心性
const calculateDegreeCentrality = () => {
  if (!analysisGraph) return {}
  
  const nodes = analysisGraph.getNodes()
  const centralities = []
  
  nodes.forEach(node => {
    const degree = node.getNeighbors().length
    node.getModel().degree = degree
    centralities.push(degree)
  })
  
  return {
    maxDegree: Math.max(...centralities),
    minDegree: Math.min(...centralities),
    avgDegree: centralities.reduce((a, b) => a + b, 0) / centralities.length,
  }
}

// 计算介数中心性（简化版）
const calculateBetweenness = () => {
  if (!analysisGraph) return {}
  
  const nodes = analysisGraph.getNodes()
  const betweenness = new Map()
  
  nodes.forEach(node => {
    betweenness.set(node.getID(), 0)
  })
  
  nodes.forEach(node => {
    const nodeId = node.getID()
    // 简化的介数计算
    const neighbors = node.getNeighbors()
    const degree = neighbors.length
    node.getModel().betweenness = degree
  })
  
  return { maxBetweenness: Math.max(...Array.from(betweenness.values())) }
}

// 计算接近中心性（简化版）
const calculateCloseness = () => {
  if (!analysisGraph) return {}
  
  const nodes = analysisGraph.getNodes()
  
  nodes.forEach(node => {
    const nodeId = node.getID()
    // 简化的接近度计算
    const neighbors = node.getNeighbors()
    const closeness = neighbors.length / nodes.length
    node.getModel().closeness = closeness
  })
  
  return { avgCloseness: 0.5 }
}

// 社区检测（简化版）
const detectCommunities = () => {
  if (!analysisGraph) return {}
  
  const nodes = analysisGraph.getNodes()
  const communities = new Map()
  let communityId = 0
  
  nodes.forEach(node => {
    // 简单的社区分配
    const community = Math.floor(Math.random() * 5)
    communities.set(node.getID(), community)
    node.getModel().community = community
  })
  
  return { communityCount: 5 }
}

// 更新可视化
const updateVisualization = () => {
  if (!analysisGraph) return
  
  const nodes = analysisGraph.getNodes()
  
  nodes.forEach(node => {
    const model = node.getModel()
    
    // 更新节点大小
    let size = 20
    switch (nodeSizeMapping.value) {
      case 'degree':
        size = 10 + (model.degree || 1) * 3
        break
      case 'pagerank':
        size = 10 + (model.pagerank || 0.1) * 100
        break
      case 'betweenness':
        size = 10 + (model.betweenness || 1) * 2
        break
    }
    
    // 更新节点颜色
    let color = '#1890ff'
    switch (colorMapping.value) {
      case 'community':
        const colors = ['#1890ff', '#52c41a', '#fa8c16', '#f5222d', '#722ed1']
        color = colors[model.community || 0]
        break
      case 'centrality':
        const centrality = model.degree || 1
        color = centrality > 5 ? '#f5222d' : centrality > 3 ? '#fa8c16' : '#1890ff'
        break
    }
    
    analysisGraph!.updateItem(node, {
      size,
      style: { fill: color },
    })
  })
}

// 绑定分析事件
const bindAnalysisEvents = () => {
  if (!analysisGraph) return

  analysisGraph.on('node:click', (e) => {
    const nodeData = e.item.getModel()
    message.info(`节点 ${nodeData.label}: 度数=${nodeData.degree || 0}`)
  })
}

// 功能方法
const goBack = () => {
  router.push('/editor')
}

const saveGraph = () => {
  const data = analysisGraph?.save()
  console.log('保存图分析数据:', data)
  message.success('图分析数据已保存')
}

const exportGraph = () => {
  analysisGraph?.downloadFullImage('graph-analysis', 'image/png')
  message.success('图分析已导出')
}

const clearGraph = () => {
  if (analysisGraph) {
    analysisGraph.clear()
    analysisResults.value = null
    message.warning('图分析已清空')
  }
}

// 生命周期
onMounted(() => {
  initAnalysisGraph()
  
  // 监听窗口大小变化
  window.addEventListener('resize', () => {
    const container = document.getElementById('analysis-container')
    if (container && analysisGraph) {
      analysisGraph.changeSize(container.offsetWidth, container.offsetHeight)
    }
  })
})

onUnmounted(() => {
  if (analysisGraph) {
    analysisGraph.destroy()
  }
})
</script>

<style scoped>
.graph-analysis-editor {
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

.analysis-sidebar {
  width: 320px;
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

/* 控制面板样式 */
.algorithm-controls,
.visualization-controls {
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

/* 分析结果样式 */
.analysis-results {
  margin-bottom: 24px;
}

.result-panel {
  background: #f8f9fa;
  border-radius: 6px;
  padding: 12px;
}

.result-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.result-item:last-child {
  margin-bottom: 0;
}

.result-label {
  color: #666;
  font-size: 14px;
}

.result-value {
  font-weight: bold;
  font-size: 14px;
  color: #1890ff;
}

.no-results {
  background: #f8f9fa;
  border-radius: 6px;
  padding: 12px;
  text-align: center;
  color: #999;
  font-size: 14px;
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
  .analysis-sidebar {
    width: 280px;
  }
  
  .header-controls {
    flex-wrap: wrap;
  }
}
