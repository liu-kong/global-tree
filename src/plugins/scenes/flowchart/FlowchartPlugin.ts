/**
 * 流程图插件实现
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
import { FlowchartSceneFactory } from './FlowchartSceneFactory'

export class FlowchartPlugin implements IPlugin {
  readonly id = 'flowchart-plugin'
  readonly name = 'Flowchart Plugin'
  readonly version = '1.0.0'
  readonly type = PluginType.SCENE
  readonly description = '流程图编辑器插件，支持各种流程图节点和连接'
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
      gridSize: 10,
      snapToGrid: true,
      allowMultiSelect: true,
      keyboardShortcuts: true,
      defaultNodeWidth: 120,
      defaultNodeHeight: 60,
      connectionStyle: 'manhattan'
    }
  }

  async install(context: IPluginContext): Promise<void> {
    this.context = context
    
    // 注册场景工厂
    const sceneFactory = new FlowchartSceneFactory()
    context.registerScene(sceneFactory)
    
    context.logger.info('Flowchart plugin installed')
  }

  async uninstall(): Promise<void> {
    if (this.context) {
      // 清理资源
      this.context.logger.info('Flowchart plugin uninstalled')
    }
  }

  async activate(): Promise<void> {
    if (this.context) {
      this.context.logger.info('Flowchart plugin activated')
    }
  }

  async deactivate(): Promise<void> {
    if (this.context) {
      this.context.logger.info('Flowchart plugin deactivated')
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
      keywords: ['flowchart', 'diagram', 'editor', 'antv', 'x6'],
      createdAt: new Date(),
      updatedAt: new Date()
    }
  }

  getCapabilities(): PluginCapabilities {
    return {
      supportedRenderers: ['X6Renderer'],
      supportedScenes: ['FlowchartScene'],
      supportedTools: ['select', 'pan', 'zoom', 'node-add', 'edge-add', 'delete'],
      supportedThemes: ['default', 'dark', 'light'],
      features: [
        'drag-and-drop',
        'undo-redo',
        'grid-snap',
        'keyboard-shortcuts',
        'export',
        'import',
        'custom-nodes',
        'custom-edges',
        'connection-validation',
        'node-ports',
        'flowchart-layout'
      ]
    }
  }
}
