/**
 * 知识树类型定义
 */

export enum NodeType {
  ROOT = 'root',           // 根节点（核心领域）
  BRANCH = 'branch',       // 分支节点（子领域）
  LEAF = 'leaf',           // 叶子节点（知识点）
  VIRTUAL = 'virtual'      // 虚拟节点（AI 生成）
}

export enum NodeStatus {
  ACTIVE = 'active',
  ARCHIVED = 'archived',
  DELETED = 'deleted'
}

export enum ConnectionType {
  REFERENCE = 'reference',   // 引用
  PREREQUISITE = 'prereq',   // 前置知识
  RELATED = 'related',       // 相关
  FUSION = 'fusion'          // 融合产生
}

export interface TreeNode {
  id: string;
  parentId: string | null;
  type: NodeType;
  title: string;
  description?: string;
  children: TreeNode[];
  metadata: NodeMetadata;
  connections: NodeConnection[];
  nutrients: string[];  // 养料 ID 数组
  createdAt: Date;
  updatedAt: Date;
}

export interface NodeMetadata {
  tags: string[];
  importance: number;  // 1-5
  status: NodeStatus;
  progress: number;    // 0-100
  source?: string;     // 来源：manual | ai
}

export interface NodeConnection {
  id: string;
  targetId: string;
  type: ConnectionType;
  strength: number;    // 0-1
  description?: string;
}

export interface KnowledgeTree {
  root: TreeNode;
  nodes: Map<string, TreeNode>;

  addNode(node: TreeNode): void;
  removeNode(nodeId: string): void;
  updateNode(nodeId: string, updates: Partial<TreeNode>): void;
  getNode(nodeId: string): TreeNode | undefined;
  moveNode(nodeId: string, newParentId: string): void;
  connect(nodeId1: string, nodeId2: string, type: ConnectionType): void;
  disconnect(connectionId: string): void;
  flatten(): TreeNode[];
  getAllNodeIds(): string[];
}
