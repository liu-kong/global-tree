/**
 * 类型定义统一导出
 */

export * from './tree';
export * from './nutrient';
export * from './ai';

// ============ 通用类型 ============

export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
}

export interface ListResult<T> {
  items: T[];
  pagination: Pagination;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}
