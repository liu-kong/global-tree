/**
 * 配置管理器实现
 */

import type { IConfigManager } from '../plugin/types'

export class ConfigManager implements IConfigManager {
  private config = new Map<string, any>()
  private watchers = new Map<string, Set<(value: any, oldValue: any) => void>>()
  private storageKey = 'global-tree-config'

  constructor() {
    this.loadFromStorage()
  }

  get<T = any>(key: string, defaultValue?: T): T {
    const keys = key.split('.')
    let value = this.config.get(keys[0])
    
    for (let i = 1; i < keys.length; i++) {
      if (value && typeof value === 'object') {
        value = value[keys[i]]
      } else {
        return defaultValue as T
      }
    }
    
    return value !== undefined ? value : defaultValue
  }

  set(key: string, value: any): void {
    const keys = key.split('.')
    const oldValue = this.get(key)
    
    if (keys.length === 1) {
      this.config.set(keys[0], value)
    } else {
      let current = this.config.get(keys[0])
      if (!current || typeof current !== 'object') {
        current = {}
        this.config.set(keys[0], current)
      }
      
      for (let i = 1; i < keys.length - 1; i++) {
        if (!current[keys[i]] || typeof current[keys[i]] !== 'object') {
          current[keys[i]] = {}
        }
        current = current[keys[i]]
      }
      
      current[keys[keys.length - 1]] = value
    }
    
    // 触发监听器
    this.notifyWatchers(key, value, oldValue)
    
    // 保存到本地存储
    this.saveToStorage()
  }

  has(key: string): boolean {
    const keys = key.split('.')
    let value = this.config.get(keys[0])
    
    for (let i = 1; i < keys.length; i++) {
      if (value && typeof value === 'object') {
        value = value[keys[i]]
      } else {
        return false
      }
    }
    
    return value !== undefined
  }

  delete(key: string): void {
    const keys = key.split('.')
    const oldValue = this.get(key)
    
    if (keys.length === 1) {
      this.config.delete(keys[0])
    } else {
      let current = this.config.get(keys[0])
      if (!current || typeof current !== 'object') {
        return
      }
      
      for (let i = 1; i < keys.length - 1; i++) {
        if (!current[keys[i]] || typeof current[keys[i]] !== 'object') {
          return
        }
        current = current[keys[i]]
      }
      
      delete current[keys[keys.length - 1]]
    }
    
    // 触发监听器
    this.notifyWatchers(key, undefined, oldValue)
    
    // 保存到本地存储
    this.saveToStorage()
  }

  clear(): void {
    this.config.clear()
    this.watchers.clear()
    this.saveToStorage()
  }

  getAll(): Record<string, any> {
    const result: Record<string, any> = {}
    this.config.forEach((value, key) => {
      result[key] = value
    })
    return result
  }

  watch(key: string, callback: (value: any, oldValue: any) => void): () => void {
    if (!this.watchers.has(key)) {
      this.watchers.set(key, new Set())
    }
    
    this.watchers.get(key)!.add(callback)
    
    // 返回取消监听的函数
    return () => {
      const watchers = this.watchers.get(key)
      if (watchers) {
        watchers.delete(callback)
        if (watchers.size === 0) {
          this.watchers.delete(key)
        }
      }
    }
  }

  private notifyWatchers(key: string, newValue: any, oldValue: any): void {
    // 通知精确匹配的监听器
    const exactWatchers = this.watchers.get(key)
    if (exactWatchers) {
      exactWatchers.forEach(callback => {
        try {
          callback(newValue, oldValue)
        } catch (error) {
          console.error(`Error in config watcher for '${key}':`, error)
        }
      })
    }
    
    // 通知父路径的监听器
    const keys = key.split('.')
    for (let i = 1; i < keys.length; i++) {
      const parentKey = keys.slice(0, i).join('.')
      const parentWatchers = this.watchers.get(parentKey)
      if (parentWatchers) {
        const parentValue = this.get(parentKey)
        parentWatchers.forEach(callback => {
          try {
            callback(parentValue, this.get(parentKey))
          } catch (error) {
            console.error(`Error in config watcher for '${parentKey}':`, error)
          }
        })
      }
    }
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.storageKey)
      if (stored) {
        const data = JSON.parse(stored)
        Object.entries(data).forEach(([key, value]) => {
          this.config.set(key, value)
        })
      }
    } catch (error) {
      console.error('Failed to load config from storage:', error)
    }
  }

  private saveToStorage(): void {
    try {
      const data = this.getAll()
      localStorage.setItem(this.storageKey, JSON.stringify(data))
    } catch (error) {
      console.error('Failed to save config to storage:', error)
    }
  }

  // 批量更新配置
  update(updates: Record<string, any>): void {
    Object.entries(updates).forEach(([key, value]) => {
      this.set(key, value)
    })
  }

  // 获取配置的路径列表
  getKeys(): string[] {
    const keys: string[] = []
    
    const collectKeys = (obj: any, prefix: string = ''): void => {
      if (obj && typeof obj === 'object') {
        Object.entries(obj).forEach(([key, value]) => {
          const fullKey = prefix ? `${prefix}.${key}` : key
          if (value && typeof value === 'object' && !Array.isArray(value)) {
            collectKeys(value, fullKey)
          } else {
            keys.push(fullKey)
          }
        })
      }
    }
    
    this.getAll().forEach((value, key) => {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        collectKeys(value, key)
      } else {
        keys.push(key)
      }
    })
    
    return keys
  }

  // 重置为默认值
  reset(defaults?: Record<string, any>): void {
    this.clear()
    if (defaults) {
      this.update(defaults)
    }
  }
}

// 创建全局配置管理器实例
export const configManager = new ConfigManager()
