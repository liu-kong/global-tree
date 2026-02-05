<template>
  <teleport to="body">
    <div v-if="visible" class="dialog-overlay" @click="handleCancel">
      <div class="dialog-container danger" @click.stop>
        <div class="dialog-header">
          <AppIcon name="warning" :size="24" class="warning-icon-header" />
          <h2>确认删除</h2>
        </div>

        <div class="dialog-body">
          <p class="warning-text">
            确定要删除节点 <strong>"{{ node?.title }}"</strong> 吗？
          </p>

          <div v-if="hasChildren" class="warning-box">
            <AppIcon name="warning" :size="32" class="warning-icon" />
            <div class="warning-content">
              <p><strong>该节点包含 {{ childCount }} 个子节点</strong></p>
              <p>删除后，所有子节点也将被删除，此操作不可恢复。</p>
            </div>
          </div>

          <div class="info-box">
            <p><strong>节点信息：</strong></p>
            <ul>
              <li>ID: {{ node?.id }}</li>
              <li>类型: {{ getTypeLabel(node?.type) }}</li>
              <li>关联养料: {{ nutrientCount }} 个</li>
            </ul>
          </div>

          <div class="dialog-actions">
            <button @click="handleCancel" class="btn-secondary">
              取消
            </button>
            <button @click="handleConfirm" class="btn-danger">
              确认删除
            </button>
          </div>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import { NodeType } from '../types'
  import AppIcon from './AppIcon.vue'

  interface Props {
    visible: boolean
    node?: {
      id: string
      title: string
      type: NodeType
      children: any[]
      nutrients: string[]
    }
  }

  interface Emits {
    (event: 'update:visible', value: boolean): void
    (event: 'confirm'): void
    (event: 'cancel'): void
  }

  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()

  const hasChildren = computed(() => {
    return props.node?.children && props.node.children.length > 0
  })

  const childCount = computed(() => {
    return props.node?.children?.length || 0
  })

  const nutrientCount = computed(() => {
    return props.node?.nutrients?.length || 0
  })

  function getTypeLabel(type?: NodeType): string {
    const labels: Record<NodeType, string> = {
      [NodeType.ROOT]: '根节点',
      [NodeType.BRANCH]: '分支',
      [NodeType.LEAF]: '叶子节点',
      [NodeType.VIRTUAL]: '虚拟节点'
    }
    return type ? labels[type] : '未知'
  }

  function handleCancel() {
    emit('update:visible', false)
    emit('cancel')
  }

  function handleConfirm() {
    emit('confirm')
    emit('update:visible', false)
  }
</script>

<style scoped>
  .dialog-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    animation: fadeIn 0.2s;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .dialog-container {
    background: white;
    border-radius: 8px;
    width: 90%;
    max-width: 500px;
    max-height: 80vh;
    overflow-y: auto;
    animation: slideUp 0.3s;
  }

  .dialog-container.danger {
    border: 2px solid #ff4d4f;
  }

  @keyframes slideUp {
    from {
      transform: translateY(20px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  .dialog-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1.5rem;
    border-bottom: 1px solid #e8e8e8;
  }

  .dialog-header h2 {
    margin: 0;
    font-size: 1.2rem;
    color: #ff4d4f;
  }

  .warning-icon-header {
    color: #ff4d4f;
    flex-shrink: 0;
  }

  .dialog-body {
    padding: 1.5rem;
  }

  .warning-text {
    font-size: 1rem;
    color: #333;
    margin-bottom: 1rem;
  }

  .warning-text strong {
    color: #d4380d;
  }

  .warning-box {
    background: #fff7e6;
    border: 1px solid #ffd666;
    border-left: 4px solid #fa8c16;
    padding: 1rem;
    border-radius: 4px;
    margin-bottom: 1rem;
    display: flex;
    gap: 1rem;
  }

  .warning-icon {
    font-size: 1.5rem;
    flex-shrink: 0;
  }

  .warning-content {
    flex: 1;
  }

  .warning-content p {
    margin: 0 0 0.5rem 0;
  }

  .warning-content p:last-child {
    margin: 0;
  }

  .warning-content strong {
    color: #d4380d;
  }

  .info-box {
    background: #f6ffed;
    border: 1px solid #b7eb8f;
    border-left: 4px solid #52c41a;
    padding: 1rem;
    border-radius: 4px;
    margin-bottom: 1.5rem;
  }

  .info-box p {
    margin: 0 0 0.5rem 0;
  }

  .info-box ul {
    margin: 0;
    padding-left: 1.5rem;
  }

  .info-box li {
    margin: 0.25rem 0;
    color: #333;
  }

  .dialog-actions {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
  }

  .btn-secondary,
  .btn-danger {
    padding: 0.6rem 1.2rem;
    border: none;
    border-radius: 4px;
    font-size: 0.9rem;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-secondary {
    background: #fff;
    border: 1px solid #d9d9d9;
    color: #333;
  }

  .btn-secondary:hover {
    background: #f5f5f5;
  }

  .btn-danger {
    background: #ff4d4f;
    color: white;
  }

  .btn-danger:hover {
    background: #ff7875;
  }
</style>
