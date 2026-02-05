/**
 * 养料 Store
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Nutrient, ParsedContent } from '../types';
import { NutrientType, NutrientStatus } from '../types';
import { NutrientService } from '../services/NutrientService';

export const useNutrientStore = defineStore('nutrient', () => {
  // State
  const nutrients = ref<Nutrient[]>([]);
  const currentNutrient = ref<Nutrient | null>(null);
  const processing = ref<string[]>([]);
  const loading = ref(false);
  const filter = ref<{
    nodeId: string | null;
    tags: string[];
    type: NutrientType | null;
    status: NutrientStatus | null;
  }>({
    nodeId: null,
    tags: [],
    type: null,
    status: null
  });

  const service = ref<NutrientService>(new NutrientService());

  // Getters
  const filteredNutrients = computed<Nutrient[]>(() => {
    let result = [...nutrients.value];

    if (filter.value.nodeId) {
      result = result.filter(n => n.nodeId === filter.value.nodeId);
    }

    if (filter.value.tags.length > 0) {
      result = result.filter(n =>
        filter.value.tags!.some(tag => n.tags.includes(tag))
      );
    }

    if (filter.value.type) {
      result = result.filter(n => n.type === filter.value.type);
    }

    if (filter.value.status) {
      result = result.filter(n => n.status === filter.value.status);
    }

    return result;
  });

  const nutrientsByNode = computed<Map<string, Nutrient[]>>(() => {
    const grouped = new Map<string, Nutrient[]>();

    nutrients.value.forEach(nutrient => {
      if (nutrient.nodeId) {
        if (!grouped.has(nutrient.nodeId)) {
          grouped.set(nutrient.nodeId, []);
        }
        grouped.get(nutrient.nodeId)!.push(nutrient);
      }
    });

    return grouped;
  });

  const processingNutrients = computed<Nutrient[]>(() => {
    return processing.value
      .map(id => nutrients.value.find(n => n.id === id))
      .filter(Boolean) as Nutrient[];
  });

  const nutrientsByType = computed<Record<NutrientType, number>>(() => {
    const counts: Record<string, number> = {};

    nutrients.value.forEach(n => {
      counts[n.type] = (counts[n.type] || 0) + 1;
    });

    return counts as Record<NutrientType, number>;
  });

  // Actions
  async function loadNutrients() {
    loading.value = true;

    try {
      nutrients.value = service.value.getAllNutrients();
    } finally {
      loading.value = false;
    }
  }

  async function loadNutrientsByNode(nodeId: string) {
    loading.value = true;
    filter.value.nodeId = nodeId;

    try {
      nutrients.value = service.value.getNutrientsByNode(nodeId);
    } finally {
      loading.value = false;
    }
  }

  async function addNutrient(
    nutrient: Omit<Nutrient, 'id' | 'createdAt' | 'status'>
  ): Promise<string> {
    const id = await service.value.addNutrient(nutrient);
    await loadNutrients();
    return id;
  }

  async function addFromUrl(
    url: string,
    options?: {
      autoProcess?: boolean;
      nodeId?: string;
      tags?: string[];
    }
  ): Promise<string> {
    const id = await service.value.addFromUrl(url, options);

    if (options?.autoProcess) {
      processing.value.push(id);
    }

    await loadNutrients();
    return id;
  }

  async function processNutrient(
    nutrientId: string
  ): Promise<Nutrient & { parsed: ParsedContent }> {
    if (!processing.value.includes(nutrientId)) {
      processing.value.push(nutrientId);
    }

    try {
      const result = await service.value.processNutrient(nutrientId);

      // 更新本地状态
      const index = nutrients.value.findIndex(n => n.id === nutrientId);
      if (index > -1) {
        nutrients.value[index] = result;
      }

      return result;
    } finally {
      const index = processing.value.indexOf(nutrientId);
      if (index > -1) {
        processing.value.splice(index, 1);
      }
    }
  }

  async function updateNutrient(nutrientId: string, updates: Partial<Nutrient>) {
    await service.value.updateNutrient(nutrientId, updates);

    // 更新本地状态
    const index = nutrients.value.findIndex(n => n.id === nutrientId);
    if (index > -1) {
      Object.assign(nutrients.value[index], updates);
    }
  }

  async function deleteNutrient(nutrientId: string) {
    await service.value.deleteNutrient(nutrientId);

    // 从列表移除
    const index = nutrients.value.findIndex(n => n.id === nutrientId);
    if (index > -1) {
      nutrients.value.splice(index, 1);
    }
  }

  async function attachToNode(nutrientId: string, nodeId: string) {
    await service.value.attachToNode(nutrientId, nodeId);

    // 更新本地状态
    const nutrient = nutrients.value.find(n => n.id === nutrientId);
    if (nutrient) {
      nutrient.nodeId = nodeId;
    }
  }

  function setFilter(newFilter: Partial<typeof filter.value>) {
    Object.assign(filter.value, newFilter);
  }

  function clearFilter() {
    filter.value = {
      nodeId: null,
      tags: [],
      type: null,
      status: null
    };
  }

  function searchNutrients(query: {
    keyword?: string;
    type?: NutrientType;
    tags?: string[];
    nodeId?: string;
    status?: NutrientStatus;
  }): Nutrient[] {
    return service.value.searchNutrients(query);
  }

  return {
    // State
    nutrients,
    currentNutrient,
    processing,
    loading,
    filter,

    // Getters
    filteredNutrients,
    nutrientsByNode,
    processingNutrients,
    nutrientsByType,

    // Actions
    loadNutrients,
    loadNutrientsByNode,
    addNutrient,
    addFromUrl,
    processNutrient,
    updateNutrient,
    deleteNutrient,
    attachToNode,
    setFilter,
    clearFilter,
    searchNutrients
  };
});
