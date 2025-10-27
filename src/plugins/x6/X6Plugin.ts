/**
 * AntV X6 插件实现
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
import { X6RendererFactory } from '../../renderers/x6/X6RendererFactory'
import { X6SceneFactory } from '../../renderers/x6/X6SceneFactory'

export class X6Plugin implements IPlugin {
  readonly id = 'x6-plugin'
  readonly name = 'AntV X6 Plugin'
  readonly version = '1.0.0'
  readonly type = PluginType.RENDERER
  readonly description = 'AntV X6 图形编辑器插件，支持流程图、思维导图等'
  readonly author = 'Global Tree Team'
  
  readonly dependencies = []
  readonly optionalDependencies = []
  readonly peerDependencies = []

  private context?: IPluginContext
  private config: PluginConfig = {
    enabled: true,
    autoActivate: true,
    priority: 1,
    settings: {
      gridSize: 10,
      snapToGrid: true,
      allowMultiSelect: true,
      keyboardShortcuts: true,
      minimap: true,
      history: true
    }
  }

  async install(context: IPluginContext): Promise<void> {
    this.context = context
    
    // 注册渲染器工厂
    const rendererFactory = new X6RendererFactory()
    context.registerRenderer(rendererFactory)
    
    // 注册场景工厂
    const sceneFactory = new X6SceneFactory()
    context.registerScene(sceneFactory)
    
    context.logger.info('X6 plugin installed')
  }

  async uninstall(): Promise<void> {
    if (this.context) {
      // 清理资源
      this.context.logger.info('X6 plugin uninstalled')
    }
  }

  async activate(): Promise<void> {
    if (this.context) {
      this.context.logger.info('X6 plugin activated')
    }
  }

  async deactivate(): Promise<void> {
    if (this.context) {
      this.context.logger.info('X6 plugin deactivated')
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
      homepage: 'https://x6.antv.antgroup.com/',
      repository: 'https://github.com/antvis/X6',
      license: 'MIT',
      keywords: ['graph', 'editor', 'flowchart', 'mindmap', 'antv'],
      createdAt: new Date(),
      updatedAt: new Date()
    }
  }

  getCapabilities(): PluginCapabilities {
    return {
      supportedRenderers: ['X6Renderer'],
      supportedScenes: ['X6Scene'],
      supportedTools: ['select', 'pan', 'zoom', 'node-add', 'edge-add'],
      supportedThemes: ['default', 'dark', 'light'],
      features: [
        'drag-and-drop',
        'undo-redo',
        'minimap',
        'keyboard-shortcuts',
        'export',
        'import',
        'custom-nodes',
        'custom-edges',
        'layout-algorithms'
      ]
    }
  }
}
