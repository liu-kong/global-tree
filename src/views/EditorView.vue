<template>
  <div class="editor-management">
    <div class="management-header">
      <h1>图谱编辑器管理</h1>
      <p class="management-desc">选择您需要的图形编辑器类型</p>
    </div>
    
    <div class="editor-grid">
      <!-- 流程图编辑器 -->
      <div class="editor-card" @click="navigateToFlowchart">
        <div class="card-icon flowchart-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M3 3h18v18H3z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M8 12h8M12 8v8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <h3>流程图编辑器</h3>
        <p>创建专业的流程图、业务流程图、系统架构图等</p>
        <div class="card-features">
          <span class="feature-tag">拖拽编辑</span>
          <span class="feature-tag">智能连接</span>
          <span class="feature-tag">模板丰富</span>
        </div>
        <div class="card-action">
          <a-button type="primary">打开编辑器</a-button>
        </div>
      </div>

      <!-- RAG/DAG 编辑器 -->
      <div class="editor-card" @click="navigateToDag">
        <div class="card-icon dag-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="6" cy="6" r="3" stroke-width="2"/>
            <circle cx="18" cy="6" r="3" stroke-width="2"/>
            <circle cx="12" cy="18" r="3" stroke-width="2"/>
            <path d="M6 9v6l6 3m6-9v6l-6 3" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <h3>RAG/DAG 编辑器</h3>
        <p>构建检索增强生成和有向无环图，支持AI工作流设计</p>
        <div class="card-features">
          <span class="feature-tag">AI节点</span>
          <span class="feature-tag">工作流</span>
          <span class="feature-tag">自动执行</span>
        </div>
        <div class="card-action">
          <a-button type="primary">打开编辑器</a-button>
        </div>
      </div>

      <!-- 思维导图编辑器 -->
      <div class="editor-card" @click="navigateToMindmap">
        <div class="card-icon mindmap-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="12" cy="12" r="3" stroke-width="2"/>
            <path d="M12 9V6m0 12v3m-3-3H6m12 0h-3" stroke-width="2" stroke-linecap="round"/>
            <path d="M9 9L6 6m12 12l-3-3m0-12l3 3M6 18l3-3" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </div>
        <h3>思维导图编辑器</h3>
        <p>创建思维导图、知识图谱、概念图等</p>
        <div class="card-features">
          <span class="feature-tag">层级结构</span>
          <span class="feature-tag">智能布局</span>
          <span class="feature-tag">样式丰富</span>
        </div>
        <div class="card-action">
          <a-button type="primary">打开编辑器</a-button>
        </div>
      </div>

      <!-- 图分析编辑器 -->
      <div class="editor-card" @click="navigateToGraphAnalysis">
        <div class="card-icon analysis-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <h3>图分析编辑器</h3>
        <p>进行网络分析、路径计算、社区发现等图算法分析</p>
        <div class="card-features">
          <span class="feature-tag">算法丰富</span>
          <span class="feature-tag">可视化分析</span>
          <span class="feature-tag">实时计算</span>
        </div>
        <div class="card-action">
          <a-button type="primary">打开编辑器</a-button>
        </div>
      </div>

      <!-- D3 可视化编辑器 -->
      <div class="editor-card" @click="navigateToD3Visualization">
        <div class="card-icon d3-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M3 12h18m-9-9v18" stroke-width="2" stroke-linecap="round"/>
            <circle cx="12" cy="12" r="9" stroke-width="2" stroke-dasharray="2 2"/>
          </svg>
        </div>
        <h3>D3 可视化编辑器</h3>
        <p>使用 D3.js 创建自定义数据可视化图表</p>
        <div class="card-features">
          <span class="feature-tag">自定义图表</span>
          <span class="feature-tag">数据驱动</span>
          <span class="feature-tag">交互丰富</span>
        </div>
        <div class="card-action">
          <a-button type="primary">打开编辑器</a-button>
        </div>
      </div>

      <!-- 知识图谱编辑器 -->
      <div class="editor-card" @click="navigateToKnowledgeGraph">
        <div class="card-icon knowledge-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <h3>知识图谱编辑器</h3>
        <p>构建和管理知识图谱，支持实体关系建模</p>
        <div class="card-features">
          <span class="feature-tag">实体关系</span>
          <span class="feature-tag">语义推理</span>
          <span class="feature-tag">数据导入</span>
        </div>
        <div class="card-action">
          <a-button type="primary">打开编辑器</a-button>
        </div>
      </div>
    </div>

    <!-- 快速操作区域 -->
    <div class="quick-actions">
      <h3>快速操作</h3>
      <div class="action-buttons">
        <a-button @click="importProject">
          <template #icon>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" style="width: 16px; height: 16px;">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <polyline points="7,10 12,15 17,10" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <line x1="12" y1="15" x2="12" y2="3" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </template>
          导入项目
        </a-button>
        <a-button @click="createNewProject">
          <template #icon>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" style="width: 16px; height: 16px;">
              <circle cx="12" cy="12" r="10" stroke-width="2"/>
              <line x1="12" y1="8" x2="12" y2="16" stroke-width="2"/>
              <line x1="8" y1="12" x2="16" y2="12" stroke-width="2"/>
            </svg>
          </template>
          新建项目
        </a-button>
        <a-button @click="openRecentProjects">
          <template #icon>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" style="width: 16px; height: 16px;">
              <circle cx="12" cy="12" r="10" stroke-width="2"/>
              <polyline points="12,6 12,12 16,14" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </template>
          最近项目
        </a-button>
        <a-button @click="openSettings">
          <template #icon>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" style="width: 16px; height: 16px;">
              <circle cx="12" cy="12" r="3" stroke-width="2"/>
              <path d="M12 1v6m0 6v6m4.22-13.22l4.24 4.24M1.54 1.54l4.24 4.24M1 12h6m6 0h6m-13.22 4.22l-4.24 4.24m16.92 0l-4.24-4.24" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </template>
          设置
        </a-button>
      </div>
    </div>

    <!-- 最近使用的编辑器 -->
    <div class="recent-editors" v-if="recentEditors.length > 0">
      <h3>最近使用</h3>
      <div class="recent-list">
        <div 
          v-for="editor in recentEditors" 
          :key="editor.id"
          class="recent-item"
          @click="navigateToEditor(editor.type)"
        >
          <div class="recent-icon" :class="`${editor.type}-icon`">
            <component :is="editor.icon" />
          </div>
          <div class="recent-info">
            <div class="recent-name">{{ editor.name }}</div>
            <div class="recent-time">{{ editor.lastUsed }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'

const router = useRouter()

// 最近使用的编辑器
const recentEditors = ref([
  {
    id: 1,
    type: 'flowchart',
    name: '流程图编辑器',
    lastUsed: '2小时前',
    icon: 'flowchart-icon'
  },
  {
    id: 2,
    type: 'dag',
    name: 'RAG/DAG 编辑器',
    lastUsed: '昨天',
    icon: 'dag-icon'
  }
])

// 导航方法
const navigateToFlowchart = () => {
  router.push('/editor/flowchart')
}

const navigateToDag = () => {
  router.push('/editor/dag')
}

const navigateToMindmap = () => {
  router.push('/editor/mindmap')
}

const navigateToGraphAnalysis = () => {
  router.push('/editor/graph-analysis')
}

const navigateToD3Visualization = () => {
  router.push('/editor/d3-visualization')
}

const navigateToKnowledgeGraph = () => {
  router.push('/editor/knowledge-graph')
}

const navigateToEditor = (type: string) => {
  switch (type) {
    case 'flowchart':
      navigateToFlowchart()
      break
    case 'dag':
      navigateToDag()
      break
    case 'mindmap':
      navigateToMindmap()
      break
    case 'graph-analysis':
      navigateToGraphAnalysis()
      break
    case 'd3-visualization':
      navigateToD3Visualization()
      break
    case 'knowledge-graph':
      navigateToKnowledgeGraph()
      break
  }
}

// 快速操作方法
const importProject = () => {
  message.info('导入项目功能开发中...')
}

const createNewProject = () => {
  message.info('新建项目功能开发中...')
}

const openRecentProjects = () => {
  message.info('最近项目功能开发中...')
}

const openSettings = () => {
  router.push('/settings')
}
</script>

<style scoped>
.editor-management {
  padding: 24px;
  background: #f5f5f5;
  min-height: 100vh;
}

.management-header {
  text-align: center;
  margin-bottom: 48px;
}

.management-header h1 {
  font-size: 32px;
  font-weight: 600;
  color: #262626;
  margin-bottom: 8px;
}

.management-desc {
  font-size: 16px;
  color: #666;
  margin: 0;
}

.editor-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 24px;
  margin-bottom: 48px;
}

.editor-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.editor-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  border-color: #1890ff;
}

.card-icon {
  width: 64px;
  height: 64px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
  color: white;
}

.flowchart-icon {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.dag-icon {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.mindmap-icon {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.analysis-icon {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.d3-icon {
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
}

.knowledge-icon {
  background: linear-gradient(135deg, #30cfd0 0%, #330867 100%);
}

.card-icon svg {
  width: 32px;
  height: 32px;
}

.editor-card h3 {
  font-size: 20px;
  font-weight: 600;
  color: #262626;
  margin-bottom: 8px;
}

.editor-card p {
  color: #666;
  font-size: 14px;
  line-height: 1.6;
  margin-bottom: 16px;
}

.card-features {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.feature-tag {
  background: #f0f0f0;
  color: #666;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.card-action {
  display: flex;
  justify-content: center;
}

.quick-actions {
  background: white;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.quick-actions h3 {
  font-size: 18px;
  font-weight: 600;
  color: #262626;
  margin-bottom: 16px;
}

.action-buttons {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.recent-editors {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.recent-editors h3 {
  font-size: 18px;
  font-weight: 600;
  color: #262626;
  margin-bottom: 16px;
}

.recent-list {
  display: flex;
  gap: 16px;
  overflow-x: auto;
}

.recent-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 200px;
}

.recent-item:hover {
  border-color: #1890ff;
  background: #f0f8ff;
}

.recent-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.recent-info {
  flex: 1;
}

.recent-name {
  font-weight: 500;
  color: #262626;
  margin-bottom: 4px;
}

.recent-time {
  font-size: 12px;
  color: #999;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .editor-management {
    padding: 16px;
  }
  
  .editor-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .management-header h1 {
    font-size: 24px;
  }
  
  .action-buttons {
    justify-content: center;
  }
}
</style>
