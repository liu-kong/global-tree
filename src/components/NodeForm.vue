<template>
  <form @submit.prevent="handleSubmit" class="node-form">
    <!-- 标题 -->
    <div class="form-group">
      <label>标题 <span class="required">*</span></label>
      <input
        v-model="formData.title"
        type="text"
        class="form-input"
        placeholder="输入节点标题"
        required
        maxlength="100"
        autofocus
      />
    </div>

    <!-- 类型（仅创建时显示） -->
    <div class="form-group" v-if="isCreate">
      <label>类型 <span class="required">*</span></label>
      <select v-model="formData.type" class="form-select">
        <option value="branch">分支（子领域）</option>
        <option value="leaf">叶子（知识点）</option>
      </select>
    </div>

    <!-- 高级选项（折叠） -->
    <div class="form-group">
      <button
        type="button"
        class="toggle-advanced"
        @click="showAdvanced = !showAdvanced"
      >
        <span class="toggle-icon">{{ showAdvanced ? '▼' : '▶' }}</span>
        高级选项
      </button>

      <div v-show="showAdvanced" class="advanced-options">
        <!-- 描述 -->
        <div class="sub-group">
          <label>描述</label>
          <textarea
            v-model="formData.description"
            class="form-textarea"
            placeholder="输入节点描述（可选）"
            rows="3"
            maxlength="500"
          ></textarea>
          <div class="char-count">{{ formData.description.length }}/500</div>
        </div>

        <!-- 标签 -->
        <div class="sub-group">
          <label>标签</label>
          <div class="tags-input">
            <span
              v-for="tag in formData.tags"
              :key="tag"
              class="tag"
            >
              {{ tag }}
              <button type="button" @click="removeTag(tag)" class="tag-remove">×</button>
            </span>
            <input
              v-model="tagInput"
              type="text"
              class="tag-input"
              placeholder="输入标签后按回车"
              @keydown.enter.prevent="addTag"
            />
          </div>
        </div>

        <!-- 重要性和进度 -->
        <div class="sub-group-row">
          <div class="sub-group half">
            <label>重要性</label>
            <div class="importance-selector">
              <button
                v-for="i in 5"
                :key="i"
                type="button"
                class="importance-btn"
                :class="{ active: formData.importance === i }"
                @click="formData.importance = i"
              >
                <AppIcon
                  v-for="j in i"
                  :key="j"
                  name="star"
                  :size="16"
                  :class="{ filled: j <= formData.importance }"
                  class="star-icon"
                />
              </button>
            </div>
          </div>

          <div class="sub-group half">
            <label>进度: {{ formData.progress }}%</label>
            <input
              v-model.number="formData.progress"
              type="range"
              min="0"
              max="100"
              class="form-slider"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- 按钮 -->
    <div class="form-actions">
      <button type="button" @click="handleCancel" class="btn-secondary">
        取消
      </button>
      <button type="submit" class="btn-primary" :disabled="!formData.title.trim()">
        {{ submitText }}
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed } from 'vue'
import { NodeType } from '../types'
import AppIcon from './AppIcon.vue'

interface Props {
  node?: {
    id: string
    title: string
    description?: string
    type: NodeType
    metadata: {
      tags: string[]
      importance: number
      progress: number
      status: string
    }
  }
  }

interface Emits {
  (event: 'submit', data: any): void
  (event: 'cancel'): void
}

const props = withDefaults(defineProps<Props>(), {
  node: undefined
})

const emit = defineEmits<Emits>()

// 高级选项展开状态
const showAdvanced = ref(false)

const isCreate = computed(() => !props.node)

const submitText = computed(() => isCreate.value ? '创建节点' : '保存修改')

const formData = reactive({
  title: props.node?.title || '',
  description: props.node?.description || '',
  type: props.node?.type || NodeType.BRANCH,
  tags: props.node?.metadata.tags ? [...props.node.metadata.tags] : [],
  importance: props.node?.metadata.importance || 3,
  progress: props.node?.metadata.progress || 0
})

const tagInput = ref('')

// 监听节点变化，更新表单
watch(() => props.node, (node) => {
  if (node) {
    formData.title = node.title
    formData.description = node.description || ''
    formData.type = node.type
    formData.tags = [...node.metadata.tags]
    formData.importance = node.metadata.importance
    formData.progress = node.metadata.progress
  }
}, { deep: true })

function addTag() {
  const tag = tagInput.value.trim()
  if (tag && !formData.tags.includes(tag)) {
    formData.tags.push(tag)
    tagInput.value = ''
  }
}

function removeTag(tag: string) {
  const index = formData.tags.indexOf(tag)
  if (index > -1) {
    formData.tags.splice(index, 1)
  }
}

function handleSubmit() {
  // 将字符串类型转换为 NodeType 枚举
  const nodeType = formData.type === 'branch' ? NodeType.BRANCH : NodeType.LEAF

  emit('submit', {
    parentId: null,
    ...formData,
    type: nodeType, // 使用枚举值而不是字符串
    metadata: {
      tags: formData.tags,
      importance: formData.importance,
      progress: formData.progress,
      status: 'active'
    }
  })
}

function handleCancel() {
  emit('cancel')
}
</script>

<style scoped>
.node-form {
  padding: 1rem;
}

.form-group {
  margin-bottom: 1.2rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #333;
}

.toggle-advanced {
  width: 100%;
  padding: 0.5rem 1rem;
  background: #f5f5f5;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  color: #666;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
}

.toggle-advanced:hover {
  background: #e6e6e6;
  border-color: #bbb;
}

.toggle-icon {
  font-size: 0.7rem;
  transition: transform 0.2s;
}

.advanced-options {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e8e8e8;
}

.sub-group {
  margin-bottom: 1rem;
}

.sub-group:last-child {
  margin-bottom: 0;
}

.sub-group.half {
  flex: 1;
}

.sub-group-row {
  display: flex;
  gap: 1rem;
}

.sub-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.85rem;
  font-weight: 500;
  color: #666;
}

.required {
  color: #ff4d4f;
  margin-left: 2px;
}

.form-input,
.form-select,
.form-textarea {
  width: 100%;
  padding: 0.6rem 0.8rem;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 0.9rem;
  font-family: inherit;
  transition: border-color 0.2s;
}

.form-input:focus,
.form-select:focus,
.form-textarea:focus {
  outline: none;
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.1);
}

.form-input:invalid {
  border-color: #ff4d4f;
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
  font-family: inherit;
}

.char-count {
  text-align: right;
  font-size: 0.8rem;
  color: #999;
  margin-top: 0.25rem;
}

.tags-input {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding: 0.5rem;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  background: white;
  min-height: 42px;
}

.tag {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.3rem 0.6rem;
  background: #f0f0f0;
  border-radius: 4px;
  font-size: 0.85rem;
}

.tag-remove {
  background: none;
  border: none;
  color: #999;
  cursor: pointer;
  font-size: 1.1rem;
  line-height: 1;
  padding: 0;
}

.tag-remove:hover {
  color: #ff4d4f;
}

.tag-input {
  flex: 1;
  min-width: 100px;
  border: none;
  outline: none;
  font-size: 0.9rem;
}

.importance-selector {
  display: flex;
  gap: 0.5rem;
}

.importance-btn {
  flex: 1;
  padding: 0.6rem;
  background: #f5f5f5;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
}

.importance-btn:hover {
  background: #e6f7ff;
  border-color: #1890ff;
}

.importance-btn.active {
  background: #1890ff;
  color: white;
  border-color: #1890ff;
}

.importance-btn .star-icon {
  color: #d9d9d9;
}

.importance-btn.active .star-icon {
  color: #faad14;
}

.form-slider {
  width: 100%;
  cursor: pointer;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
}

.btn-secondary,
.btn-primary {
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
  border-color: #bbb;
}

.btn-primary {
  background: #1890ff;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #40a9ff;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
