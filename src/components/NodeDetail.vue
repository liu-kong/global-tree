<template>
  <div class="node-detail">
    <!-- 头部 -->
    <div class="detail-header">
      <div class="node-icon">
        <AppIcon :name="getNodeIconName(node.type)" :size="48" />
      </div>
      <div class="node-info">
        <h2>{{ node.title }}</h2>
        <div class="node-meta">
          <span class="type-badge">{{ getTypeLabel(node.type) }}</span>
          <span class="date">{{ formatDate(node.createdAt) }}</span>
        </div>
      </div>
      <div v-if="!readonly" class="header-actions">
        <button @click="handleEdit" class="btn-icon" title="编辑">
          <AppIcon name="edit" :size="18" />
        </button>
        <button @click="handleDelete" class="btn-icon danger" title="删除">
          <AppIcon name="delete" :size="18" />
        </button>
      </div>
    </div>

    <!-- 描述 -->
    <div v-if="node.description" class="detail-section">
      <h3 class="section-title">
        <AppIcon name="description" :size="18" />
        描述
      </h3>
      <p>{{ node.description }}</p>
    </div>

    <!-- 元数据 -->
    <div class="detail-section">
      <h3 class="section-title">
        <AppIcon name="metadata" :size="18" />
        元数据
      </h3>
      <div class="metadata-grid">
        <div class="metadata-item">
          <span class="label">重要性:</span>
          <span class="value importance">
            <AppIcon
              v-for="i in node.metadata.importance"
              :key="i"
              name="star"
              :size="16"
              :class="{ filled: i <= node.metadata.importance }"
              class="star-icon"
            />
          </span>
        </div>
        <div class="metadata-item">
          <span class="label">进度:</span>
          <span class="value">
            <progress :value="node.metadata.progress" max="100" class="progress-bar" />
            {{ node.metadata.progress }}%
          </span>
        </div>
        <div class="metadata-item">
          <span class="label">状态:</span>
          <span class="value status" :class="node.metadata.status">
            {{ getStatusLabel(node.metadata.status) }}
          </span>
        </div>
      </div>
    </div>

    <!-- 标签 -->
    <div v-if="node.metadata.tags.length > 0" class="detail-section">
      <h3 class="section-title">
        <AppIcon name="tags" :size="18" />
        标签
      </h3>
      <div class="tags-list">
        <span v-for="tag in node.metadata.tags" :key="tag" class="tag">
          {{ tag }}
        </span>
      </div>
    </div>

    <!-- 连接 -->
    <div v-if="node.connections.length > 0" class="detail-section">
      <h3 class="section-title">
        <AppIcon name="link" :size="18" />
        关联
      </h3>
      <div class="connections-list">
        <div
          v-for="conn in node.connections"
          :key="conn.id"
          class="connection-item"
        >
          <span class="connection-type">{{ getConnectionLabel(conn.type) }}</span>
          <span class="connection-target">→ {{ getTargetTitle(conn.targetId) }}</span>
          <span class="connection-strength">
            强度: {{ Math.round(conn.strength * 100) }}%
          </span>
        </div>
      </div>
    </div>

    <!-- 关联的养料 -->
    <div class="detail-section">
      <h3 class="section-title">
        <AppIcon name="library" :size="18" />
        关联养料 ({{ nutrients.length }})
      </h3>
      <div v-if="nutrients.length === 0" class="empty-state">
        <p>暂无关联的养料</p>
      </div>
      <div v-else class="nutrients-list">
        <div
          v-for="nutrient in nutrients.slice(0, 5)"
          :key="nutrient.id"
          class="nutrient-item"
        >
          <span class="nutrient-type">
            <AppIcon :name="getNutrientIconName(nutrient.type)" :size="16" />
          </span>
          <span class="nutrient-title">{{ nutrient.parsed?.title || '未处理' }}</span>
          <span class="nutrient-status" :class="nutrient.status">
            {{ getStatusLabel(nutrient.status) }}
          </span>
        </div>
        <div v-if="nutrients.length > 5" class="show-more">
          还有 {{ nutrients.length - 5 }} 条养料...
        </div>
      </div>
    </div>

    <!-- 子节点 -->
    <div v-if="node.children.length > 0" class="detail-section">
      <h3 class="section-title">
        <AppIcon name="tree-branch" :size="18" />
        子节点 ({{ node.children.length }})
      </h3>
      <div class="children-list">
        <div
          v-for="child in node.children"
          :key="child.id"
          class="child-item"
          @click="$emit('select-node', child.id)"
        >
          <span class="child-icon">
            <AppIcon :name="getNodeIconName(child.type)" :size="18" />
          </span>
          <span class="child-title">{{ child.title }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import type { TreeNode, Nutrient } from '../types'
  import { NodeType, ConnectionType, NutrientType, NutrientStatus } from '../types'
  import { formatDate } from '../utils'
  import AppIcon from './AppIcon.vue'

  interface Props {
    node: TreeNode
    nutrients?: Nutrient[]
    allNodes?: TreeNode[]
    readonly?: boolean
  }

  interface Emits {
    (event: 'edit'): void
    (event: 'delete'): void
    (event: 'select-node', nodeId: string): void
  }

  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()

  function getNodeIconName(type: NodeType): string {
    const icons = {
      [NodeType.ROOT]: 'tree-root',
      [NodeType.BRANCH]: 'tree-branch',
      [NodeType.LEAF]: 'tree-leaf',
      [NodeType.VIRTUAL]: 'tree-virtual'
    }
    return icons[type] || 'tree-virtual'
  }

  function getNutrientIconName(type: NutrientType): string {
    const icons = {
      [NutrientType.WEB_LINK]: 'nutrient-web',
      [NutrientType.MARKDOWN]: 'nutrient-markdown',
      [NutrientType.PDF]: 'nutrient-pdf',
      [NutrientType.IMAGE]: 'nutrient-image',
      [NutrientType.NOTE]: 'nutrient-note'
    }
    return icons[type] || 'nutrient-note'
  }

  function getTypeLabel(type: NodeType): string {
    const labels = {
      [NodeType.ROOT]: '根节点',
      [NodeType.BRANCH]: '分支',
      [NodeType.LEAF]: '叶子节点',
      [NodeType.VIRTUAL]: '虚拟节点'
    }
    return labels[type] || '未知'
  }

  function getStatusLabel(status: string): string {
    const labels = {
      active: '进行中',
      archived: '已归档',
      deleted: '已删除'
    }
    return labels[status] || status
  }

  function getConnectionLabel(type: ConnectionType): string {
    const labels = {
      [ConnectionType.REFERENCE]: '引用',
      [ConnectionType.PREREQUISITE]: '前置知识',
      [ConnectionType.RELATED]: '相关',
      [ConnectionType.FUSION]: '融合产生'
    }
    return labels[type] || type
  }

  function getTargetTitle(targetId: string): string {
    const target = props.allNodes?.find(n => n.id === targetId)
    return target?.title || targetId
  }

  function handleEdit() {
    emit('edit')
  }

  function handleDelete() {
    emit('delete')
  }
</script>

<style scoped>
  .node-detail {
    padding: 1.5rem;
  }

  .detail-header {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    margin-bottom: 2rem;
    padding-bottom: 1.5rem;
    border-bottom: 1px solid #e8e8e8;
  }

  .node-icon {
    flex-shrink: 0;
    color: #1890ff;
  }

  .section-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin: 0 0 1rem 0;
    font-size: 1rem;
    color: #333;
  }

  .section-title svg {
    color: #1890ff;
  }

  .star-icon {
    color: #d9d9d9;
  }

  .star-icon.filled {
    color: #faad14;
  }

  .node-info {
    flex: 1;
  }

  .node-info h2 {
    margin: 0 0 0.5rem 0;
    font-size: 1.5rem;
    color: #333;
  }

  .node-meta {
    display: flex;
    gap: 1rem;
    font-size: 0.85rem;
    color: #999;
  }

  .type-badge {
    padding: 0.2rem 0.5rem;
    background: #f0f0f0;
    border-radius: 4px;
  }

  .date {
    color: #999;
  }

  .header-actions {
    display: flex;
    gap: 0.5rem;
  }

  .btn-icon {
    padding: 0.4rem 0.6rem;
    background: #f5f5f5;
    border: 1px solid #d9d9d9;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1.2rem;
    transition: all 0.2s;
  }

  .btn-icon:hover {
    background: #e6e6e6;
  }

  .btn-icon.danger:hover {
    background: #fff1f0;
    color: #ff4d4f;
  }

  .detail-section {
    margin-bottom: 2rem;
  }

  .detail-section h3 {
    margin: 0 0 1rem 0;
    font-size: 1rem;
    color: #333;
  }

  .metadata-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
  }

  .metadata-item {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
  }

  .metadata-item .label {
    font-size: 0.85rem;
    color: #666;
  }

  .metadata-item .value.importance {
    color: #faad14;
  }

  .metadata-item .value.progress {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .progress-bar {
    flex: 1;
    height: 8px;
    border-radius: 4px;
    overflow: hidden;
    background: #f0f0f0;
  }

  .progress-bar::-webkit-progress-bar {
    background: #52c41a;
  }

  .metadata-item .value.status {
    padding: 0.2rem 0.5rem;
    border-radius: 4px;
    font-size: 0.85rem;
  }

  .metadata-item .value.status.active {
    background: #f6ffed;
    color: #52c41a;
  }

  .tags-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .tag {
    padding: 0.3rem 0.6rem;
    background: #f0f0f0;
    border-radius: 4px;
    font-size: 0.85rem;
  }

  .connections-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .connection-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem;
    background: #fafafa;
    border-radius: 4px;
    font-size: 0.85rem;
  }

  .connection-type {
    padding: 0.2rem 0.4rem;
    background: #e6f7ff;
    color: #1890ff;
    border-radius: 3px;
  }

  .connection-target {
    flex: 1;
  }

  .connection-strength {
    color: #999;
    font-size: 0.8rem;
  }

  .nutrients-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .nutrient-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem;
    background: white;
    border: 1px solid #e8e8e8;
    border-radius: 4px;
    font-size: 0.85rem;
  }

  .nutrient-type {
    padding: 0.2rem 0.4rem;
    background: #f0f0f0;
    border-radius: 3px;
    font-size: 0.75rem;
  }

  .nutrient-title {
    flex: 1;
    font-weight: 500;
  }

  .nutrient-status {
    padding: 0.2rem 0.4rem;
    border-radius: 3px;
    font-size: 0.75rem;
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

  .show-more {
    padding: 0.5rem;
    text-align: center;
    color: #999;
    font-size: 0.85rem;
  }

  .children-list {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
  }

  .child-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem;
    background: #fafafa;
    border-radius: 4px;
    cursor: pointer;
    transition: background 0.2s;
  }

  .child-item:hover {
    background: #e6f7ff;
  }

  .child-icon {
    font-size: 1.2rem;
  }

  .child-title {
    font-weight: 500;
  }

  .empty-state {
    padding: 2rem;
    text-align: center;
    color: #999;
    background: #fafafa;
    border-radius: 4px;
  }
</style>
