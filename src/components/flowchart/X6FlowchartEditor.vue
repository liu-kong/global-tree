<template>
  <div id="container" class="x6-flowchart-editor">
    <div ref="stencilRef" id="stencil"></div>
    <div ref="graphContainerRef" id="graph-container"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { Graph, Shape } from '@antv/x6'
import { Snapline } from '@antv/x6-plugin-snapline'
import { Scroller } from '@antv/x6-plugin-scroller'
import { Keyboard } from '@antv/x6-plugin-keyboard'
import { History } from '@antv/x6-plugin-history'
import { Clipboard } from '@antv/x6-plugin-clipboard'
import { Selection } from '@antv/x6-plugin-selection'

// 定义props
interface Props {
  width?: string | number
  height?: string | number
}

const props = withDefaults(defineProps<Props>(), {
  width: '100%',
  height: '600px'
})

// 定义emits
const emit = defineEmits<{
  ready: [graph: Graph]
}>()

// 响应式数据
const stencilRef = ref<HTMLElement>()
const graphContainerRef = ref<HTMLElement>()
let graph: Graph | null = null

// 浏览器缩放相关
let browserZoomLevel = 1
let lastZoomLevel = 1
let resizeObserver: ResizeObserver | null = null
let zoomCheckInterval: number | null = null

// 前期准备工作 - 注入样式
const preWork = () => {
  const style = document.createElement('style')
  style.textContent = `
    #container {
      display: flex;
      border: 1px solid #dfe3e8;
      width: 100%;
      height: 100%;
      min-height: 400px;
      position: relative;
    }
    #stencil {
      width: 180px;
      height: 100%;
      position: relative;
      border-right: 1px solid #dfe3e8;
      background: #f5f5f5;
      overflow-y: auto;
      flex-shrink: 0;
    }
    #graph-container {
      flex: 1;
      height: 100%;
      background: #fff;
      position: relative;
      min-width: 0;
    }
    .x6-widget-stencil {
      background-color: #fff;
    }
    .x6-widget-stencil-title {
      background-color: #fff;
      border-bottom: 1px solid #dfe3e8;
      padding: 8px 12px;
      font-weight: 500;
    }
    .x6-widget-stencil-group-title {
      background-color: #fff !important;
      border-bottom: 1px solid #e8e8e8;
      padding: 8px 12px;
      font-size: 12px;
      color: #666;
    }
    .x6-widget-transform {
      margin: -1px 0 0 -1px;
      padding: 0px;
      border: 1px solid #239edd;
    }
    .x6-widget-transform > div {
      border: 1px solid #239edd;
    }
    .x6-widget-transform > div:hover {
      background-color: #3dafe4;
    }
    .x6-widget-transform-active-handle {
      background-color: #3dafe4;
    }
    .x6-widget-transform-resize {
      border-radius: 0;
    }
    .x6-widget-selection-inner {
      border: 1px solid #239edd;
    }
    .x6-widget-selection-box {
      opacity: 0;
    }
    .x6-port-body {
      visibility: hidden;
    }
    .x6-node:hover .x6-port-body {
      visibility: visible;
    }
    /* 隐藏滚动条 */
    .x6-graph-scroller {
      overflow: hidden !important;
    }
    .x6-graph-scroller::-webkit-scrollbar {
      display: none !important;
    }
    .x6-graph-scroller::-webkit-scrollbar-track {
      display: none !important;
    }
    .x6-graph-scroller::-webkit-scrollbar-thumb {
      display: none !important;
    }
    .x6-graph-scroller::-webkit-scrollbar-corner {
      display: none !important;
    }
  `
  document.head.appendChild(style)
}

// 初始化画布
const initGraph = () => {
  if (!graphContainerRef.value) return

  graph = new Graph({
    container: graphContainerRef.value,
    // 视图配置
    sorting: 'exact', // 按 zIndex 从低到高渲染，当 zIndex 相同时按照添加顺序渲染
    async: false, // 同步渲染模式，确保操作立即生效
    frozen: false, // 不冻结画布，变更立即生效
    // 连线触发阈值
    magnetThreshold: 0, // 鼠标移动 0 次后触发连线
    // 鼠标移动阈值
    moveThreshold: 0, // 立即触发 mousemove 事件
    // 点击阈值
    clickThreshold: 0, // 鼠标移动 0 次后仍触发点击事件
    // 右键菜单配置
    preventDefaultContextMenu: true, // 禁用画布默认右键
    preventDefaultBlankAction: true, // 禁用画布空白位置的默认行为
    // 事件守卫
    guard: function(e: any, view?: any) {
      // 返回 true 时忽略指定的鼠标事件
      return false // 不忽略任何事件
    },
    // 框选允许函数
    allowRubberband: function(e: any) {
      return true // 允许框选
    },
    // 平移允许函数
    allowPanning: function(e: any) {
      return true // 允许平移
    },
    // HTML 组件获取函数
    getHTMLComponent: function(this: Graph, node: any) {
      // 返回 null 表示不使用自定义 HTML 组件
      return null
    },
    // 链接桩渲染完成回调
    onPortRendered: function(args: any) {
      // 链接桩渲染完成时的处理
      console.log('Port rendered:', args.node?.id, args.port?.id)
    },
    // 边标签渲染完成回调
    onEdgeLabelRendered: function(args: any) {
      // 边标签渲染完成时的处理
      console.log('Edge label rendered:', args.edge?.id, args.label)
    },
    // 工具项渲染完成回调
    onToolItemCreated: function(this: Graph, args: {
      name: string
      cell: any
      view: any
      tool: any
    }) {
      // 工具项渲染完成时的处理
      console.log('Tool item created:', args.name, args.cell.id)
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
      zoomAtMousePosition: true,
      modifiers: 'ctrl',
      minScale: 0.1,
      maxScale: 5,
    },
    connecting: {
      // 自动吸附配置
      snap: {
        radius: 20, // 距离节点或连接桩20px时触发自动吸附
      },
      // 连接规则配置
      allowBlank: false, // 不允许连接到画布空白位置
      allowMulti: 'withPort', // 在相同链接桩之间只允许创建一条边
      allowLoop: false, // 不允许创建循环连线
      allowNode: true, // 允许边链接到节点（非节点上的链接桩）
      allowEdge: false, // 不允许边链接到另一个边
      allowPort: true, // 允许边链接到链接桩
      highlight: true, // 拖动边时高亮显示所有可用的连接桩或节点
      
      // 锚点配置
      anchor: 'center', // 连接到节点时的默认锚点
      sourceAnchor: 'center', // 源节点的锚点
      targetAnchor: 'center', // 目标节点的锚点
      edgeAnchor: 'ratio', // 连接到边时的锚点
      
      // 连接点配置
      connectionPoint: 'anchor', // 指定连接点
      sourceConnectionPoint: 'anchor', // 连接源的连接点
      targetConnectionPoint: 'anchor', // 连接目标的连接点
      
      // 路由和连接器配置
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
      
      // 连接策略 (注意：strategy属性在当前X6版本中可能不存在)
      // strategy: null, // 使用默认连接策略
      
      // 验证函数
      validateMagnet({ magnet, view, cell }) {
        // 点击magnet时的验证逻辑
        return true // 允许所有magnet
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
          tools: [
            {
              name: 'edge-editor',
              args: {
                attrs: {
                  backgroundColor: '#fff',
                },
              },
            },
          ],
        })
      },
      
      validateConnection({ 
        edge, 
        sourceView, 
        targetView, 
        sourceMagnet, 
        targetMagnet,
        sourceCell,
        targetCell,
        sourcePort,
        targetPort,
        type 
      }: any) {
        // 连接验证逻辑
        // 1. 不能连接到自己
        if (sourceCell === targetCell) {
          return false
        }
        
        // 2. 必须有目标magnet
        if (!targetMagnet) {
          return false
        }
        
        // 3. 检查是否已经存在相同的连接
        const sourceId = sourceCell?.id
        const targetId = targetCell?.id
        const existingEdges = this.getEdges().filter((e: any) => {
          return e.source.cell === sourceId && e.target.cell === targetId
        })
        
        // 如果是端口到端口的连接，检查端口
        if (sourcePort && targetPort) {
          const portToPortExists = existingEdges.some((e: any) => 
            e.source.port === sourcePort && e.target.port === targetPort
          )
          if (portToPortExists) {
            return false
          }
        }
        
        return true
      },
      
      validateEdge({ edge, type, previous }) {
        // 边验证逻辑
        return true
      },
    },
    // 嵌入功能配置
    embedding: {
      enabled: false, // 默认禁用节点嵌入功能
      findParent: 'bbox', // 使用边界框查找父节点
      frontOnly: true, // 只能嵌入显示在最前面的节点
      validate: ({ child, parent }) => {
        // 验证节点能否被嵌入父节点
        // 这里可以添加自定义验证逻辑
        return true
      },
    },
    
    // 交互行为配置
    interacting: {
      // 节点交互
      nodeMovable: true, // 节点是否可以被移动
      magnetConnectable: true, // 当在具有 'magnet' 属性的元素上按下鼠标开始拖动时，是否触发连线交互
      stopDelegateOnDragging: false, // 拖动时是否停止代理
      
      // 边交互
      edgeMovable: true, // 边是否可以被移动
      edgeLabelMovable: true, // 边的标签是否可以被移动
      arrowheadMovable: true, // 边的起始/终止箭头是否可以被移动
      vertexMovable: true, // 边的路径点是否可以被移动
      vertexAddable: true, // 是否可以添加边的路径点
      vertexDeletable: true, // 边的路径点是否可以被删除
      useEdgeTools: true, // 是否使用边工具
    },
    
    // 高亮配置
    highlighting: {
      // 默认高亮选项
      default: {
        name: 'stroke',
        args: {
          attrs: {
            fill: '#fff',
            stroke: '#333',
            strokeWidth: 2,
          },
        },
      },
      
      // 嵌入操作时的高亮
      embedding: {
        name: 'stroke',
        args: {
          attrs: {
            fill: '#eff4ff',
            stroke: '#1890ff',
            strokeDasharray: '5 5',
            strokeWidth: 2,
          },
        },
      },
      
      // 连线过程中节点可连接时的高亮
      nodeAvailable: {
        name: 'stroke',
        args: {
          attrs: {
            fill: '#f6ffed',
            stroke: '#52c41a',
            strokeWidth: 2,
          },
        },
      },
      
      // 连线过程中链接桩可连接时的高亮
      magnetAvailable: {
        name: 'stroke',
        args: {
          attrs: {
            fill: '#5F95FF',
            stroke: '#5F95FF',
            strokeWidth: 2,
          },
        },
      },
      
      // 连线过程中自动吸附到链接桩时的高亮
      magnetAdsorbed: {
        name: 'stroke',
        args: {
          attrs: {
            fill: '#5F95FF',
            stroke: '#5F95FF',
            strokeWidth: 3,
          },
        },
      },
    },
    
    // 节点变换配置
    transforming: {
      clearAll: true, // 创建新组件时是否清除页面上存在的其他组件
      clearOnBlankMouseDown: true, // 点击空白区域时是否清除组件
    },
    
    // 节点缩放配置
    resizing: {
      enabled: true, // 是否开启节点缩放
      minWidth: 20, // 缩放后的最小宽度
      minHeight: 20, // 缩放后的最小高度
      maxWidth: Number.MAX_SAFE_INTEGER, // 缩放后的最大宽度
      maxHeight: Number.MAX_SAFE_INTEGER, // 缩放后的最大高度
      orthogonal: true, // 是否显示中间缩放点
      restricted: false, // 是否限制缩放大小为画布边缘
      autoScroll: true, // 是否自动滚动画布
      preserveAspectRatio: false, // 缩放过程中是否保持节点的宽高比例
      allowReverse: true, // 到达最小宽度或者高度时是否允许控制点反向拖动
    },
    
    // 节点旋转配置
    rotating: {
      enabled: true, // 是否开启节点旋转
      grid: 15, // 每次旋转的角度
    },
    
    // 节点移动配置
    translating: {
      restrict: false, // 是否限制节点移动区域
    },
    
    // 画布缩放配置
    scaling: {
      min: 0.01, // 画布可以缩放的最小级别
      max: 16, // 画布可以缩放的最大级别
    },
  })

  // 注册对齐线插件
  graph.use(new Snapline({
    enabled: true,
    sharp: false,
    resizing: false,
    tolerance: 10,
    clean: true,
  }))

  // 注册滚动器插件
  graph.use(new Scroller({
    enabled: true,
    pannable: true,
    autoResize: true,
    width: graphContainerRef.value?.clientWidth || 800,
    height: graphContainerRef.value?.clientHeight || 600,
  }))

  // 注册键盘插件
  graph.use(new Keyboard({
    enabled: true,
    global: true,
  }))

  // 注册历史记录插件
  graph.use(new History({
    enabled: true,
  }))

  // 注册剪贴板插件
  graph.use(new Clipboard({
    enabled: true,
    useLocalStorage: true,
  }))

  // 注册选择插件
  graph.use(new Selection({
    enabled: true,
    rubberband: true,
    movable: true,
    showNodeSelectionBox: true,
    showEdgeSelectionBox: false,
    multiple: true,
    strict: false,
    modifiers: 'shift',
    multipleSelectionModifiers: ['ctrl', 'meta'],
    className: 'my-selecting',
    filter: null, // 可以设置过滤器
    content: null, // 可以设置附加显示内容
  }))

  // 绑定基本事件
  bindEvents()

  // 绑定键盘快捷键
  bindKeyboardShortcuts()
}

// 绑定事件
const bindEvents = () => {
  if (!graph) return

  // 控制连接桩显示/隐藏
  const showPorts = (ports: NodeListOf<SVGElement>, show: boolean) => {
    for (let i = 0, len = ports.length; i < len; i++) {
      ports[i].style.visibility = show ? 'visible' : 'hidden'
    }
  }
  
  graph.on('node:mouseenter', ({ node }) => {
    const container = document.getElementById('graph-container')!
    const ports = container.querySelectorAll(
      '.x6-port-body',
    ) as NodeListOf<SVGElement>
    showPorts(ports, true)
  })
  
  graph.on('node:mouseleave', ({ node }) => {
    const container = document.getElementById('graph-container')!
    const ports = container.querySelectorAll(
      '.x6-port-body',
    ) as NodeListOf<SVGElement>
    showPorts(ports, false)
  })

  // 节点添加事件
  graph.on('node:added', ({ node }) => {
    console.log('Node added:', node)
  })

  // 边添加事件
  graph.on('edge:added', ({ edge }) => {
    console.log('Edge added:', edge)
  })

  // 节点点击事件 - 处理叠加节点的选择优先级
  graph.on('node:click', ({ node, e }) => {
    // 获取点击位置的所有节点
    const point = graph.clientToLocal(e.clientX, e.clientY)
    const nodesAtPoint = graph.getNodesInArea(point.x - 1, point.y - 1, point.x + 1, point.y + 1)
    
    if (nodesAtPoint.length > 1) {
      // 如果有多个节点在点击位置，找到zIndex最高的节点
      let topNode = nodesAtPoint[0]
      let maxZIndex = topNode.getZIndex() || 0
      
      nodesAtPoint.forEach(n => {
        const zIndex = n.getZIndex() || 0
        if (zIndex > maxZIndex) {
          maxZIndex = zIndex
          topNode = n
        }
      })
      
      // 如果点击的不是最上层节点，阻止默认行为
      if (topNode.id !== node.id) {
        e.preventDefault()
        // 手动触发最上层节点的点击事件
        const clickEvent = new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
          clientX: e.clientX,
          clientY: e.clientY
        })
        topNode.trigger('click', { node: topNode, e: clickEvent })
        return
      }
    }
  })

  // 双击节点编辑文字（内联编辑）
  graph.on('node:dblclick', ({ node, e }) => {
    e.stopPropagation()
    
    // 获取点击位置的所有节点，确保编辑的是最上层节点
    const point = graph.clientToLocal(e.clientX, e.clientY)
    const nodesAtPoint = graph.getNodesInArea(point.x - 1, point.y - 1, point.x + 1, point.y + 1)
    
    if (nodesAtPoint.length > 1) {
      // 如果有多个节点，找到最上层的节点
      let topNode = nodesAtPoint[0]
      let maxZIndex = topNode.getZIndex() || 0
      
      nodesAtPoint.forEach(n => {
        const zIndex = n.getZIndex() || 0
        if (zIndex > maxZIndex) {
          maxZIndex = zIndex
          topNode = n
        }
      })
      
      // 如果双击的不是最上层节点，则编辑最上层节点
      if (topNode.id !== node.id) {
        node = topNode
      }
    }
    
    const currentLabel = String(node.attr('text/text') || '')
    
    // 创建输入框
    const input = document.createElement('input')
    input.type = 'text'
    input.value = currentLabel
    input.style.cssText = `
      position: absolute;
      left: ${e.clientX - 40}px;
      top: ${e.clientY - 12}px;
      width: 80px;
      height: 24px;
      padding: 2px 4px;
      border: 1px solid #1890ff;
      border-radius: 2px;
      font-size: 12px;
      background: #fff;
      z-index: 1000;
      outline: none;
    `
    
    // 添加到页面
    document.body.appendChild(input)
    input.focus()
    input.select()
    
    // 保存处理函数
    const saveText = () => {
      const newLabel = input.value.trim()
      node.attr('text/text', newLabel)
      document.body.removeChild(input)
      console.log('Node label updated:', newLabel)
    }
    
    // 取消处理函数
    const cancelEdit = () => {
      document.body.removeChild(input)
    }
    
    // 绑定事件
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        saveText()
      } else if (e.key === 'Escape') {
        cancelEdit()
      }
    })
    
    input.addEventListener('blur', saveText)
  })

  // 节点移动时自动置顶
  graph.on('node:moving', ({ node }) => {
    // 将移动的节点置顶
    const maxZIndex = Math.max(...graph.getNodes().map(n => n.getZIndex() || 0))
    node.setZIndex(maxZIndex + 1)
  })

  // 节点添加时设置合适的zIndex
  graph.on('node:added', ({ node }) => {
    const maxZIndex = Math.max(...graph.getNodes().map(n => n.getZIndex() || 0))
    node.setZIndex(maxZIndex + 1)
  })
}

// 绑定键盘快捷键
const bindKeyboardShortcuts = () => {
  if (!graph) return

// 删除选中的节点或边 - 使用官方Model API优化
  graph.bindKey(['backspace', 'delete'], (e: KeyboardEvent) => {
    const cells = graph.getSelectedCells()
    if (cells.length) {
      // 使用官方API批量删除，提供更好的性能
      const removedCells = graph.removeCells(cells, { 
        silent: false, // 触发事件以便历史记录
        sort: true // 按zIndex排序删除
      })
      console.log('Deleted cells:', removedCells)
    }
  })

  // 复制选中的节点或边 - 使用官方Model API优化
  graph.bindKey('ctrl+c', (e: KeyboardEvent) => {
    const cells = graph.getSelectedCells()
    if (cells.length) {
      // 使用剪贴板插件
      const clipboard = graph.getPlugin('clipboard') as any
      if (clipboard) {
        clipboard.copy(cells, { useLocalStorage: true })
        console.log('Copied cells:', cells)
      }
    }
  })

  // 粘贴节点或边 - 使用官方Model API优化
  graph.bindKey('ctrl+v', (e: KeyboardEvent) => {
    const clipboard = graph.getPlugin('clipboard') as any
    if (clipboard) {
      const pastedCells = clipboard.paste({ useLocalStorage: true })
      if (pastedCells && pastedCells.length) {
        // 使用官方API批量添加和选择
        pastedCells.forEach((cell: any) => {
          graph.addCell(cell, { 
            silent: false, // 触发事件以便历史记录
            sort: true // 按zIndex排序
          })
        })
        graph.select(pastedCells)
        console.log('Pasted cells:', pastedCells)
      }
    }
  })

  // 撤销 - 使用历史记录功能
  graph.bindKey('ctrl+z', (e: KeyboardEvent) => {
    const history = graph.getPlugin('history') as any
    if (history && history.canUndo()) {
      history.undo()
      console.log('Undo performed')
    }
  })

  // 重做 - 使用历史记录功能
  graph.bindKey('ctrl+y', (e: KeyboardEvent) => {
    const history = graph.getPlugin('history') as any
    if (history && history.canRedo()) {
      history.redo()
      console.log('Redo performed')
    }
  })

  // 全选
  graph.bindKey('ctrl+a', (e: KeyboardEvent) => {
    const cells = graph.getCells()
    if (graph) {
      graph.select(cells)
    }
    console.log('Select all cells:', cells.length)
  })

  // 放大
  graph.bindKey('ctrl+=', (e: KeyboardEvent) => {
    const zoom = graph.zoom()
    if (zoom < 3) {
      graph.zoom(0.1)
      console.log('Zoom in:', graph.zoom())
    }
  })

  // 缩小
  graph.bindKey('ctrl+-', (e: KeyboardEvent) => {
    const zoom = graph.zoom()
    if (zoom > 0.5) {
      graph.zoom(-0.1)
      console.log('Zoom out:', graph.zoom())
    }
  })

  // 重置缩放
  graph.bindKey('ctrl+0', (e: KeyboardEvent) => {
    graph.scale(1)
    graph.centerContent()
    console.log('Reset zoom')
  })

  // 上移选中节点
  graph.bindKey('up', (e: KeyboardEvent) => {
    const cells = graph.getSelectedCells()
    const nodes = cells.filter(cell => cell.isNode())
    if (nodes.length) {
      nodes.forEach(node => {
        const position = node.getPosition()
        node.setPosition(position.x, position.y - 10)
      })
      console.log('Move nodes up')
    }
  })

  // 下移选中节点
  graph.bindKey('down', (e: KeyboardEvent) => {
    const cells = graph.getSelectedCells()
    const nodes = cells.filter(cell => cell.isNode())
    if (nodes.length) {
      nodes.forEach(node => {
        const position = node.getPosition()
        node.setPosition(position.x, position.y + 10)
      })
      console.log('Move nodes down')
    }
  })

  // 左移选中节点
  graph.bindKey('left', (e: KeyboardEvent) => {
    const cells = graph.getSelectedCells()
    const nodes = cells.filter(cell => cell.isNode())
    if (nodes.length) {
      nodes.forEach(node => {
        const position = node.getPosition()
        node.setPosition(position.x - 10, position.y)
      })
      console.log('Move nodes left')
    }
  })

  // 右移选中节点
  graph.bindKey('right', (e: KeyboardEvent) => {
    const cells = graph.getSelectedCells()
    const nodes = cells.filter(cell => cell.isNode())
    if (nodes.length) {
      nodes.forEach(node => {
        const position = node.getPosition()
        node.setPosition(position.x + 10, position.y)
      })
      console.log('Move nodes right')
    }
  })

  console.log('Keyboard shortcuts bound successfully')
}

// 初始化图形和节点
const initShapes = () => {
  if (!graph) return

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
      { group: 'top' },
      { group: 'right' },
      { group: 'bottom' },
      { group: 'left' },
    ],
  }

  // 注册自定义矩形节点
  Graph.registerNode(
    'custom-rect',
    {
      inherit: 'rect',
      width: 66,
      height: 36,
      attrs: {
        body: {
          strokeWidth: 1,
          stroke: '#5F95FF',
          fill: '#EFF4FF',
        },
        text: {
          fontSize: 12,
          fill: '#262626',
        },
      },
      ports: { ...ports },
    },
    true,
  )

  // 注册自定义多边形节点（决策）
  Graph.registerNode(
    'custom-polygon',
    {
      inherit: 'polygon',
      width: 66,
      height: 36,
      attrs: {
        body: {
          strokeWidth: 1,
          stroke: '#5F95FF',
          fill: '#EFF4FF',
        },
        text: {
          fontSize: 12,
          fill: '#262626',
        },
      },
      ports: {
        ...ports,
        items: [
          { group: 'top' },
          { group: 'bottom' },
        ],
      },
    },
    true,
  )

  // 注册自定义圆形节点
  Graph.registerNode(
    'custom-circle',
    {
      inherit: 'circle',
      width: 45,
      height: 45,
      attrs: {
        body: {
          strokeWidth: 1,
          stroke: '#5F95FF',
          fill: '#EFF4FF',
        },
        text: {
          fontSize: 12,
          fill: '#262626',
        },
      },
      ports: { ...ports },
    },
    true,
  )

  // 注册自定义图像节点
  Graph.registerNode(
    'custom-image',
    {
      inherit: 'rect',
      width: 52,
      height: 52,
      markup: [
        {
          tagName: 'rect',
          selector: 'body',
        },
        {
          tagName: 'image',
        },
        {
          tagName: 'text',
          selector: 'label',
        },
      ],
      attrs: {
        body: {
          stroke: '#5F95FF',
          fill: '#5F95FF',
        },
        image: {
          width: 26,
          height: 26,
          refX: 13,
          refY: 16,
        },
        label: {
          refX: 3,
          refY: 2,
          textAnchor: 'left',
          textVerticalAnchor: 'top',
          fontSize: 12,
          fill: '#fff',
        },
      },
      ports: { ...ports },
    },
    true,
  )

  // 创建基础流程图节点（去掉预置文字，添加编辑工具）
  const basicNodeConfigs = [
    {
      shape: 'custom-rect',
      label: '', // 去掉预置文字
      displayName: '开始',
      x: 0,
      y: 0,
      width: 66,
      height: 36,
      visible: true,
      attrs: {
        body: {
          rx: 20,
          ry: 26,
        },
        text: {
          text: '', // 确保文本为空
        },
      },
      tools: [
        {
          name: 'node-editor',
          args: {
            attrs: {
              backgroundColor: '#EFF4FF',
            },
          },
        },
      ],
    },
    {
      shape: 'custom-rect',
      label: '', // 去掉预置文字
      displayName: '过程',
      x: 0,
      y: 0,
      width: 66,
      height: 36,
      visible: true,
      attrs: {
        text: {
          text: '', // 确保文本为空
        },
      },
      tools: [
        {
          name: 'node-editor',
          args: {
            attrs: {
              backgroundColor: '#EFF4FF',
            },
          },
        },
      ],
    },
    {
      shape: 'custom-rect',
      label: '', // 去掉预置文字
      displayName: '可选过程',
      x: 0,
      y: 0,
      width: 66,
      height: 36,
      visible: true,
      attrs: {
        body: {
          rx: 6,
          ry: 6,
        },
        text: {
          text: '', // 确保文本为空
        },
      },
      tools: [
        {
          name: 'node-editor',
          args: {
            attrs: {
              backgroundColor: '#EFF4FF',
            },
          },
        },
      ],
    },
    {
      shape: 'custom-polygon',
      label: '', // 去掉预置文字
      displayName: '决策',
      x: 0,
      y: 0,
      width: 66,
      height: 36,
      visible: true,
      attrs: {
        body: {
          refPoints: '0,10 10,0 20,10 10,20',
        },
        text: {
          text: '', // 确保文本为空
        },
      },
      tools: [
        {
          name: 'node-editor',
          args: {
            attrs: {
              backgroundColor: '#EFF4FF',
            },
          },
        },
      ],
    },
    {
      shape: 'custom-polygon',
      label: '', // 去掉预置文字
      displayName: '数据',
      x: 0,
      y: 0,
      width: 66,
      height: 36,
      visible: true,
      attrs: {
        body: {
          refPoints: '10,0 40,0 30,20 0,20',
        },
        text: {
          text: '', // 确保文本为空
        },
      },
      tools: [
        {
          name: 'node-editor',
          args: {
            attrs: {
              backgroundColor: '#EFF4FF',
            },
          },
        },
      ],
    },
    {
      shape: 'custom-circle',
      label: '', // 去掉预置文字
      displayName: '连接',
      x: 0,
      y: 0,
      width: 45,
      height: 45,
      visible: true,
      attrs: {
        text: {
          text: '', // 确保文本为空
        },
      },
      tools: [
        {
          name: 'node-editor',
          args: {
            attrs: {
              backgroundColor: '#EFF4FF',
            },
          },
        },
      ],
    },
  ]

  const basicNodes = basicNodeConfigs.map(config => {
    const node = graph.createNode(config)
    // 保存显示名称用于面板显示
    ;(node as any).displayName = config.displayName
    return node
  })

  // 创建系统设计图节点
  const imageShapes = [
    {
      label: 'Client',
      image: 'https://gw.alipayobjects.com/zos/bmw-prod/687b6cb9-4b97-42a6-96d0-34b3099133ac.svg',
    },
    {
      label: 'Http',
      image: 'https://gw.alipayobjects.com/zos/bmw-prod/dc1ced06-417d-466f-927b-b4a4d3265791.svg',
    },
    {
      label: 'Api',
      image: 'https://gw.alipayobjects.com/zos/bmw-prod/c55d7ae1-8d20-4585-bd8f-ca23653a4489.svg',
    },
    {
      label: 'Sql',
      image: 'https://gw.alipayobjects.com/zos/bmw-prod/6eb71764-18ed-4149-b868-53ad1542c405.svg',
    },
    {
      label: 'Cloud',
      image: 'https://gw.alipayobjects.com/zos/bmw-prod/c36fe7cb-dc24-4854-aeb5-88d8dc36d52e.svg',
    },
    {
      label: 'Mq',
      image: 'https://gw.alipayobjects.com/zos/bmw-prod/2010ac9f-40e7-49d4-8c4a-4fcf2f83033b.svg',
    },
  ]
  
  const imageNodes = imageShapes.map((item) =>
    graph.createNode({
      shape: 'custom-image',
      label: item.label,
      attrs: {
        image: {
          'xlink:href': item.image,
        },
      },
      tools: [
        {
          name: 'node-editor',
          args: {
            attrs: {
              backgroundColor: '#EFF4FF',
            },
          },
        },
      ],
    }),
  )

  // 创建简单的拖拽面板
  createSimpleStencil(basicNodes, imageNodes)
}

// 创建简单的拖拽面板
const createSimpleStencil = (basicNodes: any[], imageNodes: any[]) => {
  if (!stencilRef.value) return

  const stencilContainer = stencilRef.value
  
  // 创建基础流程图分组
  const basicGroup = document.createElement('div')
  basicGroup.className = 'stencil-group'
  basicGroup.innerHTML = `
    <div class="stencil-group-title">基础流程图</div>
    <div class="stencil-items"></div>
  `
  
  // 创建系统设计图分组
  const systemGroup = document.createElement('div')
  systemGroup.className = 'stencil-group'
  systemGroup.innerHTML = `
    <div class="stencil-group-title">系统设计图</div>
    <div class="stencil-items"></div>
  `
  
  stencilContainer.appendChild(basicGroup)
  stencilContainer.appendChild(systemGroup)
  
  // 添加基础节点到面板
  const basicItems = basicGroup.querySelector('.stencil-items')!
  basicNodes.forEach((node, index) => {
    const nodeEl = createStencilNode(node, index)
    basicItems.appendChild(nodeEl)
  })
  
  // 添加图像节点到面板
  const systemItems = systemGroup.querySelector('.stencil-items')!
  imageNodes.forEach((node, index) => {
    const nodeEl = createStencilNode(node, index + basicNodes.length)
    systemItems.appendChild(nodeEl)
  })
  
  // 添加拖拽样式
  const stencilStyle = document.createElement('style')
  stencilStyle.textContent = `
    .stencil-group {
      margin-bottom: 16px;
    }
    .stencil-items {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;
      padding: 8px;
    }
    .stencil-node {
      background: #fff;
      border: 1px solid #d9d9d9;
      border-radius: 4px;
      padding: 8px;
      cursor: move;
      text-align: center;
      font-size: 12px;
      transition: all 0.2s;
    }
    .stencil-node:hover {
      border-color: #1890ff;
      box-shadow: 0 2px 4px rgba(24, 144, 255, 0.2);
    }
    .stencil-node.dragging {
      opacity: 0.5;
    }
  `
  document.head.appendChild(stencilStyle)
}

// 创建面板节点元素
const createStencilNode = (node: any, index: number) => {
  const nodeEl = document.createElement('div')
  nodeEl.className = 'stencil-node'
  
  // 创建图形预览
  const previewEl = document.createElement('div')
  previewEl.className = 'stencil-node-preview'
  previewEl.style.cssText = `
    width: 40px;
    height: 30px;
    margin: 0 auto 4px;
    background: #EFF4FF;
    border: 1px solid #5F95FF;
    border-radius: ${node.shape === 'custom-circle' ? '50%' : node.shape === 'custom-rect' && node.attrs?.body?.rx ? '8px' : '2px'};
    position: relative;
  `
  
  // 创建文字标签
  const labelEl = document.createElement('div')
  labelEl.className = 'stencil-node-label'
  labelEl.textContent = (node as any).displayName || node.getLabel() || ''
  labelEl.style.cssText = `
    font-size: 11px;
    color: #666;
    text-align: center;
  `
  
  nodeEl.appendChild(previewEl)
  nodeEl.appendChild(labelEl)
  nodeEl.draggable = true
  
  // 拖拽事件
  nodeEl.addEventListener('dragstart', (e) => {
    // 创建节点数据的副本，去掉ID以确保每个新节点都有唯一ID
    const nodeData = node.toJSON()
    delete nodeData.id // 删除ID，让X6自动生成新的唯一ID
    e.dataTransfer?.setData('application/json', JSON.stringify(nodeData))
    nodeEl.classList.add('dragging')
  })
  
  nodeEl.addEventListener('dragend', () => {
    nodeEl.classList.remove('dragging')
  })
  
  return nodeEl
}

// 设置画布拖拽接收
const setupDropZone = () => {
  if (!graphContainerRef.value || !graph) return
  
  const container = graphContainerRef.value
  
  container.addEventListener('dragover', (e) => {
    e.preventDefault()
  })
  
  container.addEventListener('drop', (e) => {
    e.preventDefault()
    
    try {
      const data = e.dataTransfer?.getData('application/json')
      if (data && graph) {
        const nodeData = JSON.parse(data)
        const rect = container.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top
        
        // 转换为画布坐标
        const canvasPoint = graph.clientToLocal(x, y)
        
        // 创建新节点，确保所有必要属性都正确设置
        const newNode = graph.addNode({
          shape: nodeData.shape,
          x: canvasPoint.x - (nodeData.width || 66) / 2, // 居中偏移
          y: canvasPoint.y - (nodeData.height || 36) / 2,
          width: nodeData.width || 66,
          height: nodeData.height || 36,
          visible: true,
          attrs: {
            ...nodeData.attrs,
            text: {
              text: '', // 确保文本为空
            },
          },
          ports: nodeData.ports,
          tools: nodeData.tools,
        })
        
        console.log('Node dropped:', newNode)
        console.log('Node position:', {
          x: newNode.getPosition(),
          size: newNode.getSize(),
          visible: newNode.isVisible(),
          attrs: newNode.getAttrs()
        })
        
        // 简化视图检查 - 只检查基本状态
        setTimeout(() => {
          const nodeView = graph?.findViewByCell(newNode)
          console.log('Node view:', nodeView)
          
          if (!nodeView && graph) {
            console.log('Node view not found, checking graph state...')
            console.log('Graph zoom:', graph?.zoom())
            console.log('Graph size:', graph?.getGraphArea())
            
            // 简单修复：强制重绘画布
            graph.resize()
          }
        }, 200)
      }
    } catch (error) {
      console.error('Drop error:', error)
    }
  })
}

// 检测浏览器缩放级别
const detectBrowserZoom = () => {
  const getZoomLevel = () => {
    // 方法1: 使用 window.devicePixelRatio
    const devicePixelRatio = window.devicePixelRatio || 1
    
    // 方法2: 使用 visual viewport 尺寸与 window.innerWidth 的比例
    const visualViewportWidth = window.visualViewport?.width || window.innerWidth
    const zoomRatio = window.innerWidth / visualViewportWidth
    
    // 方法3: 使用 transform 检测
    const testElement = document.createElement('div')
    testElement.style.position = 'absolute'
    testElement.style.width = '100mm'
    testElement.style.height = '100mm'
    testElement.style.left = '-9999px'
    testElement.style.top = '-9999px'
    document.body.appendChild(testElement)
    
    const rect = testElement.getBoundingClientRect()
    document.body.removeChild(testElement)
    
    const mmToPixels = rect.width / 100 // 100mm 对应的像素数
    const calculatedZoom = mmToPixels / 3.78 // 96dpi 下 1mm = 3.78px
    
    // 综合多种方法计算最准确的缩放级别
    // 优先使用 visual viewport 方法，因为它更准确
    const finalZoom = visualViewportWidth > 0 ? zoomRatio : (devicePixelRatio + calculatedZoom) / 2
    
    return Math.round(finalZoom * 100) / 100
  }
  
  const newZoomLevel = getZoomLevel()
  
  // 增加更严格的阈值，避免微小变化触发补偿
  if (Math.abs(newZoomLevel - browserZoomLevel) > 0.05) {
    const zoomChange = newZoomLevel / browserZoomLevel
    
    // 防止过度补偿：如果变化太大，可能是检测错误
    if (zoomChange > 0.5 && zoomChange < 2.0) {
      browserZoomLevel = newZoomLevel
      
      console.log(`Browser zoom changed: ${browserZoomLevel} (change: ${zoomChange})`)
      
      // 补偿画布缩放
      if (graph) {
        compensateForBrowserZoom(zoomChange)
      }
    } else {
      console.warn(`Zoom change too extreme, ignoring: ${zoomChange}`)
    }
  }
}

// 补偿浏览器缩放对画布的影响
const compensateForBrowserZoom = (zoomChange: number) => {
  if (!graph) return
  
  try {
    // 获取当前画布缩放级别
    const currentGraphZoom = graph.zoom()
    
    // 计算补偿后的缩放级别
    // 注意：如果浏览器放大了2倍，我们需要将画布缩小到原来的1/2来补偿
    // 所以应该是 currentGraphZoom / zoomChange
    let compensatedZoom = currentGraphZoom / zoomChange
    
    // 确保缩放级别在合理范围内
    const minScale = 0.1
    const maxScale = 10
    compensatedZoom = Math.max(minScale, Math.min(maxScale, compensatedZoom))
    
    // 应用补偿缩放
    graph.scale(compensatedZoom)
    
    console.log(`Browser zoom change: ${zoomChange}, Graph zoom: ${currentGraphZoom} -> ${compensatedZoom}`)
    
    // 补偿网格背景的浏览器缩放影响
    compensateGridBackground(zoomChange)
    
    // 更新滚动器配置以适应新的缩放
    const scroller = graph.getPlugin('scroller') as any
    if (scroller && graphContainerRef.value) {
      scroller.updateRect()
    }
  } catch (error) {
    console.error('Failed to compensate for browser zoom:', error)
  }
}

// 补偿网格背景的浏览器缩放影响
const compensateGridBackground = (zoomChange: number) => {
  if (!graphContainerRef.value) return
  
  try {
    // 查找网格背景元素
    const gridElement = graphContainerRef.value.querySelector('.x6-graph-grid') as HTMLElement
    if (!gridElement) return
    
    console.log('Compensating grid background for browser zoom:', zoomChange)
    
    // 获取当前的背景图像样式
    const currentBgImage = gridElement.style.backgroundImage
    if (!currentBgImage || !currentBgImage.includes('data:image/svg+xml')) {
      return
    }
    
    // 解析 base64 编码的 SVG
    const base64Match = currentBgImage.match(/base64,([^"]+)/)
    if (!base64Match) return
    
    const svgBase64 = base64Match[1]
    const svgXml = atob(svgBase64)
    
    // 解析 SVG 并修改 pattern 的缩放
    const parser = new DOMParser()
    const svgDoc = parser.parseFromString(svgXml, 'image/svg+xml')
    
    // 查找所有的 pattern 元素
    const patterns = svgDoc.querySelectorAll('pattern')
    patterns.forEach(pattern => {
      const currentWidth = pattern.getAttribute('width')
      const currentHeight = pattern.getAttribute('height')
      
      if (currentWidth && currentHeight) {
        // 计算补偿后的尺寸
        const newWidth = parseFloat(currentWidth) / zoomChange
        const newHeight = parseFloat(currentHeight) / zoomChange
        
        pattern.setAttribute('width', newWidth.toString())
        pattern.setAttribute('height', newHeight.toString())
        
        console.log(`Grid pattern compensated: ${currentWidth}x${currentHeight} -> ${newWidth}x${newHeight}`)
      }
    })
    
    // 重新编码 SVG
    const compensatedSvg = new XMLSerializer().serializeToString(svgDoc)
    const compensatedBase64 = btoa(compensatedSvg)
    
    // 应用补偿后的背景
    gridElement.style.backgroundImage = `url("data:image/svg+xml;base64,${compensatedBase64}")`
    
    console.log('Grid background compensation completed')
    
  } catch (error) {
    console.error('Failed to compensate grid background:', error)
  }
}

// 设置浏览器缩放监听
const setupBrowserZoomDetection = () => {
  // 方法1: 监听 window.resize 事件
  const handleResize = () => {
    detectBrowserZoom()
  }
  
  window.addEventListener('resize', handleResize, { passive: true })
  
  // 方法2: 使用 ResizeObserver 监听容器变化
  if (window.ResizeObserver && graphContainerRef.value) {
    resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        // 检查是否是缩放导致的尺寸变化
        if (width > 0 && height > 0) {
          detectBrowserZoom()
        }
      }
    })
    
    resizeObserver.observe(graphContainerRef.value)
  }
  
  // 方法3: 定期检查缩放级别（作为备用）
  zoomCheckInterval = window.setInterval(() => {
    detectBrowserZoom()
  }, 1000) // 每秒检查一次
  
  // 方法4: 监听鼠标滚轮事件以检测 Ctrl+滚轮缩放
  const handleWheel = (e: WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      // 延迟检测，让浏览器先处理缩放
      setTimeout(detectBrowserZoom, 100)
    }
  }
  
  window.addEventListener('wheel', handleWheel, { passive: true })
  
  // 初始检测
  setTimeout(detectBrowserZoom, 100)
}

// 清理浏览器缩放监听
const cleanupBrowserZoomDetection = () => {
  window.removeEventListener('resize', detectBrowserZoom)
  window.removeEventListener('wheel', detectBrowserZoom)
  
  if (resizeObserver && graphContainerRef.value) {
    resizeObserver.disconnect()
    resizeObserver = null
  }
  
  if (zoomCheckInterval) {
    clearInterval(zoomCheckInterval)
    zoomCheckInterval = null
  }
}

// 初始化所有组件
const init = () => {
  preWork()
  initGraph()
  initShapes()
  setupDropZone()
  setupBrowserZoomDetection()
  
  // 发出ready事件
  if (graph) {
    emit('ready', graph)
  }
}

// 生命周期
onMounted(() => {
  init()
})

onUnmounted(() => {
  if (graph) {
    graph.dispose()
  }
  
  // 清理浏览器缩放监听
  cleanupBrowserZoomDetection()
})

// 设置网格配置
const setGridConfig = (config: any) => {
  if (!graph) return
  
  try {
    console.log('Updating grid config:', config)
    
    // 设置网格大小
    if (config.size && typeof config.size === 'number') {
      graph.setGridSize(config.size)
    }
    
    // 处理"关闭网格"选项
    if (config.type === 'none' || config.visible === false) {
      graph.hideGrid()
      console.log('Grid hidden')
      return
    }
    
    // 显示网格
    if (config.visible !== false) {
      graph.showGrid()
    }
    
    // 如果有类型或样式配置，重绘网格
    if (config.type && config.type !== 'none') {
      const drawOptions: any = {}
      
      // 设置网格类型
      drawOptions.type = config.type
      
      // 设置网格参数
      if (config.args) {
        if (Array.isArray(config.args)) {
          drawOptions.args = config.args
        } else {
          drawOptions.args = [config.args]
        }
      }
      
      // 重绘网格
      graph.drawGrid(drawOptions)
      console.log('Grid redrawn with options:', drawOptions)
    }
    
    console.log('Grid config update completed')
  } catch (error) {
    console.error('Failed to update grid config:', error)
  }
}

// 设置背景配置
const setBackgroundConfig = (config: any) => {
  if (!graph) return
  
  try {
    console.log('Updating background config:', config)
    
    if (!config) {
      // 清除背景
      graph.clearBackground()
      console.log('Background cleared')
      return
    }
    
    // 绘制背景
    graph.drawBackground(config)
    console.log('Background updated with config:', config)
  } catch (error) {
    console.error('Failed to update background config:', error)
  }
}

// 处理动态背景更新
const handleDynamicBackgroundUpdate = (config: any) => {
  if (!graph) return
  
  try {
    console.log('Handling dynamic background update:', config)
    
    if (!config || !config.scaleWithZoom) {
      return
    }
    
    // 根据缩放级别调整背景透明度
    const currentZoom = graph.zoom()
    let opacity = config.baseOpacity || 1
    
    // 根据缩放级别调整透明度
    if (currentZoom < 1) {
      // 缩小时降低透明度
      const scale = Math.max(0, (currentZoom - 0.1) / 0.9) // 0.1 到 1.0 的范围映射到 0 到 1
      opacity = (config.minOpacity || 0.3) + ((config.baseOpacity || 1) - (config.minOpacity || 0.3)) * scale
    } else if (currentZoom > 1) {
      // 放大时可以稍微增加透明度，但不超过最大值
      const scale = Math.min(1, (currentZoom - 1) / 2) // 1 到 3 的范围映射到 0 到 1
      opacity = (config.baseOpacity || 1) + ((config.maxOpacity || 1) - (config.baseOpacity || 1)) * scale * 0.3
    }
    
    // 确保透明度在合理范围内
    opacity = Math.max(config.minOpacity || 0.3, Math.min(config.maxOpacity || 1, opacity))
    
    // 更新背景透明度
    const backgroundConfig = {
      ...config,
      opacity,
    }
    
    graph.drawBackground(backgroundConfig)
    console.log('Dynamic background updated with opacity:', opacity)
  } catch (error) {
    console.error('Failed to handle dynamic background update:', error)
  }
}

// 获取当前网格配置
const getGridConfig = () => {
  if (!graph) return null
  
  try {
    // 返回当前的网格配置
    return {
      visible: true, // 简化实现，总是返回可见
      size: 10,
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
    }
  } catch (error) {
    console.error('Failed to get grid config:', error)
    return null
  }
}

// 设置对齐线配置
const setSnaplineConfig = (config: any) => {
  if (!graph) return
  
  try {
    console.log('Updating snapline config:', config)
    
    // 获取对齐线插件实例
    const snapline = graph.getPlugin('snapline') as any
    
    if (!config || config.enabled === false) {
      // 禁用对齐线
      if (snapline) {
        snapline.disable()
        console.log('Snapline disabled')
      }
      return
    }
    
    // 启用对齐线
    if (snapline) {
      snapline.enable()
      console.log('Snapline enabled')
      
      // 更新其他配置
      if (config.tolerance !== undefined) {
        snapline.setTolerance(config.tolerance)
      }
      if (config.sharp !== undefined) {
        if (config.sharp) {
          snapline.enableSharp()
        } else {
          snapline.disableSharp()
        }
      }
      if (config.resizing !== undefined) {
        if (config.resizing) {
          snapline.enableOnResizing()
        } else {
          snapline.disableOnResizing()
        }
      }
    }
    
    console.log('Snapline config updated:', config)
    
  } catch (error) {
    console.error('Failed to update snapline config:', error)
  }
}

// 设置滚动器配置
const setScrollerConfig = (config: any) => {
  if (!graph) return
  
  try {
    console.log('Updating scroller config:', config)
    
    // 获取滚动器插件实例
    const scroller = graph.getPlugin('scroller') as any
    
    if (!config || config.enabled === false) {
      // 禁用滚动器
      if (scroller) {
        scroller.disable()
        console.log('Scroller disabled')
      }
      return
    }
    
    // 启用滚动器
    if (scroller) {
      scroller.enable()
      console.log('Scroller enabled')
      
      // 更新平移配置
      if (config.pannable !== undefined) {
        if (config.pannable) {
          scroller.enablePanning()
        } else {
          scroller.disablePanning()
        }
      }
      
      // 更新自动调整大小配置
      if (config.autoResize !== undefined) {
        if (config.autoResize) {
          scroller.enableAutoResize()
        } else {
          scroller.disableAutoResize()
        }
      }
      
      // 滚动到指定位置
      if (config.scrollToPoint) {
        const { x, y } = config.scrollToPoint
        scroller.scrollToPoint(x, y, config.scrollOptions)
      }
      
      // 滚动到内容中心
      if (config.scrollToContent) {
        scroller.scrollToContent(config.scrollOptions)
      }
      
      // 缩放和平移到指定矩形区域
      if (config.transitionToRect) {
        scroller.transitionToRect(config.transitionToRect.rect, config.transitionToRect.options)
      }
    }
    
    console.log('Scroller config updated:', config)
    
  } catch (error) {
    console.error('Failed to update scroller config:', error)
  }
}

// 获取滚动器状态
const getScrollerState = () => {
  if (!graph) return null
  
  try {
    const scroller = graph.getPlugin('scroller') as any
    
    if (!scroller) {
      return null
    }
    
    return {
      enabled: scroller.isEnabled?.() || true,
      pannable: scroller.isPannable?.() || false,
      autoResize: scroller.isAutoResizeEnabled?.() || true,
      scrollbarPosition: scroller.getScrollbarPosition?.() || { left: 0, top: 0 },
    }
  } catch (error) {
    console.error('Failed to get scroller state:', error)
    return null
  }
}

// 设置选择配置
const setSelectionConfig = (config: any) => {
  if (!graph) return
  
  try {
    console.log('Updating selection config:', config)
    
    // 简化实现 - 只记录配置状态
    if (!config || config.enabled === false) {
      console.log('Selection disabled (simplified implementation)')
      return
    }
    
    console.log('Selection enabled (simplified implementation)')
    
    // 设置选择框显示
    if (config.showNodeSelectionBox !== undefined) {
      // 通过 CSS 控制选择框显示
      const style = document.createElement('style')
      style.textContent = `
        .x6-widget-selection-box.node {
          display: ${config.showNodeSelectionBox ? 'block' : 'none'} !important;
        }
      `
      document.head.appendChild(style)
    }
    
    if (config.showEdgeSelectionBox !== undefined) {
      // 通过 CSS 控制选择框显示
      const style = document.createElement('style')
      style.textContent = `
        .x6-widget-selection-box.edge {
          display: ${config.showEdgeSelectionBox ? 'block' : 'none'} !important;
        }
      `
      document.head.appendChild(style)
    }
    
    // 设置自定义样式名
    if (config.className) {
      // 通过设置 graph 的 container 类名来应用自定义样式
      const container = graph.container
      if (container) {
        container.classList.add(config.className)
      }
    }
    
    console.log('Selection config updated (simplified):', config)
    
  } catch (error) {
    console.error('Failed to update selection config:', error)
  }
}

// 获取选择状态
const getSelectionState = () => {
  if (!graph) return null
  
  try {
    // 简化实现 - 返回基本状态
    const selectedCells = graph.getSelectedCells()
    return {
      enabled: true, // 简化实现，总是返回启用
      multiple: true, // 简化实现，总是返回支持多选
      rubberband: true, // 简化实现，总是返回支持框选
      strict: false, // 简化实现，总是返回非严格模式
      movable: true, // 简化实现，总是返回可移动
      selectedCells: selectedCells || [],
      selectedNodes: selectedCells?.filter((cell: any) => cell.isNode?.()) || [],
      selectedEdges: selectedCells?.filter((cell: any) => cell.isEdge?.()) || [],
    }
  } catch (error) {
    console.error('Failed to get selection state:', error)
    return null
  }
}


// 视图查找方法
const findView = (ref: any) => {
  if (!graph) return null
  
  try {
    return graph.findView(ref)
  } catch (error) {
    console.error('Failed to find view:', error)
    return null
  }
}

const findViewByCell = (cell: any) => {
  if (!graph) return null
  
  try {
    return graph.findViewByCell(cell)
  } catch (error) {
    console.error('Failed to find view by cell:', error)
    return null
  }
}

const findViewByElem = (elem: any) => {
  if (!graph) return null
  
  try {
    return graph.findViewByElem(elem)
  } catch (error) {
    console.error('Failed to find view by element:', error)
    return null
  }
}

const findViewsFromPoint = (x: number, y: number) => {
  if (!graph) return []
  
  try {
    return graph.findViewsFromPoint(x, y)
  } catch (error) {
    console.error('Failed to find views from point:', error)
    return []
  }
}

const findViewsInArea = (x: number, y: number, width: number, height: number, options?: any) => {
  if (!graph) return []
  
  try {
    return graph.findViewsInArea(x, y, width, height, options)
  } catch (error) {
    console.error('Failed to find views in area:', error)
    return []
  }
}

const findViews = (ref: any) => {
  if (!graph) return []
  
  try {
    return graph.findViews(ref)
  } catch (error) {
    console.error('Failed to find views:', error)
    return []
  }
}

// 视图状态检查方法
const isViewMounted = (view: any) => {
  if (!graph) return false
  
  try {
    return (graph as any).isViewMounted?.(view) || false
  } catch (error) {
    console.error('Failed to check if view is mounted:', error)
    return false
  }
}

const getMountedViews = () => {
  if (!graph) return []
  
  try {
    return (graph as any).getMountedViews?.() || []
  } catch (error) {
    console.error('Failed to get mounted views:', error)
    return []
  }
}

const getUnmountedViews = () => {
  if (!graph) return []
  
  try {
    return (graph as any).getUnmountedViews?.() || []
  } catch (error) {
    console.error('Failed to get unmounted views:', error)
    return []
  }
}

// 异步渲染控制方法
const isAsync = () => {
  if (!graph) return false
  
  try {
    return (graph as any).isAsync?.() || false
  } catch (error) {
    console.error('Failed to check if graph is async:', error)
    return false
  }
}

const isFrozen = () => {
  if (!graph) return false
  
  try {
    return (graph as any).isFrozen?.() || false
  } catch (error) {
    console.error('Failed to check if graph is frozen:', error)
    return false
  }
}

const freeze = (options?: any) => {
  if (!graph) return
  
  try {
    (graph as any).freeze?.(options)
    console.log('Graph frozen:', options)
  } catch (error) {
    console.error('Failed to freeze graph:', error)
  }
}

const unfreeze = (options?: any) => {
  if (!graph) return
  
  try {
    (graph as any).unfreeze?.(options)
    console.log('Graph unfrozen:', options)
  } catch (error) {
    console.error('Failed to unfreeze graph:', error)
  }
}

// 视图配置方法
const setViewConfig = (config: any) => {
  if (!graph) return
  
  try {
    console.log('Updating view config:', config)
    
    // 设置排序方式
    if (config.sorting !== undefined) {
      // 注意：sorting 只能在创建时设置，这里只是记录
      console.log('Sorting mode (note: only works on graph creation):', config.sorting)
    }
    
    // 设置异步渲染
    if (config.async !== undefined) {
      // 注意：async 只能在创建时设置，这里只是记录
      console.log('Async mode (note: only works on graph creation):', config.async)
    }
    
    // 设置连线触发阈值
    if (config.magnetThreshold !== undefined) {
      // 注意：magnetThreshold 只能在创建时设置，这里只是记录
      console.log('Magnet threshold (note: only works on graph creation):', config.magnetThreshold)
    }
    
    // 设置鼠标移动阈值
    if (config.moveThreshold !== undefined) {
      // 注意：moveThreshold 只能在创建时设置，这里只是记录
      console.log('Move threshold (note: only works on graph creation):', config.moveThreshold)
    }
    
    // 设置点击阈值
    if (config.clickThreshold !== undefined) {
      // 注意：clickThreshold 只能在创建时设置，这里只是记录
      console.log('Click threshold (note: only works on graph creation):', config.clickThreshold)
    }
    
    // 设置右键菜单
    if (config.preventDefaultContextMenu !== undefined) {
      // 注意：preventDefaultContextMenu 只能在创建时设置，这里只是记录
      console.log('Prevent default context menu (note: only works on graph creation):', config.preventDefaultContextMenu)
    }
    
    // 设置空白位置默认行为
    if (config.preventDefaultBlankAction !== undefined) {
      // 注意：preventDefaultBlankAction 只能在创建时设置，这里只是记录
      console.log('Prevent default blank action (note: only works on graph creation):', config.preventDefaultBlankAction)
    }
    
    console.log('View config updated (note: some options only work on graph creation)')
    
  } catch (error) {
    console.error('Failed to update view config:', error)
  }
}

// 获取视图状态
const getViewState = () => {
  if (!graph) return null
  
  try {
    return {
      sorting: 'exact', // 从配置中获取
      async: isAsync(),
      frozen: isFrozen(),
      magnetThreshold: 0, // 从配置中获取
      moveThreshold: 0, // 从配置中获取
      clickThreshold: 0, // 从配置中获取
      preventDefaultContextMenu: true, // 从配置中获取
      preventDefaultBlankAction: true, // 从配置中获取
      mountedViews: getMountedViews(),
      unmountedViews: getUnmountedViews(),
    }
  } catch (error) {
    console.error('Failed to get view state:', error)
    return null
  }
}

// Model API 方法 - 基于官方文档优化
const modelMethods = {
  // 节点和边的类型判断
  isNode: (cell: any) => graph?.isNode(cell) || false,
  isEdge: (cell: any) => graph?.isEdge(cell) || false,
  
  // 节点操作
  createNode: (metadata: any) => graph?.createNode(metadata),
  addNode: (node: any, options?: any) => graph?.addNode(node, options),
  addNodes: (nodes: any[], options?: any) => graph?.addNodes(nodes, options),
  removeNode: (node: any, options?: any) => graph?.removeNode(node, options),
  
  // 边操作
  createEdge: (metadata: any) => graph?.createEdge(metadata),
  addEdge: (edge: any, options?: any) => graph?.addEdge(edge, options),
  addEdges: (edges: any[], options?: any) => graph?.addEdges(edges, options),
  removeEdge: (edge: any, options?: any) => graph?.removeEdge(edge, options),
  
  // 通用Cell操作
  addCell: (cell: any, options?: any) => graph?.addCell(cell, options),
  addCells: (cells: any[], options?: any) => {
    if (!graph) return
    // 使用forEach逐个添加，因为X6可能不支持批量添加
    cells.forEach(cell => graph.addCell(cell, options))
  },
  removeCell: (cell: any, options?: any) => graph?.removeCell(cell, options),
  removeCells: (cells: any[], options?: any) => graph?.removeCells(cells, options),
  clearCells: (options?: any) => graph?.clearCells(options),
  resetCells: (cells: any[], options?: any) => graph?.resetCells(cells, options),
  
  // 查询方法
  hasCell: (cell: any) => graph?.hasCell(cell) || false,
  getCellById: (id: string) => graph?.getCellById(id),
  getCells: () => graph?.getCells() || [],
  getCellCount: () => graph?.getCellCount() || 0,
  getNodes: () => graph?.getNodes() || [],
  getEdges: () => graph?.getEdges() || [],
  
  // 连接关系查询
  getOutgoingEdges: (cell: any) => graph?.getOutgoingEdges(cell) || [],
  getIncomingEdges: (cell: any) => graph?.getIncomingEdges(cell) || [],
  getConnectedEdges: (cell: any, options?: any) => graph?.getConnectedEdges(cell, options) || [],
  removeConnectedEdges: (cell: any, options?: any) => graph?.removeConnectedEdges(cell, options) || [],
  disconnectConnectedEdges: (cell: any, options?: any) => graph?.disconnectConnectedEdges(cell, options),
  
  // 节点层次查询
  getRootNodes: () => graph?.getRootNodes() || [],
  isRootNode: (cell: any) => graph?.isRootNode(cell) || false,
  getLeafNodes: () => graph?.getLeafNodes() || [],
  isLeafNode: (cell: any) => graph?.isLeafNode(cell) || false,
  
  // 邻居节点查询
  getNeighbors: (cell: any, options?: any) => graph?.getNeighbors(cell, options) || [],
  isNeighbor: (cell1: any, cell2: any, options?: any) => graph?.isNeighbor(cell1, cell2, options) || false,
  
  // 前序和后继节点查询
  getPredecessors: (cell: any, options?: any) => graph?.getPredecessors(cell, options) || [],
  isPredecessor: (cell1: any, cell2: any, options?: any) => graph?.isPredecessor(cell1, cell2, options) || false,
  getSuccessors: (cell: any, options?: any) => graph?.getSuccessors(cell, options) || [],
  isSuccessor: (cell1: any, cell2: any, options?: any) => graph?.isSuccessor(cell1, cell2, options) || false,
  
  // 共同祖先查询
  getCommonAncestor: (...cells: any[]) => graph?.getCommonAncestor(...cells),
  
  // 子图操作
  getSubGraph: (cells: any[], options?: any) => graph?.getSubGraph(cells, options) || [],
  cloneCells: (cells: any[]) => graph?.cloneCells(cells) || {},
  cloneSubGraph: (cells: any[], options?: any) => graph?.cloneSubGraph(cells, options) || {},
  
  // 位置查询
  getNodesFromPoint: (xOrPoint: number | { x: number, y: number }, y?: number) => {
    if (!graph) return []
    if (typeof xOrPoint === 'object') {
      return graph.getNodesFromPoint(xOrPoint) || []
    } else {
      return graph.getNodesFromPoint(xOrPoint, y || 0) || []
    }
  },
  getNodesInArea: (xOrRect: number | any, y?: number, w?: number, h?: number, options?: any) => {
    if (!graph) return []
    if (typeof xOrRect === 'object') {
      return graph.getNodesInArea(xOrRect, options) || []
    } else {
      return graph.getNodesInArea(xOrRect, y || 0, w || 0, h || 0, options) || []
    }
  },
  getNodesUnderNode: (node: any, options?: any) => graph?.getNodesUnderNode(node, options) || [],
  
  // 图搜索
  searchCell: (cell: any, iterator: any, options?: any) => graph?.searchCell(cell, iterator, options),
  
  // 最短路径
  getShortestPath: (source: any, target: any, options?: any) => graph?.getShortestPath(source, target, options) || [],
  
  // 边界框查询
  getAllCellsBBox: () => graph?.getAllCellsBBox(),
  getCellsBBox: (cells: any[], options?: any) => graph?.getCellsBBox(cells, options),
  
  // 数据导入导出
  toJSON: (options?: any) => graph?.toJSON(options),
  parseJSON: (data: any) => graph?.parseJSON(data),
  fromJSON: (data: any, options?: any) => graph?.fromJSON(data, options),
  
  // 节点ID更新
  updateCellId: (cell: any, newId: string) => graph?.updateCellId(cell, newId),
}

// Transform API 方法 - 基于官方文档优化
const transformMethods = {
  // 变换矩阵操作
  matrix: (mat?: any) => {
    if (!graph) return null
    if (mat !== undefined) {
      return graph.matrix(mat)
    }
    return graph.matrix()
  },
  
  // 容器大小调整
  resize: (width?: number, height?: number) => {
    if (!graph) return
    return graph.resize(width, height)
  },
  
  // 画布大小调整
  resizeGraph: (width?: number, height?: number) => {
    if (!graph) return
    // 使用resize方法作为替代
    return graph.resize(width, height)
  },
  
  // 滚动器大小调整
  resizeScroller: (width?: number, height?: number) => {
    if (!graph) return
    // 使用resize方法作为替代
    return graph.resize(width, height)
  },
  
  // 缩放操作（已弃用，建议使用zoom）
  scale: (sx?: number, sy?: number, cx?: number, cy?: number) => {
    if (!graph) return
    if (sx !== undefined) {
      return graph.scale(sx, sy, cx, cy)
    }
    return graph.scale()
  },
  
  // 获取和设置缩放比例
  zoom: (factor?: number, options?: any) => {
    if (!graph) return
    if (factor !== undefined) {
      return graph.zoom(factor, options)
    }
    return graph.zoom()
  },
  
  // 缩放到指定比例
  zoomTo: (factor: number, options?: any) => {
    if (!graph) return
    return graph.zoomTo(factor, options)
  },
  
  // 缩放到指定矩形区域
  zoomToRect: (rect: any, options?: any) => {
    if (!graph) return
    return graph.zoomToRect(rect, options)
  },
  
  // 缩放以适应内容
  zoomToFit: (options?: any) => {
    if (!graph) return
    return graph.zoomToFit(options)
  },
  
  // 旋转操作
  rotate: (angle?: number, cx?: number, cy?: number) => {
    if (!graph) return
    if (angle !== undefined) {
      return graph.rotate(angle, cx, cy)
    }
    return graph.rotate()
  },
  
  // 平移操作
  translate: (tx?: number, ty?: number) => {
    if (!graph) return
    if (tx !== undefined && ty !== undefined) {
      return graph.translate(tx, ty)
    }
    return graph.translate()
  },
  
  // 适应内容
  fitToContent: (gridWidth?: number, gridHeight?: number, padding?: any, options?: any) => {
    if (!graph) return
    if (typeof gridWidth === 'object') {
      // 重载：第一个参数是options对象
      return graph.fitToContent(gridWidth)
    }
    return graph.fitToContent(gridWidth, gridHeight, padding, options)
  },
  
  // 缩放内容以适应
  scaleContentToFit: (options?: any) => {
    if (!graph) return
    return graph.scaleContentToFit(options)
  },
  
  // 获取内容区域
  getContentArea: (options?: any) => {
    if (!graph) return
    return graph.getContentArea(options)
  },
  
  // 获取内容边界框
  getContentBBox: (options?: any) => {
    if (!graph) return
    return graph.getContentBBox(options)
  },
  
  // 居中对齐
  center: (options?: any) => {
    if (!graph) return
    return graph.center(options)
  },
  
  // 点居中对齐
  centerPoint: (x?: number | null, y?: number | null, options?: any) => {
    if (!graph) return
    return graph.centerPoint(x || 0, y || 0, options)
  },
  
  // 内容居中对齐
  centerContent: (options?: any) => {
    if (!graph) return
    return graph.centerContent(options)
  },
  
  // 节点居中对齐
  centerCell: (cell: any, options?: any) => {
    if (!graph) return
    return graph.centerCell(cell, options)
  },
  
  // 内容位置对齐
  positionContent: (pos: string, options?: any) => {
    if (!graph) return
    // 使用类型断言来处理Direction类型
    return (graph as any).positionContent(pos, options)
  },
  
  // 节点位置对齐
  positionCell: (cell: any, pos: string, options?: any) => {
    if (!graph) return
    // 使用类型断言来处理Direction类型
    return (graph as any).positionCell(cell, pos, options)
  },
  
  // 矩形位置对齐
  positionRect: (rect: any, pos: string, options?: any) => {
    if (!graph) return
    // 使用类型断言来处理Direction类型
    return (graph as any).positionRect(rect, pos, options)
  },
  
  // 点位置对齐
  positionPoint: (point: any, x: number | string, y: number | string, options?: any) => {
    if (!graph) return
    return graph.positionPoint(point, x, y, options)
  },
}

// 节点变换配置方法
const transformConfigMethods = {
  // 设置变换配置
  setTransformingConfig: (config: any) => {
    if (!graph) return
    try {
      console.log('Updating transforming config:', config)
      // 注意：transforming配置只能在创建时设置，这里只是记录
      console.log('Transforming config (note: only works on graph creation):', config)
    } catch (error) {
      console.error('Failed to update transforming config:', error)
    }
  },
  
  // 设置缩放配置
  setResizingConfig: (config: any) => {
    if (!graph) return
    try {
      console.log('Updating resizing config:', config)
      // 注意：resizing配置只能在创建时设置，这里只是记录
      console.log('Resizing config (note: only works on graph creation):', config)
    } catch (error) {
      console.error('Failed to update resizing config:', error)
    }
  },
  
  // 设置旋转配置
  setRotatingConfig: (config: any) => {
    if (!graph) return
    try {
      console.log('Updating rotating config:', config)
      // 注意：rotating配置只能在创建时设置，这里只是记录
      console.log('Rotating config (note: only works on graph creation):', config)
    } catch (error) {
      console.error('Failed to update rotating config:', error)
    }
  },
  
  // 设置移动配置
  setTranslatingConfig: (config: any) => {
    if (!graph) return
    try {
      console.log('Updating translating config:', config)
      // 注意：translating配置只能在创建时设置，这里只是记录
      console.log('Translating config (note: only works on graph creation):', config)
    } catch (error) {
      console.error('Failed to update translating config:', error)
    }
  },
  
  // 设置缩放范围配置
  setScalingConfig: (config: any) => {
    if (!graph) return
    try {
      console.log('Updating scaling config:', config)
      // 注意：scaling配置只能在创建时设置，这里只是记录
      console.log('Scaling config (note: only works on graph creation):', config)
    } catch (error) {
      console.error('Failed to update scaling config:', error)
    }
  },
  
  // 获取变换配置状态
  getTransformState: () => {
    if (!graph) return null
    try {
      return {
        transforming: {
          clearAll: true,
          clearOnBlankMouseDown: true,
        },
        resizing: {
          enabled: true,
          minWidth: 20,
          minHeight: 20,
          maxWidth: Number.MAX_SAFE_INTEGER,
          maxHeight: Number.MAX_SAFE_INTEGER,
          orthogonal: true,
          restricted: false,
          autoScroll: true,
          preserveAspectRatio: false,
          allowReverse: true,
        },
        rotating: {
          enabled: true,
          grid: 15,
        },
        translating: {
          restrict: false,
        },
        scaling: {
          min: 0.01,
          max: 16,
        },
      }
    } catch (error) {
      console.error('Failed to get transform state:', error)
      return null
    }
  },
}

// Selection API 方法 - 基于官方文档优化
const selectionMethods = {
  // 选择操作
  select: (cells: any) => {
    if (!graph) return
    return graph.select(cells)
  },
  
  unselect: (cells: any) => {
    if (!graph) return
    return graph.unselect(cells)
  },
  
  isSelected: (cell: any) => {
    if (!graph) return false
    return graph.isSelected(cell)
  },
  
  resetSelection: (cells?: any) => {
    if (!graph) return
    return graph.resetSelection(cells)
  },
  
  getSelectedCells: () => {
    if (!graph) return []
    return graph.getSelectedCells()
  },
  
  cleanSelection: () => {
    if (!graph) return
    return graph.cleanSelection()
  },
  
  isSelectionEmpty: () => {
    if (!graph) return true
    return graph.isSelectionEmpty()
  },
  
  // 选择能力控制
  isSelectionEnabled: () => {
    if (!graph) return false
    return graph.isSelectionEnabled()
  },
  
  enableSelection: () => {
    if (!graph) return
    return graph.enableSelection()
  },
  
  disableSelection: () => {
    if (!graph) return
    return graph.disableSelection()
  },
  
  toggleSelection: (enabled?: boolean) => {
    if (!graph) return
    return graph.toggleSelection(enabled)
  },
  
  // 多选控制
  isMultipleSelection: () => {
    if (!graph) return false
    return graph.isMultipleSelection()
  },
  
  enableMultipleSelection: () => {
    if (!graph) return
    return graph.enableMultipleSelection()
  },
  
  disableMultipleSelection: () => {
    if (!graph) return
    return graph.disableMultipleSelection()
  },
  
  toggleMultipleSelection: (multiple?: boolean) => {
    if (!graph) return
    return graph.toggleMultipleSelection(multiple)
  },
  
  // 选择移动控制
  isSelectionMovable: () => {
    if (!graph) return false
    return graph.isSelectionMovable()
  },
  
  enableSelectionMovable: () => {
    if (!graph) return
    return graph.enableSelectionMovable()
  },
  
  disableSelectionMovable: () => {
    if (!graph) return
    return graph.disableSelectionMovable()
  },
  
  toggleSelectionMovable: (enabled?: boolean) => {
    if (!graph) return
    return graph.toggleSelectionMovable(enabled)
  },
  
  // 框选控制
  isRubberbandEnabled: () => {
    if (!graph) return false
    return graph.isRubberbandEnabled()
  },
  
  enableRubberband: () => {
    if (!graph) return
    return graph.enableRubberband()
  },
  
  disableRubberband: () => {
    if (!graph) return
    return graph.disableRubberband()
  },
  
  toggleRubberband: (enabled?: boolean) => {
    if (!graph) return
    return graph.toggleRubberband(enabled)
  },
  
  // 严格框选控制
  isStrictRubberband: () => {
    if (!graph) return false
    return graph.isStrictRubberband()
  },
  
  enableStrictRubberband: () => {
    if (!graph) return
    return graph.enableStrictRubberband()
  },
  
  disableStrictRubberband: () => {
    if (!graph) return
    return graph.disableStrictRubberband()
  },
  
  toggleStrictRubberband: (enabled?: boolean) => {
    if (!graph) return
    return graph.toggleStrictRubberband(enabled)
  },
  
  // 选择过滤器设置
  setSelectionFilter: (filter: any) => {
    if (!graph) return
    return graph.setSelectionFilter(filter)
  },
  
  // 框选修饰键设置
  setRubberbandModifiers: (modifiers: any) => {
    if (!graph) return
    return graph.setRubberbandModifiers(modifiers)
  },
  
  // 选择显示内容设置
  setSelectionDisplayContent: (content: any) => {
    if (!graph) return
    return graph.setSelectionDisplayContent(content)
  },
}

// View API 方法 - 基于官方文档优化
const viewMethods = {
  // 坐标转换方法
  pageToLocal: (xOrRect: any, y?: number, width?: number, height?: number) => {
    if (!graph) return null
    if (typeof xOrRect === 'object') {
      return graph.pageToLocal(xOrRect)
    } else {
      return graph.pageToLocal(xOrRect, y, width, height)
    }
  },
  
  localToPage: (xOrRect: any, y?: number, width?: number, height?: number) => {
    if (!graph) return null
    if (typeof xOrRect === 'object') {
      return graph.localToPage(xOrRect)
    } else {
      return graph.localToPage(xOrRect, y, width, height)
    }
  },
  
  clientToLocal: (xOrRect: any, y?: number, width?: number, height?: number) => {
    if (!graph) return null
    if (typeof xOrRect === 'object') {
      return graph.clientToLocal(xOrRect)
    } else {
      return graph.clientToLocal(xOrRect, y, width, height)
    }
  },
  
  localToClient: (xOrRect: any, y?: number, width?: number, height?: number) => {
    if (!graph) return null
    if (typeof xOrRect === 'object') {
      return graph.localToClient(xOrRect)
    } else {
      return graph.localToClient(xOrRect, y, width, height)
    }
  },
  
  localToGraph: (xOrRect: any, y?: number, width?: number, height?: number) => {
    if (!graph) return null
    if (typeof xOrRect === 'object') {
      return graph.localToGraph(xOrRect)
    } else {
      return graph.localToGraph(xOrRect, y, width, height)
    }
  },
  
  graphToLocal: (xOrRect: any, y?: number, width?: number, height?: number) => {
    if (!graph) return null
    if (typeof xOrRect === 'object') {
      return graph.graphToLocal(xOrRect)
    } else {
      return graph.graphToLocal(xOrRect, y, width, height)
    }
  },
  
  // 网格对齐
  snapToGrid: (xOrPoint: any, y?: number) => {
    if (!graph) return null
    if (typeof xOrPoint === 'object') {
      return graph.snapToGrid(xOrPoint)
    } else {
      return graph.snapToGrid(xOrPoint, y)
    }
  },
  
  // View 基类方法 - 基于官方文档优化
  // 视图基础操作
  getViewCid: (view: any) => {
    if (view?.cid) {
      return view.cid
    }
    return null
  },
  
  getViewContainer: (view: any) => {
    if (view?.container) {
      return view.container
    }
    return null
  },
  
  setViewContainer: (view: any, container: any) => {
    if (view && container) {
      view.container = container
      return view
    }
    return null
  },
  
  // jQuery 相关方法
  getViewJQuery: (view: any, elem: any) => {
    if (view?.$) {
      return view.$(elem)
    }
    return null
  },
  
  // DOM 操作方法
  emptyView: (view: any, elem?: any) => {
    if (view?.empty) {
      return view.empty(elem)
    }
    return null
  },
  
  unmountView: (view: any, elem?: any) => {
    if (view?.unmount) {
      return view.unmount(elem)
    }
    return null
  },
  
  removeView: (view: any, elem?: any) => {
    if (view?.remove) {
      return view.remove(elem)
    }
    return null
  },
  
  // 样式类操作方法
  addViewClass: (view: any, className: string | string[], elem?: any) => {
    if (view?.addClass) {
      return view.addClass(className, elem)
    }
    return null
  },
  
  removeViewClass: (view: any, className: string | string[], elem?: any) => {
    if (view?.removeClass) {
      return view.removeClass(className, elem)
    }
    return null
  },
  
  // 样式操作方法
  setViewStyle: (view: any, style: any, elem?: any) => {
    if (view?.setStyle) {
      return view.setStyle(style, elem)
    }
    return null
  },
  
  // 属性操作方法
  setViewAttrs: (view: any, attrs: any, elem?: any) => {
    if (view?.setAttrs) {
      return view.setAttrs(attrs, elem)
    }
    return null
  },
  
  // 元素查找方法
  findViewElements: (view: any, selector?: string, rootElem?: any, selectors?: any) => {
    if (view?.find) {
      return view.find(selector, rootElem, selectors)
    }
    return []
  },
  
  findOneViewElement: (view: any, selector?: string, rootElem?: any, selectors?: any) => {
    if (view?.findOne) {
      return view.findOne(selector, rootElem, selectors)
    }
    return null
  },
  
  findViewAttr: (view: any, attrName: string, elem?: any) => {
    if (view?.findAttr) {
      return view.findAttr(attrName, elem)
    }
    return null
  },
  
  findViewByAttr: (view: any, attrName: string, elem?: any) => {
    if (view?.findByAttr) {
      return view.findByAttr(attrName, elem)
    }
    return null
  },
  
  // 选择器方法
  getViewSelector: (view: any, elem: any, prevSelector?: string) => {
    if (view?.getSelector) {
      return view.getSelector(elem, prevSelector)
    }
    return null
  },
  
  // 样式类名前缀方法
  prefixViewClassName: (view: any, className: string) => {
    if (view?.prefixClassName) {
      return view.prefixClassName(className)
    }
    return null
  },
  
  // 事件委托方法
  delegateViewEvents: (view: any, events: any, append?: boolean) => {
    if (view?.delegateEvents) {
      return view.delegateEvents(events, append)
    }
    return null
  },
  
  undelegateViewEvents: (view: any) => {
    if (view?.undelegateEvents) {
      return view.undelegateEvents()
    }
    return null
  },
  
  // Document 事件委托方法
  delegateDocumentEvents: (view: any, events: any, data?: any) => {
    if (view?.delegateDocumentEvents) {
      return view.delegateDocumentEvents(events, data)
    }
    return null
  },
  
  undelegateDocumentEvents: (view: any) => {
    if (view?.undelegateDocumentEvents) {
      return view.undelegateDocumentEvents()
    }
    return null
  },
  
  // 事件数据方法
  getViewEventData: (view: any, e: any) => {
    if (view?.getEventData) {
      return view.getEventData(e)
    }
    return null
  },
  
  setViewEventData: (view: any, e: any, data: any) => {
    if (view?.setEventData) {
      return view.setEventData(e, data)
    }
    return null
  },
  
  // 静态方法 - View 基类
  getViewByCid: (cid: string) => {
    // 尝试从全局 View 对象获取
    if ((window as any).View?.getView) {
      return (window as any).View.getView(cid)
    }
    return null
  },
  
  // 视图状态检查
  isViewMounted: (view: any) => {
    if (view?.container && view.container.parentNode) {
      return true
    }
    return false
  },
  
  // 视图工具方法
  getViewBoundingBox: (view: any) => {
    if (view?.container) {
      const rect = view.container.getBoundingClientRect()
      return {
        x: rect.left,
        y: rect.top,
        width: rect.width,
        height: rect.height
      }
    }
    return null
  },
  
  // 视图动画方法
  animateView: (view: any, properties: any, options?: any) => {
    if (view?.container && view.animate) {
      return view.animate(properties, options)
    }
    return null
  },
  
  // 视图焦点方法
  focusView: (view: any) => {
    if (view?.container && view.container.focus) {
      view.container.focus()
      return view
    }
    return null
  },
  
  blurView: (view: any) => {
    if (view?.container && view.container.blur) {
      view.container.blur()
      return view
    }
    return null
  },
  
  // 视图可见性方法
  isViewVisible: (view: any) => {
    if (view?.container) {
      const style = window.getComputedStyle(view.container)
      return style.display !== 'none' && style.visibility !== 'hidden'
    }
    return false
  },
  
  showView: (view: any) => {
    if (view?.container) {
      view.container.style.display = ''
      view.container.style.visibility = ''
      return view
    }
    return null
  },
  
  hideView: (view: any) => {
    if (view?.container) {
      view.container.style.display = 'none'
      return view
    }
    return null
  },
  
  // 视图属性获取
  getViewData: (view: any, key?: string) => {
    if (view?.getData) {
      return view.getData(key)
    }
    return key ? undefined : {}
  },
  
  setViewData: (view: any, keyOrData: any, value?: any) => {
    if (view?.setData) {
      return view.setData(keyOrData, value)
    }
    return null
  },
  
  // 视图生命周期方法
  initView: (view: any, options?: any) => {
    if (view?.init) {
      return view.init(options)
    }
    return null
  },
  
  renderView: (view: any) => {
    if (view?.render) {
      return view.render()
    }
    return null
  },
  
  updateView: (view: any, options?: any) => {
    if (view?.update) {
      return view.update(options)
    }
    return null
  },
  
  destroyView: (view: any) => {
    if (view?.destroy) {
      return view.destroy()
    }
    return null
  },
  
  // CellView 基类方法 - 基于官方文档优化
  // 通用方法
  isNodeView: (view: any) => {
    if (view?.isNodeView) {
      return view.isNodeView()
    }
    return false
  },
  
  isEdgeView: (view: any) => {
    if (view?.isEdgeView) {
      return view.isEdgeView()
    }
    return false
  },
  
  getCellViewBBox: (view: any, options?: { useCellGeometry?: boolean }) => {
    if (view?.getBBox) {
      return view.getBBox(options)
    }
    return null
  },
  
  // 高亮方法
  highlightCellView: (view: any, elem?: any, options?: any) => {
    if (view?.highlight) {
      return view.highlight(elem, options)
    }
    return null
  },
  
  unhighlightCellView: (view: any, elem?: any, options?: any) => {
    if (view?.unhighlight) {
      return view.unhighlight(elem, options)
    }
    return null
  },
  
  // 可交互性方法
  canInteract: (view: any, feature: string) => {
    if (view?.can) {
      return view.can(feature)
    }
    return false
  },
  
  // 动画方法
  animateCellView: (view: any, elem: any, options: any) => {
    if (view?.animate) {
      return view.animate(elem, options)
    }
    return null
  },
  
  animateTransformCellView: (view: any, elem: any, options: any) => {
    if (view?.animateTransform) {
      return view.animateTransform(elem, options)
    }
    return null
  },
  
  // Cell 相关方法
  getCellFromView: (view: any) => {
    if (view?.cell) {
      return view.cell
    }
    return null
  },
  
  getCellIdFromView: (view: any) => {
    if (view?.cell?.id) {
      return view.cell.id
    }
    return null
  },
  
  getCellTypeFromView: (view: any) => {
    if (view?.cell?.shape) {
      return view.cell.shape
    }
    return null
  },
  
  // 视图状态方法
  isViewVisible: (view: any) => {
    if (view?.isVisible) {
      return view.isVisible()
    }
    return false
  },
  
  isViewDisabled: (view: any) => {
    if (view?.isDisabled) {
      return view.isDisabled()
    }
    return false
  },
  
  isViewInteractive: (view: any) => {
    if (view?.isInteractive) {
      return view.isInteractive()
    }
    return false
  },
  
  // 视图工具方法
  getViewTools: (view: any) => {
    if (view?.getTools) {
      return view.getTools()
    }
    return []
  },
  
  addViewTools: (view: any, tools: any, options?: any) => {
    if (view?.addTools) {
      return view.addTools(tools, options)
    }
    return null
  },
  
  removeViewTools: (view: any, options?: any) => {
    if (view?.removeTools) {
      return view.removeTools(options)
    }
    return null
  },
  
  // 视图更新方法
  updateViewFlags: (view: any, flags: any, options?: any) => {
    if (view?.updateFlags) {
      return view.updateFlags(flags, options)
    }
    return null
  },
  
  confirmUpdate: (view: any, flags: any, options?: any) => {
    if (view?.confirmUpdate) {
      return view.confirmUpdate(flags, options)
    }
    return null
  },
  
  // 视图渲染方法
  renderViewMarkup: (view: any) => {
    if (view?.renderMarkup) {
      return view.renderMarkup()
    }
    return null
  },
  
  renderViewTools: (view: any) => {
    if (view?.renderTools) {
      return view.renderTools()
    }
    return null
  },
  
  // 视图事件方法
  onViewMounted: (view: any) => {
    if (view?.onMounted) {
      return view.onMounted()
    }
    return null
  },
  
  onViewUnmounted: (view: any) => {
    if (view?.onUnmounted) {
      return view.onUnmounted()
    }
    return null
  },
  
  onViewChanged: (view: any, cell: any, options?: any) => {
    if (view?.onChanged) {
      return view.onChanged(cell, options)
    }
    return null
  },
  
  // 视图样式方法
  setViewNodeMovable: (view: any, movable: boolean) => {
    if (view?.setNodeMovable) {
      return view.setNodeMovable(movable)
    }
    return null
  },
  
  setViewEdgeMovable: (view: any, movable: boolean) => {
    if (view?.setEdgeMovable) {
      return view.setEdgeMovable(movable)
    }
    return null
  },
  
  setViewLabelMovable: (view: any, movable: boolean) => {
    if (view?.setLabelMovable) {
      return view.setLabelMovable(movable)
    }
    return null
  },
  
  // 视图连接方法
  setViewConnectable: (view: any, connectable: boolean) => {
    if (view?.setConnectable) {
      return view.setConnectable(connectable)
    }
    return null
  },
  
  isViewConnectable: (view: any) => {
    if (view?.isConnectable) {
      return view.isConnectable()
    }
    return false
  },
  
  // 视图高亮器方法
  getHighlighter: (view: any, name?: string) => {
    if (view?.getHighlighter) {
      return view.getHighlighter(name)
    }
    return null
  },
  
  addHighlighter: (view: any, highlighter: any, options?: any) => {
    if (view?.addHighlighter) {
      return view.addHighlighter(highlighter, options)
    }
    return null
  },
  
  removeHighlighter: (view: any, name?: string, options?: any) => {
    if (view?.removeHighlighter) {
      return view.removeHighlighter(name, options)
    }
    return null
  },
  
  // 视图磁铁方法
  getMagnets: (view: any) => {
    if (view?.getMagnets) {
      return view.getMagnets()
    }
    return []
  },
  
  getMagnetAt: (view: any, x: number, y: number) => {
    if (view?.getMagnetAt) {
      return view.getMagnetAt(x, y)
    }
    return null
  },
  
  isMagnet: (view: any, elem: any) => {
    if (view?.isMagnet) {
      return view.isMagnet(elem)
    }
    return false
  },
  
  // 视图连接点方法
  getConnectionPoint: (view: any, magnet: any, args?: any) => {
    if (view?.getConnectionPoint) {
      return view.getConnectionPoint(magnet, args)
    }
    return null
  },
  
  getAnchor: (view: any, magnet: any, args?: any) => {
    if (view?.getAnchor) {
      return view.getAnchor(magnet, args)
    }
    return null
  },
  
  // 视图端口方法
  getPorts: (view: any) => {
    if (view?.getPorts) {
      return view.getPorts()
    }
    return []
  },
  
  getPort: (view: any, portId: string) => {
    if (view?.getPort) {
      return view.getPort(portId)
    }
    return null
  },
  
  hasPort: (view: any, portId: string) => {
    if (view?.hasPort) {
      return view.hasPort(portId)
    }
    return false
  },
  
  // 视图标签方法
  getLabels: (view: any) => {
    if (view?.getLabels) {
      return view.getLabels()
    }
    return []
  },
  
  getLabelAt: (view: any, index: number) => {
    if (view?.getLabelAt) {
      return view.getLabelAt(index)
    }
    return null
  },
  
  // 视图变换方法
  getViewMatrix: (view: any) => {
    if (view?.getMatrix) {
      return view.getMatrix()
    }
    return null
  },
  
  setViewMatrix: (view: any, matrix: any, options?: any) => {
    if (view?.setMatrix) {
      return view.setMatrix(matrix, options)
    }
    return null
  },
  
  // 视图缩放方法
  getViewScale: (view: any) => {
    if (view?.getScale) {
      return view.getScale()
    }
    return 1
  },
  
  setViewScale: (view: any, scale: number, options?: any) => {
    if (view?.setScale) {
      return view.setScale(scale, options)
    }
    return null
  },
  
  // 视图旋转方法
  getViewRotation: (view: any) => {
    if (view?.getRotation) {
      return view.getRotation()
    }
    return 0
  },
  
  setViewRotation: (view: any, rotation: number, options?: any) => {
    if (view?.setRotation) {
      return view.setRotation(rotation, options)
    }
    return null
  },
  
  // 视图位置方法
  getViewPosition: (view: any) => {
    if (view?.getPosition) {
      return view.getPosition()
    }
    return { x: 0, y: 0 }
  },
  
  setViewPosition: (view: any, x: number, y: number, options?: any) => {
    if (view?.setPosition) {
      return view.setPosition(x, y, options)
    }
    return null
  },
  
  // 视图大小方法
  getViewSize: (view: any) => {
    if (view?.getSize) {
      return view.getSize()
    }
    return { width: 0, height: 0 }
  },
  
  setViewSize: (view: any, width: number, height: number, options?: any) => {
    if (view?.setSize) {
      return view.setSize(width, height, options)
    }
    return null
  },
  
  // 视图属性方法
  getViewAttrs: (view: any) => {
    if (view?.getAttrs) {
      return view.getAttrs()
    }
    return {}
  },
  
  setViewAttrs: (view: any, attrs: any, options?: any) => {
    if (view?.setAttrs) {
      return view.setAttrs(attrs, options)
    }
    return null
  },
  
  updateViewAttrs: (view: any, attrs: any, options?: any) => {
    if (view?.updateAttrs) {
      return view.updateAttrs(attrs, options)
    }
    return null
  },
  
  // 视图样式方法
  getViewStyle: (view: any) => {
    if (view?.getStyle) {
      return view.getStyle()
    }
    return {}
  },
  
  setViewStyle: (view: any, style: any, options?: any) => {
    if (view?.setStyle) {
      return view.setStyle(style, options)
    }
    return null
  },
  
  // 视图类名方法
  getViewClassName: (view: any) => {
    if (view?.getClassName) {
      return view.getClassName()
    }
    return ''
  },
  
  setViewClassName: (view: any, className: string, options?: any) => {
    if (view?.setClassName) {
      return view.setClassName(className, options)
    }
    return null
  },
  
  addViewClassName: (view: any, className: string, options?: any) => {
    if (view?.addClassName) {
      return view.addClassName(className, options)
    }
    return null
  },
  
  removeViewClassName: (view: any, className: string, options?: any) => {
    if (view?.removeClassName) {
      return view.removeClassName(className, options)
    }
    return null
  },
  
  // 视图数据方法
  getViewData: (view: any) => {
    if (view?.getData) {
      return view.getData()
    }
    return {}
  },
  
  setViewData: (view: any, data: any, options?: any) => {
    if (view?.setData) {
      return view.setData(data, options)
    }
    return null
  },
  
  updateViewData: (view: any, data: any, options?: any) => {
    if (view?.updateData) {
      return view.updateData(data, options)
    }
    return null
  },
  
  // 视图元数据方法
  getViewMetadata: (view: any, key?: string) => {
    if (view?.getMetadata) {
      return view.getMetadata(key)
    }
    return key ? undefined : {}
  },
  
  setViewMetadata: (view: any, keyOrData: any, value?: any, options?: any) => {
    if (view?.setMetadata) {
      return view.setMetadata(keyOrData, value, options)
    }
    return null
  },
  
  removeViewMetadata: (view: any, key: string, options?: any) => {
    if (view?.removeMetadata) {
      return view.removeMetadata(key, options)
    }
    return null
  },
  
  // 视图自定义属性方法
  getViewProp: (view: any, key: string) => {
    if (view?.getProp) {
      return view.getProp(key)
    }
    return undefined
  },
  
  setViewProp: (view: any, key: string, value: any, options?: any) => {
    if (view?.setProp) {
      return view.setProp(key, value, options)
    }
    return null
  },
  
  removeViewProp: (view: any, key: string, options?: any) => {
    if (view?.removeProp) {
      return view.removeProp(key, options)
    }
    return null
  },
  
  // 视图状态方法
  getViewState: (view: any) => {
    if (view?.getState) {
      return view.getState()
    }
    return {}
  },
  
  setViewState: (view: any, state: any, options?: any) => {
    if (view?.setState) {
      return view.setState(state, options)
    }
    return null
  },
  
  // 视图配置方法
  getViewConfig: (view: any) => {
    if (view?.getConfig) {
      return view.getConfig()
    }
    return {}
  },
  
  setViewConfig: (view: any, config: any, options?: any) => {
    if (view?.setConfig) {
      return view.setConfig(config, options)
    }
    return null
  },
  
  // 视图选项方法
  getViewOptions: (view: any) => {
    if (view?.getOptions) {
      return view.getOptions()
    }
    return {}
  },
  
  setViewOptions: (view: any, options: any) => {
    if (view?.setOptions) {
      return view.setOptions(options)
    }
    return null
  },
  
  // 视图优先级方法
  getViewPriority: (view: any) => {
    if (view?.getPriority) {
      return view.getPriority()
    }
    return 0
  },
  
  setViewPriority: (view: any, priority: number) => {
    if (view?.setPriority) {
      return view.setPriority(priority)
    }
    return null
  },
  
  // 视图容器方法
  getViewContainer: (view: any) => {
    if (view?.getContainer) {
      return view.getContainer()
    }
    return null
  },
  
  setViewContainer: (view: any, container: any) => {
    if (view?.setContainer) {
      return view.setContainer(container)
    }
    return null
  },
  
  // 视图SVG方法
  getViewSVGElement: (view: any) => {
    if (view?.getSVGElement) {
      return view.getSVGElement()
    }
    return null
  },
  
  setViewSVGElement: (view: any, elem: any) => {
    if (view?.setSVGElement) {
      return view.setSVGElement(elem)
    }
    return null
  },
  
  // 视图HTML方法
  getViewHTMLElement: (view: any) => {
    if (view?.getHTMLElement) {
      return view.getHTMLElement()
    }
    return null
  },
  
  setViewHTMLElement: (view: any, elem: any) => {
    if (view?.setHTMLElement) {
      return view.setHTMLElement(elem)
    }
    return null
  },
  
  // 视图选择器方法
  getViewSelector: (view: any) => {
    if (view?.getSelector) {
      return view.getSelector()
    }
    return null
  },
  
  setViewSelector: (view: any, selector: any) => {
    if (view?.setSelector) {
      return view.setSelector(selector)
    }
    return null
  },
  
  // 视图根选择器方法
  getViewRootSelector: (view: any) => {
    if (view?.getRootSelector) {
      return view.getRootSelector()
    }
    return null
  },
  
  setViewRootSelector: (view: any, selector: any) => {
    if (view?.setRootSelector) {
      return view.setRootSelector(selector)
    }
    return null
  },
  
  // 视图节点方法
  getViewNode: (view: any, selector?: string) => {
    if (view?.getNode) {
      return view.getNode(selector)
    }
    return null
  },
  
  setViewNode: (view: any, node: any, selector?: string) => {
    if (view?.setNode) {
      return view.setNode(node, selector)
    }
    return null
  },
  
  // 视图元素方法
  getViewElement: (view: any, selector?: string) => {
    if (view?.getElement) {
      return view.getElement(selector)
    }
    return null
  },
  
  setViewElement: (view: any, elem: any, selector?: string) => {
    if (view?.setElement) {
      return view.setElement(elem, selector)
    }
    return null
  },
  
  // 视图查找方法
  findViewElement: (view: any, selector: string) => {
    if (view?.findElement) {
      return view.findElement(selector)
    }
    return null
  },
  
  findViewElements: (view: any, selector: string) => {
    if (view?.findElements) {
      return view.findElements(selector)
    }
    return []
  },
  
  findOneViewElement: (view: any, selector: string) => {
    if (view?.findOneElement) {
      return view.findOneElement(selector)
    }
    return null
  },
  
  // 视图缓存方法
  getViewCache: (view: any, key: string) => {
    if (view?.getCache) {
      return view.getCache(key)
    }
    return undefined
  },
  
  setViewCache: (view: any, key: string, value: any) => {
    if (view?.setCache) {
      return view.setCache(key, value)
    }
    return null
  },
  
  removeViewCache: (view: any, key: string) => {
    if (view?.removeCache) {
      return view.removeCache(key)
    }
    return null
  },
  
  clearViewCache: (view: any) => {
    if (view?.clearCache) {
      return view.clearCache()
    }
    return null
  },
  
  // 视图标记方法
  getViewFlag: (view: any, flag: string) => {
    if (view?.getFlag) {
      return view.getFlag(flag)
    }
    return false
  },
  
  setViewFlag: (view: any, flag: string, value: boolean) => {
    if (view?.setFlag) {
      return view.setFlag(flag, value)
    }
    return null
  },
  
  toggleViewFlag: (view: any, flag: string) => {
    if (view?.toggleFlag) {
      return view.toggleFlag(flag)
    }
    return null
  },
  
  // 视图批处理方法
  batchViewUpdate: (view: any, fn: () => void, options?: any) => {
    if (view?.batchUpdate) {
      return view.batchUpdate(fn, options)
    }
    return null
  },
  
  startViewBatch: (view: any, options?: any) => {
    if (view?.startBatch) {
      return view.startBatch(options)
    }
    return null
  },
  
  stopViewBatch: (view: any, options?: any) => {
    if (view?.stopBatch) {
      return view.stopBatch(options)
    }
    return null
  },
  
  // 视图事务方法
  startViewTransaction: (view: any, options?: any) => {
    if (view?.startTransaction) {
      return view.startTransaction(options)
    }
    return null
  },
  
  stopViewTransaction: (view: any, options?: any) => {
    if (view?.stopTransaction) {
      return view.stopTransaction(options)
    }
    return null
  },
  
  // 视图验证方法
  validateView: (view: any, options?: any) => {
    if (view?.validate) {
      return view.validate(options)
    }
    return true
  },
  
  // 视图清理方法
  cleanupView: (view: any, options?: any) => {
    if (view?.cleanup) {
      return view.cleanup(options)
    }
    return null
  },
  
  // 视图重置方法
  resetView: (view: any, options?: any) => {
    if (view?.reset) {
      return view.reset(options)
    }
    return null
  },
  
  // 视图刷新方法
  refreshView: (view: any, options?: any) => {
    if (view?.refresh) {
      return view.refresh(options)
    }
    return null
  },
  
  // 视图重绘方法
  redrawView: (view: any, options?: any) => {
    if (view?.redraw) {
      return view.redraw(options)
    }
    return null
  },
  
  // 视图重新渲染方法
  rerenderView: (view: any, options?: any) => {
    if (view?.rerender) {
      return view.rerender(options)
    }
    return null
  },
}

// NodeView 专用方法 - 基于官方文档优化
const nodeViewMethods = {
  // NodeView 类型判断
  isNodeView: (view: any) => {
    if (view?.isNodeView) {
      return view.isNodeView()
    }
    return false
  },
  
  isEdgeView: (view: any) => {
    if (view?.isEdgeView) {
      return view.isEdgeView()
    }
    return false
  },
}

// EdgeView 专用方法 - 基于官方文档优化
const edgeViewMethods = {
  // EdgeView 类型判断
  isNodeView: (view: any) => {
    if (view?.isNodeView) {
      return view.isNodeView()
    }
    return false
  },
  
  isEdgeView: (view: any) => {
    if (view?.isEdgeView) {
      return view.isEdgeView()
    }
    return false
  },
  
  // 发送令牌动画 - 基于官方文档优化
  sendToken: (
    view: any, 
    token: SVGElement | string, 
    options?: number | {
      duration?: number
      reversed?: boolean
      selector?: string
      start?: (e: any) => void
      complete?: (e: any) => void
      repeat?: (e: any) => void
      [key: string]: any
    }, 
    callback?: () => void
  ) => {
    if (view?.sendToken) {
      return view.sendToken(token, options, callback)
    }
    return null
  },
}

// Cell API 方法 - 基于官方文档优化
const cellMethods = {
  // 节点和边的类型判断
  isNode: (cell: any) => cell?.isNode?.() || false,
  isEdge: (cell: any) => cell?.isEdge?.() || false,
  
  // 获取模型和视图信息
  getModel: (cell: any) => cell?.model,
  getShape: (cell: any) => cell?.shape,
  getView: (cell: any) => cell?.view,
  
  // 数据转换方法
  toJSON: (cell: any, options?: any) => cell?.toJSON?.(options),
  clone: (cell: any, options?: any) => cell?.clone?.(options),
  
  // 事件方法
  on: (cell: any, name: string, handler: any, context?: any) => {
    if (cell?.on) {
      return cell.on(name, handler, context)
    }
    return null
  },
  
  once: (cell: any, name: string, handler: any, context?: any) => {
    if (cell?.once) {
      return cell.once(name, handler, context)
    }
    return null
  },
  
  off: (cell: any, name?: string, handler?: any, context?: any) => {
    if (cell?.off) {
      if (name === undefined) {
        return cell.off()
      } else if (handler === undefined) {
        return cell.off(name)
      } else {
        return cell.off(name, handler, context)
      }
    }
    return null
  },
  
  trigger: (cell: any, name: string, ...args: any[]) => {
    if (cell?.trigger) {
      return cell.trigger(name, ...args)
    }
    return null
  },
  
  // 销毁方法
  dispose: (cell: any) => {
    if (cell?.dispose) {
      return cell.dispose()
    }
    return null
  },
  
  // Markup 相关方法
  getMarkup: (cell: any) => cell?.getMarkup?.(),
  setMarkup: (cell: any, markup: any, options?: any) => {
    if (cell?.setMarkup) {
      return cell.setMarkup(markup, options)
    }
    return null
  },
  removeMarkup: (cell: any, options?: any) => {
    if (cell?.removeMarkup) {
      return cell.removeMarkup(options)
    }
    return null
  },
  
  // Attrs 相关方法
  getAttrs: (cell: any) => cell?.getAttrs?.(),
  setAttrs: (cell: any, attrs: any, options?: any) => {
    if (cell?.setAttrs) {
      return cell.setAttrs(attrs, options)
    }
    return null
  },
  replaceAttrs: (cell: any, attrs: any, options?: any) => {
    if (cell?.replaceAttrs) {
      return cell.replaceAttrs(attrs, options)
    }
    return null
  },
  updateAttrs: (cell: any, attrs: any, options?: any) => {
    if (cell?.updateAttrs) {
      return cell.updateAttrs(attrs, options)
    }
    return null
  },
  removeAttrs: (cell: any, options?: any) => {
    if (cell?.removeAttrs) {
      return cell.removeAttrs(options)
    }
    return null
  },
  getAttrByPath: (cell: any, path: any) => cell?.getAttrByPath?.(path),
  setAttrByPath: (cell: any, path: any, value: any, options?: any) => {
    if (cell?.setAttrByPath) {
      return cell.setAttrByPath(path, value, options)
    }
    return null
  },
  removeAttrByPath: (cell: any, path: any, options?: any) => {
    if (cell?.removeAttrByPath) {
      return cell.removeAttrByPath(path, options)
    }
    return null
  },
  
  // 统一的 attr 方法
  attr: (cell: any, pathOrAttrs?: any, value?: any, options?: any) => {
    if (cell?.attr) {
      if (pathOrAttrs === undefined) {
        return cell.attr()
      } else if (typeof pathOrAttrs === 'string' || Array.isArray(pathOrAttrs)) {
        if (value !== undefined) {
          return cell.attr(pathOrAttrs, value, options)
        } else {
          return cell.attr(pathOrAttrs)
        }
      } else {
        return cell.attr(pathOrAttrs, options)
      }
    }
    return null
  },
  
  // zIndex 相关方法
  getZIndex: (cell: any) => cell?.getZIndex?.(),
  setZIndex: (cell: any, zIndex: number, options?: any) => {
    if (cell?.setZIndex) {
      return cell.setZIndex(zIndex, options)
    }
    return null
  },
  removeZIndex: (cell: any, options?: any) => {
    if (cell?.removeZIndex) {
      return cell.removeZIndex(options)
    }
    return null
  },
  toFront: (cell: any, options?: any) => {
    if (cell?.toFront) {
      return cell.toFront(options)
    }
    return null
  },
  toBack: (cell: any, options?: any) => {
    if (cell?.toBack) {
      return cell.toBack(options)
    }
    return null
  },
  
  // 可见性相关方法
  isVisible: (cell: any) => cell?.isVisible?.(),
  setVisible: (cell: any, visible: boolean, options?: any) => {
    if (cell?.setVisible) {
      return cell.setVisible(visible, options)
    }
    return null
  },
  show: (cell: any, options?: any) => {
    if (cell?.show) {
      return cell.show(options)
    }
    return null
  },
  hide: (cell: any, options?: any) => {
    if (cell?.hide) {
      return cell.hide(options)
    }
    return null
  },
  toggleVisible: (cell: any, options?: any) => {
    if (cell?.toggleVisible) {
      return cell.toggleVisible(options)
    }
    return null
  },
  
  // 数据相关方法
  getData: (cell: any) => cell?.getData?.(),
  setData: (cell: any, data: any, options?: any) => {
    if (cell?.setData) {
      return cell.setData(data, options)
    }
    return null
  },
  replaceData: (cell: any, data: any, options?: any) => {
    if (cell?.replaceData) {
      return cell.replaceData(data, options)
    }
    return null
  },
  updateData: (cell: any, data: any, options?: any) => {
    if (cell?.updateData) {
      return cell.updateData(data, options)
    }
    return null
  },
  removeData: (cell: any, options?: any) => {
    if (cell?.removeData) {
      return cell.removeData(options)
    }
    return null
  },
  
  // 父子关系相关方法
  getParent: (cell: any) => cell?.getParent?.(),
  getParentId: (cell: any) => cell?.getParentId?.(),
  hasParent: (cell: any) => cell?.hasParent?.(),
  setParent: (cell: any, parent: any, options?: any) => {
    if (cell?.setParent) {
      return cell.setParent(parent, options)
    }
    return null
  },
  
  getChildren: (cell: any) => cell?.getChildren?.(),
  setChildren: (cell: any, children: any, options?: any) => {
    if (cell?.setChildren) {
      return cell.setChildren(children, options)
    }
    return null
  },
  isParentOf: (cell: any, child: any) => cell?.isParentOf?.(child),
  isChildOf: (cell: any, parent: any) => cell?.isChildOf?.(parent),
  eachChild: (cell: any, iterator: any, context?: any) => {
    if (cell?.eachChild) {
      return cell.eachChild(iterator, context)
    }
    return null
  },
  filterChild: (cell: any, iterator: any, context?: any) => {
    if (cell?.filterChild) {
      return cell.filterChild(iterator, context)
    }
    return null
  },
  getChildCount: (cell: any) => cell?.getChildCount?.(),
  getChildIndex: (cell: any, child: any) => cell?.getChildIndex?.(child),
  getChildAt: (cell: any, index: number) => cell?.getChildAt?.(index),
  
  // 祖先和子孙节点方法
  getAncestors: (cell: any, options?: any) => cell?.getAncestors?.(options),
  getDescendants: (cell: any, options?: any) => cell?.getDescendants?.(options),
  isDescendantOf: (cell: any, ancestor: any, options?: any) => cell?.isDescendantOf?.(ancestor, options),
  isAncestorOf: (cell: any, descendant: any, options?: any) => cell?.isAncestorOf?.(descendant, options),
  getCommonAncestor: (cell: any, ...cells: any[]) => {
    if (cell?.getCommonAncestor) {
      return cell.getCommonAncestor(...cells)
    }
    return null
  },
  
  // 添加和移除方法
  addTo: (cell: any, model: any, options?: any) => {
    if (cell?.addTo) {
      return cell.addTo(model, options)
    }
    return null
  },
  insertTo: (cell: any, parent: any, index?: number, options?: any) => {
    if (cell?.insertTo) {
      return cell.insertTo(parent, index, options)
    }
    return null
  },
  addChild: (cell: any, child: any, options?: any) => {
    if (cell?.addChild) {
      return cell.addChild(child, options)
    }
    return null
  },
  insertChild: (cell: any, child: any, index?: number, options?: any) => {
    if (cell?.insertChild) {
      return cell.insertChild(child, index, options)
    }
    return null
  },
  embed: (cell: any, child: any, options?: any) => {
    if (cell?.embed) {
      return cell.embed(child, options)
    }
    return null
  },
  unembed: (cell: any, child: any, options?: any) => {
    if (cell?.unembed) {
      return cell.unembed(child, options)
    }
    return null
  },
  removeFromParent: (cell: any, options?: any) => {
    if (cell?.removeFromParent) {
      return cell.removeFromParent(options)
    }
    return null
  },
  removeChild: (cell: any, child: any, options?: any) => {
    if (cell?.removeChild) {
      return cell.removeChild(child, options)
    }
    return null
  },
  removeChildAt: (cell: any, index: number, options?: any) => {
    if (cell?.removeChildAt) {
      return cell.removeChildAt(index, options)
    }
    return null
  },
  remove: (cell: any, options?: any) => {
    if (cell?.remove) {
      return cell.remove(options)
    }
    return null
  },
  
  // 通用属性方法
  getProp: (cell: any, key: any, defaultValue?: any) => cell?.getProp?.(key, defaultValue),
  setProp: (cell: any, keyOrProps: any, value?: any, options?: any) => {
    if (cell?.setProp) {
      if (typeof keyOrProps === 'string') {
        return cell.setProp(keyOrProps, value, options)
      } else {
        return cell.setProp(keyOrProps, options)
      }
    }
    return null
  },
  removeProp: (cell: any, path: any, options?: any) => {
    if (cell?.removeProp) {
      return cell.removeProp(path, options)
    }
    return null
  },
  getPropByPath: (cell: any, path: any) => cell?.getPropByPath?.(path),
  setPropByPath: (cell: any, path: any, value: any, options?: any) => {
    if (cell?.setPropByPath) {
      return cell.setPropByPath(path, value, options)
    }
    return null
  },
  removePropByPath: (cell: any, path: any, options?: any) => {
    if (cell?.removePropByPath) {
      return cell.removePropByPath(path, options)
    }
    return null
  },
  
  // 统一的 prop 方法
  prop: (cell: any, pathOrProps?: any, value?: any, options?: any) => {
    if (cell?.prop) {
      if (pathOrProps === undefined) {
        return cell.prop()
      } else if (typeof pathOrProps === 'string' || Array.isArray(pathOrProps)) {
        if (value !== undefined) {
          return cell.prop(pathOrProps, value, options)
        } else {
          return cell.prop(pathOrProps)
        }
      } else {
        return cell.prop(pathOrProps, options)
      }
    }
    return null
  },
  
  // 变化检测方法
  hasChanged: (cell: any, key?: string) => cell?.hasChanged?.(key),
  previous: (cell: any, name: string) => cell?.previous?.(name),
  
  // 工具集相关方法
  getTools: (cell: any) => cell?.getTools?.(),
  addTools: (cell: any, items: any, nameOrOptions?: any, options?: any) => {
    if (cell?.addTools) {
      if (typeof nameOrOptions === 'string') {
        return cell.addTools(items, nameOrOptions, options)
      } else {
        return cell.addTools(items, nameOrOptions)
      }
    }
    return null
  },
  removeTools: (cell: any, options?: any) => {
    if (cell?.removeTools) {
      return cell.removeTools(options)
    }
    return null
  },
  hasTool: (cell: any, name: string) => cell?.hasTool?.(name),
  removeTool: (cell: any, nameOrIndex: any, options?: any) => {
    if (cell?.removeTool) {
      return cell.removeTool(nameOrIndex, options)
    }
    return null
  },
  
  // 动画相关方法
  transition: (cell: any, path: any, target: any, options?: any, delim?: string) => {
    if (cell?.transition) {
      return cell.transition(path, target, options, delim)
    }
    return null
  },
  stopTransition: (cell: any, path: any, options?: any, delim?: string) => {
    if (cell?.stopTransition) {
      return cell.stopTransition(path, options, delim)
    }
    return null
  },
  getTransitions: (cell: any) => cell?.getTransitions?.(),
  
  // 配置方法
  config: (cell: any, presets: any) => {
    if (cell?.config) {
      return cell.config(presets)
    }
    return null
  },
}

// Node API 方法 - 基于官方文档优化
const nodeMethods = {
  // 节点类型判断
  isNode: (node: any) => node?.isNode?.() || false,
  
  // 包围盒相关方法
  getBBox: (node: any, options?: any) => {
    if (node?.getBBox) {
      return node.getBBox(options)
    }
    return null
  },
  
  // 大小相关方法
  size: (node: any, widthOrSize?: any, height?: number, options?: any) => {
    if (node?.size) {
      if (widthOrSize === undefined) {
        // 获取大小
        return node.size()
      } else if (typeof widthOrSize === 'object') {
        // 设置大小 { width, height }
        return node.size(widthOrSize, options)
      } else {
        // 设置大小 width, height
        return node.size(widthOrSize, height, options)
      }
    }
    return null
  },
  
  resize: (node: any, width: number, height: number, options?: any) => {
    if (node?.resize) {
      return node.resize(width, height, options)
    }
    return null
  },
  
  scale: (node: any, sx: number, sy: number, origin?: any, options?: any) => {
    if (node?.scale) {
      return node.scale(sx, sy, origin, options)
    }
    return null
  },
  
  fit: (node: any, options?: any) => {
    if (node?.fit) {
      return node.fit(options)
    }
    return null
  },
  
  // 位置相关方法
  position: (node: any, xOrOptions?: any, y?: number, options?: any) => {
    if (node?.position) {
      if (xOrOptions === undefined) {
        // 获取位置
        return node.position()
      } else if (typeof xOrOptions === 'object') {
        // 获取位置带选项
        return node.position(xOrOptions)
      } else {
        // 设置位置 x, y
        return node.position(xOrOptions, y, options)
      }
    }
    return null
  },
  
  translate: (node: any, tx?: number, ty?: number, options?: any) => {
    if (node?.translate) {
      return node.translate(tx, ty, options)
    }
    return null
  },
  
  // 旋转相关方法
  getAngle: (node: any) => {
    if (node?.getAngle) {
      return node.getAngle()
    }
    return 0
  },
  
  rotate: (node: any, deg: number, options?: any) => {
    if (node?.rotate) {
      return node.rotate(deg, options)
    }
    return null
  },
  
  // 链接桩相关方法
  addPort: (node: any, port: any, options?: any) => {
    if (node?.addPort) {
      return node.addPort(port, options)
    }
    return null
  },
  
  addPorts: (node: any, ports: any[], options?: any) => {
    if (node?.addPorts) {
      return node.addPorts(ports, options)
    }
    return null
  },
  
  insertPort: (node: any, index: number, port: any, options?: any) => {
    if (node?.insertPort) {
      return node.insertPort(index, port, options)
    }
    return null
  },
  
  hasPort: (node: any, portId: string) => {
    if (node?.hasPort) {
      return node.hasPort(portId)
    }
    return false
  },
  
  hasPorts: (node: any) => {
    if (node?.hasPorts) {
      return node.hasPorts()
    }
    return false
  },
  
  getPort: (node: any, portId: string) => {
    if (node?.getPort) {
      return node.getPort(portId)
    }
    return null
  },
  
  getPortAt: (node: any, index: number) => {
    if (node?.getPortAt) {
      return node.getPortAt(index)
    }
    return null
  },
  
  getPorts: (node: any) => {
    if (node?.getPorts) {
      return node.getPorts()
    }
    return []
  },
  
  getPortsByGroup: (node: any, groupName: string) => {
    if (node?.getPortsByGroup) {
      return node.getPortsByGroup(groupName)
    }
    return []
  },
  
  removePort: (node: any, portOrId: any, options?: any) => {
    if (node?.removePort) {
      return node.removePort(portOrId, options)
    }
    return null
  },
  
  removePortAt: (node: any, index: number, options?: any) => {
    if (node?.removePortAt) {
      return node.removePortAt(index, options)
    }
    return null
  },
  
  removePorts: (node: any, ports?: any, options?: any) => {
    if (node?.removePorts) {
      return node.removePorts(ports, options)
    }
    return null
  },
  
  getPortIndex: (node: any, portOrId: any) => {
    if (node?.getPortIndex) {
      return node.getPortIndex(portOrId)
    }
    return -1
  },
  
  // 链接桩属性方法
  getPortProp: (node: any, portId: string, path?: any) => {
    if (node?.getPortProp) {
      return node.getPortProp(portId, path)
    }
    return null
  },
  
  setPortProp: (node: any, portId: string, pathOrValue: any, value?: any, options?: any) => {
    if (node?.setPortProp) {
      return node.setPortProp(portId, pathOrValue, value, options)
    }
    return null
  },
  
  removePortProp: (node: any, portId: string, path?: any, options?: any) => {
    if (node?.removePortProp) {
      return node.removePortProp(portId, path, options)
    }
    return null
  },
  
  portProp: (node: any, portId: string, pathOrValue?: any, value?: any, options?: any) => {
    if (node?.portProp) {
      return node.portProp(portId, pathOrValue, value, options)
    }
    return null
  },
}

// Edge API 方法 - 基于官方文档优化
const edgeMethods = {
  // 边类型判断
  isEdge: (edge: any) => edge?.isEdge?.() || false,
  
  // 通用方法
  getBBox: (edge: any) => {
    if (edge?.getBBox) {
      return edge.getBBox()
    }
    return null
  },
  
  getPolyline: (edge: any) => {
    if (edge?.getPolyline) {
      return edge.getPolyline()
    }
    return null
  },
  
  hasLoop: (edge: any, options?: { deep?: boolean }) => {
    if (edge?.hasLoop) {
      return edge.hasLoop(options)
    }
    return false
  },
  
  // 源节点/起点相关方法
  getSource: (edge: any) => {
    if (edge?.getSource) {
      return edge.getSource()
    }
    return null
  },
  
  getSourceCell: (edge: any) => {
    if (edge?.getSourceCell) {
      return edge.getSourceCell()
    }
    return null
  },
  
  getSourceNode: (edge: any) => {
    if (edge?.getSourceNode) {
      return edge.getSourceNode()
    }
    return null
  },
  
  getSourceCellId: (edge: any) => {
    if (edge?.getSourceCellId) {
      return edge.getSourceCellId()
    }
    return null
  },
  
  getSourcePortId: (edge: any) => {
    if (edge?.getSourcePortId) {
      return edge.getSourcePortId()
    }
    return null
  },
  
  getSourcePoint: (edge: any) => {
    if (edge?.getSourcePoint) {
      return edge.getSourcePoint()
    }
    return null
  },
  
  setSource: (edge: any, args: any, options?: any) => {
    if (edge?.setSource) {
      return edge.setSource(args, options)
    }
    return null
  },
  
  // 目标节点/终点相关方法
  getTarget: (edge: any) => {
    if (edge?.getTarget) {
      return edge.getTarget()
    }
    return null
  },
  
  getTargetCell: (edge: any) => {
    if (edge?.getTargetCell) {
      return edge.getTargetCell()
    }
    return null
  },
  
  getTargetNode: (edge: any) => {
    if (edge?.getTargetNode) {
      return edge.getTargetNode()
    }
    return null
  },
  
  getTargetCellId: (edge: any) => {
    if (edge?.getTargetCellId) {
      return edge.getTargetCellId()
    }
    return null
  },
  
  getTargetPortId: (edge: any) => {
    if (edge?.getTargetPortId) {
      return edge.getTargetPortId()
    }
    return null
  },
  
  getTargetPoint: (edge: any) => {
    if (edge?.getTargetPoint) {
      return edge.getTargetPoint()
    }
    return null
  },
  
  setTarget: (edge: any, args: any, options?: any) => {
    if (edge?.setTarget) {
      return edge.setTarget(args, options)
    }
    return null
  },
  
  // 断开连接
  disconnect: (edge: any, options?: any) => {
    if (edge?.disconnect) {
      return edge.disconnect(options)
    }
    return null
  },
  
  // 路径点相关方法
  getVertices: (edge: any) => {
    if (edge?.getVertices) {
      return edge.getVertices()
    }
    return []
  },
  
  setVertices: (edge: any, vertices: any, options?: any) => {
    if (edge?.setVertices) {
      return edge.setVertices(vertices, options)
    }
    return null
  },
  
  insertVertex: (edge: any, vertice: any, index?: number, options?: any) => {
    if (edge?.insertVertex) {
      return edge.insertVertex(vertice, index, options)
    }
    return null
  },
  
  appendVertex: (edge: any, vertex: any, options?: any) => {
    if (edge?.appendVertex) {
      return edge.appendVertex(vertex, options)
    }
    return null
  },
  
  getVertexAt: (edge: any, index: number) => {
    if (edge?.getVertexAt) {
      return edge.getVertexAt(index)
    }
    return null
  },
  
  setVertexAt: (edge: any, index: number, vertice: any, options?: any) => {
    if (edge?.setVertexAt) {
      return edge.setVertexAt(index, vertice, options)
    }
    return null
  },
  
  removeVertexAt: (edge: any, index: number, options?: any) => {
    if (edge?.removeVertexAt) {
      return edge.removeVertexAt(index, options)
    }
    return null
  },
  
  // 路由相关方法
  getRouter: (edge: any) => {
    if (edge?.getRouter) {
      return edge.getRouter()
    }
    return null
  },
  
  setRouter: (edge: any, nameOrRouter: any, args?: any, options?: any) => {
    if (edge?.setRouter) {
      if (typeof nameOrRouter === 'string') {
        return edge.setRouter(nameOrRouter, args, options)
      } else {
        return edge.setRouter(nameOrRouter, options)
      }
    }
    return null
  },
  
  removeRouter: (edge: any, options?: any) => {
    if (edge?.removeRouter) {
      return edge.removeRouter(options)
    }
    return null
  },
  
  // 连接器相关方法
  getConnector: (edge: any) => {
    if (edge?.getConnector) {
      return edge.getConnector()
    }
    return null
  },
  
  setConnector: (edge: any, nameOrConnector: any, args?: any, options?: any) => {
    if (edge?.setConnector) {
      if (typeof nameOrConnector === 'string') {
        return edge.setConnector(nameOrConnector, args, options)
      } else {
        return edge.setConnector(nameOrConnector, options)
      }
    }
    return null
  },
  
  removeConnector: (edge: any, options?: any) => {
    if (edge?.removeConnector) {
      return edge.removeConnector(options)
    }
    return null
  },
  
  // 标签相关方法
  getDefaultLabel: (edge: any) => {
    if (edge?.getDefaultLabel) {
      return edge.getDefaultLabel()
    }
    return null
  },
  
  getLabels: (edge: any) => {
    if (edge?.getLabels) {
      return edge.getLabels()
    }
    return []
  },
  
  setLabels: (edge: any, labels: any, options?: any) => {
    if (edge?.setLabels) {
      return edge.setLabels(labels, options)
    }
    return null
  },
  
  insertLabel: (edge: any, label: any, index?: number, options?: any) => {
    if (edge?.insertLabel) {
      return edge.insertLabel(label, index, options)
    }
    return null
  },
  
  appendLabel: (edge: any, label: any, options?: any) => {
    if (edge?.appendLabel) {
      return edge.appendLabel(label, options)
    }
    return null
  },
  
  getLabelAt: (edge: any, index: number) => {
    if (edge?.getLabelAt) {
      return edge.getLabelAt(index)
    }
    return null
  },
  
  setLabelAt: (edge: any, index: number, label: any, options?: any) => {
    if (edge?.setLabelAt) {
      return edge.setLabelAt(index, label, options)
    }
    return null
  },
  
  removeLabelAt: (edge: any, index: number, options?: any) => {
    if (edge?.removeLabelAt) {
      return edge.removeLabelAt(index, options)
    }
    return null
  },
}

// 暴露方法给父组件
defineExpose({
  graph,
  setGridConfig,
  getGridConfig,
  setBackgroundConfig,
  handleDynamicBackgroundUpdate,
  setSnaplineConfig,
  setScrollerConfig,
  getScrollerState,
  setSelectionConfig,
  getSelectionState,
  // 视图查找方法
  findView,
  findViewByCell,
  findViewByElem,
  findViewsFromPoint,
  findViewsInArea,
  findViews,
  // 视图状态检查方法
  isViewMounted,
  getMountedViews,
  getUnmountedViews,
  // 异步渲染控制方法
  isAsync,
  isFrozen,
  freeze,
  unfreeze,
  // 视图配置方法
  setViewConfig,
  getViewState,
  // Model API 方法
  ...modelMethods,
  // Transform API 方法
  ...transformMethods,
  // Transform 配置方法
  ...transformConfigMethods,
  // Selection API 方法
  ...selectionMethods,
  // View API 方法
  ...viewMethods,
  // Cell API 方法
  ...cellMethods,
  // Node API 方法
  ...nodeMethods,
  // Edge API 方法
  ...edgeMethods,
  // NodeView 专用方法
  ...nodeViewMethods,
  // EdgeView 专用方法
  ...edgeViewMethods,
})
</script>

<style scoped>
.x6-flowchart-editor {
  width: 100%;
  height: 100%;
}
</style>
