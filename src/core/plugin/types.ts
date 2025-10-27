/**
 * 插件系统类型定义
 */

export enum PluginType {
  RENDERER = 'renderer',
  SCENE = 'scene',
  TOOL = 'tool',
  THEME = 'theme',
  LAYOUT = 'layout'
}

export interface IPlugin {
  // 基本信息
  readonly id: string
  readonly name: string
  readonly version: string
  readonly type: PluginType
  readonly description: string
  readonly author: string
  
  // 依赖管理
  readonly dependencies: string[]
  readonly optionalDependencies: string[]
  readonly peerDependencies: string[]
  
  // 生命周期
  install(context: IPluginContext): Promise<void>
  uninstall(): Promise<void>
  activate(): Promise<void>
  deactivate(): Promise<void>
  
  // 配置管理
  getConfig(): PluginConfig
  setConfig(config: Partial<PluginConfig>): void
  validateConfig(config: any): boolean
  
  // 元数据
  getMetadata(): PluginMetadata
  getCapabilities(): PluginCapabilities
}

export interface IPluginContext {
  // 系统服务
  eventBus: IEventBus
  configManager: IConfigManager
  dataManager: IDataManager
  logger: ILogger
  
  // 注册接口
  registerRenderer(factory: IRendererFactory): void
  registerScene(factory: ISceneFactory): void
  registerTool(tool: ITool): void
  registerTheme(theme: ITheme): void
  registerLayout(layout: ILayout): void
  
  // 工具接口
  createRenderer(type: string, config?: any): IRenderer
  createScene(type: string, container: HTMLElement, config?: any): IScene
  
  // 事件接口
  on(event: string, handler: EventHandler): void
  off(event: string, handler?: EventHandler): void
  emit(event: string, data?: any): void
}

export interface PluginConfig {
  enabled: boolean
  autoActivate: boolean
  priority: number
  settings: Record<string, any>
}

export interface PluginMetadata {
  id: string
  name: string
  version: string
  description: string
  author: string
  homepage?: string
  repository?: string
  license?: string
  keywords: string[]
  createdAt: Date
  updatedAt: Date
}

export interface PluginCapabilities {
  supportedRenderers?: string[]
  supportedScenes?: string[]
  supportedTools?: string[]
  supportedThemes?: string[]
  supportedLayouts?: string[]
  features: string[]
}

// 事件系统
export interface IEventBus {
  on(event: string, handler: EventHandler): void
  off(event: string, handler?: EventHandler): void
  emit(event: string, data?: any): void
  once(event: string, handler: EventHandler): void
  removeAllListeners(event?: string): void
}

export type EventHandler = (data?: any) => void

// 配置管理
export interface IConfigManager {
  get<T = any>(key: string, defaultValue?: T): T
  set(key: string, value: any): void
  has(key: string): boolean
  delete(key: string): void
  clear(): void
  getAll(): Record<string, any>
  watch(key: string, callback: (value: any, oldValue: any) => void): () => void
}

// 数据管理
export interface IDataManager {
  get<T = any>(key: string): T | null
  set(key: string, value: any): void
  has(key: string): boolean
  delete(key: string): void
  clear(): void
  getAll(): Record<string, any>
  watch(key: string, callback: (value: any, oldValue: any) => void): () => void
}

// 日志系统
export interface ILogger {
  debug(message: string, context?: any): void
  info(message: string, context?: any): void
  warn(message: string, context?: any): void
  error(message: string, context?: any): void
}

// 渲染器接口
export interface IRendererFactory {
  create(config?: any): IRenderer
  getCapabilities(): RendererCapabilities
  getDefaultConfig(): any
  validateConfig(config: any): boolean
}

export interface IRenderer {
  // 基本信息
  readonly id: string
  readonly name: string
  readonly version: string
  readonly type: string
  
  // 渲染能力
  render(container: HTMLElement, data: any, config?: any): Promise<void>
  update(data: any): Promise<void>
  clear(): void
  destroy(): void
  
  // 视图控制
  fitView(): void
  zoomTo(level: number): void
  panTo(x: number, y: number): void
  center(): void
  
  // 交互控制
  enableInteraction(): void
  disableInteraction(): void
  setInteractionMode(mode: InteractionMode): void
  
  // 事件处理
  on(event: string, handler: EventHandler): void
  off(event: string, handler?: EventHandler): void
  emit(event: string, data?: any): void
  
  // 数据操作
  getData(): any
  setData(data: any): void
  exportData(format: string): any
  
  // 性能监控
  getPerformanceMetrics(): PerformanceMetrics
}

export interface RendererCapabilities {
  nodeTypes: string[]
  edgeTypes: string[]
  layouts: string[]
  interactions: string[]
  exports: string[]
  features: string[]
}

export enum InteractionMode {
  VIEW = 'view',
  EDIT = 'edit',
  PAN = 'pan',
  ZOOM = 'zoom'
}

export interface PerformanceMetrics {
  renderTime: number
  nodeCount: number
  edgeCount: number
  memoryUsage: number
  fps?: number
}

// 场景接口
export interface ISceneFactory {
  create(container: HTMLElement, config?: any): IScene
  getConfig(): SceneConfig
  validateConfig(config: any): boolean
}

export interface IScene {
  // 基本信息
  readonly id: string
  readonly name: string
  readonly version: string
  readonly rendererId: string
  
  // 生命周期
  initialize(container: HTMLElement, config?: any): Promise<void>
  render(data: any): Promise<void>
  destroy(): void
  
  // 视图管理
  getView(): HTMLElement
  fitView(): void
  zoomTo(level: number): void
  panTo(x: number, y: number): void
  
  // 数据管理
  getData(): any
  setData(data: any): void
  updateData(updates: any): void
  
  // 交互管理
  enableInteraction(): void
  disableInteraction(): void
  
  // 工具管理
  getTools(): ITool[]
  addTool(tool: ITool): void
  removeTool(toolId: string): void
  
  // 配置管理
  getConfig(): SceneConfig
  setConfig(config: Partial<SceneConfig>): void
  
  // 事件处理
  on(event: string, handler: EventHandler): void
  off(event: string, handler?: EventHandler): void
  emit(event: string, data?: any): void
}

export interface SceneConfig {
  renderer: any
  toolbar?: {
    enabled: boolean
    tools: string[]
  }
  sidebar?: {
    enabled: boolean
    panels: string[]
  }
  autoLayout?: boolean
  validation?: boolean
  [key: string]: any
}

// 工具接口
export interface ITool {
  readonly id: string
  readonly name: string
  readonly icon: string
  readonly description: string
  
  activate(): void
  deactivate(): void
  isEnabled(): boolean
  setEnabled(enabled: boolean): void
}

// 主题接口
export interface ITheme {
  readonly id: string
  readonly name: string
  readonly colors: ThemeColors
  readonly fonts: ThemeFonts
  readonly spacing: ThemeSpacing
  readonly shadows: ThemeShadows
}

export interface ThemeColors {
  primary: string
  secondary: string
  success: string
  warning: string
  error: string
  background: string
  surface: string
  text: string
  textSecondary: string
  border: string
  [key: string]: string
}

export interface ThemeFonts {
  primary: string
  secondary: string
  mono: string
  sizes: {
    xs: string
    sm: string
    md: string
    lg: string
    xl: string
  }
}

export interface ThemeSpacing {
  xs: string
  sm: string
  md: string
  lg: string
  xl: string
}

export interface ThemeShadows {
  sm: string
  md: string
  lg: string
  xl: string
}

// 布局接口
export interface ILayout {
  readonly id: string
  readonly name: string
  readonly description: string
  
  apply(container: HTMLElement, config?: any): void
  remove(): void
  resize(): void
}
