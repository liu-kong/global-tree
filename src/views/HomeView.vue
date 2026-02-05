<template>
  <div class="home">
    <header class="header">
      <div class="header-title">
        <AppIcon name="tree-root" :size="32" class="logo-icon" />
        <h1>Global Tree</h1>
      </div>
      <div class="header-info">
        <p class="subtitle">AI驱动的个人知识花园 - 从记录到创新</p>
        <div class="shortcuts-hint">
          <span class="shortcut-hint">
            <kbd>Ctrl</kbd>+<kbd>N</kbd> 新建
          </span>
          <span class="shortcut-hint">
            <kbd>双击</kbd> 编辑
          </span>
          <span class="shortcut-hint">
            <kbd>右键</kbd> 菜单
          </span>
        </div>
      </div>
    </header>

    <main class="main">
      <!-- 左侧面板：知识树 -->
      <aside class="sidebar">
        <div class="panel-header">
          <h2>知识树</h2>
          <button @click="handleAddNode" class="btn-primary">
            <AppIcon name="add" :size="16" />
            新建
          </button>
        </div>

        <div class="tree-content">
          <div v-if="treeStore.loading">加载中...</div>
          <div v-else-if="!treeStore.root" class="empty">
            <p>还没有知识树，开始创建吧！</p>
            <button @click="handleCreateDefault" class="btn-primary">
              创建默认知识树
            </button>
          </div>
          <div v-else class="tree-view">
            <div class="node-list">
              <div
                v-for="node in treeStore.flatNodes"
                :key="node.id"
                class="node-item"
                :class="{ active: selectedNodeId === node.id }"
                @click="handleSelectNode(node.id)"
                @dblclick="handleQuickEdit(node.id)"
                @contextmenu.prevent="handleNodeContextMenu(node, $event)"
              >
                <span class="node-icon">
                  <AppIcon :name="getNodeIconName(node.type)" :size="18" />
                </span>
                <span class="node-title">{{ node.title }}</span>
                <span class="node-meta">({{ getNodeChildrenCount(node.id) }})</span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <!-- 中间：主内容区 -->
      <section class="content">
        <NodeDetail
          v-if="selectedNode"
          :node="selectedNode"
          :nutrients="nodeNutrients"
          :all-nodes="treeStore.flatNodes"
          @edit="handleEditNode"
          @delete="handleDeleteNode"
          @select-node="handleSelectNode"
        />

        <div v-else class="placeholder">
          <p>选择一个节点查看详情</p>
          <p>或点击上方"新建"按钮创建第一个节点</p>
        </div>
      </section>

      <!-- 右侧面板：养料列表 -->
      <aside class="sidebar right">
        <div class="panel-header">
          <h2>养料</h2>
          <button @click="handleAddNutrient" class="btn-primary">+ 添加</button>
        </div>

        <div class="nutrients-list">
          <div
            v-for="nutrient in nodeNutrients"
            :key="nutrient.id"
            class="nutrient-item"
          >
            <div class="nutrient-header">
              <span class="nutrient-type">{{ getNutrientTypeLabel(nutrient.type) }}</span>
              <span class="nutrient-status" :class="nutrient.status">
                {{ getStatusLabel(nutrient.status) }}
              </span>
            </div>
            <h4 class="nutrient-title">
              {{ nutrient.parsed?.title || '未处理' }}
            </h4>
            <p v-if="nutrient.parsed?.summary" class="nutrient-summary">
              {{ nutrient.parsed.summary }}
            </p>
            <div v-if="nutrient.tags.length" class="nutrient-tags">
              <span v-for="tag in nutrient.tags" :key="tag" class="tag tag-small">
                {{ tag }}
              </span>
            </div>
          </div>

          <div v-if="nodeNutrients.length === 0" class="empty">
            <p>暂无养料</p>
          </div>
        </div>
      </aside>
    </main>

    <!-- 新建/编辑节点对话框 -->
    <NodeDialog
      v-model:visible="nodeDialogVisible"
      :node="editingNode"
      :title="dialogTitle"
      @submit="handleNodeSubmit"
    />

    <!-- 删除确认对话框 -->
    <NodeDeleteDialog
      v-model:visible="deleteDialogVisible"
      :node="deletingNode"
      @confirm="handleDeleteConfirm"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useTreeStore, useNutrientStore } from '../stores'
import { NodeType, NutrientType } from '../types'
import NodeDetail from '../components/NodeDetail.vue'
import NodeDialog from '../components/NodeDialog.vue'
import NodeDeleteDialog from '../components/NodeDeleteDialog.vue'
import AppIcon from '../components/AppIcon.vue'

const treeStore = useTreeStore()
const nutrientStore = useNutrientStore()

// 选中的节点ID
const selectedNodeId = ref<string | null>(null)

// 对话框状态
const nodeDialogVisible = ref(false)
const deleteDialogVisible = ref(false)
const editingNode = ref<any>(null)
const deletingNode = ref<any>(null)

// 快捷键处理
function handleKeydown(event: KeyboardEvent) {
  // Ctrl/Cmd + N: 新建节点
  if ((event.ctrlKey || event.metaKey) && event.key === 'n') {
    event.preventDefault()
    handleAddNode()
    return
  }

  // Ctrl/Cmd + E: 编辑节点
  if ((event.ctrlKey || event.metaKey) && event.key === 'e') {
    event.preventDefault()
    if (selectedNode.value) {
      handleEditNode()
    }
    return
  }

  // Ctrl/Cmd + D: 删除节点
  if ((event.ctrlKey || event.metaKey) && event.key === 'd') {
    event.preventDefault()
    if (selectedNode.value) {
      handleDeleteNode()
    }
    return
  }

  // Esc: 关闭对话框
  if (event.key === 'Escape') {
    if (nodeDialogVisible.value) {
      nodeDialogVisible.value = false
    }
    if (deleteDialogVisible.value) {
      deleteDialogVisible.value = false
    }
    return
  }

  // Delete: 删除选中节点
  if (event.key === 'Delete' && selectedNode.value) {
    handleDeleteNode()
    return
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})

// 计算属性
const selectedNode = computed(() => {
  if (!selectedNodeId.value) return null
  return treeStore.tree?.getNode(selectedNodeId.value)
})

const nodeNutrients = computed(() => {
  if (!selectedNodeId.value) return []
  return nutrientStore.nutrients.filter(n => n.nodeId === selectedNodeId.value)
})

const dialogTitle = computed(() => {
  return editingNode.value ? '编辑节点' : '新建节点'
})

// 节点操作处理函数
function handleAddNode() {
  editingNode.value = null
  nodeDialogVisible.value = true
}

function handleEditNode() {
  if (!selectedNode.value) return
  editingNode.value = selectedNode.value
  nodeDialogVisible.value = true
}

async function handleNodeSubmit(data: any) {
  try {
    // 确保知识树已加载
    if (!treeStore.tree) {
      await treeStore.loadTree()
    }

    if (editingNode.value) {
      // 编辑现有节点
      const { parentId, type, title, description, metadata } = data
      await treeStore.updateNode(editingNode.value.id, {
        title,
        description,
        metadata
      })
    } else {
      // 创建新节点
      const parentId = selectedNodeId.value
      const nodeId = await treeStore.createNode({
        parentId,
        type: data.type,
        title: data.title,
        description: data.description,
        metadata: data.metadata
      })
      // 自动选中新创建的节点
      if (nodeId) {
        selectedNodeId.value = nodeId
      }
    }
    nodeDialogVisible.value = false
  } catch (error) {
    console.error('Failed to save node:', error)
    // 提供更详细的错误信息
    const errorMessage = error instanceof Error ? error.message : '未知错误'
    alert(`保存失败：${errorMessage}\n\n请检查：\n1. 是否已创建知识树\n2. 标题是否填写\n3. 浏览器控制台是否有错误`)
  }
}

function handleDeleteNode() {
  if (!selectedNode.value) return
  deletingNode.value = selectedNode.value
  deleteDialogVisible.value = true
}

async function handleDeleteConfirm() {
  if (!deletingNode.value) return

  try {
    await treeStore.deleteNode(deletingNode.value.id, { recursive: true })
    deleteDialogVisible.value = false
    // 删除后清空选中状态
    selectedNodeId.value = null
    deletingNode.value = null
  } catch (error) {
    console.error('Failed to delete node:', error)
    alert('删除失败，请重试')
  }
}

function handleSelectNode(nodeId: string) {
  selectedNodeId.value = nodeId
}

function handleQuickEdit(nodeId: string) {
  selectedNodeId.value = nodeId
  handleEditNode()
}

function handleNodeContextMenu(node: any, event: MouseEvent) {
  // 简单实现：根据点击位置显示操作提示
  const action = prompt(
    `节点操作: "${node.title}"\n\n` +
    `1 - 新建子节点\n` +
    `2 - 编辑节点\n` +
    `3 - 删除节点\n` +
    `0 - 取消\n\n` +
    `请输入操作编号:`
  )

  switch (action) {
    case '1':
      // 新建子节点
      selectedNodeId.value = node.id
      handleAddNode()
      break
    case '2':
      // 编辑节点
      selectedNodeId.value = node.id
      handleEditNode()
      break
    case '3':
      // 删除节点
      selectedNodeId.value = node.id
      handleDeleteNode()
      break
    default:
      // 取消
      break
  }
}

async function handleCreateDefault() {
  await treeStore.loadTree()
}

function handleAddNutrient() {
  // TODO: 实现添加养料
  console.log('Add nutrient')
}

// 辅助函数
function getNodeIconName(type: NodeType): string {
  switch (type) {
    case NodeType.ROOT:
      return 'tree-root'
    case NodeType.BRANCH:
      return 'tree-branch'
    case NodeType.LEAF:
      return 'tree-leaf'
    default:
      return 'tree-virtual'
  }
}

function getNodeChildrenCount(nodeId: string): number {
  const node = treeStore.tree?.getNode(nodeId)
  return node?.children.length || 0
}

function getNutrientTypeLabel(type: NutrientType): string {
  const labels: Record<NutrientType, string> = {
    [NutrientType.WEB_LINK]: '网页',
    [NutrientType.MARKDOWN]: 'Markdown',
    [NutrientType.PDF]: 'PDF',
    [NutrientType.IMAGE]: '图片',
    [NutrientType.NOTE]: '笔记'
  }
  return labels[type] || type
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: '待处理',
    processing: '处理中',
    completed: '已完成',
    failed: '失败'
  }
  return labels[status] || status
}
</script>

<style scoped>
.home {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.header {
  padding: 1rem 2rem;
  border-bottom: 1px solid #e8e8e8;
  background: #fff;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.header-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
}

.logo-icon {
  color: #1890ff;
}

.header h1 {
  margin: 0;
  font-size: 1.5rem;
  color: #1890ff;
}

.subtitle {
  margin: 0;
  font-size: 0.9rem;
  color: #666;
}

.shortcuts-hint {
  display: flex;
  gap: 1rem;
  font-size: 0.8rem;
  color: #999;
}

.shortcut-hint {
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

.shortcut-hint kbd {
  padding: 0.2rem 0.4rem;
  background: #f5f5f5;
  border: 1px solid #d9d9d9;
  border-radius: 3px;
  font-family: monospace;
  font-size: 0.75rem;
  color: #666;
}

.main {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.sidebar {
  width: 300px;
  background: #fafafa;
  border-right: 1px solid #e8e8e8;
  display: flex;
  flex-direction: column;
}

.sidebar.right {
  border-right: none;
  border-left: 1px solid #e8e8e8;
}

.panel-header {
  padding: 1rem;
  border-bottom: 1px solid #e8e8e8;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.panel-header h2 {
  margin: 0;
  font-size: 1.1rem;
}

.tree-content,
.nutrients-list {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
}

.content {
  flex: 1;
  padding: 2rem;
  overflow-y: auto;
}

.btn-primary {
  padding: 0.4rem 0.8rem;
  background: #1890ff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-primary:hover {
  background: #40a9ff;
}

.node-item {
  padding: 0.5rem;
  margin-bottom: 0.5rem;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.node-item:hover {
  background: #f0f0f0;
}

.node-item.active {
  background: #e6f7ff;
  border: 1px solid #1890ff;
}

.node-icon {
  font-size: 1.2rem;
}

.node-title {
  flex: 1;
  font-weight: 500;
}

.node-meta {
  color: #999;
  font-size: 0.85rem;
}

.nutrient-item {
  padding: 1rem;
  margin-bottom: 1rem;
  background: white;
  border-radius: 4px;
  border: 1px solid #e8e8e8;
}

.nutrient-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.nutrient-type {
  font-size: 0.85rem;
  color: #666;
}

.nutrient-status {
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
  font-size: 0.8rem;
}

.nutrient-status.pending {
  background: #f0f0f0;
}

.nutrient-status.processing {
  background: #fff7e6;
  color: #fa8c16;
}

.nutrient-status.completed {
  background: #f6ffed;
  color: #52c41a;
}

.nutrient-status.failed {
  background: #fff1f0;
  color: #ff4d4f;
}

.nutrient-title {
  margin: 0.5rem 0;
  font-size: 1rem;
}

.nutrient-summary {
  margin: 0.5rem 0;
  color: #666;
  font-size: 0.9rem;
  line-height: 1.5;
}

.tag {
  display: inline-block;
  padding: 0.2rem 0.5rem;
  margin: 0.2rem;
  background: #f0f0f0;
  border-radius: 4px;
  font-size: 0.85rem;
}

.tag-small {
  font-size: 0.8rem;
}

.empty {
  text-align: center;
  color: #999;
  padding: 2rem;
}

.placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #999;
  text-align: center;
}

.placeholder p {
  margin: 0.5rem 0;
  font-size: 1rem;
}

.placeholder p:first-child {
  font-size: 1.2rem;
  font-weight: 500;
}
</style>
