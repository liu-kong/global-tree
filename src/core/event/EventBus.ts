/**
 * 事件总线实现
 */

import type { IEventBus, EventHandler } from '../plugin/types'

export class EventBus implements IEventBus {
  private events = new Map<string, EventHandler[]>()
  private onceEvents = new Map<string, EventHandler[]>()
  private history: Array<{ type: string; data: any; timestamp: number }> = []
  private maxHistorySize = 1000

  on(event: string, handler: EventHandler): void {
    if (!this.events.has(event)) {
      this.events.set(event, [])
    }
    this.events.get(event)!.push(handler)
  }

  off(event: string, handler?: EventHandler): void {
    if (!handler) {
      // 移除所有监听器
      this.events.delete(event)
      this.onceEvents.delete(event)
      return
    }

    // 移除特定监听器
    const handlers = this.events.get(event)
    if (handlers) {
      const index = handlers.indexOf(handler)
      if (index > -1) {
        handlers.splice(index, 1)
      }
    }

    const onceHandlers = this.onceEvents.get(event)
    if (onceHandlers) {
      const index = onceHandlers.indexOf(handler)
      if (index > -1) {
        onceHandlers.splice(index, 1)
      }
    }
  }

  emit(event: string, data?: any): void {
    // 记录历史
    this.addToHistory(event, data)

    // 触发普通事件监听器
    const handlers = this.events.get(event)
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data)
        } catch (error) {
          console.error(`Error in event handler for '${event}':`, error)
        }
      })
    }

    // 触发一次性事件监听器
    const onceHandlers = this.onceEvents.get(event)
    if (onceHandlers) {
      onceHandlers.forEach(handler => {
        try {
          handler(data)
        } catch (error) {
          console.error(`Error in once event handler for '${event}':`, error)
        }
      })
      // 清除一次性监听器
      this.onceEvents.delete(event)
    }
  }

  once(event: string, handler: EventHandler): void {
    if (!this.onceEvents.has(event)) {
      this.onceEvents.set(event, [])
    }
    this.onceEvents.get(event)!.push(handler)
  }

  removeAllListeners(event?: string): void {
    if (event) {
      this.events.delete(event)
      this.onceEvents.delete(event)
    } else {
      this.events.clear()
      this.onceEvents.clear()
    }
  }

  private addToHistory(event: string, data: any): void {
    this.history.push({
      type: event,
      data,
      timestamp: Date.now()
    })

    // 限制历史记录大小
    if (this.history.length > this.maxHistorySize) {
      this.history = this.history.slice(-this.maxHistorySize)
    }
  }

  getHistory(): Array<{ type: string; data: any; timestamp: number }> {
    return [...this.history]
  }

  clearHistory(): void {
    this.history = []
  }

  // 获取事件监听器数量
  getListenerCount(event: string): number {
    const handlers = this.events.get(event) || []
    const onceHandlers = this.onceEvents.get(event) || []
    return handlers.length + onceHandlers.length
  }

  // 获取所有事件名称
  getEventNames(): string[] {
    const events = new Set<string>()
    this.events.forEach((_, event) => events.add(event))
    this.onceEvents.forEach((_, event) => events.add(event))
    return Array.from(events)
  }
}

// 创建全局事件总线实例
export const eventBus = new EventBus()
