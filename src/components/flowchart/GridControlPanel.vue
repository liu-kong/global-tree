<template>
  <div class="grid-control-panel">
    <div class="panel-header">
      <h3>画布网格</h3>
    </div>
    
    <div class="panel-content">
      <!-- 网格显示开关 -->
      <div class="control-item">
        <label class="control-label">
          <input 
            type="checkbox" 
            v-model="gridConfig.visible"
            @change="updateGrid"
          />
          显示网格
        </label>
      </div>

      <!-- 网格类型选择 -->
      <div class="control-item" v-if="gridConfig.visible">
        <label class="control-label">网格类型</label>
        <select 
          v-model="gridConfig.type" 
          class="control-select"
          @change="updateGrid"
        >
          <option value="none">关闭网格</option>
          <option value="dot">点状网格</option>
          <option value="fixedDot">固定点状网格</option>
          <option value="mesh">线状网格</option>
          <option value="doubleMesh">双线网格</option>
        </select>
      </div>

      <!-- 网格大小 -->
      <div class="control-item" v-if="gridConfig.visible">
        <label class="control-label">
          网格大小: {{ gridConfig.size }}px
        </label>
        <input 
          type="range" 
          min="5" 
          max="50" 
          v-model="gridConfig.size"
          class="control-slider"
          @input="updateGrid"
        />
      </div>

      <!-- 主网格颜色 -->
      <div class="control-item" v-if="gridConfig.visible && (gridConfig.type === 'mesh' || gridConfig.type === 'doubleMesh') && gridConfig.args[0]">
        <label class="control-label">主网格颜色</label>
        <div class="color-picker-wrapper">
          <input 
            type="color" 
            v-model="gridConfig.args[0].color"
            class="control-color"
            @change="updateGrid"
          />
          <span class="color-value">{{ gridConfig.args[0].color }}</span>
        </div>
      </div>

      <!-- 主网格线宽 -->
      <div class="control-item" v-if="gridConfig.visible && (gridConfig.type === 'mesh' || gridConfig.type === 'doubleMesh') && gridConfig.args[0]">
        <label class="control-label">
          主网格线宽: {{ gridConfig.args[0].thickness }}px
        </label>
        <input 
          type="range" 
          min="0.5" 
          max="5" 
          step="0.5"
          v-model="gridConfig.args[0].thickness"
          class="control-slider"
          @input="updateGrid"
        />
      </div>

      <!-- 副网格配置（仅双线网格） -->
      <template v-if="gridConfig.visible && gridConfig.type === 'doubleMesh' && gridConfig.args[1]">
        <!-- 副网格颜色 -->
        <div class="control-item">
          <label class="control-label">副网格颜色</label>
          <div class="color-picker-wrapper">
            <input 
              type="color" 
              v-model="gridConfig.args[1].color"
              class="control-color"
              @change="updateGrid"
            />
            <span class="color-value">{{ gridConfig.args[1].color }}</span>
          </div>
        </div>

        <!-- 副网格线宽 -->
        <div class="control-item">
          <label class="control-label">
            副网格线宽: {{ gridConfig.args[1].thickness }}px
          </label>
          <input 
            type="range" 
            min="0.5" 
            max="5" 
            step="0.5"
            v-model="gridConfig.args[1].thickness"
            class="control-slider"
            @input="updateGrid"
          />
        </div>

        <!-- 副网格间隔倍数 -->
        <div class="control-item">
          <label class="control-label">
            副网格间隔: {{ gridConfig.args[1].factor }}倍
          </label>
          <input 
            type="range" 
            min="2" 
            max="10" 
            v-model="gridConfig.args[1].factor"
            class="control-slider"
            @input="updateGrid"
          />
        </div>
      </template>

      <!-- 预设配置 -->
      <div class="control-item" v-if="gridConfig.visible">
        <label class="control-label">预设配置</label>
        <div class="preset-buttons">
          <button 
            class="preset-btn"
            @click="applyPreset('fine')"
          >
            精细
          </button>
          <button 
            class="preset-btn"
            @click="applyPreset('normal')"
          >
            标准
          </button>
          <button 
            class="preset-btn"
            @click="applyPreset('coarse')"
          >
            粗糙
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'

// 定义事件
const emit = defineEmits<{
  gridChange: [config: any]
}>()

// 网格配置
const gridConfig = reactive({
  visible: true,
  size: 10,
  type: 'doubleMesh',
  args: [
    {
      color: '#eee',
      thickness: 1,
    },
    {
      color: '#ddd',
      thickness: 1,
      factor: 4,
    },
  ],
})

// 预设配置
const presets = {
  fine: {
    size: 5,
    type: 'doubleMesh',
    args: [
      { color: '#f0f0f0', thickness: 0.5 },
      { color: '#e0e0e0', thickness: 0.5, factor: 5 },
    ],
  },
  normal: {
    size: 10,
    type: 'doubleMesh',
    args: [
      { color: '#eee', thickness: 1 },
      { color: '#ddd', thickness: 1, factor: 4 },
    ],
  },
  coarse: {
    size: 20,
    type: 'mesh',
    args: [
      { color: '#ddd', thickness: 1 },
    ],
  },
}

// 更新网格配置
const updateGrid = () => {
  // 确保配置结构正确
  const config = { ...gridConfig }
  
  // 根据类型调整 args 结构
  if (config.type === 'dot' || config.type === 'fixedDot') {
    config.args = []
  } else if (config.type === 'mesh') {
    config.args = [config.args[0]]
  }
  // doubleMesh 保持两个 args
  
  emit('gridChange', config)
  
  // 保存到本地存储
  localStorage.setItem('flowchart-grid-config', JSON.stringify(config))
}

// 应用预设配置
const applyPreset = (presetName: keyof typeof presets) => {
  const preset = presets[presetName]
  
  gridConfig.size = preset.size
  gridConfig.type = preset.type
  
  // 更新 args
  if (preset.args.length === 1) {
    gridConfig.args[0] = { ...preset.args[0] }
    // 确保 args 有两个元素（保持结构一致）
    if (gridConfig.args.length < 2) {
      gridConfig.args[1] = {
        color: '#ddd',
        thickness: 1,
        factor: 4,
      }
    }
  } else {
    gridConfig.args[0] = { ...preset.args[0] }
    gridConfig.args[1] = { ...preset.args[1] }
  }
  
  updateGrid()
}

// 从本地存储加载配置
const loadConfig = () => {
  try {
    const saved = localStorage.getItem('flowchart-grid-config')
    if (saved) {
      const config = JSON.parse(saved)
      Object.assign(gridConfig, config)
    }
  } catch (error) {
    console.warn('Failed to load grid config:', error)
  }
}

// 初始化
loadConfig()
updateGrid()
</script>

<style scoped>
.grid-control-panel {
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

.control-select {
  padding: 4px 8px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 12px;
  background: #fff;
}

.control-select:focus {
  outline: none;
  border-color: #1890ff;
}

.control-slider {
  width: 100%;
  height: 4px;
  border-radius: 2px;
  background: #f0f0f0;
  outline: none;
  -webkit-appearance: none;
}

.control-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #1890ff;
  cursor: pointer;
  border: 2px solid #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.control-slider::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #1890ff;
  cursor: pointer;
  border: 2px solid #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.color-picker-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
}

.control-color {
  width: 32px;
  height: 24px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  cursor: pointer;
  padding: 0;
}

.control-color::-webkit-color-swatch-wrapper {
  padding: 2px;
}

.control-color::-webkit-color-swatch {
  border: none;
  border-radius: 2px;
}

.color-value {
  font-size: 12px;
  color: #999;
  font-family: monospace;
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
  .grid-control-panel {
    padding: 12px;
  }
  
  .preset-buttons {
    flex-direction: column;
  }
}
</style>
