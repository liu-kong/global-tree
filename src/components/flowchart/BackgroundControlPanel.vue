<template>
  <div class="background-control-panel">
    <div class="panel-header">
      <h3>画布背景</h3>
    </div>
    
    <div class="panel-content">
      <!-- 背景开关 -->
      <div class="control-item">
        <label class="control-label">
          <input 
            type="checkbox" 
            v-model="backgroundConfig.enabled"
            @change="updateBackground"
          />
          启用背景
        </label>
      </div>

      <!-- 背景类型选择 -->
      <div class="control-item" v-if="backgroundConfig.enabled">
        <label class="control-label">背景类型</label>
        <select 
          v-model="backgroundConfig.type" 
          class="control-select"
          @change="onTypeChange"
        >
          <option value="color">纯色背景</option>
          <option value="image">图片背景</option>
          <option value="gradient">渐变背景</option>
          <option value="watermark">水印背景</option>
        </select>
      </div>

      <!-- 纯色背景配置 -->
      <template v-if="backgroundConfig.enabled && backgroundConfig.type === 'color'">
        <div class="control-item">
          <label class="control-label">背景颜色</label>
          <div class="color-picker-wrapper">
            <input 
              type="color" 
              v-model="backgroundConfig.color"
              class="control-color"
              @change="updateBackground"
            />
            <span class="color-value">{{ backgroundConfig.color }}</span>
          </div>
        </div>
      </template>

      <!-- 渐变背景配置 -->
      <template v-if="backgroundConfig.enabled && backgroundConfig.type === 'gradient'">
        <div class="control-item">
          <label class="control-label">渐变类型</label>
          <select 
            v-model="backgroundConfig.gradientType" 
            class="control-select"
            @change="updateBackground"
          >
            <option value="linear">线性渐变</option>
            <option value="radial">径向渐变</option>
          </select>
        </div>
        <div class="control-item">
          <label class="control-label">起始颜色</label>
          <div class="color-picker-wrapper">
            <input 
              type="color" 
              v-model="backgroundConfig.gradientStart"
              class="control-color"
              @change="updateBackground"
            />
            <span class="color-value">{{ backgroundConfig.gradientStart }}</span>
          </div>
        </div>
        <div class="control-item">
          <label class="control-label">结束颜色</label>
          <div class="color-picker-wrapper">
            <input 
              type="color" 
              v-model="backgroundConfig.gradientEnd"
              class="control-color"
              @change="updateBackground"
            />
            <span class="color-value">{{ backgroundConfig.gradientEnd }}</span>
          </div>
        </div>
        <div class="control-item" v-if="backgroundConfig.gradientType === 'linear'">
          <label class="control-label">
            渐变角度: {{ backgroundConfig.angle }}°
          </label>
          <input 
            type="range" 
            min="0" 
            max="360" 
            v-model="backgroundConfig.angle"
            class="control-slider"
            @input="updateBackground"
          />
        </div>
      </template>

      <!-- 图片背景配置 -->
      <template v-if="backgroundConfig.enabled && backgroundConfig.type === 'image'">
        <div class="control-item">
          <label class="control-label">图片URL</label>
          <input 
            type="text" 
            v-model="backgroundConfig.image"
            class="control-input"
            placeholder="输入图片URL"
            @change="updateBackground"
          />
        </div>
        <div class="control-item">
          <label class="control-label">重复方式</label>
          <select 
            v-model="backgroundConfig.repeat" 
            class="control-select"
            @change="updateBackground"
          >
            <option value="no-repeat">不重复</option>
            <option value="repeat">重复</option>
            <option value="repeat-x">水平重复</option>
            <option value="repeat-y">垂直重复</option>
            <option value="watermark">水印效果</option>
            <option value="flip-x">水平翻转</option>
            <option value="flip-y">垂直翻转</option>
            <option value="flip-xy">双向翻转</option>
          </select>
        </div>
        <div class="control-item">
          <label class="control-label">图片位置</label>
          <select 
            v-model="backgroundConfig.position" 
            class="control-select"
            @change="updateBackground"
          >
            <option value="center">居中</option>
            <option value="top">顶部</option>
            <option value="bottom">底部</option>
            <option value="left">左侧</option>
            <option value="right">右侧</option>
            <option value="top left">左上</option>
            <option value="top right">右上</option>
            <option value="bottom left">左下</option>
            <option value="bottom right">右下</option>
          </select>
        </div>
        <div class="control-item">
          <label class="control-label">图片大小</label>
          <select 
            v-model="backgroundConfig.size" 
            class="control-select"
            @change="updateBackground"
          >
            <option value="auto">自动</option>
            <option value="cover">覆盖</option>
            <option value="contain">包含</option>
            <option value="100% 100%">拉伸</option>
            <option value="50% 50%">50%</option>
            <option value="25% 25%">25%</option>
          </select>
        </div>
        <div class="control-item">
          <label class="control-label">
            透明度: {{ Math.round(backgroundConfig.opacity * 100) }}%
          </label>
          <input 
            type="range" 
            min="0" 
            max="1" 
            step="0.1"
            v-model="backgroundConfig.opacity"
            class="control-slider"
            @input="updateBackground"
          />
        </div>
      </template>

      <!-- 水印背景配置 -->
      <template v-if="backgroundConfig.enabled && backgroundConfig.type === 'watermark'">
        <div class="control-item">
          <label class="control-label">水印文字</label>
          <input 
            type="text" 
            v-model="backgroundConfig.watermarkText"
            class="control-input"
            placeholder="输入水印文字"
            @change="updateBackground"
          />
        </div>
        <div class="control-item">
          <label class="control-label">水印颜色</label>
          <div class="color-picker-wrapper">
            <input 
              type="color" 
              v-model="backgroundConfig.watermarkColor"
              class="control-color"
              @change="updateBackground"
            />
            <span class="color-value">{{ backgroundConfig.watermarkColor }}</span>
          </div>
        </div>
        <div class="control-item">
          <label class="control-label">
            水印角度: {{ backgroundConfig.watermarkAngle }}°
          </label>
          <input 
            type="range" 
            min="-90" 
            max="90" 
            v-model="backgroundConfig.watermarkAngle"
            class="control-slider"
            @input="updateBackground"
          />
        </div>
        <div class="control-item">
          <label class="control-label">
            水印大小: {{ backgroundConfig.watermarkSize }}px
          </label>
          <input 
            type="range" 
            min="12" 
            max="48" 
            v-model="backgroundConfig.watermarkSize"
            class="control-slider"
            @input="updateBackground"
          />
        </div>
      </template>

      <!-- 预设配置 -->
      <div class="control-item" v-if="backgroundConfig.enabled">
        <label class="control-label">预设背景</label>
        <div class="preset-buttons">
          <button 
            class="preset-btn"
            @click="applyPreset('grid')"
          >
            网格纸
          </button>
          <button 
            class="preset-btn"
            @click="applyPreset('blueprint')"
          >
            蓝图
          </button>
          <button 
            class="preset-btn"
            @click="applyPreset('dark')"
          >
            深色
          </button>
        </div>
      </div>

      <!-- 动态背景控制 -->
      <div class="control-item" v-if="backgroundConfig.enabled">
        <label class="control-label">
          <input 
            type="checkbox" 
            v-model="backgroundConfig.dynamicBackground"
            @change="updateBackground"
          />
          启用动态背景
        </label>
      </div>

      <template v-if="backgroundConfig.enabled && backgroundConfig.dynamicBackground">
        <div class="control-item">
          <label class="control-label">
            <input 
              type="checkbox" 
              v-model="backgroundConfig.scaleWithZoom"
              @change="updateBackground"
            />
            背景随缩放改变
          </label>
        </div>
        
        <div class="control-item">
          <label class="control-label">
            基础透明度: {{ Math.round(backgroundConfig.baseOpacity * 100) }}%
          </label>
          <input 
            type="range" 
            min="0" 
            max="1" 
            step="0.1"
            v-model="backgroundConfig.baseOpacity"
            class="control-slider"
            @input="updateBackground"
          />
        </div>
        
        <div class="control-item">
          <label class="control-label">
            最小透明度: {{ Math.round(backgroundConfig.minOpacity * 100) }}%
          </label>
          <input 
            type="range" 
            min="0" 
            max="1" 
            step="0.1"
            v-model="backgroundConfig.minOpacity"
            class="control-slider"
            @input="updateBackground"
          />
        </div>
        
        <div class="control-item">
          <label class="control-label">
            最大透明度: {{ Math.round(backgroundConfig.maxOpacity * 100) }}%
          </label>
          <input 
            type="range" 
            min="0" 
            max="1" 
            step="0.1"
            v-model="backgroundConfig.maxOpacity"
            class="control-slider"
            @input="updateBackground"
          />
        </div>
      </template>

      <!-- 清除背景按钮 -->
      <div class="control-item" v-if="backgroundConfig.enabled">
        <button 
          class="clear-btn"
          @click="clearBackground"
        >
          清除背景
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'

// 定义props
interface Props {
  editorRef?: any
}

const props = defineProps<Props>()

// 定义事件
const emit = defineEmits<{
  backgroundChange: [config: any]
  dynamicBackgroundUpdate: [config: any]
}>()

// 当前缩放级别
const currentZoom = ref(1)

// 背景配置
const backgroundConfig = reactive({
  enabled: true, // 默认启用背景
  type: 'color',
  color: '#f8f9fa', // 白偏灰色
  image: '',
  repeat: 'no-repeat',
  position: 'center',
  size: 'auto',
  opacity: 1,
  gradientType: 'linear',
  gradientStart: '#ffffff',
  gradientEnd: '#f0f0f0',
  angle: 45,
  watermarkText: 'Confidential',
  watermarkColor: '#cccccc',
  watermarkAngle: 20,
  watermarkSize: 16,
  // 新增：动态背景配置
  dynamicBackground: false, // 是否启用动态背景
  scaleWithZoom: false, // 背景是否随缩放改变
  baseOpacity: 1, // 基础透明度
  minOpacity: 0.3, // 最小透明度
  maxOpacity: 1, // 最大透明度
})

// 预设配置
const presets = {
  grid: {
    type: 'color',
    color: '#fafafa',
  },
  blueprint: {
    type: 'gradient',
    gradientType: 'linear',
    gradientStart: '#0a192f',
    gradientEnd: '#172a45',
    angle: 135,
  },
  dark: {
    type: 'gradient',
    gradientType: 'radial',
    gradientStart: '#2d3748',
    gradientEnd: '#1a202c',
  },
}

// 背景类型改变时的处理
const onTypeChange = () => {
  // 根据类型重置相关配置
  if (backgroundConfig.type === 'color') {
    backgroundConfig.color = '#f5f5f5'
  } else if (backgroundConfig.type === 'gradient') {
    backgroundConfig.gradientType = 'linear'
    backgroundConfig.gradientStart = '#ffffff'
    backgroundConfig.gradientEnd = '#f0f0f0'
    backgroundConfig.angle = 45
  } else if (backgroundConfig.type === 'watermark') {
    backgroundConfig.watermarkText = 'Confidential'
    backgroundConfig.watermarkColor = '#cccccc'
    backgroundConfig.watermarkAngle = 20
    backgroundConfig.watermarkSize = 16
  }
  updateBackground()
}

// 更新背景配置
const updateBackground = () => {
  if (!backgroundConfig.enabled) {
    emit('backgroundChange', null)
    return
  }

  let config: any = {}

  if (backgroundConfig.type === 'color') {
    config = {
      color: backgroundConfig.color,
    }
  } else if (backgroundConfig.type === 'gradient') {
    if (backgroundConfig.gradientType === 'linear') {
      config.color = `linear-gradient(${backgroundConfig.angle}deg, ${backgroundConfig.gradientStart}, ${backgroundConfig.gradientEnd})`
    } else {
      config.color = `radial-gradient(circle, ${backgroundConfig.gradientStart}, ${backgroundConfig.gradientEnd})`
    }
  } else if (backgroundConfig.type === 'image') {
    config = {
      image: backgroundConfig.image,
      repeat: backgroundConfig.repeat,
      position: backgroundConfig.position,
      size: backgroundConfig.size,
      opacity: backgroundConfig.opacity,
    }
  } else if (backgroundConfig.type === 'watermark') {
    // 创建水印图片
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!
    canvas.width = 200
    canvas.height = 200
    
    ctx.save()
    ctx.translate(100, 100)
    ctx.rotate((backgroundConfig.watermarkAngle * Math.PI) / 180)
    ctx.font = `${backgroundConfig.watermarkSize}px Arial`
    ctx.fillStyle = backgroundConfig.watermarkColor
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(backgroundConfig.watermarkText, 0, 0)
    ctx.restore()
    
    config = {
      image: canvas.toDataURL(),
      repeat: 'repeat',
      opacity: 0.3,
    }
  }

  // 如果启用了动态背景，添加动态配置
  if (backgroundConfig.dynamicBackground) {
    config.dynamic = {
      scaleWithZoom: backgroundConfig.scaleWithZoom,
      baseOpacity: backgroundConfig.baseOpacity,
      minOpacity: backgroundConfig.minOpacity,
      maxOpacity: backgroundConfig.maxOpacity,
      currentZoom: currentZoom.value,
    }
  }

  emit('backgroundChange', config)
  
  // 如果启用了动态背景，发送动态更新事件
  if (backgroundConfig.dynamicBackground) {
    emit('dynamicBackgroundUpdate', {
      ...config,
      zoom: currentZoom.value,
    })
  }
  
  // 保存到本地存储
  localStorage.setItem('flowchart-background-config', JSON.stringify(backgroundConfig))
}

// 处理缩放变化
const handleZoomChange = (zoom: number) => {
  currentZoom.value = zoom
  
  if (backgroundConfig.enabled && backgroundConfig.dynamicBackground && backgroundConfig.scaleWithZoom) {
    // 计算基于缩放的透明度
    let opacity = backgroundConfig.baseOpacity
    
    // 根据缩放级别调整透明度
    if (zoom < 1) {
      // 缩小时降低透明度
      const scale = Math.max(0, (zoom - 0.1) / 0.9) // 0.1 到 1.0 的范围映射到 0 到 1
      opacity = backgroundConfig.minOpacity + (backgroundConfig.baseOpacity - backgroundConfig.minOpacity) * scale
    } else if (zoom > 1) {
      // 放大时可以稍微增加透明度，但不超过最大值
      const scale = Math.min(1, (zoom - 1) / 2) // 1 到 3 的范围映射到 0 到 1
      opacity = backgroundConfig.baseOpacity + (backgroundConfig.maxOpacity - backgroundConfig.baseOpacity) * scale * 0.3
    }
    
    // 确保透明度在合理范围内
    opacity = Math.max(backgroundConfig.minOpacity, Math.min(backgroundConfig.maxOpacity, opacity))
    
    // 发送动态背景更新事件
    emit('dynamicBackgroundUpdate', {
      zoom,
      opacity,
      scaleWithZoom: backgroundConfig.scaleWithZoom,
      baseOpacity: backgroundConfig.baseOpacity,
      minOpacity: backgroundConfig.minOpacity,
      maxOpacity: backgroundConfig.maxOpacity,
    })
  }
}

// 暴露方法给父组件
defineExpose({
  handleZoomChange,
  updateBackground,
})

// 应用预设配置
const applyPreset = (presetName: keyof typeof presets) => {
  const preset = presets[presetName]
  
  Object.assign(backgroundConfig, preset)
  backgroundConfig.enabled = true
  backgroundConfig.type = preset.type
  
  updateBackground()
}

// 清除背景
const clearBackground = () => {
  backgroundConfig.enabled = false
  emit('backgroundChange', null)
  localStorage.removeItem('flowchart-background-config')
}

// 设置缩放监听
const setupZoomListener = () => {
  if (!props.editorRef?.graph) return
  
  const graph = props.editorRef.graph
  
  // 监听缩放事件
  graph.on('scale', ({ sx, sy, ox, oy }) => {
    handleZoomChange(sx)
  })
  
  // 监听平移事件（也可能影响视觉效果）
  graph.on('translate', ({ tx, ty }) => {
    // 平移时也可以触发背景更新（如果需要的话）
    if (backgroundConfig.enabled && backgroundConfig.dynamicBackground) {
      const currentZoom = graph.zoom()
      handleZoomChange(currentZoom)
    }
  })
  
  console.log('Zoom listener setup for dynamic background')
}

// 监听编辑器引用变化
watch(() => props.editorRef, (newRef) => {
  if (newRef) {
    // 设置缩放监听
    setupZoomListener()
  }
}, { immediate: true })

// 从本地存储加载配置
const loadConfig = () => {
  try {
    const saved = localStorage.getItem('flowchart-background-config')
    if (saved) {
      const config = JSON.parse(saved)
      Object.assign(backgroundConfig, config)
    }
  } catch (error) {
    console.warn('Failed to load background config:', error)
  }
}

// 初始化
loadConfig()
</script>

<style scoped>
.background-control-panel {
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

.clear-btn {
  width: 100%;
  padding: 8px 16px;
  border: 1px solid #ff4d4f;
  border-radius: 4px;
  background: #fff;
  font-size: 12px;
  color: #ff4d4f;
  cursor: pointer;
  transition: all 0.2s;
}

.clear-btn:hover {
  background: #fff2f0;
  border-color: #ff7875;
}

.clear-btn:active {
  transform: translateY(1px);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .background-control-panel {
    padding: 12px;
  }
  
  .preset-buttons {
    flex-direction: column;
  }
}
</style>
