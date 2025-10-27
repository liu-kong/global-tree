/**
 * 思维导图场景插件
 */

import type { 
  IPlugin, 
  IPluginContext,
  ISceneFactory,
  PluginConfig,
  PluginMetadata,
  PluginCapabilities
} from '../../../core/plugin/types'
import { PluginType } from '../../../core/plugin/types'
import { MindmapSceneFactory } from './MindmapSceneFactory'

export class MindmapPlugin implements IPlugin {
  readonly id = 'mindmap-plugin'
  readonly name = 'Mindmap Plugin'
  readonly version = '1.0.0'
  readonly type = PluginType.SCENE
  readonly description = '思维导图场景插件，基于AntV X6实现'
  readonly author = 'Global Tree Team'
  
  readonly dependencies = ['x6-plugin']
  readonly optionalDependencies = []
  readonly peerDependencies = []

  private context?: IPluginContext
  private config: PluginConfig = {
    enabled: true,
    autoActivate: true,
    priority: 2,
    settings: {
      layout: 'mindmap',
      direction: 'H',
      nodeSpacing: 40,
      levelSpacing: 80,
      animation: true,
      theme: 'default'
    }
  }

  async install(context: IPluginContext): Promise<void> {
    this.context = context
    
    // 注册思维导图场景工厂
    const sceneFactory = new MindmapSceneFactory()
    context.registerScene(sceneFactory)
    
    context.logger.info('Mindmap plugin installed')
  }

  async uninstall(): Promise<void> {
    if (this.context) {
      this.context.logger.info('Mindmap plugin uninstalled')
    }
  }

  async activate(): Promise<void> {
    if (this.context) {
      this.context.logger.info('Mindmap plugin activated')
    }
  }

  async deactivate(): Promise<void> {
    if (this.context) {
      this.context.logger.info('Mindmap plugin deactivated')
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
      homepage: 'https://global-tree.dev/',
      repository: 'https://github.com/global-tree/global-tree',
      license: 'MIT',
      keywords: ['mindmap', 'x6', 'scene', 'antv'],
      createdAt: new Date(),
      updatedAt: new Date()
    }
  }

  getCapabilities(): PluginCapabilities {
    return {
      supportedRenderers: ['X6Renderer'],
      supportedScenes: ['MindmapScene'],
      supportedTools: ['select', 'pan', 'zoom', 'node-add', 'node-edit', 'node-delete'],
      supportedThemes: ['default', 'dark', 'light'],
      features: [
        'hierarchical-layout',
        'node-editing',
        'keyboard-shortcuts',
        'export',
        'import',
        'custom-node-styles',
        'expand-collapse',
        'drag-and-drop'
      ]
    }
  }
}
