/**
 * 插件管理器实现
 */

import type { 
  IPlugin, 
  IPluginContext, 
  IRendererFactory, 
  ISceneFactory, 
  ITool, 
  ITheme, 
  ILayout,
  PluginType 
} from './types'
import { EventBus } from '../event/EventBus'
import { ConfigManager } from '../config/ConfigManager'

export class PluginManager implements IPluginContext {
  private plugins = new Map<string, IPlugin>()
  private rendererFactories = new Map<string, IRendererFactory>()
  private sceneFactories = new Map<string, ISceneFactory>()
  private tools = new Map<string, ITool>()
  private themes = new Map<string, ITheme>()
  private layouts = new Map<string, ILayout>()
  private data = new Map<string, any>()

  constructor(
    public eventBus: EventBus,
    public configManager: ConfigManager,
    public dataManager: ConfigManager,
    public logger: any
  ) {}

  // 插件生命周期管理
  async installPlugin(plugin: IPlugin): Promise<void> {
    try {
      // 检查依赖
      await this.checkDependencies(plugin)
      
      // 安装插件
      await plugin.install(this)
      
      // 注册插件
      this.plugins.set(plugin.id, plugin)
      
      this.logger.info(`Plugin ${plugin.name} installed successfully`)
      this.eventBus.emit('plugin:installed', { plugin })
      
    } catch (error) {
      this.logger.error(`Failed to install plugin ${plugin.name}:`, error)
      throw error
    }
  }

  async uninstallPlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId)
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`)
    }

    try {
      // 先停用插件
      if (this.isPluginActive(pluginId)) {
        await this.deactivatePlugin(pluginId)
      }
      
      // 卸载插件
      await plugin.uninstall()
      
      // 移除插件
      this.plugins.delete(pluginId)
      
      this.logger.info(`Plugin ${plugin.name} uninstalled successfully`)
      this.eventBus.emit('plugin:uninstalled', { pluginId })
      
    } catch (error) {
      this.logger.error(`Failed to uninstall plugin ${pluginId}:`, error)
      throw error
    }
  }

  async activatePlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId)
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`)
    }

    if (this.isPluginActive(pluginId)) {
      return
    }

    try {
      await plugin.activate()
      this.logger.info(`Plugin ${plugin.name} activated successfully`)
      this.eventBus.emit('plugin:activated', { plugin })
      
    } catch (error) {
      this.logger.error(`Failed to activate plugin ${pluginId}:`, error)
      throw error
    }
  }

  async deactivatePlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId)
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`)
    }

    if (!this.isPluginActive(pluginId)) {
      return
    }

    try {
      await plugin.deactivate()
      this.logger.info(`Plugin ${plugin.name} deactivated successfully`)
      this.eventBus.emit('plugin:deactivated', { plugin })
      
    } catch (error) {
      this.logger.error(`Failed to deactivate plugin ${pluginId}:`, error)
      throw error
    }
  }

  private async checkDependencies(plugin: IPlugin): Promise<void> {
    for (const depId of plugin.dependencies) {
      if (!this.plugins.has(depId)) {
        throw new Error(`Dependency ${depId} not found for plugin ${plugin.name}`)
      }
    }

    for (const depId of plugin.optionalDependencies) {
      if (this.plugins.has(depId)) {
        await this.activatePlugin(depId)
      }
    }
  }

  private isPluginActive(pluginId: string): boolean {
    // 这里可以通过插件状态来判断，简化实现
    return true
  }

  // 注册接口实现
  registerRenderer(factory: IRendererFactory): void {
    this.rendererFactories.set(factory.constructor.name, factory)
    this.eventBus.emit('renderer:registered', { factory })
  }

  registerScene(factory: ISceneFactory): void {
    this.sceneFactories.set(factory.constructor.name, factory)
    this.eventBus.emit('scene:registered', { factory })
  }

  registerTool(tool: ITool): void {
    this.tools.set(tool.id, tool)
    this.eventBus.emit('tool:registered', { tool })
  }

  registerTheme(theme: ITheme): void {
    this.themes.set(theme.id, theme)
    this.eventBus.emit('theme:registered', { theme })
  }

  registerLayout(layout: ILayout): void {
    this.layouts.set(layout.id, layout)
    this.eventBus.emit('layout:registered', { layout })
  }

  // 工具接口实现
  createRenderer(type: string, config?: any) {
    const factory = this.rendererFactories.get(type)
    if (!factory) {
      throw new Error(`Renderer factory ${type} not found`)
    }
    return factory.create(config)
  }

  createScene(type: string, container: HTMLElement, config?: any) {
    const factory = this.sceneFactories.get(type)
    if (!factory) {
      throw new Error(`Scene factory ${type} not found`)
    }
    return factory.create(container, config)
  }

  // 事件接口实现
  on(event: string, handler: any): void {
    this.eventBus.on(event, handler)
  }

  off(event: string, handler?: any): void {
    this.eventBus.off(event, handler)
  }

  emit(event: string, data?: any): void {
    this.eventBus.emit(event, data)
  }

  // 插件查询接口
  getPlugin(id: string): IPlugin | undefined {
    return this.plugins.get(id)
  }

  getPluginsByType(type: PluginType): IPlugin[] {
    return Array.from(this.plugins.values()).filter(plugin => plugin.type === type)
  }

  getAllPlugins(): IPlugin[] {
    return Array.from(this.plugins.values())
  }

  // 资源获取接口
  getRendererFactory(type: string): IRendererFactory | undefined {
    return this.rendererFactories.get(type)
  }

  getSceneFactory(type: string): ISceneFactory | undefined {
    return this.sceneFactories.get(type)
  }

  getTool(id: string): ITool | undefined {
    return this.tools.get(id)
  }

  getTheme(id: string): ITheme | undefined {
    return this.themes.get(id)
  }

  getLayout(id: string): ILayout | undefined {
    return this.layouts.get(id)
  }

  // 列表获取接口
  getAvailableRenderers(): string[] {
    return Array.from(this.rendererFactories.keys())
  }

  getAvailableScenes(): string[] {
    return Array.from(this.sceneFactories.keys())
  }

  getAvailableTools(): string[] {
    return Array.from(this.tools.keys())
  }

  getAvailableThemes(): string[] {
    return Array.from(this.themes.keys())
  }

  getAvailableLayouts(): string[] {
    return Array.from(this.layouts.keys())
  }

  // 插件状态管理
  getPluginStatus(pluginId: string): 'installed' | 'active' | 'inactive' | 'error' {
    const plugin = this.plugins.get(pluginId)
    if (!plugin) {
      return 'error'
    }
    
    // 简化实现，实际应该维护插件状态
    return 'active'
  }

  // 批量操作
  async installPlugins(plugins: IPlugin[]): Promise<void> {
    const results = await Promise.allSettled(
      plugins.map(plugin => this.installPlugin(plugin))
    )
    
    const failures = results.filter(result => result.status === 'rejected')
    if (failures.length > 0) {
      throw new Error(`Failed to install ${failures.length} plugins`)
    }
  }

  async activatePlugins(pluginIds: string[]): Promise<void> {
    const results = await Promise.allSettled(
      pluginIds.map(id => this.activatePlugin(id))
    )
    
    const failures = results.filter(result => result.status === 'rejected')
    if (failures.length > 0) {
      throw new Error(`Failed to activate ${failures.length} plugins`)
    }
  }

  // 插件配置管理
  setPluginConfig(pluginId: string, config: any): void {
    const plugin = this.plugins.get(pluginId)
    if (plugin) {
      plugin.setConfig(config)
      this.eventBus.emit('plugin:config-changed', { pluginId, config })
    }
  }

  getPluginConfig(pluginId: string): any {
    const plugin = this.plugins.get(pluginId)
    return plugin?.getConfig()
  }

  // 清理资源
  destroy(): void {
    // 停用所有插件
    this.plugins.forEach(async (plugin) => {
      try {
        await this.deactivatePlugin(plugin.id)
      } catch (error) {
        this.logger.error(`Error deactivating plugin ${plugin.id}:`, error)
      }
    })

    // 清理资源
    this.plugins.clear()
    this.rendererFactories.clear()
    this.sceneFactories.clear()
    this.tools.clear()
    this.themes.clear()
    this.layouts.clear()
    this.data.clear()
  }
}
