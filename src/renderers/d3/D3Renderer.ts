/**
 * D3.js 渲染器实现
 * 提供基于 D3.js 的高级数据可视化功能
 */

import type { IRenderer, EventHandler, PerformanceMetrics } from '../../core/plugin/types'
import { InteractionMode } from '../../core/plugin/types'
import type { GraphData, KnowledgeNode, KnowledgeEdge } from '../../types/graph'
import { logger } from '../../core/logger/Logger'

// D3.js 类型定义（简化版本）
interface D3Selection {
  select(selector: string): D3Selection
  selectAll(selector: string): D3Selection
  append<T>(name: string): D3Selection
  attr(name: string, value: any): D3Selection
  style(name: string, value: any): D3Selection
  datum(data: any): D3Selection
  data(data: any[]): D3Selection & { enter(): any }
  on(event: string, handler: EventHandler): D3Selection
  call(fn: any): D3Selection
  remove(): D3Selection
  transition(): D3Transition
  node(): any
  nodes(): any[]
}

interface D3Transition {
  duration(ms: number): D3Transition
  attr(name: string, value: any): D3Transition
  style(name: string, value: any): D3Transition
  call(fn: any): D3Transition
}

interface D3Zoom {
  (selection: D3Selection): void
  scaleBy(selection: D3Selection, k: number): void
  scaleTo(selection: D3Selection, k: number): void
  translateBy(selection: D3Selection, x: number, y: number): void
  translateTo(selection: D3Selection, x: number, y: number): void
  on(event: string, handler: EventHandler): D3Zoom
  scaleExtent(extent: [number, number]): D3Zoom
}

interface D3Drag {
  (selection: D3Selection): void
  on(event: string, handler: EventHandler): D3Drag
}

interface D3ForceSimulation {
  nodes(nodes: any[]): D3ForceSimulation
  force(name: string, force?: any): D3ForceSimulation | any
  alpha(alpha: number): D3ForceSimulation
  alphaMin(alphaMin: number): D3ForceSimulation
  alphaDecay(decay: number): D3ForceSimulation
  velocityDecay(decay: number): D3ForceSimulation
  on(event: string, handler: EventHandler): D3ForceSimulation
  stop(): D3ForceSimulation
  restart(): D3ForceSimulation
  tick(): D3ForceSimulation
  find(x: number, y: number, radius?: number): any
  alphaTarget(target: number): D3ForceSimulation
}

declare global {
  interface Window {
    d3: {
      select: (selector: string) => D3Selection
      selectAll: (selector: string) => D3Selection
      create: (name: string) => D3Selection
      zoom: () => D3Zoom
      drag: () => D3Drag
      forceSimulation: (nodes?: any[]) => D3ForceSimulation
      forceLink: (links?: any[]) => any
      forceManyBody: () => any
      forceCenter: (x?: number, y?: number) => any
      forceCollide: (radius?: number) => any
      scaleLinear: () => any
      scaleOrdinal: () => any
      schemeCategory10: string[]
      json: (url: string) => Promise<any>
      csv: (url: string) => Promise<any>
      zoomIdentity: any
    }
  }
}

export class D3Renderer implements IRenderer {
  readonly id = 'd3-renderer'
  readonly name = 'D3.js Renderer'
  readonly version = '1.0.0'
  readonly type = 'd3'

  private container: HTMLElement | null = null
  private svg: D3Selection | null = null
  private simulation: D3ForceSimulation | null = null
  private zoom: D3Zoom | null = null
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
      margin: { top: 20, right: 20, bottom: 20, left: 20 },
      animationDuration: 300,
      enableTransitions: true,
      defaultNodeSize: 8,
      defaultLinkDistance: 50,
      defaultStrength: -100,
      colors: {
        nodes: ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd'],
        edges: ['#999', '#666', '#333'],
        text: '#333',
        background: '#fff'
      },
      interaction: {
        enableZoom: true,
        enablePan: true,
        enableDrag: true,
        enableHover: true,
        enableClick: true
      },
      layout: {
        type: 'force',
        iterations: 300,
        alphaMin: 0.001,
        velocityDecay: 0.4
      }
    }

    return { ...defaultConfig, ...userConfig }
  }

  async render(container: HTMLElement, data: GraphData, config?: any): Promise<void> {
    const startTime = performance.now()
    
    try {
      this.container = container
      this.config = this.mergeConfig({ ...this.config, ...config })
      this.data = data

      // 加载 D3.js
      await this.loadD3()

      // 初始化 SVG
      this.initializeSVG()

      // 渲染图形
      await this.renderGraph(data)

      // 设置交互
      this.setupInteractions()

      this.isInitialized = true

      // 更新性能指标
      this.performanceMetrics.renderTime = performance.now() - startTime
      this.performanceMetrics.nodeCount = data.nodes.length
      this.performanceMetrics.edgeCount = data.edges.length

      logger.info('D3 renderer rendered successfully', this.performanceMetrics)
      this.emit('render:complete', this.performanceMetrics)

    } catch (error) {
      logger.error('Failed to render with D3:', error)
      throw error
    }
  }

  private async loadD3(): Promise<void> {
    if (window.d3) {
      return // D3 已经加载
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = 'https://d3js.org/d3.v7.min.js'
      script.onload = () => resolve()
      script.onerror = () => reject(new Error('Failed to load D3.js'))
      document.head.appendChild(script)
    })
  }

  private initializeSVG(): void {
    if (!this.container || !window.d3) return

    // 清除现有内容
    this.container.innerHTML = ''

    // 创建 SVG
    const { width, height, margin } = this.config
    const innerWidth = width - margin.left - margin.right
    const innerHeight = height - margin.top - margin.bottom

    this.svg = window.d3.select(this.container)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', [0, 0, width, height])
      .style('background', this.config.colors.background)

    // 创建主容器组
    this.svg.append('g')
      .attr('class', 'main-group')
      .attr('transform', `translate(${margin.left},${margin.top})`)

    logger.info('D3 SVG initialized')
  }

  private async renderGraph(data: GraphData): Promise<void> {
    if (!this.svg || !window.d3) return

    const mainGroup = this.svg.select('.main-group')

    // 创建力导向模拟
    if (this.config.layout.type === 'force') {
      this.setupForceSimulation(data)
    }

    // 渲染边
    this.renderEdges(data.edges, mainGroup)

    // 渲染节点
    this.renderNodes(data.nodes, mainGroup)

    // 启动模拟
    if (this.simulation) {
      this.simulation.on('tick', () => {
        this.updatePositions()
      })
    }
  }

  private setupForceSimulation(data: GraphData): void {
    if (!window.d3) return

    this.simulation = window.d3.forceSimulation(data.nodes)
      .force('link', window.d3.forceLink(data.edges)
        .id((d: any) => d.id)
        .distance(this.config.defaultLinkDistance))
      .force('charge', window.d3.forceManyBody().strength(this.config.defaultStrength))
      .force('center', window.d3.forceCenter(
        this.config.width / 2 - this.config.margin.left,
        this.config.height / 2 - this.config.margin.top
      ))
      .force('collision', window.d3.forceCollide().radius(this.config.defaultNodeSize * 2))

    logger.info('Force simulation setup completed')
  }

  private renderEdges(edges: KnowledgeEdge[], container: D3Selection): void {
    if (!window.d3) return

    const linkSelection = container.selectAll('.link')
      .data(edges)
      .enter()
      .append('line')
      .attr('class', 'link')
      .attr('stroke', (d: any) => this.config.colors.edges[0] || '#999')
      .attr('stroke-width', 2)
      .attr('stroke-opacity', 0.6)

    if (this.config.enableTransitions) {
      linkSelection.transition()
        .duration(this.config.animationDuration)
        .attr('stroke-opacity', 0.8)
    }

    // 添加交互事件
    if (this.config.interaction.enableClick) {
      linkSelection.on('click', (event: any, d: any) => {
        this.emit('edge:click', d)
      })
    }

    if (this.config.interaction.enableHover) {
      linkSelection
        .on('mouseenter', function(event: any, d: any) {
          window.d3.select(this).attr('stroke-width', 3)
        })
        .on('mouseleave', function(event: any, d: any) {
          window.d3.select(this).attr('stroke-width', 2)
        })
    }

    logger.info(`Rendered ${edges.length} edges`)
  }

  private renderNodes(nodes: KnowledgeNode[], container: D3Selection): void {
    if (!window.d3) return

    const colorScale = window.d3.scaleOrdinal()
      .domain(nodes.map((d: any) => d.type || 'default'))
      .range(this.config.colors.nodes)

    const nodeSelection = container.selectAll('.node')
      .data(nodes)
      .enter()
      .append('g')
      .attr('class', 'node')

    // 添加圆形节点
    nodeSelection.append('circle')
      .attr('r', (d: any) => {
        const size = d.properties?.size || this.config.defaultNodeSize
        return Math.max(5, Math.min(20, size))
      })
      .attr('fill', (d: any) => colorScale(d.type || 'default') as string)
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)

    // 添加文本标签
    nodeSelection.append('text')
      .text((d: any) => d.label || d.id)
      .attr('font-size', '12px')
      .attr('font-family', 'Arial, sans-serif')
      .attr('text-anchor', 'middle')
      .attr('dy', '.35em')
      .attr('fill', this.config.colors.text)
      .attr('pointer-events', 'none')

    // 添加拖拽行为
    if (this.config.interaction.enableDrag) {
      const drag = window.d3.drag()
        .on('start', (event: any, d: any) => {
          if (!event.active && this.simulation) this.simulation.alphaTarget(0.3).restart()
          d.fx = d.x
          d.fy = d.y
          this.emit('node:dragstart', d)
        })
        .on('drag', (event: any, d: any) => {
          d.fx = event.x
          d.fy = event.y
          this.emit('node:drag', d)
        })
        .on('end', (event: any, d: any) => {
          if (!event.active && this.simulation) this.simulation.alphaTarget(0)
          d.fx = null
          d.fy = null
          this.emit('node:dragend', d)
        })

      nodeSelection.call(drag as any)
    }

    // 添加点击事件
    if (this.config.interaction.enableClick) {
      nodeSelection.on('click', (event: any, d: any) => {
        this.emit('node:click', d)
      })
    }

    // 添加悬停事件
    if (this.config.interaction.enableHover) {
      nodeSelection
        .on('mouseenter', function(event: any, d: any) {
          window.d3.select(this).select('circle')
            .transition()
            .duration(150)
            .attr('r', (d: any) => {
              const size = d.properties?.size || this.config.defaultNodeSize
              return Math.max(7, Math.min(25, size * 1.3))
            })
        })
        .on('mouseleave', function(event: any, d: any) {
          window.d3.select(this).select('circle')
            .transition()
            .duration(150)
            .attr('r', (d: any) => {
              const size = d.properties?.size || this.config.defaultNodeSize
              return Math.max(5, Math.min(20, size))
            })
        })
    }

    logger.info(`Rendered ${nodes.length} nodes`)
  }

  private updatePositions(): void {
    if (!this.svg) return

    const mainGroup = this.svg.select('.main-group')

    // 更新边的位置
    mainGroup.selectAll('.link')
      .attr('x1', (d: any) => d.source.x)
      .attr('y1', (d: any) => d.source.y)
      .attr('x2', (d: any) => d.target.x)
      .attr('y2', (d: any) => d.target.y)

    // 更新节点的位置
    mainGroup.selectAll('.node')
      .attr('transform', (d: any) => `translate(${d.x},${d.y})`)
  }

  private setupInteractions(): void {
    if (!this.svg || !window.d3) return

    // 设置缩放行为
    if (this.config.interaction.enableZoom) {
      this.zoom = window.d3.zoom()
        .scaleExtent([0.1, 10])
        .on('zoom', (event: any) => {
          this.svg?.select('.main-group')
            .attr('transform', event.transform)
          this.emit('view:change', { transform: event.transform })
        })

      this.svg.call(this.zoom)
    }
  }

  async update(data: GraphData): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Renderer not initialized')
    }

    const startTime = performance.now()

    try {
      this.data = data
      await this.renderGraph(data)

      this.performanceMetrics.renderTime = performance.now() - startTime
      this.performanceMetrics.nodeCount = data.nodes.length
      this.performanceMetrics.edgeCount = data.edges.length

      logger.info('D3 renderer updated successfully')
      this.emit('update:complete', this.performanceMetrics)
    } catch (error) {
      logger.error('Failed to update D3 renderer:', error)
      throw error
    }
  }

  clear(): void {
    if (!this.svg) return

    this.svg.selectAll('*').remove()
    if (this.simulation) {
      this.simulation.stop()
      this.simulation = null
    }

    logger.info('D3 renderer cleared')
  }

  destroy(): void {
    this.clear()
    this.svg = null
    this.container = null
    this.eventListeners.clear()
    this.isInitialized = false

    logger.info('D3 renderer destroyed')
  }

  fitView(): void {
    if (!this.svg || !window.d3) return

    const bounds = this.svg.select('.main-group').node()!.getBBox()
    const fullWidth = this.config.width
    const fullHeight = this.config.height
    const width = bounds.width
    const height = bounds.height
    const midX = bounds.x + width / 2
    const midY = bounds.y + height / 2

    if (width === 0 || height === 0) return

    const scale = 0.85 / Math.max(width / fullWidth, height / fullHeight)
    const translate = [fullWidth / 2 - scale * midX, fullHeight / 2 - scale * midY]

    if (this.zoom) {
      this.svg.transition()
        .duration(750)
        .call(this.zoom.transform, window.d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale))
    }
  }

  zoomTo(level: number): void {
    if (!this.svg || !this.zoom) return

    this.svg.transition()
      .duration(750)
      .call(this.zoom.scaleTo, level)
  }

  panTo(x: number, y: number): void {
    if (!this.svg || !this.zoom) return

    this.svg.transition()
      .duration(750)
      .call(this.zoom.translateTo, x, y)
  }

  center(): void {
    this.fitView()
  }

  enableInteraction(): void {
    this.interactionMode = InteractionMode.VIEW
    if (this.zoom) {
      this.svg?.call(this.zoom)
    }
  }

  disableInteraction(): void {
    this.interactionMode = InteractionMode.VIEW
    if (this.zoom) {
      this.zoom.on('zoom', null)
      this.svg?.call(this.zoom)
    }
  }

  setInteractionMode(mode: InteractionMode): void {
    this.interactionMode = mode
    // 根据 mode 设置不同的交互行为
    switch (mode) {
      case InteractionMode.VIEW:
        this.enableInteraction()
        break
      case InteractionMode.EDIT:
        // 编辑模式的特殊处理
        break
      case InteractionMode.PAN:
        // 仅平移模式
        break
      case InteractionMode.ZOOM:
        // 仅缩放模式
        break
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
      case 'svg':
        if (this.svg) {
          return this.svg.node()?.outerHTML
        }
        return null
      case 'png':
        // 实现 PNG 导出
        return this.exportAsPNG()
      default:
        throw new Error(`Unsupported export format: ${format}`)
    }
  }

  private exportAsPNG(): string {
    if (!this.svg) return ''

    // 简化的 PNG 导出实现
    // 在实际应用中，需要使用 canvas 或者其他库来转换 SVG 为 PNG
    const svgData = this.svg.node()?.outerHTML
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    
    if (!ctx || !svgData) return ''

    canvas.width = this.config.width
    canvas.height = this.config.height

    // 这里需要更复杂的 SVG 到 Canvas 转换逻辑
    // 暂时返回空字符串
    return ''
  }

  getPerformanceMetrics(): PerformanceMetrics {
    return { ...this.performanceMetrics }
  }
}
