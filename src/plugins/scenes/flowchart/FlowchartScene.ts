/**
 * 流程图场景实现
 */

import type { IScene, SceneConfig } from '../../../core/plugin/types'
import { Graph, Shape } from '@antv/x6'

export class FlowchartScene implements IScene {
  readonly id = 'flowchart-scene'
  readonly name = 'Flowchart Scene'
  readonly version = '1.0.0'
  readonly rendererId = 'x6'

  private graph?: Graph
  private container?: HTMLElement
  private config: SceneConfig = {
    renderer: { type: 'x6' }
  }
  private tools: any[] = []

  constructor(container?: HTMLElement, config?: any) {
    this.container = container
    if (config) {
      this.config = { ...this.config, ...config }
    }
    this.registerCustomNodes()
    this.injectStyles()
  }

  async initialize(container: HTMLElement, config?: any): Promise<void> {
    this.container = container
    if (config) {
      this.config = { ...this.config, ...config }
    }

    // 创建 X6 图形实例
    this.graph = new Graph({
      container: container,
      width: config?.width || '100%',
      height: config?.height || '100%',
      background: {
        color: '#f8f9fa'
      },
      grid: {
        size: 10,
        visible: true,
        type: 'doubleMesh',
        args: [
          {
            color: '#eee',
            thickness: 1,
          },
          {
            color: '#ddd',
            thickness: 1,
            factor: 4,
          },
        ],
      },
      mousewheel: {
        enabled: true,
        modifiers: ['ctrl', 'meta'],
        factor: 1.1,
        maxScale: 5,
        minScale: 0.1
      },
      connecting: {
        router: {
          name: 'manhattan',
          args: {
            padding: 1,
          },
        },
        connector: {
          name: 'rounded',
          args: {
            radius: 8,
          },
        },
        anchor: 'center',
        connectionPoint: 'anchor',
        allowBlank: false,
        snap: {
          radius: 20,
        },
        createEdge() {
          return new Shape.Edge({
            attrs: {
              line: {
                stroke: '#A2B1C3',
                strokeWidth: 2,
                targetMarker: {
                  name: 'block',
                  width: 12,
                  height: 8,
                },
              },
            },
            zIndex: 0,
          })
        },
        validateConnection({ targetMagnet }) {
          return !!targetMagnet
        },
      },
      highlighting: {
        magnetAdsorbed: {
          name: 'stroke',
          args: {
            attrs: {
              fill: '#5F95FF',
              stroke: '#5F95FF',
            },
          },
        },
      },
    })

    // 创建示例流程图
    this.createSampleFlowchart()

    // 绑定事件
    this.bindEvents()
  }

  private registerCustomNodes(): void {
    // 定义连接桩
    const ports = {
      groups: {
        top: {
          position: 'top',
          attrs: {
            circle: {
              r: 4,
              magnet: true,
              stroke: '#5F95FF',
              strokeWidth: 1,
              fill: '#fff',
              style: {
                visibility: 'hidden',
              },
            },
          },
        },
        right: {
          position: 'right',
          attrs: {
            circle: {
              r: 4,
              magnet: true,
              stroke: '#5F95FF',
              strokeWidth: 1,
              fill: '#fff',
              style: {
                visibility: 'hidden',
              },
            },
          },
        },
        bottom: {
          position: 'bottom',
          attrs: {
            circle: {
              r: 4,
              magnet: true,
              stroke: '#5F95FF',
              strokeWidth: 1,
              fill: '#fff',
              style: {
                visibility: 'hidden',
              },
            },
          },
        },
        left: {
          position: 'left',
          attrs: {
            circle: {
              r: 4,
              magnet: true,
              stroke: '#5F95FF',
              strokeWidth: 1,
              fill: '#fff',
              style: {
                visibility: 'hidden',
              },
            },
          },
        },
      },
      items: [
        {
          group: 'top',
        },
        {
          group: 'right',
        },
        {
          group: 'bottom',
        },
        {
          group: 'left',
        },
      ],
    }

    // 注册自定义矩形节点
    Graph.registerNode(
      'flowchart-rect',
      {
        inherit: 'rect',
        width: 120,
        height: 60,
        attrs: {
          body: {
            strokeWidth: 1,
            stroke: '#5F95FF',
            fill: '#EFF4FF',
          },
          text: {
            fontSize: 14,
            fill: '#262626',
          },
        },
        ports: { ...ports },
      },
      true,
    )

    // 注册自定义多边形节点（决策）
    Graph.registerNode(
      'flowchart-diamond',
      {
        inherit: 'polygon',
        width: 120,
        height: 80,
        attrs: {
          body: {
            strokeWidth: 1,
            stroke: '#5F95FF',
            fill: '#EFF4FF',
            refPoints: '0,40 60,0 120,40 60,80',
          },
          text: {
            fontSize: 14,
            fill: '#262626',
          },
        },
        ports: {
          ...ports,
          items: [
            {
              group: 'top',
            },
            {
              group: 'bottom',
            },
          ],
        },
      },
      true,
    )

    // 注册自定义圆形节点
    Graph.registerNode(
      'flowchart-circle',
      {
        inherit: 'circle',
        width: 80,
        height: 80,
        attrs: {
          body: {
            strokeWidth: 1,
            stroke: '#5F95FF',
            fill: '#EFF4FF',
          },
          text: {
            fontSize: 14,
            fill: '#262626',
          },
        },
        ports: { ...ports },
      },
      true,
    )

    // 注册自定义数据节点
    Graph.registerNode(
      'flowchart-parallelogram',
      {
        inherit: 'polygon',
        width: 120,
        height: 60,
        attrs: {
          body: {
            strokeWidth: 1,
            stroke: '#5F95FF',
            fill: '#EFF4FF',
            refPoints: '20,0 120,0 100,60 0,60',
          },
          text: {
            fontSize: 14,
            fill: '#262626',
          },
        },
        ports: { ...ports },
      },
      true,
    )
  }

  private createSampleFlowchart(): void {
    if (!this.graph) return

    // 创建示例节点
    const start = this.graph.addNode({
      shape: 'flowchart-circle',
      x: 100,
      y: 50,
      label: '开始',
    })

    const process1 = this.graph.addNode({
      shape: 'flowchart-rect',
      x: 80,
      y: 180,
      label: '数据处理',
    })

    const decision = this.graph.addNode({
      shape: 'flowchart-diamond',
      x: 80,
      y: 300,
      label: '条件判断',
    })

    const process2 = this.graph.addNode({
      shape: 'flowchart-rect',
      x: 250,
      y: 280,
      label: '处理A',
    })

    const process3 = this.graph.addNode({
      shape: 'flowchart-rect',
      x: 250,
      y: 380,
      label: '处理B',
    })

    const data = this.graph.addNode({
      shape: 'flowchart-parallelogram',
      x: 420,
      y: 330,
      label: '数据存储',
    })

    const end = this.graph.addNode({
      shape: 'flowchart-circle',
      x: 420,
      y: 450,
      label: '结束',
    })

    // 创建连接
    this.graph.addEdge({
      source: start,
      target: process1,
    })

    this.graph.addEdge({
      source: process1,
      target: decision,
    })

    this.graph.addEdge({
      source: decision,
      target: process2,
      labels: ['是'],
    })

    this.graph.addEdge({
      source: decision,
      target: process3,
      labels: ['否'],
    })

    this.graph.addEdge({
      source: process2,
      target: data,
    })

    this.graph.addEdge({
      source: process3,
      target: data,
    })

    this.graph.addEdge({
      source: data,
      target: end,
    })

    // 居中显示
    this.graph.centerContent()
  }

  private bindEvents(): void {
    if (!this.graph) return

    // 控制连接桩显示/隐藏
    this.graph.on('node:mouseenter', ({ node }) => {
      if (this.container) {
        const ports = this.container.querySelectorAll('.x6-port-body') as NodeListOf<SVGElement>
        this.showPorts(ports, true)
      }
    })

    this.graph.on('node:mouseleave', ({ node }) => {
      if (this.container) {
        const ports = this.container.querySelectorAll('.x6-port-body') as NodeListOf<SVGElement>
        this.showPorts(ports, false)
      }
    })

    // 监听键盘事件
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        // 简化删除逻辑
        console.log('Delete key pressed')
      }
    })
  }

  private showPorts(ports: NodeListOf<SVGElement>, show: boolean): void {
    for (let i = 0, len = ports.length; i < len; i = i + 1) {
      ports[i].style.visibility = show ? 'visible' : 'hidden'
    }
  }

  private injectStyles(): void {
    const style = document.createElement('style')
    style.textContent = `
      .flowchart-container {
        width: 100%;
        height: 100%;
      }
      .x6-port-body {
        visibility: hidden;
      }
      .x6-node:hover .x6-port-body {
        visibility: visible;
      }
      .x6-node-selected rect {
        stroke-width: 2px;
      }
    `
    document.head.appendChild(style)
  }

  async render(data?: any): Promise<void> {
    if (!this.graph) return

    if (data) {
      this.graph.fromJSON(data)
    } else {
      // 使用默认示例
      this.createSampleFlowchart()
    }
  }

  destroy(): void {
    if (this.graph) {
      this.graph.dispose()
      this.graph = undefined
    }
    this.container = undefined
    this.tools = []
  }

  getView(): HTMLElement {
    return this.container || document.createElement('div')
  }

  fitView(): void {
    if (this.graph) {
      this.graph.zoomToFit({ padding: 20 })
    }
  }

  zoomTo(level: number): void {
    if (this.graph) {
      this.graph.zoomTo(level)
    }
  }

  panTo(x: number, y: number): void {
    if (this.graph) {
      this.graph.translate(x, y)
    }
  }

  center(): void {
    if (this.graph) {
      this.graph.centerContent()
    }
  }

  getData(): any {
    return this.graph?.toJSON()
  }

  setData(data: any): void {
    if (this.graph) {
      this.graph.fromJSON(data)
    }
  }

  updateData(updates: any): void {
    // 更新流程图数据
    if (updates.data && this.graph) {
      this.graph.fromJSON(updates.data)
    }
  }

  enableInteraction(): void {
    // 启用交互功能
  }

  disableInteraction(): void {
    // 禁用交互功能
  }

  getTools(): any[] {
    return this.tools
  }

  addTool(tool: any): void {
    this.tools.push(tool)
  }

  removeTool(toolId: string): void {
    this.tools = this.tools.filter(tool => tool.id !== toolId)
  }

  getConfig(): SceneConfig {
    return { ...this.config }
  }

  setConfig(config: Partial<SceneConfig>): void {
    this.config = { ...this.config, ...config }
  }

  on(event: string, handler: any): void {
    if (this.graph) {
      this.graph.on(event, handler)
    }
  }

  off(event: string, handler?: any): void {
    if (this.graph) {
      this.graph.off(event, handler)
    }
  }

  emit(event: string, data?: any): void {
    if (this.graph) {
      this.graph.trigger(event, data)
    }
  }
}
