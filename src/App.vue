<template>
  <div id="app" :class="{ 'dark-theme': isDarkTheme }">
    <router-view />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useConfigStore } from '@/stores/config'

const configStore = useConfigStore()

// 计算是否为深色主题
const isDarkTheme = computed(() => configStore.graphConfig.theme === 'dark')

// 初始化应用
onMounted(() => {
  // 应用主题
  configStore.applyTheme()
  
  // 监听系统主题变化
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  mediaQuery.addEventListener('change', (e) => {
    // 可以根据系统主题自动切换
    // configStore.setTheme(e.matches ? 'dark' : 'light')
  })
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

/* 深色主题样式 */
.dark-theme {
  background-color: var(--color-background, #141414);
  color: var(--color-text, #ffffff);
}

/* 全局样式重置 */
* {
  box-sizing: border-box;
}

html, body {
  margin: 0;
  padding: 0;
  height: 100%;
  overflow: hidden;
}

/* 自定义滚动条 */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: var(--color-background, #f5f5f5);
}

::-webkit-scrollbar-thumb {
  background: var(--color-border, #d9d9d9);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--color-primary, #1890ff);
}

/* 选择文本样式 */
::selection {
  background-color: var(--color-primary, #1890ff);
  color: white;
}

/* 焦点样式 */
:focus-visible {
  outline: 2px solid var(--color-primary, #1890ff);
  outline-offset: 2px;
}

/* 禁用拖拽 */
img, svg {
  -webkit-user-drag: none;
  user-select: none;
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

.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease;
}

.slide-enter-from {
  transform: translateX(-100%);
}

.slide-leave-to {
  transform: translateX(100%);
}
</style>
