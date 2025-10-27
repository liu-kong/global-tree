import { defineStore } from 'pinia';
import type { GraphRenderer, RendererState, RendererType, RendererConfig } from '@/types/renderer';

export const useRendererStore = defineStore('renderer', {
  state: () => ({
    // 当前渲染器类型
    currentRenderer: 'd3' as RendererType,
    
    // 渲染器实例
    rendererInstance: null as GraphRenderer | null,
    
    // 渲染器状态
    state: {
      isInitialized: false,
      isRendering: false,
      currentRenderer: 'd3',
      nodeCount: 0,
      edgeCount: 0,
      viewState: {
        zoom: 1,
        pan: { x: 0, y: 0 }
      },
      selection: {
        nodes: [],
        edges: []
      },
      performance: {
        renderTime: 0,
        lastUpdate: 0
      }
    } as RendererState,
    
    // 渲染器配置
    config: {
      d3: {
        forceSimulation: {
          strength: 1,
          distance: 100,
          charge: -300
        },
        animation: {
          duration: 300,
          easing: 'easeInOut'
        }
      },
      x6: {
        grid: {
          size: 20,
          visible: true,
          type: 'dot'
        },
        snapline: true,
        history: true,
        clipboard: true,
        keyboard: true
      },
      g6: {
        modes: {
          default: ['drag-canvas', 'zoom-canvas', 'drag-node']
        },
        layout: {
          type: 'force',
          preventOverlap: true,
          nodeSize: 40
        },
        animate: true,
        fitView: true
      }
    } as RendererConfig,
    
    // 可用的渲染器
    availableRenderers: ['d3', 'x6', 'g6'] as RendererType[],
    
    // 性能监控
    performanceMetrics: {
      fps: 0,
      memoryUsage: 0,
      renderTime: 0,
      nodeCount: 0,
      edgeCount: 0
    },
    
    // 错误状态
    error: null as string | null
  }),

  getters: {
    // 获取当前渲染器类型
    getCurrentRenderer: (state) => state.currentRenderer,
    
    // 检查是否已初始化
    isInitialized: (state) => state.state.isInitialized,
    
    // 检查是否正在渲染
    isRendering: (state) => state.state.isRendering,
    
    // 获取渲染器配置
    getRendererConfig: (state) => (type: RendererType) => {
      return state.config[type] || {};
    },
    
    // 获取性能指标
    getPerformanceMetrics: (state) => state.performanceMetrics,
    
    // 检查是否有错误
    hasError: (state) => state.error !== null
  },

  actions: {
    // 设置当前渲染器
    setCurrentRenderer(type: RendererType) {
      this.currentRenderer = type;
      this.state.currentRenderer = type;
    },

    // 设置渲染器实例
    setRendererInstance(renderer: GraphRenderer | null) {
      this.rendererInstance = renderer;
      if (renderer) {
        this.state.isInitialized = true;
      } else {
        this.state.isInitialized = false;
      }
    },

    // 更新渲染器状态
    updateRendererState(updates: Partial<RendererState>) {
      this.state = { ...this.state, ...updates };
    },

    // 设置渲染状态
    setRendering(rendering: boolean) {
      this.state.isRendering = rendering;
      if (rendering) {
        this.state.performance.lastUpdate = Date.now();
      }
    },

    // 更新性能指标
    updatePerformanceMetrics(metrics: Partial<typeof this.performanceMetrics>) {
      this.performanceMetrics = { ...this.performanceMetrics, ...metrics };
    },

    // 更新节点和边数量
    updateNodeEdgeCounts(nodeCount: number, edgeCount: number) {
      this.state.nodeCount = nodeCount;
      this.state.edgeCount = edgeCount;
      this.performanceMetrics.nodeCount = nodeCount;
      this.performanceMetrics.edgeCount = edgeCount;
    },

    // 更新视图状态
    updateViewState(viewState: Partial<typeof this.state.viewState>) {
      this.state.viewState = { ...this.state.viewState, ...viewState };
    },

    // 更新选择状态
    updateSelection(selection: Partial<typeof this.state.selection>) {
      this.state.selection = { ...this.state.selection, ...selection };
    },

    // 设置渲染器配置
    setRendererConfig(type: RendererType, config: any) {
      this.config[type] = { ...this.config[type], ...config };
    },

    // 重置渲染器
    resetRenderer() {
      if (this.rendererInstance) {
        this.rendererInstance.destroy();
        this.rendererInstance = null;
      }
      this.state.isInitialized = false;
      this.state.isRendering = false;
      this.error = null;
    },

    // 切换渲染器
    async switchRenderer(type: RendererType) {
      if (type === this.currentRenderer) return;

      try {
        // 重置当前渲染器
        this.resetRenderer();
        
        // 设置新的渲染器类型
        this.setCurrentRenderer(type);
        
        // 这里会由组件来创建新的渲染器实例
        
      } catch (error) {
        this.error = `切换渲染器失败: ${error}`;
        console.error('Failed to switch renderer:', error);
      }
    },

    // 记录渲染时间
    recordRenderTime(startTime: number) {
      const renderTime = Date.now() - startTime;
      this.state.performance.renderTime = renderTime;
      this.performanceMetrics.renderTime = renderTime;
    },

    // 监控 FPS
    monitorFPS() {
      let lastTime = performance.now();
      let frames = 0;
      
      const measureFPS = () => {
        frames++;
        const currentTime = performance.now();
        
        if (currentTime >= lastTime + 1000) {
          this.performanceMetrics.fps = Math.round((frames * 1000) / (currentTime - lastTime));
          frames = 0;
          lastTime = currentTime;
        }
        
        if (this.state.isInitialized) {
          requestAnimationFrame(measureFPS);
        }
      };
      
      measureFPS();
    },

    // 监控内存使用
    monitorMemoryUsage() {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        this.performanceMetrics.memoryUsage = Math.round(memory.usedJSHeapSize / 1024 / 1024);
      }
    },

    // 设置错误状态
    setError(error: string | null) {
      this.error = error;
    },

    // 清除错误
    clearError() {
      this.error = null;
    },

    // 初始化渲染器
    async initializeRenderer(container: HTMLElement) {
      try {
        this.setRendering(true);
        const startTime = Date.now();
        
        // 这里会由具体的渲染器实现来初始化
        
        this.recordRenderTime(startTime);
        this.updateRendererState({ isInitialized: true });
        this.monitorFPS();
        
      } catch (error) {
        this.error = `初始化渲染器失败: ${error}`;
        console.error('Failed to initialize renderer:', error);
      } finally {
        this.setRendering(false);
      }
    }
  }
});
