import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/HomeView.vue'),
      meta: {
        title: '知识图谱编辑器'
      }
    },
    {
      path: '/editor',
      name: 'editor',
      component: () => import('@/views/EditorView.vue'),
      meta: {
        title: '图谱编辑器管理'
      }
    },
    {
      path: '/editor/flowchart',
      name: 'flowchart-editor',
      component: () => import('@/views/FlowchartEditorView.vue'),
      meta: {
        title: '流程图编辑器'
      }
    },
    {
      path: '/editor/dag',
      name: 'dag-editor',
      component: () => import('@/views/DagEditorView.vue'),
      meta: {
        title: 'RAG/DAG 编辑器'
      }
    },
    {
      path: '/editor/mindmap',
      name: 'mindmap-editor',
      component: () => import('@/views/MindmapEditorView.vue'),
      meta: {
        title: '思维导图编辑器'
      }
    },
    {
      path: '/editor/graph-analysis',
      name: 'graph-analysis-editor',
      component: () => import('@/views/GraphAnalysisEditorView.vue'),
      meta: {
        title: '图分析编辑器'
      }
    },
    {
      path: '/analyzer',
      name: 'analyzer',
      component: () => import('@/views/AnalyzerView.vue'),
      meta: {
        title: '图谱分析器'
      }
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('@/views/SettingsView.vue'),
      meta: {
        title: '设置'
      }
    },
    {
      path: '/about',
      name: 'about',
      component: () => import('@/views/AboutView.vue'),
      meta: {
        title: '关于'
      }
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/views/NotFoundView.vue'),
      meta: {
        title: '页面未找到'
      }
    }
  ]
})

// 路由守卫
router.beforeEach((to, from, next) => {
  // 设置页面标题
  if (to.meta?.title) {
    document.title = `${to.meta.title} - 知识图谱编辑器`
  }
  next()
})

export default router
