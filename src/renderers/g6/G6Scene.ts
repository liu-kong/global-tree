/**
 * G6 场景实现
 */

import type { 
  IScene, 
  EventHandler, 
  SceneConfig,
  ITool 
} from '../../core/plugin/types'
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
  fitViewGraph(padding?: number[] | number): void
  fitCenterGraph(): void
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

export class G6Scene implements IScene {
  readonly id = 'g6-scene'
  readonly name = 'G6 Scene'
  readonly version = '1.0.0'
  readonly rendererId = 'g6'

  private container: HTMLElement | null = null
  private graph: G6Graph | null = null
  private config: SceneConfig = {}
  private data: any = null
  private tools = new Map<string, ITool>()
  private eventListeners = new Map<string, EventHandler[]>()
  private isInitialized = false

  constructor(container: HTMLElement, config?: any) {
    this.container = container
    this.config = { ...this.getDefaultConfig(), ...config }
  }

  private getDefaultConfig(): SceneConfig {
    return {
      renderer: 'g6',
      toolbar: {
        enabled: true,
        tools: ['select', 'pan', 'zoom']
      },
      sidebar: {
        enabled: false,
        panels: []
      },
      autoLayout: true,
      validation: false
    }
  }

  async initialize(container: HTMLElement, config?: any): Promise<void> {
    try {
      this.container = container
      this.config = { ...this.config, ...config }

      // 加载 G6
      await this.loadG6()

      // 创建图形实例
      this.createGraph()

      this.isInitialized = true
      logger.info('G6 scene initialized')
    } catch (error) {
      logger.error('Failed to initialize G6 scene:', error)
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

  private createGraph(): void {
    if (!this.container || !window.G6) return

    const graphConfig = {
      container: this.container,
      width: this.container.clientWidth,
      height: this.container.clientHeight,
      modes: {
        default: ['drag-canvas', 'zoom-canvas', 'drag-node'],
        edit: ['click-select']
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

    this.graph = new window.G6.Graph(graphConfig)

    // 设置事件监听
    this.setupEventListeners()

    logger.info('G6 graph created')
  }

  private setupEventListeners(): void {
    if (!this.graph) return

    this.graph.on('node:click', (e: any) => {
      this.emit('node:click', e.item)
    })

    this.graph.on('edge:click', (e: any) => {
      this.emit('edge:click', e.item)
    })

    this.graph.on('node:dragstart', (e: any) => {
      this.emit('node:dragstart', e.item)
    })

    this.graph.on('node:drag', (e: any) => {
      this.emit('node:drag', e.item)
    })

    this.graph.on('node:dragend', (e: any) => {
      this.emit('node:dragend', e.item)
    })

    this.graph.on('canvas:click', () => {
      this.emit('canvas:click')
    })
  }

  async render(data: any): Promise<void> {
    if (!this.graph) {
      throw new Error('Scene not initialized')
    }

    try {
      this.data = data
      
      // 处理数据
      const processedData = this.processData(data)
      
      // 设置数据并渲染
      this.graph.data(processedData)
      this.graph.render()

      // 适应视图
      this.graph.fitView()

      logger.info('G6 scene rendered successfully')
      this.emit('render:complete')
    } catch (error) {
      logger.error('Failed to render G6 scene:', error)
      throw error
    }
  }

  private processData(data: any): any {
    if (!data) return { nodes: [], edges: [] }

    // 确保数据格式正确
    const processedData = {
      nodes: (data.nodes || []).map((node: any) => ({
        id: node.id,
        label: node.label || node.id,
        type: node.type || 'circle',
        size: node.size || 30,
        style: node.style || {},
        ...node
      })),
      edges: (data.edges || []).map((edge: any) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        label: edge.label,
        style: edge.style || {},
        ...edge
      }))
    }

    return processedData
  }

  destroy(): void {
    if (this.graph) {
      this.graph.destroy()
      this.graph = null
    }

    this.container = null
    this.data = null
    this.tools.clear()
    this.eventListeners.clear()
    this.isInitialized = false

    logger.info('G6 scene destroyed')
  }

  getView(): HTMLElement {
    if (!this.container) {
      throw new Error('Scene not initialized')
    }
    return this.container
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

  getData(): any {
    return this.data
  }

  setData(data: any): void {
    this.data = data
  }

  updateData(updates: any): void {
    if (!this.graph || !this.data) return

    // 更新数据
    if (updates.nodes) {
      updates.nodes.forEach((nodeUpdate: any) => {
        const node = this.graph!.findById(nodeUpdate.id)
        if (node) {
          this.graph!.updateItem(node, nodeUpdate)
        }
      })
    }

    if (updates.edges) {
      updates.edges.forEach((edgeUpdate: any) => {
        const edge = this.graph!.findById(edgeUpdate.id)
        if (edge) {
          this.graph!.updateItem(edge, edgeUpdate)
        }
      })
    }

    this.graph.refresh()
  }

  enableInteraction(): void {
    if (this.graph) {
      this.graph.setMode('default')
    }
  }

  disableInteraction(): void {
    if (this.graph) {
      this.graph.setMode('readonly')
    }
  }

  getTools(): ITool[] {
    return Array.from(this.tools.values())
  }

  addTool(tool: ITool): void {
    this.tools.set(tool.id, tool)
  }

  removeTool(toolId: string): void {
    this.tools.delete(toolId)
  }

  getConfig(): SceneConfig {
    return { ...this.config }
  }

  setConfig(config: Partial<SceneConfig>): void {
    this.config = { ...this.config, ...config }
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
}
