/**
 * 应用程序核心类
 */

import { EventBus } from './event/EventBus'
import { ConfigManager } from './config/ConfigManager'
import { PluginManager } from './plugin/PluginManager'
import { logger } from './logger/Logger'

export interface ApplicationConfig {
  name: string
  version: string
  debug?: boolean
  plugins?: string[]
  theme?: string
  locale?: string
}

export class Application {
  private static instance: Application
  private initialized = false
  private plugins = new Map<string, any>()

  public eventBus: EventBus
  public configManager: ConfigManager
  public pluginManager: PluginManager

  private constructor(private config: ApplicationConfig) {
    this.eventBus = new EventBus()
    this.configManager = new ConfigManager()
    this.pluginManager = new PluginManager(
      this.eventBus,
      this.configManager,
      this.configManager, // 使用配置管理器作为数据管理器
      logger
    )

    this.setupErrorHandling()
    this.setupPerformanceMonitoring()
  }

  static getInstance(config?: ApplicationConfig): Application {
    if (!Application.instance) {
      if (!config) {
        throw new Error('Application config is required for first initialization')
      }
      Application.instance = new Application(config)
    }
    return Application.instance
  }

  async initialize(): Promise<void> {
    if (this.initialized) {
      logger.warn('Application already initialized')
      return
    }

    try {
      logger.info(`Initializing ${this.config.name} v${this.config.version}`)
      
      // 初始化配置
      await this.initializeConfig()
      
      // 初始化插件系统
      await this.initializePlugins()
      
      // 设置全局事件监听
      this.setupGlobalEventListeners()
      
      this.initialized = true
      
      logger.info('Application initialized successfully')
      this.eventBus.emit('app:initialized')
      
    } catch (error) {
      logger.error('Failed to initialize application:', error)
      throw error
    }
  }

  private async initializeConfig(): Promise<void> {
    // 设置默认配置
    const defaultConfig = {
      app: {
        name: this.config.name,
        version: this.config.version,
        debug: this.config.debug || false
      },
      theme: {
        id: this.config.theme || 'default',
        mode: 'light'
      },
      locale: this.config.locale || 'zh-CN',
      renderer: {
        default: 'x6',
        performance: {
          enabled: true,
          maxNodes: 1000,
          enableVirtualization: true
        }
      }
    }

    // 合并用户配置
    this.configManager.update(defaultConfig)
    
    logger.info('Configuration initialized')
  }

  private async initializePlugins(): Promise<void> {
    const pluginIds = this.config.plugins || []
    
    if (pluginIds.length > 0) {
      logger.info(`Loading ${pluginIds.length} plugins`)
      
      for (const pluginId of pluginIds) {
        try {
          await this.loadPlugin(pluginId)
        } catch (error) {
          logger.error(`Failed to load plugin ${pluginId}:`, error)
        }
      }
    }
    
    logger.info('Plugin system initialized')
  }

  private async loadPlugin(pluginId: string): Promise<void> {
    try {
      // 动态导入插件
      const pluginModule = await import(/* @vite-ignore */ `../plugins/${pluginId}`)
      
      // 尝试多种方式获取插件类
      let PluginClass = pluginModule.default
      
      // 如果没有 default，尝试查找以大写字母开头的类
      if (!PluginClass) {
        const className = pluginId.split('/').pop() // 获取最后一部分，如 'X6Plugin'
        if (className) {
          // 将 x6/X6Plugin 转换为 X6Plugin
          const pluginClassName = className.split('-').map(part => 
            part.charAt(0).toUpperCase() + part.slice(1)
          ).join('')
          PluginClass = pluginModule[pluginClassName]
        }
      }
      
      // 如果还是找不到，尝试查找第一个导出的类
      if (!PluginClass) {
        for (const key in pluginModule) {
          const exportValue = pluginModule[key]
          if (typeof exportValue === 'function' && 
              exportValue.prototype && 
              exportValue.name.includes('Plugin')) {
            PluginClass = exportValue
            break
          }
        }
      }
      
      if (!PluginClass) {
        throw new Error(`Plugin class not found in module ${pluginId}`)
      }

      const plugin = new PluginClass()
      await this.pluginManager.installPlugin(plugin)
      await this.pluginManager.activatePlugin(plugin.id)
      
      this.plugins.set(pluginId, plugin)
      logger.info(`Plugin ${pluginId} loaded successfully`)
      
    } catch (error) {
      logger.error(`Failed to load plugin ${pluginId}:`, error)
      throw error
    }
  }

  private setupGlobalEventListeners(): void {
    // 监听插件事件
    this.eventBus.on('plugin:error', (data) => {
      logger.error('Plugin error:', data)
    })

    // 监听配置变化
    this.configManager.watch('app.debug', (debug) => {
      if (debug) {
        logger.setLevel(0) // DEBUG
        logger.info('Debug mode enabled')
      } else {
        logger.setLevel(1) // INFO
        logger.info('Debug mode disabled')
      }
    })

    // 监听性能事件
    this.eventBus.on('performance:warning', (data) => {
      logger.warn('Performance warning:', data)
    })

    // 监听错误事件
    this.eventBus.on('error', (data) => {
      logger.error('Application error:', data)
    })
  }

  private setupErrorHandling(): void {
    // 全局错误处理
    window.addEventListener('error', (event) => {
      logger.error('Global error:', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error
      })
    })

    // 未处理的 Promise 拒绝
    window.addEventListener('unhandledrejection', (event) => {
      logger.error('Unhandled promise rejection:', {
        reason: event.reason,
        promise: event.promise
      })
    })
  }

  private setupPerformanceMonitoring(): void {
    // 监控内存使用
    if (this.config.debug) {
      setInterval(() => {
        logger.logMemoryUsage('Periodic check')
      }, 30000) // 每30秒检查一次
    }

    // 监控长任务
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.duration > 50) { // 超过50ms的任务
            logger.warn('Long task detected:', {
              name: entry.name,
              duration: entry.duration,
              startTime: entry.startTime
            })
          }
        })
      })
      
      observer.observe({ entryTypes: ['longtask'] })
    }
  }

  // 公共API
  async loadPluginAsync(pluginId: string): Promise<void> {
    await this.loadPlugin(pluginId)
  }

  async unloadPlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId)
    if (plugin) {
      await this.pluginManager.deactivatePlugin(pluginId)
      await this.pluginManager.uninstallPlugin(pluginId)
      this.plugins.delete(pluginId)
      logger.info(`Plugin ${pluginId} unloaded`)
    }
  }

  getPlugin(pluginId: string): any {
    return this.plugins.get(pluginId)
  }

  getLoadedPlugins(): string[] {
    return Array.from(this.plugins.keys())
  }

  getConfig(): ApplicationConfig {
    return { ...this.config }
  }

  isInitialized(): boolean {
    return this.initialized
  }

  // 重新加载应用
  async reload(): Promise<void> {
    logger.info('Reloading application...')
    
    // 清理资源
    this.destroy()
    
    // 重新初始化
    await this.initialize()
    
    logger.info('Application reloaded')
  }

  // 销毁应用
  destroy(): void {
    if (!this.initialized) {
      return
    }

    logger.info('Destroying application...')

    // 卸载所有插件
    this.plugins.forEach(async (_, pluginId) => {
      try {
        await this.unloadPlugin(pluginId)
      } catch (error) {
        logger.error(`Error unloading plugin ${pluginId}:`, error)
      }
    })

    // 清理插件管理器
    this.pluginManager.destroy()

    // 清理事件总线
    this.eventBus.removeAllListeners()

    // 清理配置管理器
    this.configManager.clear()

    this.initialized = false
    logger.info('Application destroyed')
  }

  // 获取应用状态
  getStatus(): {
    initialized: boolean
    plugins: string[]
    config: ApplicationConfig
    performance: {
      memory?: any
      uptime: number
    }
  } {
    return {
      initialized: this.initialized,
      plugins: this.getLoadedPlugins(),
      config: this.getConfig(),
      performance: {
        memory: (performance as any).memory,
        uptime: performance.now()
      }
    }
  }
}

// 创建应用实例的工厂函数
export function createApplication(config: ApplicationConfig): Application {
  return Application.getInstance(config)
}
