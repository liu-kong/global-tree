<template>
  <div class="selection-control-panel">
    <div class="panel-header">
      <h3>选择控制</h3>
    </div>
    
    <div class="panel-content">
      <!-- 选择开关 -->
      <div class="control-item">
        <label class="control-label">
          <input 
            type="checkbox" 
            v-model="selectionConfig.enabled"
            @change="updateSelection"
          />
          启用选择
        </label>
      </div>

      <!-- 多选控制 -->
      <div class="control-item" v-if="selectionConfig.enabled">
        <label class="control-label">
          <input 
            type="checkbox" 
            v-model="selectionConfig.multiple"
            @change="updateSelection"
          />
          启用多选
        </label>
      </div>

      <!-- 框选控制 -->
      <div class="control-item" v-if="selectionConfig.enabled">
        <label class="control-label">
          <input 
            type="checkbox" 
            v-model="selectionConfig.rubberband"
            @change="updateSelection"
          />
          启用框选
        </label>
      </div>

      <!-- 严格框选 -->
      <div class="control-item" v-if="selectionConfig.enabled && selectionConfig.rubberband">
        <label class="control-label">
          <input 
            type="checkbox" 
            v-model="selectionConfig.strict"
            @change="updateSelection"
          />
          严格框选（完全包围）
        </label>
      </div>

      <!-- 选中节点可移动 -->
      <div class="control-item" v-if="selectionConfig.enabled">
        <label class="control-label">
          <input 
            type="checkbox" 
            v-model="selectionConfig.movable"
            @change="updateSelection"
          />
          选中节点可移动
        </label>
      </div>

      <!-- 显示选择框 -->
      <div class="control-item" v-if="selectionConfig.enabled">
        <label class="control-label">
          <input 
            type="checkbox" 
            v-model="selectionConfig.showNodeSelectionBox"
            @change="updateSelection"
          />
          显示节点选择框
        </label>
      </div>

      <div class="control-item" v-if="selectionConfig.enabled">
        <label class="control-label">
          <input 
            type="checkbox" 
            v-model="selectionConfig.showEdgeSelectionBox"
            @change="updateSelection"
          />
          显示边选择框
        </label>
      </div>

      <!-- 多选修饰键 -->
      <div class="control-item" v-if="selectionConfig.enabled && selectionConfig.multiple">
        <label class="control-label">多选修饰键</label>
        <div class="modifier-keys">
          <label class="checkbox-label">
            <input 
              type="checkbox" 
              value="ctrl"
              v-model="selectionConfig.multipleSelectionModifiers"
              @change="updateSelection"
            />
            Ctrl
          </label>
          <label class="checkbox-label">
            <input 
              type="checkbox" 
              value="meta"
              v-model="selectionConfig.multipleSelectionModifiers"
              @change="updateSelection"
            />
            Meta/Cmd
          </label>
          <label class="checkbox-label">
            <input 
              type="checkbox" 
              value="shift"
              v-model="selectionConfig.multipleSelectionModifiers"
              @change="updateSelection"
            />
            Shift
          </label>
          <label class="checkbox-label">
            <input 
              type="checkbox" 
              value="alt"
              v-model="selectionConfig.multipleSelectionModifiers"
              @change="updateSelection"
            />
            Alt
          </label>
        </div>
      </div>

      <!-- 框选修饰键 -->
      <div class="control-item" v-if="selectionConfig.enabled && selectionConfig.rubberband">
        <label class="control-label">框选修饰键</label>
        <div class="modifier-keys">
          <label class="checkbox-label">
            <input 
              type="checkbox" 
              value="ctrl"
              v-model="selectionConfig.modifiers"
              @change="updateSelection"
            />
            Ctrl
          </label>
          <label class="checkbox-label">
            <input 
              type="checkbox" 
              value="meta"
              v-model="selectionConfig.modifiers"
              @change="updateSelection"
            />
            Meta/Cmd
          </label>
          <label class="checkbox-label">
            <input 
              type="checkbox" 
              value="shift"
              v-model="selectionConfig.modifiers"
              @change="updateSelection"
            />
            Shift
          </label>
          <label class="checkbox-label">
            <input 
              type="checkbox" 
              value="alt"
              v-model="selectionConfig.modifiers"
              @change="updateSelection"
            />
            Alt
          </label>
        </div>
      </div>

      <!-- 选择过滤器 -->
      <div class="control-item" v-if="selectionConfig.enabled">
        <label class="control-label">选择过滤器</label>
        <select 
          v-model="selectionConfig.filterType" 
          class="control-select"
          @change="onFilterTypeChange"
        >
          <option value="none">无过滤</option>
          <option value="types">按节点类型</option>
          <option value="ids">按节点ID</option>
          <option value="function">自定义函数</option>
        </select>
      </div>

      <!-- 节点类型过滤 -->
      <div class="control-item" v-if="selectionConfig.enabled && selectionConfig.filterType === 'types'">
        <label class="control-label">排除节点类型</label>
        <div class="node-types">
          <label class="checkbox-label">
            <input 
              type="checkbox" 
              value="rect"
              v-model="selectionConfig.filterTypes"
              @change="updateSelection"
            />
            矩形
          </label>
          <label class="checkbox-label">
            <input 
              type="checkbox" 
              value="circle"
              v-model="selectionConfig.filterTypes"
              @change="updateSelection"
            />
            圆形
          </label>
          <label class="checkbox-label">
            <input 
              type="checkbox" 
              value="ellipse"
              v-model="selectionConfig.filterTypes"
              @change="updateSelection"
            />
            椭圆
          </label>
          <label class="checkbox-label">
            <input 
              type="checkbox" 
              value="polygon"
              v-model="selectionConfig.filterTypes"
              @change="updateSelection"
            />
            多边形
          </label>
          <label class="checkbox-label">
            <input 
              type="checkbox" 
              value="image"
              v-model="selectionConfig.filterTypes"
              @change="updateSelection"
            />
            图片
          </label>
          <label class="checkbox-label">
            <input 
              type="checkbox" 
              value="text"
              v-model="selectionConfig.filterTypes"
              @change="updateSelection"
            />
            文本
          </label>
        </div>
      </div>

      <!-- 节点ID过滤 -->
      <div class="control-item" v-if="selectionConfig.enabled && selectionConfig.filterType === 'ids'">
        <label class="control-label">排除节点ID（逗号分隔）</label>
        <input 
          type="text" 
          v-model="selectionConfig.filterIdsText"
          class="control-input"
          placeholder="node1,node2,node3"
          @input="onFilterIdsChange"
        />
      </div>

      <!-- 选择操作按钮 -->
      <div class="control-item" v-if="selectionConfig.enabled">
        <label class="control-label">选择操作</label>
        <div class="action-buttons">
          <button 
            class="action-btn"
            @click="selectAll"
          >
            全选
          </button>
          <button 
            class="action-btn"
            @click="clearSelection"
          >
            清空选择
          </button>
          <button 
            class="action-btn"
            @click="invertSelection"
          >
            反选
          </button>
        </div>
      </div>

      <!-- 选择信息显示 -->
      <div class="control-item" v-if="selectionConfig.enabled">
        <label class="control-label">选择信息</label>
        <div class="selection-info">
          <div class="info-item">
            <span class="info-label">已选中节点:</span>
            <span class="info-value">{{ selectedNodesCount }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">已选中边:</span>
            <span class="info-value">{{ selectedEdgesCount }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">总选中:</span>
            <span class="info-value">{{ selectedCellsCount }}</span>
          </div>
        </div>
      </div>

      <!-- 预设配置 -->
      <div class="control-item" v-if="selectionConfig.enabled">
        <label class="control-label">预设配置</label>
        <div class="preset-buttons">
          <button 
            class="preset-btn"
            @click="applyPreset('basic')"
          >
            基础选择
          </button>
          <button 
            class="preset-btn"
            @click="applyPreset('advanced')"
          >
            高级选择
          </button>
          <button 
            class="preset-btn"
            @click="applyPreset('readonly')"
          >
            只读模式
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, onMounted, onUnmounted } from 'vue'

// 定义props
interface Props {
  graph?: any
}

const props = defineProps<Props>()

// 定义事件
const emit = defineEmits<{
  selectionChange: [config: any]
}>()

// 选择配置 - 基于X6官方SelectionOptions
const selectionConfig = reactive({
  enabled: true,
  multiple: true,
  rubberband: false,
  strict: false,
  movable: true,
  showNodeSelectionBox: false,
  showEdgeSelectionBox: false,
  multipleSelectionModifiers: ['ctrl', 'meta'] as ('alt' | 'ctrl' | 'meta' | 'shift')[],
  modifiers: [] as ('alt' | 'ctrl' | 'meta' | 'shift')[],
  filterType: 'none',
  filterTypes: [] as string[],
  filterIds: [] as string[],
  filterIdsText: '',
  className: 'flowchart-selection',
  filter: null as any,
  content: null as any,
})

// 选择状态
const selectedNodesCount = ref(0)
const selectedEdgesCount = ref(0)
const selectedCellsCount = ref(0)

// 预设配置 - 基于X6官方API
const presets = {
  basic: {
    enabled: true,
    multiple: true,
    rubberband: false,
    strict: false,
    movable: true,
    showNodeSelectionBox: false,
    showEdgeSelectionBox: false,
    multipleSelectionModifiers: ['ctrl', 'meta'] as ('alt' | 'ctrl' | 'meta' | 'shift')[],
    modifiers: [] as ('alt' | 'ctrl' | 'meta' | 'shift')[],
    filterType: 'none',
    content: null,
  },
  advanced: {
    enabled: true,
    multiple: true,
    rubberband: true,
    strict: false,
    movable: true,
    showNodeSelectionBox: true,
    showEdgeSelectionBox: true,
    multipleSelectionModifiers: ['ctrl', 'meta'] as ('alt' | 'ctrl' | 'meta' | 'shift')[],
    modifiers: ['shift'] as ('alt' | 'ctrl' | 'meta' | 'shift')[],
    filterType: 'none',
    content: null,
  },
  readonly: {
    enabled: true,
    multiple: true,
    rubberband: true,
    strict: false,
    movable: false,
    showNodeSelectionBox: true,
    showEdgeSelectionBox: false,
    multipleSelectionModifiers: ['ctrl', 'meta'] as ('alt' | 'ctrl' | 'meta' | 'shift')[],
    modifiers: [] as ('alt' | 'ctrl' | 'meta' | 'shift')[],
    filterType: 'none',
    content: null,
  },
}

// 更新选择配置 - 基于X6官方API
const updateSelection = () => {
  const config = { ...selectionConfig }
  
  // 处理过滤器 - 基于X6官方filter类型
  if (selectionConfig.filterType === 'types' && selectionConfig.filterTypes.length > 0) {
    config.filter = selectionConfig.filterTypes
  } else if (selectionConfig.filterType === 'ids' && selectionConfig.filterIds.length > 0) {
    config.filter = selectionConfig.filterIds.map(id => ({ id }))
  } else if (selectionConfig.filterType === 'function') {
    config.filter = (cell: any) => {
      // 自定义过滤函数示例：过滤掉特定属性的节点
      return cell.getData()?.unselectable === true
    }
  } else {
    config.filter = null
  }
  
  // 处理content显示内容
  if (selectionConfig.filterType === 'function') {
    config.content = function(this: any, selection: any, contentElement: HTMLElement) {
      const selectedCells = selection.getSelectedCells()
      return `已选择 ${selectedCells.length} 个元素`
    }
  } else {
    config.content = null
  }
  
  emit('selectionChange', config)
  
  // 保存到本地存储
  localStorage.setItem('flowchart-selection-config', JSON.stringify(selectionConfig))
}

// 过滤类型改变处理
const onFilterTypeChange = () => {
  if (selectionConfig.filterType === 'none') {
    selectionConfig.filterTypes = []
    selectionConfig.filterIds = []
    selectionConfig.filterIdsText = ''
  }
  updateSelection()
}

// 过滤ID文本改变处理
const onFilterIdsChange = () => {
  const ids = selectionConfig.filterIdsText
    .split(',')
    .map(id => id.trim())
    .filter(id => id.length > 0)
  selectionConfig.filterIds = ids
  updateSelection()
}

// 更新选择信息
const updateSelectionInfo = () => {
  if (!props.graph) {
    selectedNodesCount.value = 0
    selectedEdgesCount.value = 0
    selectedCellsCount.value = 0
    return
  }
  
  const selectedCells = props.graph.getSelectedCells()
  selectedCellsCount.value = selectedCells.length
  
  const selectedNodes = selectedCells.filter((cell: any) => cell.isNode())
  selectedNodesCount.value = selectedNodes.length
  
  const selectedEdges = selectedCells.filter((cell: any) => cell.isEdge())
  selectedEdgesCount.value = selectedEdges.length
}

// 选择操作方法
const selectAll = () => {
  if (props.graph) {
    const cells = props.graph.getCells()
    props.graph.select(cells)
    updateSelectionInfo()
  }
}

const clearSelection = () => {
  if (props.graph) {
    props.graph.cleanSelection()
    updateSelectionInfo()
  }
}

const invertSelection = () => {
  if (props.graph) {
    const allCells = props.graph.getCells()
    const selectedCells = props.graph.getSelectedCells()
    const unselectedCells = allCells.filter((cell: any) => 
      !selectedCells.includes(cell)
    )
    props.graph.resetSelection(unselectedCells)
    updateSelectionInfo()
  }
}

// 应用预设配置
const applyPreset = (presetName: keyof typeof presets) => {
  const preset = presets[presetName]
  Object.assign(selectionConfig, preset)
  updateSelection()
}

// 监听选择变化事件
const setupSelectionListeners = () => {
  if (!props.graph) return
  
  // 监听选择变化
  props.graph.on('selection:changed', () => {
    updateSelectionInfo()
  })
  
  // 监听节点选中/取消选中
  props.graph.on('node:selected', () => {
    updateSelectionInfo()
  })
  
  props.graph.on('node:unselected', () => {
    updateSelectionInfo()
  })
  
  props.graph.on('edge:selected', () => {
    updateSelectionInfo()
  })
  
  props.graph.on('edge:unselected', () => {
    updateSelectionInfo()
  })
}

// 监听graph变化
watch(() => props.graph, (newGraph) => {
  if (newGraph) {
    setupSelectionListeners()
    updateSelectionInfo()
  }
}, { immediate: true })

// 从本地存储加载配置
const loadConfig = () => {
  try {
    const saved = localStorage.getItem('flowchart-selection-config')
    if (saved) {
      const config = JSON.parse(saved)
      Object.assign(selectionConfig, config)
    }
  } catch (error) {
    console.warn('Failed to load selection config:', error)
  }
}

// 初始化
onMounted(() => {
  loadConfig()
  updateSelection()
})

// 清理监听器
onUnmounted(() => {
  if (props.graph) {
    props.graph.off('selection:changed')
    props.graph.off('node:selected')
    props.graph.off('node:unselected')
    props.graph.off('edge:selected')
    props.graph.off('edge:unselected')
  }
})
</script>

<style scoped>
.selection-control-panel {
  padding: 16px;
  background: #fff;
  border-radius: 6px;
}

.panel-header {
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e8e8e8;
}

.panel-header h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #262626;
}

.panel-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.control-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.control-label {
  font-size: 12px;
  color: #666;
  display: flex;
  align-items: center;
  gap: 6px;
}

.control-label input[type="checkbox"] {
  margin: 0;
}

.control-select,
.control-input {
  padding: 4px 8px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 12px;
  background: #fff;
}

.control-select:focus,
.control-input:focus {
  outline: none;
  border-color: #1890ff;
}

.modifier-keys,
.node-types {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.checkbox-label {
  font-size: 12px;
  color: #666;
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
}

.checkbox-label input[type="checkbox"] {
  margin: 0;
}

.action-buttons {
  display: flex;
  gap: 8px;
}

.action-btn {
  flex: 1;
  padding: 6px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  background: #fff;
  font-size: 12px;
  color: #666;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover {
  border-color: #1890ff;
  color: #1890ff;
  background: #f6ffed;
}

.action-btn:active {
  transform: translateY(1px);
}

.selection-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px;
  background: #f8f9fa;
  border-radius: 4px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
}

.info-label {
  color: #666;
}

.info-value {
  font-weight: 600;
  color: #1890ff;
}

.preset-buttons {
  display: flex;
  gap: 8px;
}

.preset-btn {
  flex: 1;
  padding: 6px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  background: #fff;
  font-size: 12px;
  color: #666;
  cursor: pointer;
  transition: all 0.2s;
}

.preset-btn:hover {
  border-color: #1890ff;
  color: #1890ff;
  background: #f6ffed;
}

.preset-btn:active {
  transform: translateY(1px);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .selection-control-panel {
    padding: 12px;
  }
  
  .modifier-keys,
  .node-types {
    flex-direction: column;
  }
  
  .action-buttons,
  .preset-buttons {
    flex-direction: column;
  }
}
</style>
