import { defineStore } from 'pinia';
import type { GraphConfig, RendererType, LayoutType } from '@/types/graph';

export const useConfigStore = defineStore('config', {
  state: () => ({
    // 图谱配置
    graphConfig: {
      renderer: 'd3' as RendererType,
      layout: 'force' as LayoutType,
      theme: 'light' as 'light' | 'dark',
      showGrid: true,
      showMiniMap: false,
      enableAnimation: true,
      animationDuration: 300,
      nodeSize: { min: 30, max: 80 },
      edgeWidth: { min: 1, max: 5 },
      colors: {
        primary: '#1890ff',
        secondary: '#52c41a',
        accent: '#fa8c16',
        background: '#ffffff',
        text: '#000000',
        border: '#d9d9d9'
      }
    } as GraphConfig,

    // 用户偏好设置
    preferences: {
      autoSave: true,
      autoSaveInterval: 30000, // 30秒
      showTooltips: true,
      enableShortcuts: true,
      showNodeLabels: true,
      showEdgeLabels: true,
      defaultNodeType: 'concept',
      defaultEdgeType: 'relates',
      maxUndoSteps: 50,
      exportFormat: 'json'
    },

    // 界面布局
    layout: {
      showToolbar: true,
      showPropertyPanel: true,
      showToolPanel: true,
      showStatusBar: true,
      sidebarWidth: 300,
      propertyPanelWidth: 350,
      toolbarHeight: 60,
      statusBarHeight: 30
    },

    // 性能设置
    performance: {
      enableVirtualization: true,
      maxNodesToRender: 1000,
      enableWebWorkers: true,
      cacheSize: 100,
      enableLazyLoading: true
    },

    // 主题配置
    themes: {
      light: {
        name: '浅色主题',
        colors: {
          primary: '#1890ff',
          secondary: '#52c41a',
          accent: '#fa8c16',
          background: '#ffffff',
          text: '#000000',
          border: '#d9d9d9',
          nodeBackground: '#ffffff',
          nodeBorder: '#1890ff',
          edgeColor: '#999999',
          gridColor: '#f0f0f0'
        }
      },
      dark: {
        name: '深色主题',
        colors: {
          primary: '#177ddc',
          secondary: '#49aa19',
          accent: '#d89614',
          background: '#141414',
          text: '#ffffff',
          border: '#434343',
          nodeBackground: '#1f1f1f',
          nodeBorder: '#177ddc',
          edgeColor: '#666666',
          gridColor: '#303030'
        }
      }
    },

    // 布局配置
    layoutConfigs: {
      force: {
        name: '力导向布局',
        description: '基于力导向算法的自动布局',
        settings: {
          strength: 1,
          distance: 100,
          charge: -300,
          iterations: 1000,
          preventOverlap: true
        }
      },
      hierarchical: {
        name: '层次布局',
        description: '按层次结构排列节点',
        settings: {
          direction: 'TB', // TB, BT, LR, RL
          nodeSpacing: 50,
          rankSpacing: 100,
          align: 'UL' // UL, UR, DL, DR
        }
      },
      circular: {
        name: '环形布局',
        description: '按环形方式排列节点',
        settings: {
          radius: 200,
          startAngle: 0,
          endAngle: 360,
          clockwise: true
        }
      },
      grid: {
        name: '网格布局',
        description: '按网格方式排列节点',
        settings: {
          rows: 5,
          cols: 5,
          spacing: 100,
          sortBy: 'id' // id, degree, random
        }
      },
      random: {
        name: '随机布局',
        description: '随机分布节点',
        settings: {
          width: 800,
          height: 600,
          seed: Math.random()
        }
      }
    }
  }),

  getters: {
    // 获取当前配置
    getCurrentConfig: (state) => state.graphConfig,

    // 获取当前主题
    getCurrentTheme: (state) => state.themes[state.graphConfig.theme],

    // 获取布局配置
    getLayoutConfig: (state) => (layout: LayoutType) => {
      return state.layoutConfigs[layout] || state.layoutConfigs.force;
    },

    // 获取性能设置
    getPerformanceSettings: (state) => state.performance,

    // 获取用户偏好
    getPreferences: (state) => state.preferences,

    // 获取界面布局
    getUILayout: (state) => state.layout,

    // 检查是否启用自动保存
    isAutoSaveEnabled: (state) => state.preferences.autoSave,

    // 获取当前主题颜色
    getThemeColors: (state) => state.themes[state.graphConfig.theme].colors
  },

  actions: {
    // 更新图谱配置
    updateGraphConfig(config: Partial<GraphConfig>) {
      this.graphConfig = { ...this.graphConfig, ...config };
    },

    // 切换渲染器
    setRenderer(renderer: RendererType) {
      this.graphConfig.renderer = renderer;
    },

    // 切换布局
    setLayout(layout: LayoutType) {
      this.graphConfig.layout = layout;
    },

    // 切换主题
    setTheme(theme: 'light' | 'dark') {
      this.graphConfig.theme = theme;
      this.applyTheme();
    },

    // 应用主题
    applyTheme() {
      const theme = this.getCurrentTheme;
      if (theme) {
        // 更新图谱配置中的颜色
        this.graphConfig.colors = {
          primary: theme.colors.primary,
          secondary: theme.colors.secondary,
          accent: theme.colors.accent,
          background: theme.colors.background,
          text: theme.colors.text,
          border: theme.colors.border
        };

        // 应用 CSS 变量
        const root = document.documentElement;
        Object.entries(theme.colors).forEach(([key, value]) => {
          root.style.setProperty(`--color-${key}`, value);
        });
      }
    },

    // 更新用户偏好
    updatePreferences(preferences: Partial<typeof this.preferences>) {
      this.preferences = { ...this.preferences, ...preferences };
    },

    // 更新界面布局
    updateLayout(layout: Partial<typeof this.layout>) {
      this.layout = { ...this.layout, ...layout };
    },

    // 更新性能设置
    updatePerformance(performance: Partial<typeof this.performance>) {
      this.performance = { ...this.performance, ...performance };
    },

    // 更新布局配置
    updateLayoutConfig(layout: LayoutType, config: any) {
      if (this.layoutConfigs[layout]) {
        this.layoutConfigs[layout].settings = {
          ...this.layoutConfigs[layout].settings,
          ...config
        };
      }
    },

    // 切换网格显示
    toggleGrid() {
      this.graphConfig.showGrid = !this.graphConfig.showGrid;
    },

    // 切换迷你地图显示
    toggleMiniMap() {
      this.graphConfig.showMiniMap = !this.graphConfig.showMiniMap;
    },

    // 切换动画
    toggleAnimation() {
      this.graphConfig.enableAnimation = !this.graphConfig.enableAnimation;
    },

    // 设置动画持续时间
    setAnimationDuration(duration: number) {
      this.graphConfig.animationDuration = duration;
    },

    // 设置节点大小范围
    setNodeSizeRange(min: number, max: number) {
      this.graphConfig.nodeSize = { min, max };
    },

    // 设置边宽度范围
    setEdgeWidthRange(min: number, max: number) {
      this.graphConfig.edgeWidth = { min, max };
    },

    // 重置配置
    resetConfig() {
      this.graphConfig = {
        renderer: 'd3',
        layout: 'force',
        theme: 'light',
        showGrid: true,
        showMiniMap: false,
        enableAnimation: true,
        animationDuration: 300,
        nodeSize: { min: 30, max: 80 },
        edgeWidth: { min: 1, max: 5 },
        colors: {
          primary: '#1890ff',
          secondary: '#52c41a',
          accent: '#fa8c16',
          background: '#ffffff',
          text: '#000000',
          border: '#d9d9d9'
        }
      };
    },

    // 导出配置
    exportConfig() {
      return {
        graphConfig: this.graphConfig,
        preferences: this.preferences,
        layout: this.layout,
        performance: this.performance
      };
    },

    // 导入配置
    importConfig(config: any) {
      if (config.graphConfig) {
        this.updateGraphConfig(config.graphConfig);
      }
      if (config.preferences) {
        this.updatePreferences(config.preferences);
      }
      if (config.layout) {
        this.updateLayout(config.layout);
      }
      if (config.performance) {
        this.updatePerformance(config.performance);
      }
    }
  }
});
