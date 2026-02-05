/**
 * 知识树 Store
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { TreeNode, SearchQuery } from '../types';
import { NodeType } from '../types';
import { TreeService } from '../services/TreeService';

export const useTreeStore = defineStore('tree', () => {
  // State
  const tree = ref<any>(null);
  const selectedNodeIds = ref<string[]>([]);
  const expandedNodeIds = ref<string[]>([]);
  const loading = ref(false);
  const error = ref<Error | null>(null);
  const service = ref<TreeService>(new TreeService());

  // Getters
  const root = computed<TreeNode | null>(() => {
    return tree.value?.root || null;
  });

  const selectedNodes = computed<TreeNode[]>(() => {
    if (!tree.value) return [];
    return selectedNodeIds.value
      .map(id => tree.value.getNode(id))
      .filter(Boolean);
  });

  const flatNodes = computed<TreeNode[]>(() => {
    return tree.value?.flatten() || [];
  });

  // Actions
  async function loadTree() {
    loading.value = true;
    error.value = null;

    try {
      tree.value = await service.value.getTree();
    } catch (e) {
      error.value = e as Error;
      throw e;
    } finally {
      loading.value = false;
    }
  }

  async function createNode(data: {
    parentId: string | null;
    type: NodeType;
    title: string;
    description?: string;
    metadata?: any;
  }) {
    const nodeId = await service.value.createNode(data);
    await loadTree();
    return nodeId;
  }

  async function updateNode(nodeId: string, updates: any) {
    await service.value.updateNode(nodeId, updates);
    const node = tree.value?.getNode(nodeId);
    if (node) {
      Object.assign(node, updates);
    }
  }

  async function deleteNode(nodeId: string, options?: any) {
    await service.value.deleteNode(nodeId, options);
    await loadTree();
  }

  async function moveNode(nodeId: string, newParentId: string, index?: number) {
    await service.value.moveNode(nodeId, newParentId, index);
    await loadTree();
  }

  function selectNode(nodeId: string | string[]) {
    selectedNodeIds.value = Array.isArray(nodeId) ? nodeId : [nodeId];
  }

  function toggleSelection(nodeId: string) {
    const index = selectedNodeIds.value.indexOf(nodeId);
    if (index > -1) {
      selectedNodeIds.value.splice(index, 1);
    } else {
      selectedNodeIds.value.push(nodeId);
    }
  }

  function clearSelection() {
    selectedNodeIds.value = [];
  }

  function toggleExpand(nodeId: string) {
    const index = expandedNodeIds.value.indexOf(nodeId);
    if (index > -1) {
      expandedNodeIds.value.splice(index, 1);
    } else {
      expandedNodeIds.value.push(nodeId);
    }
  }

  function expandAll() {
    expandedNodeIds.value = tree.value?.getAllNodeIds() || [];
  }

  function collapseAll() {
    expandedNodeIds.value = [];
  }

  function searchNodes(query: SearchQuery): TreeNode[] {
    return service.value.searchNodes(query);
  }

  async function exportTree(format: 'json' | 'markdown' | 'png') {
    // TODO: 实现导出
    return null;
  }

  return {
    // State
    tree,
    selectedNodeIds,
    expandedNodeIds,
    loading,
    error,

    // Getters
    root,
    selectedNodes,
    flatNodes,

    // Actions
    loadTree,
    createNode,
    updateNode,
    deleteNode,
    moveNode,
    selectNode,
    toggleSelection,
    clearSelection,
    toggleExpand,
    expandAll,
    collapseAll,
    searchNodes,
    exportTree
  };
});
