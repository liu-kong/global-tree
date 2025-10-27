/**
 * AntV G6 插件实现
 */

import type { 
  IPlugin, 
  IPluginContext, 
  IRendererFactory, 
  ISceneFactory,
  PluginConfig,
  PluginMetadata,
  PluginCapabilities
} from '../../core/plugin/types'
import { PluginType } from '../../core/plugin/types'
import { G6RendererFactory } from '../../renderers/g6/G6RendererFactory'
import { G6SceneFactory } from '../../renderers/g6/G6SceneFactory'

export class G6Plugin implements IPlugin {
  readonly id = 'g6-plugin'
  readonly name = 'AntV G6 Plugin'
  readonly version = '1.0.0'
  readonly type = PluginType.RENDERER
  readonly description = 'AntV G6 图分析和可视化插件'
  readonly author = 'Global Tree Team'
  
  readonly dependencies = []
  readonly optionalDependencies = []
  readonly peerDependencies = []

  private context?: IPluginContext
  private rendererFactory?: G6RendererFactory
  private sceneFactory?: G6SceneFactory
  private config: PluginConfig = {
    enabled: true,
    autoActivate: true,
    priority: 2,
    settings: {
      defaultLayout: 'force',
      animationEnabled: true,
      animationDuration: 500,
      interactionEnabled: true,
      minimapEnabled: true,
      toolbarEnabled: true
    }
  }

  async install(context: IPluginContext): Promise<void> {
    this.context = context
    
    // 注册渲染器工厂
    this.rendererFactory = new G6RendererFactory()
    context.registerRenderer(this.rendererFactory)
    
    // 注册场景工厂
    this.sceneFactory = new G6SceneFactory()
    context.registerScene(this.sceneFactory)
    
    context.logger.info('G6 plugin installed')
  }

  async uninstall(): Promise<void> {
    if (this.context) {
      // 清理资源
      this.context.logger.info('G6 plugin uninstalled')
    }
  }

  async activate(): Promise<void> {
    if (this.context) {
      // 初始化 G6 全局配置
      this.initializeG6Config()
      this.context.logger.info('G6 plugin activated')
    }
  }

  async deactivate(): Promise<void> {
    if (this.context) {
      // 清理资源
      this.context.logger.info('G6 plugin deactivated')
    }
  }

  getConfig(): PluginConfig {
    return { ...this.config }
  }

  setConfig(config: Partial<PluginConfig>): void {
    this.config = { ...this.config, ...config }
  }

  validateConfig(config: any): boolean {
    return config && typeof config === 'object'
  }

  getMetadata(): PluginMetadata {
    return {
      id: this.id,
      name: this.name,
      version: this.version,
      description: this.description,
      author: this.author,
      homepage: 'https://g6.antv.antgroup.com/',
      repository: 'https://github.com/antvis/G6',
      license: 'MIT',
      keywords: ['graph', 'analysis', 'visualization', 'network', 'antv'],
      createdAt: new Date(),
      updatedAt: new Date()
    }
  }

  getCapabilities(): PluginCapabilities {
    return {
      supportedRenderers: ['G6Renderer'],
      supportedScenes: ['G6Scene'],
      supportedTools: ['select', 'pan', 'zoom', 'lasso-select', 'fisheye'],
      supportedThemes: ['default', 'dark', 'light'],
      features: [
        'graph-analysis',
        'layout-algorithms',
        'force-directed',
        'hierarchical-layout',
        'circular-layout',
        'minimap',
        'toolbar',
        'animation',
        'interaction',
        'export',
        'import',
        'custom-nodes',
        'custom-edges'
      ]
    }
  }

  private initializeG6Config(): void {
    if (!this.context) return
    
    // 设置 G6 默认配置
    this.context.configManager.set('g6.defaultLayout', 'force')
    this.context.configManager.set('g6.defaultMode', 'default')
    this.context.configManager.set('g6.animation.enabled', true)
    this.context.configManager.set('g6.animation.duration', 500)
    this.context.configManager.set('g6.interaction.enabled', true)
    this.context.configManager.set('g6.minimap.enabled', true)
    this.context.configManager.set('g6.toolbar.enabled', true)
  }

  // 插件特定的 API
  getRendererFactory(): G6RendererFactory | undefined {
    return this.rendererFactory
  }

  getSceneFactory(): G6SceneFactory | undefined {
    return this.sceneFactory
  }

  // 获取 G6 版本信息
  getVersion(): string {
    return this.version
  }

  // 检查 G6 是否可用
  isAvailable(): boolean {
    try {
      // 检查 G6 是否已加载
      return typeof window !== 'undefined' && (window as any).G6 !== undefined
    } catch {
      return false
    }
  }
}
