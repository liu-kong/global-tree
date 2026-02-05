/**
 * AI Store
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { SummaryOptions, SummaryResult, FusionContext, FusionResult, FusionOpportunity } from '../types';
import { AIService } from '../services/AIService';

export const useAIStore = defineStore('ai', () => {
  // State
  const provider = ref<'claude' | 'openai'>('claude');
  const loading = ref(false);
  const currentTask = ref<any>(null);
  const history = ref<any[]>([]);
  const settings = ref({
    defaultProvider: 'claude',
    temperature: 0.7,
    maxTokens: 4096,
    autoProcess: true
  });

  const service = ref<AIService>(new AIService());

  // Getters
  const activeTask = computed(() => currentTask.value);
  const taskHistory = computed(() => [...history.value].reverse());
  const tasksByType = computed<Record<string, number>>(() => {
    const counts: Record<string, number> = {};
    history.value.forEach(task => {
      counts[task.type] = (counts[task.type] || 0) + 1;
    });
    return counts;
  });
  const totalTokens = computed<number>(() => {
    return history.value.reduce((sum, task) => {
      return sum + (task.metadata?.tokensUsed || 0);
    }, 0);
  });

  // Actions
  async function summarize(content: string, options?: SummaryOptions): Promise<SummaryResult> {
    return executeTask('summarize', async () => {
      return service.value.summarize(content, options);
    });
  }

  async function extractKeyPoints(content: string, count?: number): Promise<string[]> {
    return executeTask('extractKeyPoints', async () => {
      return service.value.extractKeyPoints(content, count);
    });
  }

  async function fuseNodes(node1: any, node2: any, context?: FusionContext): Promise<FusionResult> {
    return executeTask('fuse', async () => {
      return service.value.fuseNodes(node1, node2, context);
    });
  }

  async function discoverFusionOpportunities(tree: any, limit?: number): Promise<FusionOpportunity[]> {
    return executeTask('discoverFusion', async () => {
      return service.value.discoverFusionOpportunities(tree, limit);
    });
  }

  async function executeTask<T>(type: string, fn: () => Promise<T>): Promise<T> {
    loading.value = true;
    currentTask.value = {
      id: generateId(),
      type,
      status: 'running',
      startTime: new Date()
    };

    try {
      const result = await fn();

      currentTask.value.status = 'completed';
      currentTask.value.endTime = new Date();
      currentTask.value.result = result;

      history.value.push({ ...currentTask.value });

      return result;
    } catch (error) {
      currentTask.value.status = 'failed';
      currentTask.value.endTime = new Date();
      currentTask.value.error = error as Error;

      throw error;
    } finally {
      loading.value = false;
      currentTask.value = null;
    }
  }

  function setProvider(newProvider: 'claude' | 'openai') {
    provider.value = newProvider;
    settings.value.defaultProvider = newProvider;
  }

  function updateSettings(newSettings: Partial<typeof settings.value>) {
    Object.assign(settings.value, newSettings);
  }

  function clearHistory() {
    history.value = [];
  }

  function generateId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  return {
    // State
    provider,
    loading,
    currentTask,
    history,
    settings,

    // Getters
    activeTask,
    taskHistory,
    tasksByType,
    totalTokens,

    // Actions
    summarize,
    extractKeyPoints,
    fuseNodes,
    discoverFusionOpportunities,
    setProvider,
    updateSettings,
    clearHistory
  };
});
