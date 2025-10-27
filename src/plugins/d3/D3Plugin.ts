/**
 * D3.js 插件
 * 提供 D3.js 渲染器支持
 */

import type { IPlugin, IPluginContext } from '../../core/plugin/types'
import { PluginType } from '../../core/plugin/types'
import { D3RendererFactory } from '../../renderers/d3/D3RendererFactory'
import { logger } from '../../core/logger/Logger'

export class D3Plugin implements IPlugin {
  readonly id = 'd3-plugin'
  readonly name = 'D3.js Plugin'
  readonly version = '1.0.0'
  readonly type = PluginType.RENDERER
  readonly description = 'D3.js visualization plugin for advanced data visualization'
  readonly author = 'Global Tree Team'
  readonly dependencies = []
  readonly optionalDependencies = []
  readonly peerDependencies = []

  private config = {
    enabled: true,
    autoActivate: true,
    priority: 3,
    settings: {
      defaultLayout: 'force',
      animationDuration: 300,
      enableTransitions: true
    }
  }

  private rendererFactory: D3RendererFactory | null = null

  async install(context: IPluginContext): Promise<void> {
    logger.info('Installing D3 plugin...')
    
    // 注册渲染器工厂
    this.rendererFactory = new D3RendererFactory()
    context.registerRenderer(this.rendererFactory)

    logger.info('D3 plugin installed successfully')
  }

  async uninstall(): Promise<void> {
    logger.info('Uninstalling D3 plugin...')
    
    if (this.rendererFactory) {
      this.rendererFactory = null
    }
    
    logger.info('D3 plugin uninstalled')
  }

  async activate(): Promise<void> {
    logger.info('Activating D3 plugin...')
    logger.info('D3 plugin activated')
  }

  async deactivate(): Promise<void> {
    logger.info('Deactivating D3 plugin...')
    logger.info('D3 plugin deactivated')
  }

  getConfig() {
    return this.config
  }

  setConfig(config: Partial<typeof this.config>): void {
    Object.assign(this.config.settings, config.settings || {})
  }

  validateConfig(config: any): boolean {
    return config && typeof config === 'object'
  }

  getMetadata() {
    return {
      id: this.id,
      name: this.name,
      version: this.version,
      description: this.description,
      author: this.author,
      keywords: ['d3', 'visualization', 'svg', 'canvas'],
      createdAt: new Date(),
      updatedAt: new Date()
    }
  }

  getCapabilities() {
    return {
      supportedRenderers: ['d3'],
      features: [
        'force-layout',
        'tree-layout',
        'pack-layout',
        'svg-rendering',
        'canvas-rendering',
        'transitions',
        'interactions',
        'data-binding'
      ]
    }
  }

  getRendererFactory(): D3RendererFactory | null {
    return this.rendererFactory
  }
}
