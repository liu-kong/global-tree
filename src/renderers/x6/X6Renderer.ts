import { Graph, Node, Edge } from '@antv/x6'
import type { GraphRenderer, GraphData, RendererConfig } from '@/types/renderer'
import type { KnowledgeNode, KnowledgeEdge } from '@/types/graph'

export class X6Renderer implements GraphRenderer {
  private graph: Graph | null = null
  private container: HTMLElement | null = null
  private config: RendererConfig['x6']
  private onNodeClick?: (node: KnowledgeNode) => void
  private onEdgeClick?: (edge: KnowledgeEdge) => void
  private onSelectionChange?: (nodes: string[], edges: string[]) => void

  constructor(config: RendererConfig['x6']) {
    this.config = config
  }

  async initialize(container: HTMLElement): Promise<void> {
    this.container = container
    
    // 创建 X6 图实例
    this.graph = new Graph({
      container,
      width: '100%',
      height: '100%',
      background: {
        color: this.config.grid?.visible ? '#f5f5f5' : 'transparent'
      },
      grid: this.config.grid?.visible ? {
        size: this.config.grid.size || 20,
        type: this.config.grid.type || 'dot',
        args: [{
          color: '#e0e0e0',
          thickness: 1
        }]
      } : false,
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
            padding: 1
          }
        },
        connector: {
          name: 'rounded',
          args: {
            radius: 8
          }
        },
        anchor: 'center',
        connectionPoint: 'anchor',
        allowBlank: false,
        snap: {
          radius: 20
        },
        createEdge() {
          return new Edge({
            attrs: {
              line: {
                stroke: '#A2B1C3',
                strokeWidth: 2,
                targetMarker: {
                  name: 'block',
                  width: 12,
                  height: 8
                }
              }
            },
            zIndex: 0
          })
        },
        validateConnection({ targetMagnet }) {
          return !!targetMagnet
        }
      },
      highlighting: {
        magnetAvailable: {
          name: 'stroke',
          args: {
            attrs: {
              fill: '#fff',
              stroke: '#31d0c6',
              strokeWidth: 4
            }
          }
        }
      },
      resizing: true,
      rotating: true,
      selecting: {
        enabled: true,
        rubberband: true,
        movable: true,
        showNodeSelectionBox: true
      },
      snapline: this.config.snapline || false,
      keyboard: this.config.keyboard || false,
      clipboard: this.config.clipboard || false,
      history: this.config.history || false
    })

    // 绑定事件
    this.bindEvents()

    // 注册自定义节点
    this.registerCustomNodes()
  }

  private bindEvents(): void {
    if (!this.graph) return

    // 节点点击事件
    this.graph.on('node:click', ({ node }) => {
      const knowledgeNode = this.convertX6NodeToKnowledgeNode(node)
      this.onNodeClick?.(knowledgeNode)
    })

    // 边点击事件
    this.graph.on('edge:click', ({ edge }) => {
      const knowledgeEdge = this.convertX6EdgeToKnowledgeEdge(edge)
      this.onEdgeClick?.(knowledgeEdge)
    })

    // 选择变化事件
    this.graph.on('selection:changed', ({ selected }) => {
      const nodes: string[] = []
      const edges: string[] = []
      
      selected.forEach(cell => {
        if (cell.isNode()) {
          nodes.push(cell.id)
        } else if (cell.isEdge()) {
          edges.push(cell.id)
        }
      })
      
      this.onSelectionChange?.(nodes, edges)
    })

    // 节点双击编辑
    this.graph.on('node:dblclick', ({ node }) => {
      this.showNodeEditor(node)
    })

    // 边双击编辑
    this.graph.on('edge:dblclick', ({ edge }) => {
      this.showEdgeEditor(edge)
    })
  }

  private registerCustomNodes(): void {
    if (!this.graph) return

    // 注册概念节点
    Graph.registerNode('concept-node', {
      inherit: 'rect',
      width: 120,
      height: 60,
      attrs: {
        body: {
          strokeWidth: 2,
          stroke: '#1890ff',
          fill: '#ffffff',
          rx: 8,
          ry: 8
        },
        text: {
          fontSize: 14,
          fill: '#333333',
          textAnchor: 'middle',
          textVerticalAnchor: 'middle'
        }
      },
      ports: {
        groups: {
          in: {
            position: 'left',
            attrs: {
              circle: {
                r: 4,
                magnet: true,
                stroke: '#31d0c6',
                strokeWidth: 2,
                fill: '#fff'
              }
            }
          },
          out: {
            position: 'right',
            attrs: {
              circle: {
                r: 4,
                magnet: true,
                stroke: '#fe854f',
                strokeWidth: 2,
                fill: '#fff'
              }
            }
          }
        },
        items: [
          { group: 'in' },
          { group: 'out' }
        ]
      }
    })

    // 注册实体节点
    Graph.registerNode('entity-node', {
      inherit: 'rect',
      width: 140,
      height: 70,
      attrs: {
        body: {
          strokeWidth: 2,
          stroke: '#52c41a',
          fill: '#f6ffed',
          rx: 10,
          ry: 10
        },
        text: {
          fontSize: 14,
          fill: '#333333',
          textAnchor: 'middle',
          textVerticalAnchor: 'middle'
        }
      },
      ports: {
        groups: {
          in: {
            position: 'left',
            attrs: {
              circle: {
                r: 4,
                magnet: true,
                stroke: '#52c41a',
                strokeWidth: 2,
                fill: '#fff'
              }
            }
          },
          out: {
            position: 'right',
            attrs: {
              circle: {
                r: 4,
                magnet: true,
                stroke: '#52c41a',
                strokeWidth: 2,
                fill: '#fff'
              }
            }
          }
        },
        items: [
          { group: 'in' },
          { group: 'out' }
        ]
      }
    })

    // 注册关系节点
    Graph.registerNode('relation-node', {
      inherit: 'ellipse',
      width: 100,
      height: 50,
      attrs: {
        body: {
          strokeWidth: 2,
          stroke: '#fa8c16',
          fill: '#fff7e6'
        },
        text: {
          fontSize: 12,
          fill: '#333333',
          textAnchor: 'middle',
          textVerticalAnchor: 'middle'
        }
      },
      ports: {
        groups: {
          in: {
            position: 'left',
            attrs: {
              circle: {
                r: 4,
                magnet: true,
                stroke: '#fa8c16',
                strokeWidth: 2,
                fill: '#fff'
              }
            }
          },
          out: {
            position: 'right',
            attrs: {
              circle: {
                r: 4,
                magnet: true,
                stroke: '#fa8c16',
                strokeWidth: 2,
                fill: '#fff'
              }
            }
          }
        },
        items: [
          { group: 'in' },
          { group: 'out' }
        ]
      }
    })

    // 注册文档节点
    Graph.registerNode('document-node', {
      inherit: 'rect',
      width: 160,
      height: 80,
      attrs: {
        body: {
          strokeWidth: 2,
          stroke: '#722ed1',
          fill: '#f9f0ff',
          rx: 4,
          ry: 4
        },
        text: {
          fontSize: 12,
          fill: '#333333',
          textAnchor: 'middle',
          textVerticalAnchor: 'middle'
        }
      },
      ports: {
        groups: {
          in: {
            position: 'left',
            attrs: {
              circle: {
                r: 4,
                magnet: true,
                stroke: '#722ed1',
                strokeWidth: 2,
                fill: '#fff'
              }
            }
          },
          out: {
            position: 'right',
            attrs: {
              circle: {
                r: 4,
                magnet: true,
                stroke: '#722ed1',
                strokeWidth: 2,
                fill: '#fff'
              }
            }
          }
        },
        items: [
          { group: 'in' },
          { group: 'out' }
        ]
      }
    })
  }

  render(data: GraphData): void {
    if (!this.graph) return

    // 清空现有内容
    this.graph.clearCells()

    // 添加节点
    data.nodes.forEach(node => {
      this.addNode(node)
    })

    // 添加边
    data.edges.forEach(edge => {
      this.addEdge(edge)
    })

    // 自动布局
    this.autoLayout()
  }

  private addNode(node: KnowledgeNode): Node {
    if (!this.graph) return null as any

    const nodeType = this.getNodeType(node.type)
    
    const x6Node = this.graph.addNode({
      id: node.id,
      shape: nodeType,
      x: node.position.x,
      y: node.position.y,
      label: node.label,
      data: node.properties,
      attrs: {
        text: {
          text: node.label
        },
        body: {
          fill: node.style?.backgroundColor || '#ffffff',
          stroke: node.style?.borderColor || '#1890ff',
          strokeWidth: node.style?.borderWidth || 2
        }
      }
    })

    return x6Node
  }

  private addEdge(edge: KnowledgeEdge): Edge {
    if (!this.graph) return null as any

    const edgeStyle = this.getEdgeStyle(edge.type)

    const x6Edge = this.graph.addEdge({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      label: edge.label,
      data: edge.properties,
      attrs: {
        line: {
          stroke: edgeStyle.color,
          strokeWidth: edgeStyle.width,
          targetMarker: edgeStyle.arrow
        },
        label: {
          text: edge.label,
          fill: '#666',
          fontSize: 12,
          textAnchor: 'middle',
          textVerticalAnchor: 'bottom'
        }
      }
    })

    return x6Edge
  }

  private getNodeType(type: string): string {
    const typeMap: Record<string, string> = {
      concept: 'concept-node',
      entity: 'entity-node',
      relation: 'relation-node',
      document: 'document-node'
    }
    return typeMap[type] || 'concept-node'
  }

  private getEdgeStyle(type: string): any {
    const styleMap: Record<string, any> = {
      relates: {
        color: '#1890ff',
        width: 2,
        arrow: {
          name: 'classic',
          size: 8
        }
      },
      contains: {
        color: '#52c41a',
        width: 2,
        arrow: {
          name: 'classic',
          size: 8
        }
      },
      depends: {
        color: '#fa8c16',
        width: 2,
        arrow: {
          name: 'classic',
          size: 8
        }
      },
      opposes: {
        color: '#f5222d',
        width: 2,
        arrow: {
          name: 'classic',
          size: 8
        }
      }
    }
    return styleMap[type] || styleMap.relates
  }

  private autoLayout(): void {
    if (!this.graph) return

    // 使用 Dagre 布局算法（需要安装 @antv/layout）
    try {
      const { dagre } = require('@antv/layout')
      const nodes = this.graph.getNodes()
      const edges = this.graph.getEdges()

      if (nodes.length > 0) {
        const model = this.graph.toJSON()
        const dagreLayout = dagre.layout({
          type: 'dagre',
          rankdir: 'TB',
          align: 'UL',
          nodesep: 50,
          ranksep: 80,
          controlPoints: true
        })

        const layoutModel = dagreLayout.layout({
          nodes: model.cells.map(cell => ({
            id: cell.id,
            size: { width: cell.size?.width || 120, height: cell.size?.height || 60 }
          })),
          edges: model.cells.map(cell => 
            cell.shape === 'edge' ? {
              source: cell.source.cell,
              target: cell.target.cell
            } : null
          ).filter(Boolean)
        })

        // 应用布局结果
        layoutModel.nodes.forEach((node: any) => {
          const x6Node = this.graph!.getCellById(node.id)
          if (x6Node) {
            x6Node.setPosition(node.x, node.y)
          }
        })
      }
    } catch (error) {
      console.warn('Dagre layout not available, using default layout')
      // 简单的网格布局作为后备
      this.gridLayout()
    }
  }

  private gridLayout(): void {
    if (!this.graph) return

    const nodes = this.graph.getNodes()
    const cols = Math.ceil(Math.sqrt(nodes.length))
    const spacing = 150

    nodes.forEach((node, index) => {
      const row = Math.floor(index / cols)
      const col = index % cols
      node.setPosition(col * spacing + 50, row * spacing + 50)
    })
  }

  private convertX6NodeToKnowledgeNode(x6Node: Node): KnowledgeNode {
    return {
      id: x6Node.id,
      type: x6Node.shape?.replace('-node', '') as any || 'concept',
      label: x6Node.getLabel() || '',
      properties: x6Node.getData() || {},
      position: { x: x6Node.getPosition().x, y: x6Node.getPosition().y },
      style: {
        backgroundColor: x6Node.attr('body/fill'),
        borderColor: x6Node.attr('body/stroke'),
        borderWidth: x6Node.attr('body/strokeWidth')
      }
    }
  }

  private convertX6EdgeToKnowledgeEdge(x6Edge: Edge): KnowledgeEdge {
    return {
      id: x6Edge.id,
      source: x6Edge.getSource()?.cell || '',
      target: x6Edge.getTarget()?.cell || '',
      type: 'relates',
      label: x6Edge.getLabel() || '',
      properties: x6Edge.getData() || {},
      style: {
        color: x6Edge.attr('line/stroke'),
        width: x6Edge.attr('line/strokeWidth')
      }
    }
  }

  private showNodeEditor(node: Node): void {
    // 实现节点编辑器
    const knowledgeNode = this.convertX6NodeToKnowledgeNode(node)
    const newLabel = prompt('编辑节点标签:', knowledgeNode.label)
    if (newLabel && newLabel !== knowledgeNode.label) {
      node.setLabel(newLabel)
    }
  }

  private showEdgeEditor(edge: Edge): void {
    // 实现边编辑器
    const knowledgeEdge = this.convertX6EdgeToKnowledgeEdge(edge)
    const newLabel = prompt('编辑边标签:', knowledgeEdge.label || '')
    if (newLabel !== null) {
      edge.setLabel(newLabel)
    }
  }

  updateNode(nodeId: string, updates: Partial<KnowledgeNode>): void {
    if (!this.graph) return

    const node = this.graph.getCellById(nodeId)
    if (node && node.isNode()) {
      if (updates.label) {
        node.setLabel(updates.label)
      }
      if (updates.position) {
        node.setPosition(updates.position.x, updates.position.y)
      }
      if (updates.style) {
        if (updates.style.backgroundColor) {
          node.attr('body/fill', updates.style.backgroundColor)
        }
        if (updates.style.borderColor) {
          node.attr('body/stroke', updates.style.borderColor)
        }
        if (updates.style.borderWidth) {
          node.attr('body/strokeWidth', updates.style.borderWidth)
        }
      }
      if (updates.properties) {
        node.setData(updates.properties)
      }
    }
  }

  updateEdge(edgeId: string, updates: Partial<KnowledgeEdge>): void {
    if (!this.graph) return

    const edge = this.graph.getCellById(edgeId)
    if (edge && edge.isEdge()) {
      if (updates.label !== undefined) {
        edge.setLabel(updates.label)
      }
      if (updates.style) {
        if (updates.style.color) {
          edge.attr('line/stroke', updates.style.color)
        }
        if (updates.style.width) {
          edge.attr('line/strokeWidth', updates.style.width)
        }
      }
      if (updates.properties) {
        edge.setData(updates.properties)
      }
    }
  }

  removeNode(nodeId: string): void {
    if (!this.graph) return

    const node = this.graph.getCellById(nodeId)
    if (node) {
      node.remove()
    }
  }

  removeEdge(edgeId: string): void {
    if (!this.graph) return

    const edge = this.graph.getCellById(edgeId)
    if (edge) {
      edge.remove()
    }
  }

  selectNodes(nodeIds: string[]): void {
    if (!this.graph) return

    this.graph.cleanSelection()
    nodeIds.forEach(id => {
      const node = this.graph!.getCellById(id)
      if (node) {
        this.graph!.select(node)
      }
    })
  }

  selectEdges(edgeIds: string[]): void {
    if (!this.graph) return

    this.graph.cleanSelection()
    edgeIds.forEach(id => {
      const edge = this.graph!.getCellById(id)
      if (edge) {
        this.graph!.select(edge)
      }
    })
  }

  clearSelection(): void {
    if (!this.graph) return

    this.graph.cleanSelection()
  }

  fitToView(): void {
    if (!this.graph) return

    this.graph.zoomToFit({ padding: 20 })
  }

  zoomTo(level: number): void {
    if (!this.graph) return

    this.graph.zoomTo(level)
  }

  panTo(x: number, y: number): void {
    if (!this.graph) return

    this.graph.scrollTo(x, y)
  }

  async exportAsImage(format: 'png' | 'jpeg' | 'svg' = 'png'): Promise<Blob> {
    if (!this.graph) throw new Error('Graph not initialized')

    let dataUrl: string = ''
    
    switch (format) {
      case 'png':
        dataUrl = this.graph.exportPNG?.() || ''
        break
      case 'jpeg':
        dataUrl = this.graph.exportJPEG?.() || ''
        break
      case 'svg':
        dataUrl = this.graph.exportSVG?.() || ''
        break
    }

    if (!dataUrl) {
      throw new Error(`Failed to export as ${format}`)
    }

    // Convert data URL to Blob
    const response = await fetch(dataUrl)
    return response.blob()
  }

  exportAsJSON(): GraphData {
    return this.getData()
  }

  destroy(): void {
    if (this.graph) {
      this.graph.dispose()
      this.graph = null
    }
    this.container = null
  }

  // 事件处理器
  on(event: string, handler: any): void {
    if (!this.graph) return

    this.graph.on(event, handler)
  }

  off(event: string, handler?: any): void {
    if (!this.graph) return

    this.graph.off(event, handler)
  }

  // 设置事件回调
  setEventHandlers(handlers: {
    onNodeClick?: (node: KnowledgeNode) => void
    onEdgeClick?: (edge: KnowledgeEdge) => void
    onSelectionChange?: (nodes: string[], edges: string[]) => void
  }): void {
    this.onNodeClick = handlers.onNodeClick
    this.onEdgeClick = handlers.onEdgeClick
    this.onSelectionChange = handlers.onSelectionChange
  }

  // 获取当前数据
  getData(): GraphData {
    if (!this.graph) return { nodes: [], edges: [], metadata: {} }

    const nodes = this.graph.getNodes().map(node => 
      this.convertX6NodeToKnowledgeNode(node)
    )
    const edges = this.graph.getEdges().map(edge => 
      this.convertX6EdgeToKnowledgeEdge(edge)
    )

    return {
      nodes,
      edges,
      metadata: {
        title: '知识图谱',
        description: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: '1.0.0'
      }
    }
  }
}
