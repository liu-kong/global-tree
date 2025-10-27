<template>
  <!-- 历史记录控制面板默认隐藏，但功能保持启用 -->
  <!-- 可以通过 v-show="showHistoryPanel" 来控制显示，默认为 false -->
  <div class="history-control-panel" v-show="false">
    <div class="panel-section">
      <h3 class="section-title">历史记录</h3>
      
      <!-- 历史记录开关 -->
      <div class="control-item">
        <label class="control-label">
          <span>启用历史记录</span>
          <a-switch 
            v-model:checked="historyEnabled" 
            @change="toggleHistory"
            size="small"
          />
        </label>
        <div class="control-description">
          启用后可以撤销和重做操作
        </div>
      </div>

      <!-- 历史记录状态 -->
      <div class="history-status" v-if="historyEnabled">
        <div class="status-item">
          <span class="status-label">可撤销:</span>
          <span class="status-value" :class="{ disabled: !canUndo }">
            {{ canUndo ? '是' : '否' }}
          </span>
        </div>
        <div class="status-item">
          <span class="status-label">可重做:</span>
          <span class="status-value" :class="{ disabled: !canRedo }">
            {{ canRedo ? '是' : '否' }}
          </span>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="action-buttons" v-if="historyEnabled">
        <a-button 
          @click="undo"
          :disabled="!canUndo"
          size="small"
          class="action-button"
        >
          <template #icon>
            <UndoOutlined />
          </template>
          撤销
        </a-button>
        
        <a-button 
          @click="redo"
          :disabled="!canRedo"
          size="small"
          class="action-button"
        >
          <template #icon>
            <RedoOutlined />
          </template>
          重做
        </a-button>
        
        <a-button 
          @click="cleanHistory"
          size="small"
          class="action-button danger"
        >
          <template #icon>
            <ClearOutlined />
          </template>
          清空
        </a-button>
      </div>

      <!-- 快捷键提示 -->
      <div class="shortcuts-hint">
        <div class="hint-title">快捷键</div>
        <div class="shortcut-item">
          <kbd>Ctrl</kbd> + <kbd>Z</kbd>
          <span>撤销</span>
        </div>
        <div class="shortcut-item">
          <kbd>Ctrl</kbd> + <kbd>Y</kbd>
          <span>重做</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { message } from 'ant-design-vue'
import { 
  UndoOutlined, 
  RedoOutlined, 
  ClearOutlined 
} from '@ant-design/icons-vue'

// 定义props
interface Props {
  graph?: any
}

const props = defineProps<Props>()

// 响应式数据
const historyEnabled = ref(true) // 默认启用历史记录
const canUndo = ref(false)
const canRedo = ref(false)

// 获取历史记录状态
const getHistoryStatus = () => {
  if (!props.graph) return

  try {
    const history = props.graph.getPlugin('history')
    if (history) {
      historyEnabled.value = history.isEnabled?.() ?? true
      canUndo.value = history.canUndo?.() ?? false
      canRedo.value = history.canRedo?.() ?? false
    }
  } catch (error) {
    console.error('Get history status error:', error)
  }
}

// 切换历史记录
const toggleHistory = (enabled: boolean) => {
  if (!props.graph) {
    message.warning('画布未初始化')
    return
  }

  try {
    const history = props.graph.getPlugin('history')
    
    if (history) {
      if (enabled) {
        history.enable()
        message.success('历史记录已启用')
      } else {
        history.disable()
        message.info('历史记录已禁用')
      }
      
      // 更新状态
      getHistoryStatus()
    } else {
      message.warning('历史记录插件未找到')
    }
  } catch (error) {
    console.error('Toggle history error:', error)
    message.error('切换历史记录失败')
  }
}

// 撤销
const undo = () => {
  if (!props.graph) {
    message.warning('画布未初始化')
    return
  }

  try {
    const history = props.graph.getPlugin('history')
    
    if (history && history.canUndo()) {
      history.undo()
      getHistoryStatus()
      console.log('Undo performed')
    } else {
      message.info('没有可撤销的操作')
    }
  } catch (error) {
    console.error('Undo error:', error)
    message.error('撤销失败')
  }
}

// 重做
const redo = () => {
  if (!props.graph) {
    message.warning('画布未初始化')
    return
  }

  try {
    const history = props.graph.getPlugin('history')
    
    if (history && history.canRedo()) {
      history.redo()
      getHistoryStatus()
      console.log('Redo performed')
    } else {
      message.info('没有可重做的操作')
    }
  } catch (error) {
    console.error('Redo error:', error)
    message.error('重做失败')
  }
}

// 清空历史记录
const cleanHistory = () => {
  if (!props.graph) {
    message.warning('画布未初始化')
    return
  }

  try {
    const history = props.graph.getPlugin('history')
    
    if (history) {
      history.cleanHistory()
      getHistoryStatus()
      message.success('历史记录已清空')
      console.log('History cleaned')
    } else {
      message.warning('历史记录插件未找到')
    }
  } catch (error) {
    console.error('Clean history error:', error)
    message.error('清空历史记录失败')
  }
}

// 监听graph变化
watch(() => props.graph, () => {
  getHistoryStatus()
}, { immediate: true })

// 监听历史记录事件
const setupHistoryListeners = () => {
  if (!props.graph) return

  try {
    const history = props.graph.getPlugin('history')
    if (history) {
      // 监听历史记录变化
      history.on?.('change', () => {
        getHistoryStatus()
      })
    }
  } catch (error) {
    console.error('Setup history listeners error:', error)
  }
}

// 初始化
onMounted(() => {
  getHistoryStatus()
  setupHistoryListeners()
})
</script>

<style scoped>
.history-control-panel {
  padding: 16px;
  background: #fafafa;
  border-radius: 6px;
}

.panel-section {
  margin-bottom: 16px;
}

.section-title {
  margin: 0 0 16px 0;
  font-size: 14px;
  font-weight: 600;
  color: #262626;
}

.control-item {
  margin-bottom: 16px;
}

.control-label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  color: #595959;
  margin-bottom: 4px;
}

.control-description {
  font-size: 11px;
  color: #8c8c8c;
  line-height: 1.4;
}

.history-status {
  background: #fff;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  padding: 12px;
  margin-bottom: 16px;
}

.status-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.status-item:last-child {
  margin-bottom: 0;
}

.status-label {
  font-size: 12px;
  color: #595959;
}

.status-value {
  font-size: 12px;
  font-weight: 500;
  color: #52c41a;
}

.status-value.disabled {
  color: #d9d9d9;
}

.action-buttons {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.action-button {
  flex: 1;
  min-width: 80px;
}

.action-button.danger {
  border-color: #ff4d4f;
  color: #ff4d4f;
}

.action-button.danger:hover {
  border-color: #ff4d4f;
  color: #ff4d4f;
  background: #fff2f0;
}

.shortcuts-hint {
  background: #f6f8fa;
  border: 1px solid #e1e4e8;
  border-radius: 4px;
  padding: 12px;
}

.hint-title {
  font-size: 12px;
  font-weight: 600;
  color: #24292e;
  margin-bottom: 8px;
}

.shortcut-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
  font-size: 11px;
  color: #586069;
}

.shortcut-item:last-child {
  margin-bottom: 0;
}

kbd {
  background: #fafbfc;
  border: 1px solid #d1d5da;
  border-bottom-color: #c6cbd1;
  border-radius: 3px;
  box-shadow: inset 0 -1px 0 #c6cbd1;
  color: #444d56;
  display: inline-block;
  font-size: 10px;
  line-height: 10px;
  padding: 3px 5px;
  vertical-align: middle;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .action-buttons {
    flex-direction: column;
  }
  
  .action-button {
    width: 100%;
  }
}
</style>
