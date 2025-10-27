<template>
  <div class="home-view">
    <div class="hero-section">
      <div class="hero-content">
        <h1 class="hero-title">Global Tree</h1>
        <p class="hero-subtitle">专业且自由的知识图谱可视化平台</p>
        <p class="hero-description">
          集成 D3.js、AntV X6 和 AntV G6 三大图形库，提供统一的多图形库渲染解决方案
        </p>
      </div>
    </div>

    <div class="features-section">
      <div class="container">
        <h2 class="section-title">核心功能</h2>
        <div class="features-grid">
          <div class="feature-card" v-for="feature in features" :key="feature.id">
            <div class="feature-icon">
              {{ feature.icon }}
            </div>
            <h3 class="feature-title">{{ feature.title }}</h3>
            <p class="feature-description">{{ feature.description }}</p>
          </div>
        </div>
      </div>
    </div>

    <div class="demos-section">
      <div class="container">
        <h2 class="section-title">功能演示</h2>
        <div class="demos-grid">
          <div class="demo-card" @click="navigateToDemo">
            <h3>综合演示</h3>
            <p>展示所有渲染器功能</p>
          </div>
          <div class="demo-card" @click="navigateToKnowledge">
            <h3>知识图谱</h3>
            <p>专业的知识图谱编辑器</p>
          </div>
          <div class="demo-card" @click="navigateToAnalyzer">
            <h3>图分析</h3>
            <p>数据分析和可视化工具</p>
          </div>
          <div class="demo-card" @click="navigateToD3">
            <h3>D3 可视化</h3>
            <p>高级数据可视化示例</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

// 功能特性
const features = [
  {
    id: 1,
    title: '多图形库集成',
    description: '深度集成 D3.js、AntV X6、AntV G6 三大图形库',
    icon: '🎯'
  },
  {
    id: 2,
    title: '统一接口',
    description: '提供统一的渲染器接口，无缝切换不同图形库',
    icon: '🔗'
  },
  {
    id: 3,
    title: '插件化架构',
    description: '完全模块化的插件系统，支持动态加载和扩展',
    icon: '🧩'
  },
  {
    id: 4,
    title: '高性能渲染',
    description: '支持 10,000+ 节点流畅渲染，优化的内存管理',
    icon: '⚡'
  },
  {
    id: 5,
    title: '交互式操作',
    description: '丰富的交互功能，包括缩放、平移、选择、编辑等',
    icon: '🖱️'
  },
  {
    id: 6,
    title: '数据分析',
    description: '内置图算法和统计分析功能',
    icon: '📊'
  }
]

// 导航方法
const navigateToDemo = () => {
  router.push('/demo')
}

const navigateToKnowledge = () => {
  router.push('/knowledge-graph')
}

const navigateToAnalyzer = () => {
  router.push('/analyzer')
}

const navigateToD3 = () => {
  router.push('/d3-visualization')
}
</script>

<style scoped>
.home-view {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.hero-section {
  padding: 80px 20px;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
}

.hero-content {
  max-width: 800px;
}

.hero-title {
  font-size: 4rem;
  font-weight: bold;
  margin-bottom: 1rem;
  background: linear-gradient(45deg, #fff, #f0f0f0);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-subtitle {
  font-size: 1.5rem;
  margin-bottom: 1rem;
  opacity: 0.9;
}

.hero-description {
  font-size: 1.1rem;
  opacity: 0.8;
  line-height: 1.6;
}

.features-section,
.demos-section {
  padding: 60px 20px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
}

.container {
  max-width: 1200px;
  margin: 0 auto;
}

.section-title {
  text-align: center;
  font-size: 2.5rem;
  margin-bottom: 3rem;
  font-weight: bold;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
}

.feature-card {
  background: rgba(255, 255, 255, 0.1);
  padding: 2rem;
  border-radius: 12px;
  text-align: center;
  backdrop-filter: blur(5px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: transform 0.3s ease, background 0.3s ease;
}

.feature-card:hover {
  transform: translateY(-5px);
  background: rgba(255, 255, 255, 0.15);
}

.feature-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.feature-title {
  font-size: 1.3rem;
  margin-bottom: 1rem;
  font-weight: bold;
}

.feature-description {
  opacity: 0.9;
  line-height: 1.5;
}

.demos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.demo-card {
  background: rgba(255, 255, 255, 0.1);
  padding: 2rem;
  border-radius: 12px;
  text-align: center;
  backdrop-filter: blur(5px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  cursor: pointer;
  transition: all 0.3s ease;
}

.demo-card:hover {
  transform: translateY(-5px);
  background: rgba(255, 255, 255, 0.2);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.demo-card h3 {
  font-size: 1.2rem;
  margin-bottom: 0.5rem;
  font-weight: bold;
}

.demo-card p {
  opacity: 0.9;
  font-size: 0.9rem;
}

@media (max-width: 768px) {
  .hero-title {
    font-size: 2.5rem;
  }
  
  .hero-subtitle {
    font-size: 1.2rem;
  }
  
  .features-grid,
  .demos-grid {
    grid-template-columns: 1fr;
  }
}
</style>
