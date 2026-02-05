/**
 * 知识树服务
 */

import type { KnowledgeTree, TreeNode } from '../types';
import { NodeType, ConnectionType } from '../types';
import { getIndexedDB, STORES } from '../utils/storage';

export class TreeService {
  private tree: KnowledgeTree | null = null;
  private db: ReturnType<typeof getIndexedDB>;

  constructor() {
    this.db = getIndexedDB();
  }

  /**
   * 获取知识树
   */
  getTree(): KnowledgeTree | null {
    return this.tree;
  }

  /**
   * 加载知识树（从 IndexedDB）
   */
  async loadTree(): Promise<void> {
    // 尝试从 IndexedDB 加载
    try {
      const allNodes = await this.db.getAll<TreeNode>(STORES.NODES);

      if (allNodes.length === 0) {
        // 没有数据，创建默认树
        this.tree = this.createDefaultTree();
        await this.saveTree();
      } else {
        // 重建树结构
        this.tree = this.rebuildTree(allNodes);
      }
    } catch (error) {
      console.error('Failed to load tree from IndexedDB:', error);
      // 创建默认树
      this.tree = this.createDefaultTree();
    }
  }

  /**
   * 创建默认树
   */
  private createDefaultTree(): KnowledgeTree {
    const root: TreeNode = {
      id: 'root',
      parentId: null,
      type: NodeType.ROOT,
      title: '我的知识树',
      description: '核心知识领域',
      children: [],
      metadata: {
        tags: [],
        importance: 5,
        status: 'active',
        progress: 0
      },
      connections: [],
      nutrients: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return new KnowledgeTreeImpl(root);
  }

  /**
   * 从节点列表重建树结构
   */
  private rebuildTree(nodes: TreeNode[]): KnowledgeTree {
    const nodesMap = new Map<string, TreeNode>();

    // 第一遍：创建所有节点映射
    nodes.forEach(node => {
      nodesMap.set(node.id, { ...node, children: [] });
    });

    // 第二遍：建立父子关系
    nodesMap.forEach(node => {
      if (node.parentId && nodesMap.has(node.parentId)) {
        const parent = nodesMap.get(node.parentId)!;
        parent.children.push(node);
      }
    });

    // 找到根节点
    const root = Array.from(nodesMap.values()).find(node => !node.parentId);

    if (!root) {
      return this.createDefaultTree();
    }

    const tree = new KnowledgeTreeImpl(root);
    tree.nodes = nodesMap;

    return tree;
  }

  /**
   * 创建节点
   */
  async createNode(data: CreateNodeData): Promise<string> {
    if (!this.tree) {
      await this.loadTree();
    }

    const id = this.generateId();

    const node: TreeNode = {
      id,
      parentId: data.parentId || null,
      type: data.type,
      title: data.title,
      description: data.description,
      children: [], // 这里只存空数组，不存对象引用
      metadata: {
        tags: data.metadata?.tags || [],
        importance: data.metadata?.importance || 3,
        status: data.metadata?.status || 'active',
        progress: data.metadata?.progress || 0,
        source: data.metadata?.source || 'manual'
      },
      connections: [],
      nutrients: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // 添加到树结构
    this.tree!.addNode(node);

    // 序列化节点用于 IndexedDB（移除循环引用）
    const plainNode = this.serializeNode(node);

    // 保存到 IndexedDB
    await this.db.add(STORES.NODES, plainNode);

    return id;
  }

  /**
   * 序列化节点（移除循环引用，只保留ID）
   */
  private serializeNode(node: TreeNode): any {
    return {
      id: node.id,
      parentId: node.parentId,
      type: node.type,
      title: node.title,
      description: node.description,
      children: [], // IndexedDB 中只存空数组
      metadata: {
        ...node.metadata,
        status: node.metadata.status || 'active' as any
      },
      connections: node.connections.map(conn => ({
        id: conn.id,
        targetId: conn.targetId,
        type: conn.type,
        strength: conn.strength,
        description: conn.description
      })),
      nutrients: [...node.nutrients],
      createdAt: node.createdAt.toISOString(),
      updatedAt: node.updatedAt.toISOString()
    }
  }

  /**
   * 更新节点
   */
  async updateNode(nodeId: string, updates: Partial<TreeNode>): Promise<boolean> {
    if (!this.tree) return false;

    const node = this.tree.getNode(nodeId);
    if (!node) return false;

    // 更新节点
    Object.assign(node, updates, { updatedAt: new Date() });

    // 序列化后保存到 IndexedDB
    const plainNode = this.serializeNode(node);
    await this.db.put(STORES.NODES, plainNode);

    return true;
  }

  /**
   * 删除节点
   */
  async deleteNode(nodeId: string, options: { recursive?: boolean } = {}): Promise<boolean> {
    if (!this.tree) return false;

    const node = this.tree.getNode(nodeId);
    if (!node) return false;

    // 递归删除子节点
    if (options.recursive !== false) {
      const allNodeIds = this.tree.getAllNodeIds();
      const toDelete = [nodeId];

      // 找出所有子孙节点
      const findDescendants = (parentId: string) => {
        allNodeIds.forEach(id => {
          const n = this.tree!.getNode(id);
          if (n && n.parentId === parentId) {
            toDelete.push(id);
            findDescendants(id);
          }
        });
      };

      findDescendants(nodeId);

      // 批量删除
      for (const id of toDelete) {
        await this.db.delete(STORES.NODES, id);
        this.tree.removeNode(id);
      }
    } else {
      // 只删除当前节点
      await this.db.delete(STORES.NODES, nodeId);
      this.tree.removeNode(nodeId);
    }

    return true;
  }

  /**
   * 移动节点
   */
  async moveNode(nodeId: string, newParentId: string, index?: number): Promise<boolean> {
    if (!this.tree) return false;

    const node = this.tree.getNode(nodeId);
    if (!node) return false;

    // 更新父节点
    node.parentId = newParentId;
    node.updatedAt = new Date();

    // 序列化后保存更新
    const plainNode = this.serializeNode(node);
    await this.db.put(STORES.NODES, plainNode);

    // 重建树结构
    const allNodes = await this.db.getAll<TreeNode>(STORES.NODES);
    this.tree = this.rebuildTree(allNodes);

    return true;
  }

  /**
   * 搜索节点
   */
  searchNodes(query: SearchQuery): TreeNode[] {
    if (!this.tree) return [];

    const allNodes = this.tree.flatten();

    let result = allNodes;

    if (query.keyword) {
      const keyword = query.keyword.toLowerCase();
      result = result.filter(node =>
        node.title.toLowerCase().includes(keyword) ||
        node.description?.toLowerCase().includes(keyword)
      );
    }

    if (query.tags && query.tags.length > 0) {
      result = result.filter(node =>
        query.tags!.some(tag => node.metadata.tags.includes(tag))
      );
    }

    if (query.type) {
      result = result.filter(node => node.type === query.type);
    }

    if (query.limit) {
      result = result.slice(0, query.limit);
    }

    return result;
  }

  /**
   * 获取节点路径
   */
  getPath(nodeId: string): TreeNode[] {
    if (!this.tree) return [];

    const path: TreeNode[] = [];
    let current = this.tree.getNode(nodeId);

    while (current) {
      path.unshift(current);
      current = current.parentId ? this.tree.getNode(current.parentId) : undefined;
    }

    return path;
  }

  /**
   * 创建连接
   */
  async connect(
    sourceId: string,
    targetId: string,
    type: ConnectionType,
    options?: { description?: string; strength?: number }
  ): Promise<string> {
    if (!this.tree) {
      throw new Error('Tree not loaded');
    }

    const connectionId = this.generateId();
    const connection = {
      id: connectionId,
      sourceId,
      targetId,
      type,
      strength: options?.strength || 0.5,
      description: options?.description
    };

    // 添加连接
    const sourceNode = this.tree.getNode(sourceId);
    if (sourceNode) {
      sourceNode.connections.push(connection);
      await this.db.put(STORES.NODES, sourceNode);
    }

    return connectionId;
  }

  /**
   * 删除连接
   */
  async disconnect(connectionId: string): Promise<boolean> {
    if (!this.tree) return false;

    // 查找包含此连接的节点
    for (const node of this.tree.flatten()) {
      const index = node.connections.findIndex(c => c.id === connectionId);
      if (index > -1) {
        node.connections.splice(index, 1);
        await this.db.put(STORES.NODES, node);
        return true;
      }
    }

    return false;
  }

  /**
   * 导出树
   */
  async exportTree(format: 'json' | 'markdown'): Promise<string> {
    if (!this.tree) throw new Error('No tree to export');

    if (format === 'json') {
      return JSON.stringify(this.tree.flatten(), null, 2);
    }

    if (format === 'markdown') {
      return this.treeToMarkdown(this.tree.root);
    }

    throw new Error('Unsupported format');
  }

  /**
   * 树转 Markdown
   */
  private treeToMarkdown(node: TreeNode, level: number = 0): string {
    const indent = '  '.repeat(level);
    const lines: string[] = [];

    // 标题
    const prefix = '#'.repeat(Math.min(level + 1, 6)) + ' ';
    lines.push(`${prefix}${node.title}`);

    // 描述
    if (node.description) {
      lines.push(`${node.description}\n`);
    }

    // 元数据
    if (node.metadata.tags.length > 0) {
      lines.push(`**标签**: ${node.metadata.tags.join(', ')}`);
    }
    lines.push(`**重要性**: ${node.metadata.importance}/5`);
    lines.push(`**进度**: ${node.metadata.progress}%\n`);

    // 子节点
    for (const child of node.children) {
      lines.push(this.treeToMarkdown(child, level + 1));
    }

    return lines.join('\n');
  }

  /**
   * 保存树
   */
  private async saveTree(): Promise<void> {
    if (!this.tree) return;

    // 批量保存所有节点
    const nodes = this.tree.flatten();
    await this.db.batchUpdate(STORES.NODES, nodes);
  }

  /**
   * 生成 ID
   */
  private generateId(): string {
    return `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// ============ KnowledgeTree 实现 ============

class KnowledgeTreeImpl implements KnowledgeTree {
  root: TreeNode;
  nodes: Map<string, TreeNode>;

  constructor(root: TreeNode) {
    this.root = root;
    this.nodes = new Map();
    this.nodes.set(root.id, root);
  }

  addNode(node: TreeNode): void {
    this.nodes.set(node.id, node);

    if (node.parentId) {
      const parent = this.nodes.get(node.parentId);
      if (parent) {
        parent.children.push(node);
      }
    }
  }

  removeNode(nodeId: string): void {
    const node = this.nodes.get(nodeId);
    if (!node) return;

    // 从父节点移除
    if (node.parentId) {
      const parent = this.nodes.get(node.parentId);
      if (parent) {
        parent.children = parent.children.filter(child => child.id !== nodeId);
      }
    }

    this.nodes.delete(nodeId);
  }

  updateNode(nodeId: string, updates: Partial<TreeNode>): void {
    const node = this.nodes.get(nodeId);
    if (node) {
      Object.assign(node, updates);
    }
  }

  getNode(nodeId: string): TreeNode | undefined {
    return this.nodes.get(nodeId);
  }

  moveNode(nodeId: string, newParentId: string): void {
    const node = this.nodes.get(nodeId);
    if (!node) return;

    // 从旧父节点移除
    if (node.parentId) {
      const oldParent = this.nodes.get(node.parentId);
      if (oldParent) {
        oldParent.children = oldParent.children.filter(child => child.id !== nodeId);
      }
    }

    // 添加到新父节点
    const newParent = this.nodes.get(newParentId);
    if (newParent) {
      newParent.children.push(node);
      node.parentId = newParentId;
    }
  }

  connect(nodeId1: string, nodeId2: string, type: ConnectionType): void {
    const node1 = this.nodes.get(nodeId1);
    if (!node1) return;

    const connection = {
      id: `conn_${Date.now()}`,
      targetId: nodeId2,
      type,
      strength: 0.5
    };

    node1.connections.push(connection);
  }

  disconnect(connectionId: string): void {
    this.nodes.forEach(node => {
      node.connections = node.connections.filter(c => c.id !== connectionId);
    });
  }

  flatten(): TreeNode[] {
    return Array.from(this.nodes.values());
  }

  getAllNodeIds(): string[] {
    return Array.from(this.nodes.keys());
  }
}

// ============ 类型定义 ============

interface CreateNodeData {
  parentId: string | null;
  type: NodeType;
  title: string;
  description?: string;
  metadata?: {
    tags?: string[];
    importance?: number;
    status?: 'active' | 'archived';
    progress?: number;
    source?: string;
  };
}

interface SearchQuery {
  keyword?: string;
  tags?: string[];
  type?: NodeType;
  dateRange?: {
    start: Date;
    end: Date;
  };
  limit?: number;
}
