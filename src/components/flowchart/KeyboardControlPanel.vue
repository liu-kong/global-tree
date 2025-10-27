<template>
  <div class="keyboard-control-panel">
    <h3 class="control-title">键盘快捷键</h3>
    
    <div class="keyboard-status">
      <a-switch
        v-model:checked="keyboardEnabled"
        size="small"
        @change="toggleKeyboard"
      />
      <span class="status-text">启用键盘快捷键</span>
    </div>

    <div class="shortcuts-list" v-if="keyboardEnabled">
      <div class="shortcut-category">
        <h4>基础操作</h4>
        <div class="shortcut-item">
          <kbd>Delete</kbd>
          <span>删除选中元素</span>
        </div>
        <div class="shortcut-item">
          <kbd>Ctrl</kbd> + <kbd>C</kbd>
          <span>复制</span>
        </div>
        <div class="shortcut-item">
          <kbd>Ctrl</kbd> + <kbd>V</kbd>
          <span>粘贴</span>
        </div>
        <div class="shortcut-item">
          <kbd>Ctrl</kbd> + <kbd>A</kbd>
          <span>全选</span>
        </div>
      </div>

      <div class="shortcut-category">
        <h4>缩放操作</h4>
        <div class="shortcut-item">
          <kbd>Ctrl</kbd> + <kbd>=</kbd>
          <span>放大</span>
        </div>
        <div class="shortcut-item">
          <kbd>Ctrl</kbd> + <kbd>-</kbd>
          <span>缩小</span>
        </div>
        <div class="shortcut-item">
          <kbd>Ctrl</kbd> + <kbd>0</kbd>
          <span>重置缩放</span>
        </div>
      </div>

      <div class="shortcut-category">
        <h4>节点移动</h4>
        <div class="shortcut-item">
          <kbd>↑</kbd>
          <span>上移 10px</span>
        </div>
        <div class="shortcut-item">
          <kbd>↓</kbd>
          <span>下移 10px</span>
        </div>
        <div class="shortcut-item">
          <kbd>←</kbd>
          <span>左移 10px</span>
        </div>
        <div class="shortcut-item">
          <kbd>→</kbd>
          <span>右移 10px</span>
        </div>
      </div>

      <div class="shortcut-category">
        <h4>历史操作</h4>
        <div class="shortcut-item">
          <kbd>Ctrl</kbd> + <kbd>Z</kbd>
          <span>撤销（需要历史插件）</span>
        </div>
        <div class="shortcut-item">
          <kbd>Ctrl</kbd> + <kbd>Y</kbd>
          <span>重做（需要历史插件）</span>
        </div>
      </div>
    </div>

    <div class="keyboard-info" v-if="keyboardEnabled">
      <a-alert
        message="提示"
        description="键盘快捷键需要在画布获得焦点时才能正常工作。点击画布区域即可获得焦点。"
        type="info"
        show-icon
        size="small"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { message } from 'ant-design-vue'

// 定义props
interface Props {
  graph?: any
}

const props = withDefaults(defineProps<Props>(), {})

// 响应式数据
const keyboardEnabled = ref(true)

// 切换键盘快捷键
const toggleKeyboard = (enabled: boolean) => {
  if (!props.graph) {
    message.warning('画布未初始化')
    return
  }

  try {
    const keyboard = props.graph.getPlugin('keyboard')
    
    if (keyboard) {
      if (enabled) {
        keyboard.enable()
        message.success('键盘快捷键已启用')
      } else {
        keyboard.disable()
        message.info('键盘快捷键已禁用')
      }
    } else {
      message.warning('键盘插件未找到')
    }
  } catch (error) {
    console.error('Toggle keyboard error:', error)
    message.error('切换键盘快捷键失败')
  }
}

// 获取键盘状态
const getKeyboardStatus = () => {
  if (!props.graph) return

  try {
    const keyboard = props.graph.getPlugin('keyboard')
    if (keyboard) {
      keyboardEnabled.value = keyboard.isEnabled?.() ?? true
    }
  } catch (error) {
    console.error('Get keyboard status error:', error)
  }
}

// 组件挂载时获取状态
onMounted(() => {
  getKeyboardStatus()
})
</script>

<style scoped>
.keyboard-control-panel {
  padding: 16px;
  background: #fff;
  border-radius: 6px;
}

.control-title {
  margin: 0 0 16px 0;
  font-size: 14px;
  font-weight: 600;
  color: #262626;
}

.keyboard-status {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  padding: 8px 12px;
  background: #f5f5f5;
  border-radius: 4px;
}

.status-text {
  font-size: 12px;
  color: #666;
}

.shortcuts-list {
  max-height: 400px;
  overflow-y: auto;
}

.shortcut-category {
  margin-bottom: 20px;
}

.shortcut-category h4 {
  margin: 0 0 8px 0;
  font-size: 12px;
  font-weight: 600;
  color: #262626;
  border-bottom: 1px solid #e8e8e8;
  padding-bottom: 4px;
}

.shortcut-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
  padding: 4px 0;
  font-size: 12px;
}

.shortcut-item span {
  color: #666;
  flex: 1;
  margin-left: 12px;
}

kbd {
  display: inline-block;
  padding: 2px 6px;
  font-size: 11px;
  line-height: 1;
  color: #555;
  background-color: #f7f7f7;
  border: 1px solid #ccc;
  border-radius: 3px;
  box-shadow: 0 1px 0 rgba(0, 0, 0, 0.2), inset 0 0 0 2px #fff;
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace;
}

.keyboard-info {
  margin-top: 16px;
}

/* 滚动条样式 */
.shortcuts-list::-webkit-scrollbar {
  width: 4px;
}

.shortcuts-list::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 2px;
}

.shortcuts-list::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 2px;
}

.shortcuts-list::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>
