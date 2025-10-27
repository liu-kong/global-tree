/**
 * 日志系统实现
 */

import type { ILogger } from '../plugin/types'

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

export interface LogEntry {
  level: LogLevel
  message: string
  context?: any
  timestamp: Date
  module?: string
}

export class Logger implements ILogger {
  private static instance: Logger
  private logs: LogEntry[] = []
  private maxLogs = 1000
  private currentLevel = LogLevel.INFO
  private handlers: Array<(entry: LogEntry) => void> = []

  private constructor() {}

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger()
    }
    return Logger.instance
  }

  debug(message: string, context?: any): void {
    this.log(LogLevel.DEBUG, message, context)
  }

  info(message: string, context?: any): void {
    this.log(LogLevel.INFO, message, context)
  }

  warn(message: string, context?: any): void {
    this.log(LogLevel.WARN, message, context)
  }

  error(message: string, context?: any): void {
    this.log(LogLevel.ERROR, message, context)
  }

  private log(level: LogLevel, message: string, context?: any, module?: string): void {
    if (level < this.currentLevel) {
      return
    }

    const entry: LogEntry = {
      level,
      message,
      context,
      timestamp: new Date(),
      module
    }

    // 添加到内存日志
    this.logs.push(entry)

    // 限制日志数量
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs)
    }

    // 输出到控制台
    this.outputToConsole(entry)

    // 调用处理器
    this.handlers.forEach(handler => {
      try {
        handler(entry)
      } catch (error) {
        console.error('Error in log handler:', error)
      }
    })
  }

  private outputToConsole(entry: LogEntry): void {
    const timestamp = entry.timestamp.toISOString()
    const prefix = `[${timestamp}] [${this.getLevelName(entry.level)}]`
    
    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(prefix, entry.message, entry.context || '')
        break
      case LogLevel.INFO:
        console.info(prefix, entry.message, entry.context || '')
        break
      case LogLevel.WARN:
        console.warn(prefix, entry.message, entry.context || '')
        break
      case LogLevel.ERROR:
        console.error(prefix, entry.message, entry.context || '')
        break
    }
  }

  private getLevelName(level: LogLevel): string {
    switch (level) {
      case LogLevel.DEBUG:
        return 'DEBUG'
      case LogLevel.INFO:
        return 'INFO'
      case LogLevel.WARN:
        return 'WARN'
      case LogLevel.ERROR:
        return 'ERROR'
      default:
        return 'UNKNOWN'
    }
  }

  // 配置方法
  setLevel(level: LogLevel): void {
    this.currentLevel = level
  }

  getLevel(): LogLevel {
    return this.currentLevel
  }

  setMaxLogs(max: number): void {
    this.maxLogs = max
    if (this.logs.length > max) {
      this.logs = this.logs.slice(-max)
    }
  }

  // 日志处理器
  addHandler(handler: (entry: LogEntry) => void): void {
    this.handlers.push(handler)
  }

  removeHandler(handler: (entry: LogEntry) => void): void {
    const index = this.handlers.indexOf(handler)
    if (index > -1) {
      this.handlers.splice(index, 1)
    }
  }

  // 日志查询
  getLogs(level?: LogLevel, module?: string, limit?: number): LogEntry[] {
    let filtered = this.logs

    if (level !== undefined) {
      filtered = filtered.filter(log => log.level >= level)
    }

    if (module) {
      filtered = filtered.filter(log => log.module === module)
    }

    if (limit) {
      filtered = filtered.slice(-limit)
    }

    return filtered
  }

  getLogCount(level?: LogLevel): number {
    if (level === undefined) {
      return this.logs.length
    }
    return this.logs.filter(log => log.level === level).length
  }

  clearLogs(): void {
    this.logs = []
  }

  // 日志导出
  exportLogs(format: 'json' | 'csv' | 'txt' = 'json'): string {
    switch (format) {
      case 'json':
        return JSON.stringify(this.logs, null, 2)
      
      case 'csv':
        const headers = 'timestamp,level,module,message,context'
        const rows = this.logs.map(log => 
          `${log.timestamp.toISOString()},${this.getLevelName(log.level)},${log.module || ''},"${log.message}","${JSON.stringify(log.context || '')}"`
        ).join('\n')
        return `${headers}\n${rows}`
      
      case 'txt':
        return this.logs.map(log => 
          `[${log.timestamp.toISOString()}] [${this.getLevelName(log.level)}] ${log.module ? `[${log.module}] ` : ''}${log.message}${log.context ? ` ${JSON.stringify(log.context)}` : ''}`
        ).join('\n')
      
      default:
        return ''
    }
  }

  // 创建模块专用日志器
  createModuleLogger(module: string): ILogger {
    return {
      debug: (message: string, context?: any) => this.log(LogLevel.DEBUG, message, context, module),
      info: (message: string, context?: any) => this.log(LogLevel.INFO, message, context, module),
      warn: (message: string, context?: any) => this.log(LogLevel.WARN, message, context, module),
      error: (message: string, context?: any) => this.log(LogLevel.ERROR, message, context, module)
    }
  }

  // 性能日志
  time(label: string): void {
    console.time(label)
    this.debug(`Timer started: ${label}`)
  }

  timeEnd(label: string): void {
    console.timeEnd(label)
    this.debug(`Timer ended: ${label}`)
  }

  // 内存使用日志
  logMemoryUsage(label?: string): void {
    if ((performance as any).memory) {
      const memory = (performance as any).memory
      this.info('Memory usage', {
        label: label || 'Memory',
        used: Math.round(memory.usedJSHeapSize / 1024 / 1024) + ' MB',
        total: Math.round(memory.totalJSHeapSize / 1024 / 1024) + ' MB',
        limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024) + ' MB'
      })
    }
  }

  // 错误统计
  getErrorStats(): { total: number; byMessage: Record<string, number> } {
    const errors = this.logs.filter(log => log.level === LogLevel.ERROR)
    const byMessage: Record<string, number> = {}
    
    errors.forEach(error => {
      const key = error.message
      byMessage[key] = (byMessage[key] || 0) + 1
    })

    return {
      total: errors.length,
      byMessage
    }
  }

  // 日志搜索
  searchLogs(query: string, options?: {
    level?: LogLevel
    module?: string
    startDate?: Date
    endDate?: Date
  }): LogEntry[] {
    let filtered = this.logs

    if (options?.level !== undefined) {
      filtered = filtered.filter(log => log.level >= options.level!)
    }

    if (options?.module) {
      filtered = filtered.filter(log => log.module === options.module)
    }

    if (options?.startDate) {
      filtered = filtered.filter(log => log.timestamp >= options.startDate!)
    }

    if (options?.endDate) {
      filtered = filtered.filter(log => log.timestamp <= options.endDate!)
    }

    // 文本搜索
    const lowerQuery = query.toLowerCase()
    return filtered.filter(log => 
      log.message.toLowerCase().includes(lowerQuery) ||
      (log.context && JSON.stringify(log.context).toLowerCase().includes(lowerQuery))
    )
  }
}

// 创建全局日志实例
export const logger = Logger.getInstance()

// 开发环境下设置调试级别
if ((import.meta as any).env?.DEV) {
  logger.setLevel(LogLevel.DEBUG)
}
