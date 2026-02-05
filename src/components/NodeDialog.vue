<template>
  <teleport to="body">
    <div v-if="localVisible" class="dialog-overlay" @click="handleClose">
      <div class="dialog-container" @click.stop>
        <div class="dialog-header">
          <h2>{{ title }}</h2>
          <button @click="handleClose" class="close-btn">×</button>
        </div>

        <div class="dialog-body">
          <NodeForm
            :node="node"
            @submit="handleSubmit"
            @cancel="handleClose"
          />
        </div>
      </div>
    </div>
  </teleport>
</template>

<script setup lang="ts">
  import { watch, ref } from 'vue'
  import NodeForm from './NodeForm.vue'
  import { NodeType } from '../types'

  interface Props {
    visible: boolean
    node?: any
    title?: string
  }

  interface Emits {
    (event: 'update:visible', value: boolean): void
    (event: 'submit', data: any): void
  }

  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()

  const localVisible = ref(props.visible)

  watch(() => props.visible, (val) => {
    localVisible.value = val
  })

  watch(localVisible, (val) => {
    emit('update:visible', val)
  })

  function handleClose() {
    localVisible.value = false
  }

  function handleSubmit(data: any) {
    emit('submit', data)
    handleClose()
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
    color: #333;
  }

  .close-btn {
    background: none;
    border: none;
    font-size: 1.5rem;
    color: #999;
    cursor: pointer;
    padding: 0;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    transition: all 0.2s;
  }

  .close-btn:hover {
    background: #f5f5f5;
    color: #333;
  }

  .dialog-body {
    padding: 0;
  }
</style>
