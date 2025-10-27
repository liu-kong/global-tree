<template>
  <div class="about-view">
    <div class="about-header">
      <h1>关于 Global Tree</h1>
    </div>
    
    <div class="about-content">
      <div class="about-card">
        <div class="app-info">
          <div class="app-logo">
            <h2>🌳</h2>
          </div>
          <h2>Global Tree</h2>
          <p class="version">版本 1.0.0</p>
          <p class="description">专业且自由的知识图谱可视化平台</p>
        </div>
        
        <div class="features-section">
          <h3>核心特性</h3>
          <div class="features-grid">
            <div class="feature-item">
              <div class="feature-icon">🎯</div>
              <div class="feature-text">
                <h4>多图形库集成</h4>
                <p>深度集成 D3.js、AntV X6、AntV G6</p>
              </div>
            </div>
            <div class="feature-item">
              <div class="feature-icon">🔗</div>
              <div class="feature-text">
                <h4>统一接口</h4>
                <p>提供统一的渲染器接口</p>
              </div>
            </div>
            <div class="feature-item">
              <div class="feature-icon">🧩</div>
              <div class="feature-text">
                <h4>插件化架构</h4>
                <p>完全模块化的插件系统</p>
              </div>
            </div>
            <div class="feature-item">
              <div class="feature-icon">⚡</div>
              <div class="feature-text">
                <h4>高性能渲染</h4>
                <p>支持大规模数据可视化</p>
              </div>
            </div>
          </div>
        </div>
        
        <div class="tech-stack">
          <h3>技术栈</h3>
          <div class="tech-list">
            <div class="tech-item">
              <span class="tech-name">Vue 3</span>
              <span class="tech-desc">现代前端框架</span>
            </div>
            <div class="tech-item">
              <span class="tech-name">TypeScript</span>
              <span class="tech-desc">类型安全的 JavaScript</span>
            </div>
            <div class="tech-item">
              <span class="tech-name">Vite</span>
              <span class="tech-desc">快速构建工具</span>
            </div>
            <div class="tech-item">
              <span class="tech-name">D3.js</span>
              <span class="tech-desc">数据可视化库</span>
            </div>
            <div class="tech-item">
              <span class="tech-name">AntV X6</span>
              <span class="tech-desc">图形编辑框架</span>
            </div>
            <div class="tech-item">
              <span class="tech-name">AntV G6</span>
              <span class="tech-desc">图可视化引擎</span>
            </div>
          </div>
        </div>
        
        <div class="links-section">
          <h3>相关链接</h3>
          <div class="links-grid">
            <a href="#" class="link-item">
              <div class="link-icon">📖</div>
              <span>文档</span>
            </a>
            <a href="#" class="link-item">
              <div class="link-icon">🔧</div>
              <span>API 参考</span>
            </a>
            <a href="#" class="link-item">
              <div class="link-icon">💬</div>
              <span>社区</span>
            </a>
            <a href="#" class="link-item">
              <div class="link-icon">🐛</div>
              <span>反馈</span>
            </a>
          </div>
        </div>
        
        <div class="footer-info">
          <p>&copy; 2025 Global Tree Team. All rights reserved.</p>
          <p>Built with ❤️ for knowledge visualization</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'

// 生命周期
onMounted(() => {
  console.log('关于页面已挂载')
})
</script>

<style scoped>
.about-view {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
}

.about-header {
  text-align: center;
  margin-bottom: 40px;
}

.about-header h1 {
  color: white;
  font-size: 2.5rem;
  font-weight: bold;
  margin: 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.about-content {
  width: 100%;
  max-width: 800px;
}

.about-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 40px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
}

.app-info {
  text-align: center;
  margin-bottom: 40px;
}

.app-logo h2 {
  font-size: 4rem;
  margin: 0;
  line-height: 1;
}

.app-info h2 {
  font-size: 2rem;
  font-weight: bold;
  color: #333;
  margin: 16px 0 8px 0;
}

.version {
  color: #666;
  font-size: 1rem;
  margin: 0 0 16px 0;
}

.description {
  color: #555;
  font-size: 1.1rem;
  margin: 0;
  line-height: 1.6;
}

.features-section,
.tech-stack,
.links-section {
  margin-bottom: 40px;
}

.features-section h3,
.tech-stack h3,
.links-section h3 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 20px;
  text-align: center;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.feature-item {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 12px;
  transition: transform 0.3s ease;
}

.feature-item:hover {
  transform: translateY(-2px);
}

.feature-icon {
  font-size: 2rem;
  flex-shrink: 0;
}

.feature-text h4 {
  margin: 0 0 8px 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #333;
}

.feature-text p {
  margin: 0;
  font-size: 0.9rem;
  color: #666;
  line-height: 1.4;
}

.tech-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.tech-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #1890ff;
}

.tech-name {
  font-weight: 600;
  color: #333;
}

.tech-desc {
  font-size: 0.8rem;
  color: #666;
}

.links-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
}

.link-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 12px;
  text-decoration: none;
  color: #333;
  transition: all 0.3s ease;
}

.link-item:hover {
  background: #e6f7ff;
  transform: translateY(-2px);
  color: #1890ff;
}

.link-icon {
  font-size: 2rem;
}

.footer-info {
  text-align: center;
  padding-top: 20px;
  border-top: 1px solid #e8e8e8;
}

.footer-info p {
  margin: 4px 0;
  color: #666;
  font-size: 0.9rem;
}

@media (max-width: 768px) {
  .about-header h1 {
    font-size: 2rem;
  }
  
  .about-card {
    padding: 24px;
  }
  
  .features-grid,
  .tech-list,
  .links-grid {
    grid-template-columns: 1fr;
  }
}
</style>
