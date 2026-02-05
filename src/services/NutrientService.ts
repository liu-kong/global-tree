/**
 * 养料服务
 */

import type { Nutrient, ParsedContent } from '../types';
import { NutrientType, NutrientSource, NutrientStatus } from '../types';
import { getIndexedDB, STORES } from '../utils/storage';

export class NutrientService {
  private nutrients: Map<string, Nutrient> = new Map();
  private db: ReturnType<typeof getIndexedDB>;

  constructor() {
    this.db = getIndexedDB();
  }

  /**
   * 加载养料
   */
  async loadNutrients(): Promise<void> {
    try {
      const all = await this.db.getAll<Nutrient>(STORES.NUTRIENTS);
      this.nutrients.clear();
      all.forEach(n => this.nutrients.set(n.id, n));
    } catch (error) {
      console.error('Failed to load nutrients:', error);
    }
  }

  /**
   * 添加养料
   */
  async addNutrient(
    nutrient: Omit<Nutrient, 'id' | 'createdAt' | 'status'>
  ): Promise<string> {
    const id = this.generateId();

    const newNutrient: Nutrient = {
      id,
      ...nutrient,
      status: NutrientStatus.PENDING,
      createdAt: new Date()
    };

    this.nutrients.set(id, newNutrient);

    // 保存到 IndexedDB
    await this.db.add(STORES.NUTRIENTS, newNutrient);

    return id;
  }

  /**
   * 从 URL 添加
   */
  async addFromUrl(
    url: string,
    options: {
      autoProcess?: boolean;
      nodeId?: string;
      tags?: string[];
    } = {}
  ): Promise<string> {
    const id = await this.addNutrient({
      type: NutrientType.WEB_LINK,
      source: NutrientSource.MANUAL,
      rawContent: '',
      url,
      nodeId: options.nodeId,
      tags: options.tags || []
    });

    if (options.autoProcess) {
      // 异步处理
      this.processNutrient(id).catch(console.error);
    }

    return id;
  }

  /**
   * 获取养料
   */
  getNutrient(nutrientId: string): Nutrient | null {
    return this.nutrients.get(nutrientId) || null;
  }

  /**
   * 获取所有养料
   */
  getAllNutrients(): Nutrient[] {
    return Array.from(this.nutrients.values());
  }

  /**
   * 获取节点的养料
   */
  getNutrientsByNode(nodeId: string): Nutrient[] {
    return this.getAllNutrients().filter(n => n.nodeId === nodeId);
  }

  /**
   * 更新养料
   */
  async updateNutrient(nutrientId: string, updates: Partial<Nutrient>): Promise<boolean> {
    const nutrient = this.nutrients.get(nutrientId);
    if (!nutrient) return false;

    Object.assign(nutrient, updates);

    // 保存到 IndexedDB
    await this.db.put(STORES.NUTRIENTS, nutrient);

    return true;
  }

  /**
   * 处理养料（AI 解析）
   */
  async processNutrient(
    nutrientId: string
  ): Promise<Nutrient & { parsed: ParsedContent }> {
    const nutrient = this.nutrients.get(nutrientId);
    if (!nutrient) {
      throw new Error('Nutrient not found');
    }

    // 更新状态为处理中
    nutrient.status = NutrientStatus.PROCESSING;
    await this.db.put(STORES.NUTRIENTS, nutrient);

    try {
      // TODO: 调用 AI 服务解析
      // const aiService = new AIService();
      // const parsed = await aiService.summarize(nutrient.rawContent);

      // 模拟解析结果
      const parsed: ParsedContent = {
        title: nutrient.url ? this.extractTitle(nutrient.url) : '解析的标题',
        summary: '这是 AI 生成的摘要...',
        keyPoints: ['关键点1', '关键点2', '关键点3'],
        concepts: [
          { name: '概念1', definition: '定义', importance: 0.8 }
        ],
        relatedTopics: ['相关主题'],
        confidence: 0.9
      };

      // 更新养料
      nutrient.parsed = parsed;
      nutrient.status = NutrientStatus.COMPLETED;
      nutrient.processedAt = new Date();

      await this.db.put(STORES.NUTRIENTS, nutrient);

      return nutrient as Nutrient & { parsed: ParsedContent };
    } catch (error) {
      nutrient.status = NutrientStatus.FAILED;
      await this.db.put(STORES.NUTRIENTS, nutrient);
      throw error;
    }
  }

  /**
   * 删除养料
   */
  async deleteNutrient(nutrientId: string): Promise<boolean> {
    const deleted = this.nutrients.delete(nutrientId);
    if (deleted) {
      await this.db.delete(STORES.NUTRIENTS, nutrientId);
    }
    return deleted;
  }

  /**
   * 关联到节点
   */
  async attachToNode(nutrientId: string, nodeId: string): Promise<boolean> {
    const nutrient = this.nutrients.get(nutrientId);
    if (!nutrient) return false;

    nutrient.nodeId = nodeId;
    await this.db.put(STORES.NUTRIENTS, nutrient);

    return true;
  }

  /**
   * 搜索养料
   */
  searchNutrients(query: {
    keyword?: string;
    type?: NutrientType;
    tags?: string[];
    nodeId?: string;
    status?: NutrientStatus;
  }): Nutrient[] {
    let result = this.getAllNutrients();

    if (query.keyword) {
      const keyword = query.keyword.toLowerCase();
      result = result.filter(n =>
        n.rawContent.toLowerCase().includes(keyword) ||
        n.parsed?.summary.toLowerCase().includes(keyword) ||
        n.parsed?.title.toLowerCase().includes(keyword)
      );
    }

    if (query.type) {
      result = result.filter(n => n.type === query.type);
    }

    if (query.tags && query.tags.length > 0) {
      result = result.filter(n =>
        query.tags!.some(tag => n.tags.includes(tag))
      );
    }

    if (query.nodeId) {
      result = result.filter(n => n.nodeId === query.nodeId);
    }

    if (query.status) {
      result = result.filter(n => n.status === query.status);
    }

    return result;
  }

  /**
   * 批量处理养料
   */
  async batchProcess(nutrientIds: string[]): Promise<void> {
    for (const id of nutrientIds) {
      await this.processNutrient(id);
    }
  }

  /**
   * 清空所有养料
   */
  async clearAll(): Promise<void> {
    this.nutrients.clear();
    await this.db.clear(STORES.NUTRIENTS);
  }

  /**
   * 提取 URL 标题
   */
  private extractTitle(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname + urlObj.pathname;
    } catch {
      return url;
    }
  }

  /**
   * 生成 ID
   */
  private generateId(): string {
    return `nutrient_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
