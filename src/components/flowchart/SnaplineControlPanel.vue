<template>
  <div class="snapline-control-panel">
    <div class="control-section">
      <h3 class="section-title">对齐线设置</h3>
      
      <!-- 对齐线开关 -->
      <div class="control-item">
        <label class="control-label">
          <input 
            type="checkbox" 
            v-model="snaplineEnabled"
            @change="handleSnaplineToggle"
          />
          启用对齐线
        </label>
        <p class="control-description">移动节点时显示对齐辅助线</p>
      </div>

      <!-- 对齐精度 -->
      <div class="control-item" v-if="snaplineEnabled">
        <label class="control-label">对齐精度</label>
        <div class="control-input">
          <input 
            type="range" 
            min="5" 
            max="50" 
            v-model="tolerance"
            @input="handleToleranceChange"
          />
          <span class="range-value">{{ tolerance }}px</span>
        </div>
        <p class="control-description">触发对齐的距离阈值</p>
      </div>

      <!-- 短款对齐线 -->
      <div class="control-item" v-if="snaplineEnabled">
        <label class="control-label">
          <input 
            type="checkbox" 
            v-model="sharp"
            @change="handleSharpChange"
          />
          短款对齐线
        </label>
        <p class="control-description">对齐线只显示到相关节点位置</p>
      </div>

      <!-- 调整大小时对齐 -->
      <div class="control-item" v-if="snaplineEnabled">
        <label class="control-label">
          <input 
            type="checkbox" 
            v-model="resizing"
            @change="handleResizingChange"
          />
          调整大小时对齐
        </label>
        <p class="control-description">调整节点大小时显示对齐线</p>
      </div>

      <!-- 自动清理 -->
      <div class="control-item" v-if="snaplineEnabled">
        <label class="control-label">自动清理</label>
        <div class="control-input">
          <select v-model="clean" @change="handleCleanChange">
            <option :value="false">不清理</option>
            <option :value="true">3秒后清理</option>
            <option :value="1000">1秒后清理</option>
            <option :value="3000">3秒后清理</option>
            <option :value="5000">5秒后清理</option>
          </select>
        </div>
        <p class="control-description">隐藏对齐线后的清理策略</p>
      </div>

      <!-- 过滤器设置 -->
      <div class="control-item" v-if="snaplineEnabled">
        <label class="control-label">节点过滤器</label>
        <div class="control-input">
          <select v-model="filterType" @change="handleFilterTypeChange">
            <option value="none">不过滤</option>
            <option value="shape">按节点类型过滤</option>
            <option value="custom">自定义过滤</option>
          </select>
        </div>
        
        <!-- 节点类型过滤 -->
        <div v-if="filterType === 'shape'" class="filter-options">
          <label class="checkbox-label" v-for="shape in availableShapes" :key="shape">
            <input 
              type="checkbox" 
              :value="shape"
              v-model="selectedShapes"
              @change="handleShapeFilterChange"
            />
            {{ shape }}
          </label>
        </div>
        
        <!-- 自定义过滤提示 -->
        <div v-if="filterType === 'custom'" class="custom-filter-info">
          <p class="info-text">自定义过滤器需要在代码中实现</p>
        </div>
        
        <p class="control-description">设置不参与对齐计算的节点</p>
      </div>

      <!-- 快捷操作 -->
      <div class="control-item">
        <div class="quick-actions">
          <button class="action-btn" @click="resetToDefault">
            重置默认
          </button>
          <button class="action-btn" @click="toggleSnapline">
            {{ snaplineEnabled ? '禁用' : '启用' }}对齐线
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

// 定义事件
const emit = defineEmits<{
  snaplineChange: [config: any]
}>()

// 响应式数据
const snaplineEnabled = ref(true)
const tolerance = ref(10)
const sharp = ref(false)
const resizing = ref(false)
const clean = ref(true)
const filterType = ref('none')
const selectedShapes = ref<string[]>([])

// 可用的节点类型
const availableShapes = ['custom-rect', 'custom-polygon', 'custom-circle', 'custom-image']

// 处理对齐线开关
const handleSnaplineToggle = () => {
  updateSnaplineConfig()
}

// 处理对齐精度变化
const handleToleranceChange = () => {
  updateSnaplineConfig()
}

// 处理短款对齐线变化
const handleSharpChange = () => {
  updateSnaplineConfig()
}

// 处理调整大小时对齐变化
const handleResizingChange = () => {
  updateSnaplineConfig()
}

// 处理自动清理变化
const handleCleanChange = () => {
  updateSnaplineConfig()
}

// 处理过滤器类型变化
const handleFilterTypeChange = () => {
  if (filterType.value !== 'shape') {
    selectedShapes.value = []
  }
  updateSnaplineConfig()
}

// 处理节点类型过滤变化
const handleShapeFilterChange = () => {
  updateSnaplineConfig()
}

// 更新对齐线配置
const updateSnaplineConfig = () => {
  const config: any = {
    enabled: snaplineEnabled.value,
  }

  if (snaplineEnabled.value) {
    config.tolerance = tolerance.value
    config.sharp = sharp.value
    config.resizing = resizing.value
    config.clean = clean.value

    // 设置过滤器
    if (filterType.value === 'shape' && selectedShapes.value.length > 0) {
      config.filter = selectedShapes.value
    } else if (filterType.value === 'none') {
      config.filter = null
    }
  }

  emit('snaplineChange', config)
  
  // 保存配置到本地存储
  saveConfig()
}

// 重置为默认配置
const resetToDefault = () => {
  snaplineEnabled.value = true
  tolerance.value = 10
  sharp.value = false
  resizing.value = false
  clean.value = true
  filterType.value = 'none'
  selectedShapes.value = []
  
  updateSnaplineConfig()
}

// 切换对齐线状态
const toggleSnapline = () => {
  snaplineEnabled.value = !snaplineEnabled.value
  updateSnaplineConfig()
}

// 保存配置到本地存储
const saveConfig = () => {
  try {
    const config = {
      snaplineEnabled: snaplineEnabled.value,
      tolerance: tolerance.value,
      sharp: sharp.value,
      resizing: resizing.value,
      clean: clean.value,
      filterType: filterType.value,
      selectedShapes: selectedShapes.value,
    }
    localStorage.setItem('snapline-config', JSON.stringify(config))
  } catch (error) {
    console.warn('Failed to save snapline config:', error)
  }
}

// 从本地存储加载配置
const loadConfig = () => {
  try {
    const saved = localStorage.getItem('snapline-config')
    if (saved) {
      const config = JSON.parse(saved)
      snaplineEnabled.value = config.snaplineEnabled ?? true
      tolerance.value = config.tolerance ?? 10
      sharp.value = config.sharp ?? false
      resizing.value = config.resizing ?? false
      clean.value = config.clean ?? true
      filterType.value = config.filterType ?? 'none'
      selectedShapes.value = config.selectedShapes ?? []
    }
  } catch (error) {
    console.warn('Failed to load snapline config:', error)
  }
}

// 初始化
onMounted(() => {
  loadConfig()
  updateSnaplineConfig()
})
</script>

<style scoped>
.snapline-control-panel {
  padding: 0;
}

.control-section {
  margin-bottom: 20px;
}

.section-title {
  margin: 0 0 16px 0;
  font-size: 14px;
  font-weight: 600;
  color: #262626;
  border-bottom: 1px solid #e8e8e8;
  padding-bottom: 8px;
}

.control-item {
  margin-bottom: 16px;
  padding: 12px;
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.control-item:hover {
  border-color: #1890ff;
  box-shadow: 0 2px 4px rgba(24, 144, 255, 0.1);
}

.control-label {
  display: flex;
  align-items: center;
  font-size: 13px;
  font-weight: 500;
  color: #262626;
  margin-bottom: 6px;
  cursor: pointer;
}

.control-label input[type="checkbox"] {
  margin-right: 8px;
  width: 14px;
  height: 14px;
  accent-color: #1890ff;
}

.control-description {
  margin: 6px 0 0 0;
  font-size: 11px;
  color: #999;
  line-height: 1.4;
}

.control-input {
  margin-top: 8px;
}

.control-input input[type="range"] {
  width: 180px;
  height: 4px;
  background: #e8e8e8;
  border-radius: 2px;
  outline: none;
  -webkit-appearance: none;
}

.control-input input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 16px;
  height: 16px;
  background: #1890ff;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s ease;
}

.control-input input[type="range"]::-webkit-slider-thumb:hover {
  background: #40a9ff;
  transform: scale(1.1);
}

.range-value {
  display: inline-block;
  margin-left: 8px;
  font-size: 12px;
  color: #1890ff;
  font-weight: 500;
  min-width: 35px;
}

.control-input select {
  width: 100%;
  padding: 6px 8px;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  font-size: 12px;
  background: #fff;
  color: #262626;
  outline: none;
  transition: all 0.2s ease;
}

.control-input select:focus {
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.1);
}

.filter-options {
  margin-top: 8px;
  padding: 8px;
  background: #f8f9fa;
  border-radius: 4px;
  border: 1px solid #e8e8e8;
}

.checkbox-label {
  display: block;
  font-size: 12px;
  color: #262626;
  margin-bottom: 4px;
  cursor: pointer;
  transition: color 0.2s ease;
}

.checkbox-label:hover {
  color: #1890ff;
}

.checkbox-label input[type="checkbox"] {
  margin-right: 6px;
  width: 12px;
  height: 12px;
  accent-color: #1890ff;
}

.custom-filter-info {
  margin-top: 8px;
  padding: 8px;
  background: #fff7e6;
  border: 1px solid #ffd591;
  border-radius: 4px;
}

.info-text {
  margin: 0;
  font-size: 11px;
  color: #d46b08;
  line-height: 1.4;
}

.quick-actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.action-btn {
  flex: 1;
  padding: 6px 12px;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  background: #fff;
  font-size: 12px;
  color: #262626;
  cursor: pointer;
  transition: all 0.2s ease;
  outline: none;
}

.action-btn:hover {
  border-color: #1890ff;
  color: #1890ff;
  background: #f6ffed;
}

.action-btn:active {
  transform: translateY(1px);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .control-item {
    padding: 8px;
  }
  
  .control-input input[type="range"] {
    width: 140px;
  }
  
  .quick-actions {
    flex-direction: column;
  }
  
  .action-btn {
    font-size: 11px;
    padding: 4px 8px;
  }
}

/* 动画效果 */
.control-item {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
