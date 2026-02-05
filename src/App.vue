<template>
  <div id="app">
    <div v-if="loading" class="loading-screen">
      <div class="loading-content">
        <div class="spinner"></div>
        <p>加载知识树...</p>
      </div>
    </div>
    <router-view v-else />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useTreeStore, useNutrientStore } from './stores'
import { initIndexedDB } from './utils/storage'

const treeStore = useTreeStore()
const nutrientStore = useNutrientStore()
const loading = ref(true)

// 初始化应用
onMounted(async () => {
  try {
    // 1. 初始化 IndexedDB
    await initIndexedDB()

    // 2. 加载知识树
    await treeStore.loadTree()

    // 3. 加载养料
    await nutrientStore.loadNutrients()

    // 4. 显示应用
    loading.value = false
  } catch (error) {
    console.error('Failed to initialize app:', error)
    alert('应用初始化失败，请刷新页面重试')
  }
})
</script>

<style>
#app {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  height: 100vh;
  overflow: hidden;
}

* {
  box-sizing: border-box;
}

html, body {
  margin: 0;
  padding: 0;
  height: 100%;
  overflow: hidden;
}

/* 加载屏幕 */
.loading-screen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.loading-content {
  text-align: center;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #1890ff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-content p {
  color: #666;
  margin: 0;
  font-size: 0.9rem;
}

/* 自定义滚动条 */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #f5f5f5;
}

::-webkit-scrollbar-thumb {
  background: #d9d9d9;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #1890ff;
}

/* 选择文本样式 */
::selection {
  background-color: #1890ff;
  color: white;
}

/* 焦点样式 */
:focus-visible {
  outline: 2px solid #1890ff;
  outline-offset: 2px;
}

/* 过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
