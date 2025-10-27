/**
 * X6 场景实现
 */

import type { IScene, SceneConfig } from '../../core/plugin/types'
import { Graph } from '@antv/x6'

export class X6Scene implements IScene {
  readonly id = 'x6-scene'
  readonly name = 'X6 Scene'
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
  }

  async initialize(container: HTMLElement, config?: any): Promise<void> {
    this.container = container
    if (config) {
      this.config = { ...this.config, ...config }
    }

    // 创建 X6 图形实例
    this.graph = new Graph({
      container: container,
      width: config?.width || 800,
      height: config?.height || 600,
      grid: {
        size: 10,
        visible: true,
      },
      mousewheel: {
        enabled: true,
        zoomAtMousePosition: true,
        modifiers: 'ctrl',
        minScale: 0.5,
        maxScale: 3,
      },
      connecting: {
        router: {
          name: 'manhattan',
        },
        connector: {
          name: 'rounded',
        },
        anchor: 'center',
        connectionPoint: 'anchor',
        allowBlank: false,
      },
    })
  }

  async render(data: any): Promise<void> {
    if (!this.graph) return

    // 清空现有内容
    this.graph.clearCells()

    // 渲染节点和边
    if (data.nodes) {
      const nodes = data.nodes.map((node: any) => {
        return this.graph?.createNode({
          id: node.id,
          shape: node.shape || 'rect',
          x: node.x || 100,
          y: node.y || 100,
          width: node.width || 120,
          height: node.height || 60,
          label: node.label || node.id,
          attrs: {
            body: {
              fill: node.color || '#1890ff',
              stroke: '#fff',
              strokeWidth: 2,
              rx: 6,
              ry: 6,
            },
            label: {
              fill: '#fff',
              fontSize: 12,
              fontFamily: 'Arial, sans-serif',
            },
          },
        })
      })
      
      if (nodes) {
        this.graph?.addNodes(nodes.filter(Boolean))
      }
    }

    if (data.edges) {
      const edges = data.edges.map((edge: any) => {
        return this.graph?.createEdge({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          label: edge.label,
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
        })
      })
      
      if (edges) {
        this.graph?.addEdges(edges.filter(Boolean))
      }
    }

    // 居中显示
    this.center()
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
      this.graph.zoom(level)
    }
  }

  panTo(x: number, y: number): void {
    // X6 暂时忽略平移功能
  }

  center(): void {
    if (this.graph) {
      this.graph.centerContent()
    }
  }

  getData(): any {
    if (!this.graph) return { nodes: [], edges: [] }

    const nodes = this.graph.getNodes().map(node => ({
      id: node.id,
      shape: node.shape,
      x: node.getPosition().x,
      y: node.getPosition().y,
      width: node.getSize().width,
      height: node.getSize().height,
      label: node.getAttrByPath('label/text') || node.id,
      color: node.getAttrByPath('body/fill'),
    }))

    const edges = this.graph.getEdges().map(edge => ({
      id: edge.id,
      source: edge.getSourceNode()?.id,
      target: edge.getTargetNode()?.id,
      label: edge.getAttrByPath('label/text'),
    }))

    return { nodes, edges }
  }

  setData(data: any): void {
    this.render(data)
  }

  updateData(updates: any): void {
    if (!this.graph) return

    // 更新节点
    if (updates.nodes) {
      updates.nodes.forEach((nodeUpdate: any) => {
        const node = this.graph?.getCellById(nodeUpdate.id)
        if (node && node.isNode()) {
          if (nodeUpdate.position) {
            node.setPosition(nodeUpdate.position.x, nodeUpdate.position.y)
          }
          if (nodeUpdate.size) {
            node.resize(nodeUpdate.size.width, nodeUpdate.size.height)
          }
          if (nodeUpdate.label) {
            node.setAttrByPath('label/text', nodeUpdate.label)
          }
          if (nodeUpdate.color) {
            node.setAttrByPath('body/fill', nodeUpdate.color)
          }
        }
      })
    }

    // 更新边
    if (updates.edges) {
      updates.edges.forEach((edgeUpdate: any) => {
        const edge = this.graph?.getCellById(edgeUpdate.id)
        if (edge && edge.isEdge()) {
          if (edgeUpdate.source) {
            edge.setSource(edgeUpdate.source)
          }
          if (edgeUpdate.target) {
            edge.setTarget(edgeUpdate.target)
          }
          if (edgeUpdate.label) {
            edge.setAttrByPath('label/text', edgeUpdate.label)
          }
        }
      })
    }
  }

  enableInteraction(): void {
    // X6 暂时忽略交互启用功能
  }

  disableInteraction(): void {
    // X6 暂时忽略交互禁用功能
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
