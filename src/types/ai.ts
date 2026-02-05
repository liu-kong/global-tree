/**
 * AI 相关类型定义
 */

import type { TreeNode } from './tree';
import { ConnectionType } from './tree';

// ============ 总结 ============

export enum SummaryFormat {
  PARAGRAPH = 'paragraph',
  BULLET_POINTS = 'bullets',
  STRUCTURED = 'structured'
}

export interface SummaryOptions {
  maxLength?: number;
  format?: SummaryFormat;
  language?: string;
  detailLevel?: 'brief' | 'normal' | 'detailed';
}

export interface SummaryResult {
  summary: string;
  keyPoints: string[];
  concepts: Concept[];
  actionItems?: string[];
  relatedTopics: string[];
  confidence: number;
  metadata: {
    model: string;
    tokensUsed: number;
    processingTime: number;
  };
}

export interface Concept {
  name: string;
  definition: string;
  importance: number;
}

// ============ 融合 ============

export interface FusionContext {
  userGoal?: string;
  domain?: string;
  constraints?: string[];
}

export interface FusionResult {
  insight: string;
  examples: string[];
  applications: string[];
  confidence: number;
  action: string;
  metadata: {
    node1Title: string;
    node2Title: string;
    model: string;
    tokensUsed: number;
  };
}

export interface FusionOpportunity {
  node1: string;
  node2: string;
  score: number;
  reason: string;
}

// ============ 分类 ============

export interface ClassificationResult {
  category: string;
  confidence: number;
  allScores: { category: string; score: number }[];
}

// ============ 关联推荐 ============

export interface ConnectionRecommendation {
  targetNodeId: string;
  type: ConnectionType;
  reason: string;
  confidence: number;
}

// ============ 学习路径 ============

export interface LearningPath {
  steps: LearningStep[];
  estimatedTime: string;
  prerequisites: TreeNode[];
  resources: string[];
}

export interface LearningStep {
  order: number;
  node: TreeNode;
  description: string;
  resources: string[];
  estimatedTime: string;
}

// ============ 问答 ============

export interface AnswerResult {
  answer: string;
  sources: { nodeId: string; title: string }[];
  confidence: number;
  relatedNodes: string[];
}

// ============ AI Provider ============

export interface CompleteOptions {
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  stopSequences?: string[];
}

export interface CompletionResponse {
  text: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
  finishReason?: 'stop' | 'length' | 'content_filter';
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatOptions extends CompleteOptions {
  systemPrompt?: string;
}

export interface ChatResponse {
  message: ChatMessage;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
}

export interface ModelInfo {
  name: string;
  provider: string;
  maxTokens: number;
  supportsStreaming: boolean;
  supportsEmbeddings: boolean;
}

export interface IAIProvider {
  complete(prompt: string, options?: CompleteOptions): Promise<CompletionResponse>;
  streamComplete(prompt: string, options?: CompleteOptions): AsyncGenerator<string>;
  chat(messages: ChatMessage[], options?: ChatOptions): Promise<ChatResponse>;
  streamChat(messages: ChatMessage[], options?: ChatOptions): AsyncGenerator<string>;
  embed(text: string): Promise<number[]>;
  embedBatch(texts: string[]): Promise<number[][]>;
  similarity(embedding1: number[], embedding2: number[]): number;
  getModelInfo(): ModelInfo;
  validateApiKey(apiKey: string): Promise<boolean>;
}
