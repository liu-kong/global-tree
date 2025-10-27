/**
 * 思维导图场景实现
 */

import type { IScene, SceneConfig } from '../../../core/plugin/types'
import { Graph, Node, Path } from '@antv/x6'
import Hierarchy from '@antv/hierarchy'
import insertCss from 'insert-css'

// 思维导图数据接口
interface MindMapData {
  id: string
  type: 'topic' | 'topic-branch' | 'topic-child'
  label: string
  width: number
  height: number
  children?: MindMapData[]
}

interface HierarchyResult {
  id: string
  x: number
  y: number
  data: MindMapData
  children?: HierarchyResult[]
}

export class MindmapScene implements IScene {
  readonly id = 'mindmap-scene'
  readonly name = 'Mindmap Scene'
  readonly version = '1.0.0'
  readonly rendererId = 'x6'

  private graph?: Graph
  private container?: HTMLElement
  private config: SceneConfig = {
    renderer: { type: 'x6' }
  }
  private tools: any[] = []
  private data: MindMapData = {
    id: '1',
    type: 'topic',
    label: '中心主题',
    width: 160,
    height: 50,
    children: [
      {
        id: '1-1',
        type: 'topic-branch',
        label: '分支主题1',
        width: 100,
        height: 40,
        children: [
          {
            id: '1-1-1',
            type: 'topic-child',
            label: '子主题1',
            width: 60,
            height: 30,
          },
          {
            id: '1-1-2',
            type: 'topic-child',
            label: '子主题2',
            width: 60,
            height: 30,
          },
        ],
      },
      {
        id: '1-2',
        type: 'topic-branch',
        label: '分支主题2',
        width: 100,
        height: 40,
      },
    ],
  }

  constructor(container?: HTMLElement, config?: any) {
    this.container = container
    if (config) {
      this.config = { ...this.config, ...config }
    }
    this.registerCustomNodes()
    this.registerCustomConnectors()
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
      grid: false,
      mousewheel: {
        enabled: true,
        modifiers: ['ctrl', 'meta'],
        factor: 1.1,
        maxScale: 5,
        minScale: 0.1
      },
      connecting: {
        connectionPoint: 'anchor',
      },
    })

    // 绑定事件
    this.bindEvents()
  }

  private registerCustomNodes(): void {
    // 中心主题或分支主题
    Graph.registerNode(
      'topic',
      {
        inherit: 'rect',
        markup: [
          {
            tagName: 'rect',
            selector: 'body',
          },
          {
            tagName: 'image',
            selector: 'img',
          },
          {
            tagName: 'text',
            selector: 'label',
          },
        ],
        attrs: {
          body: {
            rx: 6,
            ry: 6,
            stroke: '#5F95FF',
            fill: '#EFF4FF',
            strokeWidth: 1,
          },
          img: {
            ref: 'body',
            refX: '100%',
            refY: '50%',
            refY2: -8,
            width: 16,
            height: 16,
            'xlink:href':
              'https://gw.alipayobjects.com/mdn/rms_43231b/afts/img/A*SYCuQ6HHs5cAAAAAAAAAAAAAARQnAQ',
            event: 'add:topic',
            class: 'topic-image',
          },
          label: {
            fontSize: 14,
            fill: '#262626',
          },
        },
      },
      true,
    )

    // 子主题
    Graph.registerNode(
      'topic-child',
      {
        inherit: 'rect',
        markup: [
          {
            tagName: 'rect',
            selector: 'body',
          },
          {
            tagName: 'text',
            selector: 'label',
          },
          {
            tagName: 'path',
            selector: 'line',
          },
        ],
        attrs: {
          body: {
            fill: '#ffffff',
            strokeWidth: 0,
            stroke: '#5F95FF',
          },
          label: {
            fontSize: 14,
            fill: '#262626',
            textVerticalAnchor: 'bottom',
          },
          line: {
            stroke: '#5F95FF',
            strokeWidth: 2,
            d: 'M 0 15 L 60 15',
          },
        },
      },
      true,
    )
  }

  private registerCustomConnectors(): void {
    // 连接器
    Graph.registerConnector(
      'mindmap',
      (sourcePoint, targetPoint, routerPoints, options) => {
        const midX = sourcePoint.x + 10
        const midY = sourcePoint.y
        const ctrX = (targetPoint.x - midX) / 5 + midX
        const ctrY = targetPoint.y
        const pathData = `
         M ${sourcePoint.x} ${sourcePoint.y}
         L ${midX} ${midY}
         Q ${ctrX} ${ctrY} ${targetPoint.x} ${targetPoint.y}
        `
        return options.raw ? Path.parse(pathData) : pathData
      },
      true,
    )

    // 边
    Graph.registerEdge(
      'mindmap-edge',
      {
        inherit: 'edge',
        connector: {
          name: 'mindmap',
        },
        attrs: {
          line: {
            targetMarker: '',
            stroke: '#A2B1C3',
            strokeWidth: 2,
          },
        },
        zIndex: 0,
      },
      true,
    )
  }

  private injectStyles(): void {
    const style = document.createElement('style')
    style.textContent = `
      .topic-image {
        visibility: hidden;
        cursor: pointer;
      }
      .x6-node:hover .topic-image {
        visibility: visible;
      }
      .x6-node-selected rect {
        stroke-width: 2px;
      }
    `
    document.head.appendChild(style)
  }

  private bindEvents(): void {
    if (!this.graph) return

    // 添加节点事件
    this.graph.on('add:topic', ({ node }: { node: Node }) => {
      const { id } = node
      const type = node.prop('type')
      if (this.addChildNode(id, type)) {
        this.render()
      }
    })

    // 监听键盘事件
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const selectedNodes = this.graph!.getSelectedCells()
        if (selectedNodes.length) {
          const { id } = selectedNodes[0]
          if (this.removeNode(id)) {
            this.render()
          }
        }
      }
      if (e.key === 'Tab') {
        e.preventDefault()
        const selectedNodes = this.graph!.getSelectedCells()
        if (selectedNodes.length) {
          const node = selectedNodes[0]
          const type = node.prop('type')
          if (this.addChildNode(node.id, type)) {
            this.render()
          }
        }
      }
    })
  }

  async render(data?: any): Promise<void> {
    if (!this.graph) return

    // 使用传入的数据或默认数据
    const mindmapData = data || this.data

    const result: HierarchyResult = Hierarchy.mindmap(mindmapData, {
      direction: 'H',
      getHeight(d: MindMapData) {
        return d.height
      },
      getWidth(d: MindMapData) {
        return d.width
      },
      getHGap() {
        return 40
      },
      getVGap() {
        return 20
      },
      getSide: () => {
        return 'right'
      },
    }) as HierarchyResult

    const cells: any[] = []
    const traverse = (hierarchyItem: HierarchyResult) => {
      if (hierarchyItem) {
        const { data, children } = hierarchyItem
        cells.push(
          this.graph!.createNode({
            id: data.id,
            shape: data.type === 'topic-child' ? 'topic-child' : 'topic',
            x: hierarchyItem.x,
            y: hierarchyItem.y,
            width: data.width,
            height: data.height,
            label: data.label,
            type: data.type,
          }),
        )
        if (children) {
          children.forEach((item: HierarchyResult) => {
            const { id, data } = item
            cells.push(
              this.graph!.createEdge({
                shape: 'mindmap-edge',
                source: {
                  cell: hierarchyItem.id,
                  anchor:
                    data.type === 'topic-child'
                      ? {
                          name: 'right',
                          args: {
                            dx: -16,
                          },
                        }
                      : {
                          name: 'center',
                          args: {
                            dx: '25%',
                          },
                        },
                },
                target: {
                  cell: id,
                  anchor: {
                    name: 'left',
                  },
                },
              }),
            )
            traverse(item)
          })
        }
      }
    }
    traverse(result)
    this.graph.resetCells(cells)
    this.graph.centerContent()
  }

  private findItem(
    obj: MindMapData,
    id: string,
  ): {
    parent: MindMapData | null
    node: MindMapData | null
  } | null {
    if (obj.id === id) {
      return {
        parent: null,
        node: obj,
      }
    }
    const { children } = obj
    if (children) {
      for (let i = 0, len = children.length; i < len; i++) {
        const res = this.findItem(children[i], id)
        if (res) {
          return {
            parent: res.parent || obj,
            node: res.node,
          }
        }
      }
    }
    return null
  }

  private addChildNode(id: string, type: string): MindMapData | null {
    const res = this.findItem(this.data, id)
    const dataItem = res?.node
    if (dataItem) {
      let item: MindMapData | null = null
      const length = dataItem.children ? dataItem.children.length : 0
      if (type === 'topic') {
        item = {
          id: `${id}-${length + 1}`,
          type: 'topic-branch',
          label: `分支主题${length + 1}`,
          width: 100,
          height: 40,
        }
      } else if (type === 'topic-branch') {
        item = {
          id: `${id}-${length + 1}`,
          type: 'topic-child',
          label: `子主题${length + 1}`,
          width: 60,
          height: 30,
        }
      }
      if (item) {
        if (dataItem.children) {
          dataItem.children.push(item)
        } else {
          dataItem.children = [item]
        }
        return item
      }
    }
    return null
  }

  private removeNode(id: string): MindMapData | null {
    const res = this.findItem(this.data, id)
    const dataItem = res?.parent
    if (dataItem && dataItem.children) {
      const { children } = dataItem
      const index = children.findIndex((item) => item.id === id)
      return children.splice(index, 1)[0]
    }
    return null
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
    return this.data
  }

  setData(data: any): void {
    this.data = data
    this.render()
  }

  updateData(updates: any): void {
    // 更新思维导图数据
    if (updates.data) {
      this.data = updates.data
      this.render()
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
