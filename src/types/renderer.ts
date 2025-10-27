import type { GraphData, KnowledgeNode, KnowledgeEdge, GraphEvent, ViewState } from './graph';

// 渲染器接口
export interface GraphRenderer {
  // 基础方法
  initialize(container: HTMLElement): Promise<void>;
  render(data: GraphData): void;
  destroy(): void;
  
  // 数据更新
  updateData(data: GraphData): void;
  addNode(node: KnowledgeNode): void;
  updateNode(nodeId: string, updates: Partial<KnowledgeNode>): void;
  removeNode(nodeId: string): void;
  addEdge(edge: KnowledgeEdge): void;
  updateEdge(edgeId: string, updates: Partial<KnowledgeEdge>): void;
  removeEdge(edgeId: string): void;
  
  // 视图控制
  zoomTo(scale: number): void;
  zoomIn(): void;
  zoomOut(): void;
  panTo(x: number, y: number): void;
  center(): void;
  fitView(): void;
  
  // 布局
  applyLayout(layout: string, config?: any): void;
  
  // 选择
  selectNodes(nodeIds: string[]): void;
  selectEdges(edgeIds: string[]): void;
  clearSelection(): void;
  getSelection(): { nodes: string[]; edges: string[] };
  
  // 事件
  on(event: string, callback: (event: GraphEvent) => void): void;
  off(event: string, callback?: (event: GraphEvent) => void): void;
  emit(event: string, data: any): void;
  
  // 样式
  updateTheme(theme: 'light' | 'dark'): void;
  updateStyles(styles: any): void;
  
  // 导出
  exportAsImage(format: 'png' | 'svg' | 'jpeg'): Promise<Blob>;
  exportAsJSON(): GraphData;
  
  // 工具方法
  getNodeById(id: string): KnowledgeNode | null;
  getEdgeById(id: string): KnowledgeEdge | null;
  getAllNodes(): KnowledgeNode[];
  getAllEdges(): KnowledgeEdge[];
  getViewState(): ViewState;
}

// 渲染器配置
export interface RendererConfig {
  // D3 配置
  d3?: {
    forceSimulation?: {
      strength: number;
      distance: number;
      charge: number;
    };
    animation?: {
      duration: number;
      easing: string;
    };
  };
  
  // X6 配置
  x6?: {
    grid?: {
      size: number;
      visible: boolean;
      type: 'dot' | 'fixedDot' | 'mesh';
    };
    snapline?: boolean;
    history?: boolean;
    clipboard?: boolean;
    keyboard?: boolean;
  };
  
  // G6 配置
  g6?: {
    modes?: {
      default: string[];
    };
    layout?: {
      type: string;
      [key: string]: any;
    };
    animate?: boolean;
    fitView?: boolean;
  };
}

// 渲染器工厂
export interface RendererFactory {
  create(type: 'd3'): GraphRenderer;
  create(type: 'x6'): GraphRenderer;
  create(type: 'g6'): GraphRenderer;
}

// 渲染器事件类型
export type RendererEventType = 
  | 'node:click'
  | 'node:dblclick'
  | 'node:contextmenu'
  | 'node:mouseenter'
  | 'node:mouseleave'
  | 'node:dragstart'
  | 'node:drag'
  | 'node:dragend'
  | 'edge:click'
  | 'edge:dblclick'
  | 'edge:contextmenu'
  | 'edge:mouseenter'
  | 'edge:mouseleave'
  | 'canvas:click'
  | 'canvas:dblclick'
  | 'canvas:contextmenu'
  | 'selection:change'
  | 'view:change'
  | 'layout:complete'
  | 'render:complete';

// 渲染器状态
export interface RendererState {
  isInitialized: boolean;
  isRendering: boolean;
  currentRenderer: string;
  nodeCount: number;
  edgeCount: number;
  viewState: ViewState;
  selection: {
    nodes: string[];
    edges: string[];
  };
  performance: {
    renderTime: number;
    lastUpdate: number;
  };
}
