<template>
  <div class="analyzer-view">
    <div class="analyzer-header">
      <h1>图谱分析器</h1>
      <div class="analyzer-controls">
        <a-button type="primary" @click="runAnalysis">运行分析</a-button>
        <a-button @click="exportResults">导出结果</a-button>
      </div>
    </div>
    
    <div class="analyzer-content">
      <div class="analyzer-sidebar">
        <h3>分析算法</h3>
        <div class="algorithm-list">
          <div 
            v-for="algorithm in algorithms" 
            :key="algorithm.id"
            class="algorithm-item"
            :class="{ active: selectedAlgorithm === algorithm.id }"
            @click="selectAlgorithm(algorithm.id)"
          >
            <div class="algorithm-icon">{{ algorithm.icon }}</div>
            <div class="algorithm-info">
              <div class="algorithm-name">{{ algorithm.name }}</div>
              <div class="algorithm-description">{{ algorithm.description }}</div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="analyzer-main">
        <div class="analysis-results">
          <h3>分析结果</h3>
          <div v-if="!analysisResults.length" class="no-results">
            <a-empty description="请选择算法并运行分析" />
          </div>
          <div v-else class="results-content">
            <div 
              v-for="result in analysisResults" 
              :key="result.id"
              class="result-item"
            >
              <h4>{{ result.title }}</h4>
              <p>{{ result.description }}</p>
              <div class="result-value">{{ result.value }}</div>
            </div>
          </div>
        </div>
        
        <div class="analysis-visualization">
          <h3>可视化</h3>
          <div class="visualization-container">
            <GraphAnalysisDemo />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import GraphAnalysisDemo from '@/examples/graph-analysis/GraphAnalysisDemo.vue'

// 响应式数据
const selectedAlgorithm = ref('')
const analysisResults = ref([])

// 分析算法列表
const algorithms = [
  {
    id: 'centrality',
    name: '中心性分析',
    description: '计算节点的重要性',
    icon: '🎯'
  },
  {
    id: 'clustering',
    name: '聚类分析',
    description: '发现图中的社群结构',
    icon: '🔗'
  },
  {
    id: 'shortest-path',
    name: '最短路径',
    description: '计算节点间的最短路径',
    icon: '🛤️'
  },
  {
    id: 'connectivity',
    name: '连通性分析',
    description: '分析图的连通性',
    icon: '🔌'
  },
  {
    id: 'page-rank',
    name: 'PageRank',
    description: '计算节点的PageRank值',
    icon: '📊'
  },
  {
    id: 'community-detection',
    name: '社区发现',
    description: '自动发现社区结构',
    icon: '🏘️'
  }
]

// 方法
const selectAlgorithm = (algorithmId: string) => {
  selectedAlgorithm.value = algorithmId
  console.log('选择算法:', algorithmId)
}

const runAnalysis = () => {
  if (!selectedAlgorithm.value) {
    message.warning('请先选择分析算法')
    return
  }
  
  // 模拟分析结果
  const algorithm = algorithms.find(a => a.id === selectedAlgorithm.value)
  analysisResults.value = [
    {
      id: 'result-1',
      title: algorithm?.name || '分析结果',
      description: `基于 ${algorithm?.name} 算法的分析结果`,
      value: Math.floor(Math.random() * 100)
    }
  ]
  
  message.success('分析完成')
}

const exportResults = () => {
  if (!analysisResults.value.length) {
    message.warning('暂无分析结果可导出')
    return
  }
  
  message.success('结果已导出')
}

// 生命周期
onMounted(() => {
  console.log('分析器视图已挂载')
})
</script>

<style scoped>
.analyzer-view {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
}

.analyzer-header {
  background: white;
  padding: 16px 24px;
  border-bottom: 1px solid #e8e8e8;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.analyzer-header h1 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.analyzer-controls {
  display: flex;
  gap: 8px;
}

.analyzer-content {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.analyzer-sidebar {
  width: 280px;
  background: white;
  border-right: 1px solid #e8e8e8;
  padding: 16px;
  overflow-y: auto;
}

.analyzer-sidebar h3 {
  margin: 0 0 16px 0;
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.algorithm-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.algorithm-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.algorithm-item:hover {
  background: #f0f0f0;
  border-color: #1890ff;
}

.algorithm-item.active {
  background: #e6f7ff;
  border-color: #1890ff;
}

.algorithm-icon {
  font-size: 20px;
  flex-shrink: 0;
}

.algorithm-info {
  flex: 1;
}

.algorithm-name {
  font-weight: 600;
  margin-bottom: 4px;
  color: #333;
}

.algorithm-description {
  font-size: 12px;
  color: #666;
  line-height: 1.4;
}

.analyzer-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
  overflow-y: auto;
}

.analysis-results,
.analysis-visualization {
  background: white;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.analysis-results h3,
.analysis-visualization h3 {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.no-results {
  text-align: center;
  padding: 40px 20px;
}

.results-content {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.result-item {
  background: #fafafa;
  padding: 12px;
  border-radius: 6px;
  border-left: 4px solid #1890ff;
}

.result-item h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.result-item p {
  margin: 0 0 8px 0;
  font-size: 12px;
  color: #666;
}

.result-value {
  font-size: 18px;
  font-weight: bold;
  color: #1890ff;
}

.visualization-container {
  height: 400px;
  border: 1px solid #e8e8e8;
  border-radius: 6px;
  overflow: hidden;
}
</style>
