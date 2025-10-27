// 统一的节点数据结构
export interface KnowledgeNode {
  id: string;
  type: 'concept' | 'entity' | 'relation' | 'document';
  label: string;
  properties: Record<string, any>;
  position?: { x: number; y: number };
  style?: NodeStyle;
  data?: any; // 额外数据
}

// 统一的边数据结构
export interface KnowledgeEdge {
  id: string;
  source: string;
  target: string;
  type: 'contains' | 'relates' | 'depends' | 'similar';
  label?: string;
  properties: Record<string, any>;
  style?: EdgeStyle;
  data?: any; // 额外数据
}

// 节点样式
export interface NodeStyle {
  width?: number;
  height?: number;
  color?: string;
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  opacity?: number;
  shape?: 'rect' | 'circle' | 'ellipse' | 'polygon';
  icon?: string;
  image?: string;
}

// 边样式
export interface EdgeStyle {
  color?: string;
  width?: number;
  style?: 'solid' | 'dashed' | 'dotted';
  arrow?: boolean;
  arrowSize?: number;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  opacity?: number;
  curve?: 'linear' | 'bezier' | 'arc';
}

// 图谱数据
export interface GraphData {
  nodes: KnowledgeNode[];
  edges: KnowledgeEdge[];
  metadata?: {
    title?: string;
    description?: string;
    createdAt?: string;
    updatedAt?: string;
    version?: string;
  };
}

// 渲染器类型
export type RendererType = 'd3' | 'x6' | 'g6';

// 布局类型
export type LayoutType = 'force' | 'hierarchical' | 'circular' | 'grid' | 'random';

// 图谱事件
export interface GraphEvent {
  type: string;
  data: any;
  timestamp: number;
}

// 选中状态
export interface SelectionState {
  nodes: string[];
  edges: string[];
  active?: string; // 当前激活的元素ID
}

// 视图状态
export interface ViewState {
  zoom: number;
  pan: { x: number; y: number };
  center?: { x: number; y: number };
  fitView?: boolean;
}

// 图谱配置
export interface GraphConfig {
  renderer: RendererType;
  layout: LayoutType;
  theme: 'light' | 'dark';
  showGrid: boolean;
  showMiniMap: boolean;
  enableAnimation: boolean;
  animationDuration: number;
  nodeSize: { min: number; max: number };
  edgeWidth: { min: number; max: number };
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
    border: string;
  };
}
