<template>
  <div class="settings-view">
    <div class="settings-header">
      <h1>设置</h1>
    </div>
    
    <div class="settings-content">
      <div class="settings-sidebar">
        <h3>设置分类</h3>
        <div class="settings-menu">
          <div 
            v-for="category in settingsCategories" 
            :key="category.id"
            class="menu-item"
            :class="{ active: activeCategory === category.id }"
            @click="selectCategory(category.id)"
          >
            <div class="menu-icon">{{ category.icon }}</div>
            <span>{{ category.name }}</span>
          </div>
        </div>
      </div>
      
      <div class="settings-main">
        <div class="settings-panel">
          <h3>{{ getCurrentCategory().name }}</h3>
          <p class="category-description">{{ getCurrentCategory().description }}</p>
          
          <!-- 通用设置 -->
          <div v-if="activeCategory === 'general'" class="settings-form">
            <div class="form-group">
              <label>主题模式</label>
              <select v-model="settings.theme">
                <option value="light">浅色主题</option>
                <option value="dark">深色主题</option>
                <option value="auto">跟随系统</option>
              </select>
            </div>
            
            <div class="form-group">
              <label>语言</label>
              <select v-model="settings.language">
                <option value="zh-CN">简体中文</option>
                <option value="en-US">English</option>
              </select>
            </div>
            
            <div class="form-group">
              <label>自动保存</label>
              <input type="checkbox" v-model="settings.autoSave" />
            </div>
          </div>
          
          <!-- 渲染器设置 -->
          <div v-if="activeCategory === 'renderer'" class="settings-form">
            <div class="form-group">
              <label>默认渲染器</label>
              <select v-model="settings.defaultRenderer">
                <option value="x6">AntV X6</option>
                <option value="g6">AntV G6</option>
                <option value="d3">D3.js</option>
              </select>
            </div>
            
            <div class="form-group">
              <label>渲染质量</label>
              <select v-model="settings.renderQuality">
                <option value="low">低</option>
                <option value="medium">中</option>
                <option value="high">高</option>
                <option value="ultra">超高</option>
              </select>
            </div>
            
            <div class="form-group">
              <label>启用动画</label>
              <input type="checkbox" v-model="settings.enableAnimations" />
            </div>
          </div>
          
          <!-- 性能设置 -->
          <div v-if="activeCategory === 'performance'" class="settings-form">
            <div class="form-group">
              <label>最大节点数量</label>
              <input type="number" v-model="settings.maxNodes" min="100" max="50000" />
            </div>
            
            <div class="form-group">
              <label>内存限制 (MB)</label>
              <input type="number" v-model="settings.memoryLimit" min="100" max="2000" />
            </div>
            
            <div class="form-group">
              <label>启用虚拟化</label>
              <input type="checkbox" v-model="settings.enableVirtualization" />
            </div>
          </div>
          
          <!-- 插件设置 -->
          <div v-if="activeCategory === 'plugins'" class="settings-form">
            <div class="plugin-list">
              <div 
                v-for="plugin in plugins" 
                :key="plugin.id"
                class="plugin-item"
              >
                <div class="plugin-info">
                  <h4>{{ plugin.name }}</h4>
                  <p>{{ plugin.description }}</p>
                </div>
                <div class="plugin-controls">
                  <label class="switch">
                    <input type="checkbox" v-model="plugin.enabled" />
                    <span class="slider"></span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="settings-actions">
          <button class="btn btn-primary" @click="saveSettings">保存设置</button>
          <button class="btn btn-secondary" @click="resetSettings">重置默认</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

// 响应式数据
const activeCategory = ref('general')

// 设置分类
const settingsCategories = [
  {
    id: 'general',
    name: '通用设置',
    description: '基本应用设置',
    icon: '⚙️'
  },
  {
    id: 'renderer',
    name: '渲染器设置',
    description: '图形渲染相关设置',
    icon: '🎨'
  },
  {
    id: 'performance',
    name: '性能设置',
    description: '性能优化相关设置',
    icon: '⚡'
  },
  {
    id: 'plugins',
    name: '插件设置',
    description: '插件管理设置',
    icon: '🧩'
  }
]

// 设置数据
const settings = ref({
  theme: 'light',
  language: 'zh-CN',
  autoSave: true,
  defaultRenderer: 'x6',
  renderQuality: 'high',
  enableAnimations: true,
  maxNodes: 10000,
  memoryLimit: 512,
  enableVirtualization: true
})

// 插件列表
const plugins = ref([
  {
    id: 'x6-plugin',
    name: 'AntV X6 Plugin',
    description: 'AntV X6 图形编辑器插件',
    enabled: true
  },
  {
    id: 'g6-plugin',
    name: 'AntV G6 Plugin',
    description: 'AntV G6 图分析插件',
    enabled: true
  },
  {
    id: 'd3-plugin',
    name: 'D3.js Plugin',
    description: 'D3.js 数据可视化插件',
    enabled: true
  }
])

// 方法
const selectCategory = (categoryId: string) => {
  activeCategory.value = categoryId
}

const getCurrentCategory = () => {
  return settingsCategories.find(c => c.id === activeCategory.value) || settingsCategories[0]
}

const saveSettings = () => {
  console.log('保存设置:', settings.value)
  localStorage.setItem('global-tree-settings', JSON.stringify(settings.value))
  alert('设置已保存')
}

const resetSettings = () => {
  if (confirm('确定要重置所有设置吗？')) {
    settings.value = {
      theme: 'light',
      language: 'zh-CN',
      autoSave: true,
      defaultRenderer: 'x6',
      renderQuality: 'high',
      enableAnimations: true,
      maxNodes: 10000,
      memoryLimit: 512,
      enableVirtualization: true
    }
    alert('设置已重置')
  }
}

// 生命周期
onMounted(() => {
  // 加载保存的设置
  const savedSettings = localStorage.getItem('global-tree-settings')
  if (savedSettings) {
    try {
      const parsed = JSON.parse(savedSettings)
      Object.assign(settings.value, parsed)
    } catch (e) {
      console.error('加载设置失败:', e)
    }
  }
})
</script>

<style scoped>
.settings-view {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
}

.settings-header {
  background: white;
  padding: 16px 24px;
  border-bottom: 1px solid #e8e8e8;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.settings-header h1 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.settings-content {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.settings-sidebar {
  width: 250px;
  background: white;
  border-right: 1px solid #e8e8e8;
  padding: 16px;
  overflow-y: auto;
}

.settings-sidebar h3 {
  margin: 0 0 16px 0;
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.settings-menu {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.menu-item:hover {
  background: #f0f0f0;
}

.menu-item.active {
  background: #e6f7ff;
  color: #1890ff;
}

.menu-icon {
  font-size: 16px;
}

.settings-main {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
}

.settings-panel {
  background: white;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 16px;
}

.settings-panel h3 {
  margin: 0 0 8px 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.category-description {
  margin: 0 0 24px 0;
  color: #666;
  font-size: 14px;
}

.settings-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-weight: 500;
  color: #333;
}

.form-group select,
.form-group input[type="number"] {
  padding: 8px 12px;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  font-size: 14px;
}

.form-group input[type="checkbox"] {
  width: 16px;
  height: 16px;
}

.plugin-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.plugin-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
}

.plugin-info h4 {
  margin: 0 0 4px 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.plugin-info p {
  margin: 0;
  font-size: 14px;
  color: #666;
}

.switch {
  position: relative;
  display: inline-block;
  width: 50px;
  height: 24px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: .4s;
  border-radius: 24px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: .4s;
  border-radius: 50%;
}

input:checked + .slider {
  background-color: #1890ff;
}

input:checked + .slider:before {
  transform: translateX(26px);
}

.settings-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s ease;
}

.btn-primary {
  background: #1890ff;
  color: white;
}

.btn-primary:hover {
  background: #40a9ff;
}

.btn-secondary {
  background: #f5f5f5;
  color: #333;
  border: 1px solid #e8e8e8;
}

.btn-secondary:hover {
  background: #e8e8e8;
}
</style>
