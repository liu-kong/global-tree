/**
 * G6 渲染器实现
 */

import type { IRenderer, EventHandler, PerformanceMetrics } from '../../core/plugin/types'
import { InteractionMode } from '../../core/plugin/types'
import type { GraphData, KnowledgeNode, KnowledgeEdge } from '../../types/graph'
import { logger } from '../../core/logger/Logger'

// G6 类型定义（简化版本）
interface G6Graph {
  container: string | HTMLElement
  width?: number
  height?: number
  modes: any
  defaultNode: any
  defaultEdge: any
  layout: any
  animate: boolean
  renderer: string
  fitView: boolean
  fitCenter: boolean
  data(data: any): void
  render(): void
  destroy(): void
  on(event: string, handler: EventHandler): void
  off(event: string, handler?: EventHandler): void
  emit(event: string, data?: any): void
  addItem(type: string, item: any): any
  removeItem(item: any): void
  updateItem(item: any, cfg: any): void
  findById(id: string): any
  findAllByState(type: string, state: string): any[]
  setItemState(item: any, state: string, value: boolean): void
  clearItemState(item: any, states: string[]): void
  getZoom(): number
  zoomTo(ratio: number, center?: { x: number; y: number }): void
  zoom(ratio: number, center?: { x: number; y: number }): void
  translate(tx: number, ty: number): void
  focusPoint(point: { x: number; y: number }, ratio?: number): void
  fitViewGraph?(padding?: number[] | number): void
  fitCenterGraph?(): void
  changeSize(width: number, height: number): void
  getGroupById(id: string): any
  getNodeByCanvas(x: number, y: number): any
  getEdgeByCanvas(x: number, y: number): any
  getGroupByCanvas(x: number, y: number): any
  refresh(): void
  paint(): void
  stopAnimate(): void
  getCurrentMode(): string
  setMode(mode: string): void
  getStates(): any[]
  enableBehaviors(behaviors: string[]): void
  disableBehaviors(behaviors: string[]): void
  isDestroyed(): boolean
}

declare global {
  interface Window {
    G6: {
      Graph: new (config: any) => G6Graph
      registerBehavior(name: string, behavior: any): void
      registerNode(name: string, node: any): void
      registerEdge(name: string, edge: any): void
      registerLayout(name: string, layout: any): void
      Util: any
      Layout: any
    }
  }
}

export class G6Renderer implements IRenderer {
  readonly id = 'g6-renderer'
  readonly name = 'G6 Renderer'
  readonly version = '1.0.0'
  readonly type = 'g6'

  private container: HTMLElement | null = null
  private graph: G6Graph | null = null
  private config: any = {}
  private data: GraphData | null = null
  private eventListeners = new Map<string, EventHandler[]>()
  private isInitialized = false
  private interactionMode = InteractionMode.VIEW

  // 性能监控
  private performanceMetrics: PerformanceMetrics = {
    renderTime: 0,
    nodeCount: 0,
    edgeCount: 0,
    memoryUsage: 0,
    fps: 60
  }

  constructor(config?: any) {
    this.config = this.mergeConfig(config)
  }

  private mergeConfig(userConfig?: any): any {
    const defaultConfig = {
      width: 800,
      height: 600,
      modes: {
        default: ['drag-canvas', 'zoom-canvas', 'drag-node'],
        edit: ['click-select', 'drag-node']
      },
      defaultNode: {
        type: 'circle',
        size: 30,
        style: {
          fill: '#C6E5FF',
          stroke: '#5B8FF9',
          lineWidth: 2
        },
        labelCfg: {
          style: {
            fill: '#000',
            fontSize: 12
          }
        }
      },
      defaultEdge: {
        type: 'line',
        style: {
          stroke: '#e2e2e2',
          lineWidth: 2
        },
        labelCfg: {
          autoRotate: true,
          style: {
            fill: '#000',
            fontSize: 12
          }
        }
      },
      layout: {
        type: 'force',
        preventOverlap: true,
        nodeSize: 30,
        linkDistance: 100,
        nodeStrength: -50,
        edgeStrength: 0.1
      },
      animate: true,
      renderer: 'canvas',
      fitView: true,
      fitCenter: true
    }

    return { ...defaultConfig, ...userConfig }
  }

  async render(container: HTMLElement, data: GraphData, config?: any): Promise<void> {
    const startTime = performance.now()
    
    try {
      this.container = container
      this.config = this.mergeConfig({ ...this.config, ...config })
      this.data = data

      // 加载 G6
      await this.loadG6()

      // 初始化图形
      this.initializeGraph()

      // 渲染数据
      this.renderData(data)

      this.isInitialized = true

      // 更新性能指标
      this.performanceMetrics.renderTime = performance.now() - startTime
      this.performanceMetrics.nodeCount = data.nodes.length
      this.performanceMetrics.edgeCount = data.edges.length

      logger.info('G6 renderer rendered successfully', this.performanceMetrics)
      this.emit('render:complete', this.performanceMetrics)

    } catch (error) {
      logger.error('Failed to render with G6:', error)
      throw error
    }
  }

  private async loadG6(): Promise<void> {
    if (window.G6) {
      return // G6 已经加载
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = 'https://unpkg.com/@antv/g6@4.8.24/dist/g6.min.js'
      script.onload = () => resolve()
      script.onerror = () => reject(new Error('Failed to load G6'))
      document.head.appendChild(script)
    })
  }

  private initializeGraph(): void {
    if (!this.container || !window.G6) return

    // 清除现有内容
    this.container.innerHTML = ''

    // 创建 G6 图实例
    this.graph = new window.G6.Graph({
      container: this.container,
      width: this.config.width,
      height: this.config.height,
      modes: this.config.modes,
      defaultNode: this.config.defaultNode,
      defaultEdge: this.config.defaultEdge,
      layout: this.config.layout,
      animate: this.config.animate,
      renderer: this.config.renderer,
      fitView: this.config.fitView,
      fitCenter: this.config.fitCenter
    })

    // 设置事件监听
    this.setupEventListeners()

    logger.info('G6 graph initialized')
  }

  private setupEventListeners(): void {
    if (!this.graph) return

    this.graph.on('node:click', (e: any) => {
      this.emit('node:click', e.item)
    })

    this.graph.on('edge:click', (e: any) => {
      this.emit('edge:click', e.item)
    })

    this.graph.on('canvas:click', () => {
      this.emit('canvas:click')
    })
  }

  private renderData(data: GraphData): void {
    if (!this.graph) return

    // 处理数据
    const processedData = {
      nodes: data.nodes.map((node: any) => ({
        id: node.id,
        label: node.label || node.id,
        type: node.type || 'circle',
        size: node.size || 30,
        style: node.style || {},
        ...node
      })),
      edges: data.edges.map((edge: any) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        label: edge.label,
        style: edge.style || {},
        ...edge
      }))
    }

    // 设置数据并渲染
    this.graph.data(processedData)
    this.graph.render()

    // 适应视图
    if (this.config.fitView) {
      this.graph.fitView()
    }
  }

  async update(data: GraphData): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Renderer not initialized')
    }

    const startTime = performance.now()

    try {
      this.data = data
      this.renderData(data)

      this.performanceMetrics.renderTime = performance.now() - startTime
      this.performanceMetrics.nodeCount = data.nodes.length
      this.performanceMetrics.edgeCount = data.edges.length

      logger.info('G6 renderer updated successfully')
      this.emit('update:complete', this.performanceMetrics)
    } catch (error) {
      logger.error('Failed to update G6 renderer:', error)
      throw error
    }
  }

  clear(): void {
    if (!this.graph) return

    this.graph.clear()
    logger.info('G6 renderer cleared')
  }

  destroy(): void {
    if (this.graph) {
      this.graph.destroy()
      this.graph = null
    }

    this.container = null
    this.data = null
    this.eventListeners.clear()
    this.isInitialized = false

    logger.info('G6 renderer destroyed')
  }

  fitView(): void {
    if (this.graph) {
      this.graph.fitView()
    }
  }

  zoomTo(level: number): void {
    if (this.graph) {
      this.graph.zoomTo(level)
    }
  }

  panTo(x: number, y: number): void {
    if (this.graph) {
      this.graph.focusPoint({ x, y })
    }
  }

  center(): void {
    if (this.graph) {
      this.graph.fitCenter()
    }
  }

  enableInteraction(): void {
    this.interactionMode = InteractionMode.VIEW
    if (this.graph) {
      this.graph.setMode('default')
    }
  }

  disableInteraction(): void {
    this.interactionMode = InteractionMode.VIEW
    if (this.graph) {
      this.graph.setMode('readonly')
    }
  }

  setInteractionMode(mode: InteractionMode): void {
    this.interactionMode = mode
    if (this.graph) {
      switch (mode) {
        case InteractionMode.VIEW:
          this.graph.setMode('default')
          break
        case InteractionMode.EDIT:
          this.graph.setMode('edit')
          break
        case InteractionMode.PAN:
          this.graph.setMode('pan')
          break
        case InteractionMode.ZOOM:
          this.graph.setMode('zoom')
          break
      }
    }
  }

  on(event: string, handler: EventHandler): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, [])
    }
    this.eventListeners.get(event)!.push(handler)
  }

  off(event: string, handler?: EventHandler): void {
    if (!this.eventListeners.has(event)) return

    if (handler) {
      const listeners = this.eventListeners.get(event)!
      const index = listeners.indexOf(handler)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    } else {
      this.eventListeners.delete(event)
    }
  }

  emit(event: string, data?: any): void {
    if (!this.eventListeners.has(event)) return

    const listeners = this.eventListeners.get(event)!
    listeners.forEach(handler => {
      try {
        handler(data)
      } catch (error) {
        logger.error('Error in event handler:', error)
      }
    })
  }

  getData(): any {
    return this.data
  }

  setData(data: any): void {
    this.data = data
  }

  exportData(format: string): any {
    if (!this.data) return null

    switch (format.toLowerCase()) {
      case 'json':
        return JSON.stringify(this.data, null, 2)
      case 'png':
        return this.exportAsPNG()
      case 'svg':
        return this.exportAsSVG()
      default:
        throw new Error(`Unsupported export format: ${format}`)
    }
  }

  private exportAsPNG(): string {
    if (!this.graph) return ''
    
    // 简化的 PNG 导出实现
    // 在实际应用中，需要使用 canvas 或者其他库来转换
    return ''
  }

  private exportAsSVG(): string {
    if (!this.graph) return ''
    
    // 简化的 SVG 导出实现
    return ''
  }

  getPerformanceMetrics(): PerformanceMetrics {
    return { ...this.performanceMetrics }
  }
}
