import { defineStore } from 'pinia';
import type { GraphData, KnowledgeNode, KnowledgeEdge, SelectionState, ViewState } from '@/types/graph';

export const useGraphStore = defineStore('graph', {
  state: () => ({
    // 图谱数据
    data: {
      nodes: [] as KnowledgeNode[],
      edges: [] as KnowledgeEdge[],
      metadata: {
        title: '知识图谱',
        description: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: '1.0.0'
      }
    } as GraphData,
    
    // 选择状态
    selection: {
      nodes: [] as string[],
      edges: [] as string[],
      active: undefined as string | undefined
    } as SelectionState,
    
    // 视图状态
    viewState: {
      zoom: 1,
      pan: { x: 0, y: 0 },
      fitView: false
    } as ViewState,
    
    // 历史记录
    history: [] as GraphData[],
    historyIndex: -1,
    
    // 加载状态
    loading: false,
    
    // 错误状态
    error: null as string | null,
    
    // 修改标记
    isDirty: false
  }),

  getters: {
    // 获取所有节点
    allNodes: (state) => state.data.nodes,
    
    // 获取所有边
    allEdges: (state) => state.data.edges,
    
    // 获取节点数量
    nodeCount: (state) => state.data.nodes.length,
    
    // 获取边数量
    edgeCount: (state) => state.data.edges.length,
    
    // 根据ID获取节点
    getNodeById: (state) => (id: string) => {
      return state.data.nodes.find(node => node.id === id) || null;
    },
    
    // 根据ID获取边
    getEdgeById: (state) => (id: string) => {
      return state.data.edges.find(edge => edge.id === id) || null;
    },
    
    // 获取节点的连接边
    getNodeEdges: (state) => (nodeId: string) => {
      return state.data.edges.filter(edge => 
        edge.source === nodeId || edge.target === nodeId
      );
    },
    
    // 获取相邻节点
    getAdjacentNodes: (state) => (nodeId: string) => {
      const edges = state.data.edges.filter(edge => 
        edge.source === nodeId || edge.target === nodeId
      );
      const adjacentIds = edges.map(edge => 
        edge.source === nodeId ? edge.target : edge.source
      );
      return state.data.nodes.filter(node => adjacentIds.includes(node.id));
    },
    
    // 检查是否可以撤销
    canUndo: (state) => state.historyIndex > 0,
    
    // 检查是否可以重做
    canRedo: (state) => state.historyIndex < state.history.length - 1,
    
    // 获取选中的节点
    selectedNodes: (state) => {
      return state.data.nodes.filter(node => state.selection.nodes.includes(node.id));
    },
    
    // 获取选中的边
    selectedEdges: (state) => {
      return state.data.edges.filter(edge => state.selection.edges.includes(edge.id));
    }
  },

  actions: {
    // 设置图谱数据
    setGraphData(data: GraphData) {
      this.data = { ...data };
      this.updateMetadata();
      this.saveToHistory();
    },

    // 添加节点
    addNode(node: KnowledgeNode) {
      this.data.nodes.push(node);
      this.updateMetadata();
      this.isDirty = true;
    },

    // 更新节点
    updateNode(nodeId: string, updates: Partial<KnowledgeNode>) {
      const index = this.data.nodes.findIndex(node => node.id === nodeId);
      if (index !== -1) {
        this.data.nodes[index] = { ...this.data.nodes[index], ...updates };
        this.updateMetadata();
        this.isDirty = true;
      }
    },

    // 删除节点
    removeNode(nodeId: string) {
      // 删除节点
      this.data.nodes = this.data.nodes.filter(node => node.id !== nodeId);
      // 删除相关的边
      this.data.edges = this.data.edges.filter(edge => 
        edge.source !== nodeId && edge.target !== nodeId
      );
      // 从选择中移除
      this.selection.nodes = this.selection.nodes.filter(id => id !== nodeId);
      this.updateMetadata();
      this.isDirty = true;
    },

    // 添加边
    addEdge(edge: KnowledgeEdge) {
      this.data.edges.push(edge);
      this.updateMetadata();
      this.isDirty = true;
    },

    // 更新边
    updateEdge(edgeId: string, updates: Partial<KnowledgeEdge>) {
      const index = this.data.edges.findIndex(edge => edge.id === edgeId);
      if (index !== -1) {
        this.data.edges[index] = { ...this.data.edges[index], ...updates };
        this.updateMetadata();
        this.isDirty = true;
      }
    },

    // 删除边
    removeEdge(edgeId: string) {
      this.data.edges = this.data.edges.filter(edge => edge.id !== edgeId);
      this.selection.edges = this.selection.edges.filter(id => id !== edgeId);
      this.updateMetadata();
      this.isDirty = true;
    },

    // 设置选择状态
    setSelection(selection: Partial<SelectionState>) {
      this.selection = { ...this.selection, ...selection };
    },

    // 清除选择
    clearSelection() {
      this.selection = { nodes: [], edges: [], active: undefined };
    },

    // 选择节点
    selectNodes(nodeIds: string[]) {
      this.selection.nodes = nodeIds;
    },

    // 选择边
    selectEdges(edgeIds: string[]) {
      this.selection.edges = edgeIds;
    },

    // 设置视图状态
    setViewState(viewState: Partial<ViewState>) {
      this.viewState = { ...this.viewState, ...viewState };
    },

    // 保存到历史记录
    saveToHistory() {
      // 如果当前不在历史记录的末尾，删除后面的记录
      if (this.historyIndex < this.history.length - 1) {
        this.history = this.history.slice(0, this.historyIndex + 1);
      }
      
      // 添加新的历史记录
      this.history.push(JSON.parse(JSON.stringify(this.data)));
      this.historyIndex++;
      
      // 限制历史记录数量
      if (this.history.length > 50) {
        this.history.shift();
        this.historyIndex--;
      }
    },

    // 撤销
    undo() {
      if (this.canUndo) {
        this.historyIndex--;
        this.data = JSON.parse(JSON.stringify(this.history[this.historyIndex]));
        this.clearSelection();
        this.isDirty = true;
      }
    },

    // 重做
    redo() {
      if (this.canRedo) {
        this.historyIndex++;
        this.data = JSON.parse(JSON.stringify(this.history[this.historyIndex]));
        this.clearSelection();
        this.isDirty = true;
      }
    },

    // 清空图谱
    clearGraph() {
      this.data = {
        nodes: [],
        edges: [],
        metadata: {
          title: '知识图谱',
          description: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          version: '1.0.0'
        }
      };
      this.clearSelection();
      this.history = [];
      this.historyIndex = -1;
      this.isDirty = false;
    },

    // 更新元数据
    updateMetadata() {
      this.data.metadata.updatedAt = new Date().toISOString();
    },

    // 设置加载状态
    setLoading(loading: boolean) {
      this.loading = loading;
    },

    // 设置错误状态
    setError(error: string | null) {
      this.error = error;
    },

    // 标记为已保存
    markAsSaved() {
      this.isDirty = false;
    }
  }
});
