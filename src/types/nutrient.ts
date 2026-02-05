/**
 * 养料类型定义
 */

export enum NutrientType {
  WEB_LINK = 'web-link',
  MARKDOWN = 'markdown',
  PDF = 'pdf',
  IMAGE = 'image',
  NOTE = 'note'
}

export enum NutrientSource {
  MANUAL = 'manual',
  BROWSER_EXTENSION = 'browser',
  OBSIDIAN = 'obsidian',
  NOTION = 'notion',
  IMPORT = 'import'
}

export enum NutrientStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

export interface Nutrient {
  id: string;
  type: NutrientType;
  source: NutrientSource;

  // 原始内容
  rawContent: string;
  url?: string;

  // AI 解析结果
  parsed?: ParsedContent;

  // 归属
  nodeId?: string;
  tags: string[];

  // 状态
  status: NutrientStatus;

  // 时间
  createdAt: Date;
  processedAt?: Date;
}

export interface ParsedContent {
  title: string;
  summary: string;
  keyPoints: string[];
  concepts: Concept[];
  actionItems?: string[];
  relatedTopics: string[];
  confidence: number;
}

export interface Concept {
  name: string;
  definition: string;
  importance: number;
}
