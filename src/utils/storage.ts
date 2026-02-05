/**
 * IndexedDB 封装工具
 * 提供 Promise 风格的 API
 */

// 数据库名和版本
const DB_NAME = 'global-tree-db'
const DB_VERSION = 1

// Object Store 名称
const STORES = {
  NODES: 'nodes',
  NUTRIENTS: 'nutrients',
  CONNECTIONS: 'connections',
  SETTINGS: 'settings',
  HISTORY: 'history'
} as const

/**
 * IndexedDB 类
 */
class IndexedDB {
  private db: IDBDatabase | null = null

  /**
   * 打开数据库
   */
  async open(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      // 数据库升级
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // 创建 nodes store
        if (!db.objectStoreNames.contains(STORES.NODES)) {
          const nodeStore = db.createObjectStore(STORES.NODES, {
            keyPath: 'id'
          })
          nodeStore.createIndex('parentId', 'parentId', { unique: false })
          nodeStore.createIndex('type', 'type', { unique: false })
          nodeStore.createIndex('tags', 'tags', { unique: false, multiEntry: true })
          nodeStore.createIndex('createdAt', 'createdAt', { unique: false })
        }

        // 创建 nutrients store
        if (!db.objectStoreNames.contains(STORES.NUTRIENTS)) {
          const nutrientStore = db.createObjectStore(STORES.NUTRIENTS, {
            keyPath: 'id'
          })
          nutrientStore.createIndex('nodeId', 'nodeId', { unique: false })
          nutrientStore.createIndex('type', 'type', { unique: false })
          nutrientStore.createIndex('status', 'status', { unique: false })
          nutrientStore.createIndex('tags', 'tags', { unique: false, multiEntry: true })
          nutrientStore.createIndex('createdAt', 'createdAt', { unique: false })
        }

        // 创建 connections store
        if (!db.objectStoreNames.contains(STORES.CONNECTIONS)) {
          const connStore = db.createObjectStore(STORES.CONNECTIONS, {
            keyPath: 'id'
          })
          connStore.createIndex('sourceId', 'sourceId', { unique: false })
          connStore.createIndex('targetId', 'targetId', { unique: false })
          connStore.createIndex('type', 'type', { unique: false })
        }

        // 创建 settings store
        if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
          db.createObjectStore(STORES.SETTINGS, {
            keyPath: 'key'
          })
        }

        // 创建 history store
        if (!db.objectStoreNames.contains(STORES.HISTORY)) {
          const historyStore = db.createObjectStore(STORES.HISTORY, {
            keyPath: 'id'
          })
          historyStore.createIndex('type', 'type', { unique: false })
          historyStore.createIndex('createdAt', 'createdAt', { unique: false })
        }
      }

      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onerror = () => {
        reject(request.error)
      }

      request.onblocked = () => {
        reject(new Error('Database upgrade blocked. Please close other tabs.'))
      }
    })
  }

  /**
   * 关闭数据库
   */
  close(): void {
    if (this.db) {
      this.db.close()
      this.db = null
    }
  }

  /**
   * 获取单个记录
   */
  async get<T>(storeName: string, key: string): Promise<T | null> {
    const db = await this.ensureDB()
    return this.transaction<T>(db, [storeName], 'readonly', (store) => {
      return store.get(key) as Promise<IDBRequest>
    })
  }

  /**
   * 获取所有记录
   */
  async getAll<T>(storeName: string): Promise<T[]> {
    const db = await this.ensureDB()
    return this.transaction<T[]>(db, [storeName], 'readonly', (store) => {
      return store.getAll() as Promise<IDBRequest>
    })
  }

  /**
   * 添加记录
   */
  async add<T>(storeName: string, value: T): Promise<string> {
    const db = await this.ensureDB()
    return this.transaction<string>(db, [storeName], 'readwrite', (store) => {
      return store.add(value) as Promise<IDBRequest>
    })
  }

  /**
   * 更新记录
   */
  async put<T>(storeName: string, value: T): Promise<string> {
    const db = await this.ensureDB()
    return this.transaction<string>(db, [storeName], 'readwrite', (store) => {
      return store.put(value) as Promise<IDBRequest>
    })
  }

  /**
   * 删除记录
   */
  async delete(storeName: string, key: string): Promise<void> {
    const db = await this.ensureDB()
    return this.transaction<void>(db, [storeName], 'readwrite', (store) => {
      return store.delete(key) as Promise<IDBRequest>
    })
  }

  /**
   * 清空 store
   */
  async clear(storeName: string): Promise<void> {
    const db = await this.ensureDB()
    return this.transaction<void>(db, [storeName], 'readwrite', (store) => {
      return store.clear() as Promise<IDBRequest>
    })
  }

  /**
   * 批量添加
   */
  async batchAdd<T>(storeName: string, values: T[]): Promise<string[]> {
    const db = await this.ensureDB()
    const tx = db.transaction(storeName, 'readwrite')
    const store = tx.objectStore(storeName)

    const promises = values.map((value) => {
      return new Promise<string>((resolve, reject) => {
        const request = store.add(value)
        request.onsuccess = () => resolve(request.result as string)
        request.onerror = () => reject(request.error)
      })
    })

    return Promise.all(promises)
  }

  /**
   * 批量更新
   */
  async batchUpdate<T>(storeName: string, values: T[]): Promise<string[]> {
    const db = await this.ensureDB()
    const tx = db.transaction(storeName, 'readwrite')
    const store = tx.objectStore(storeName)

    const promises = values.map((value) => {
      return new Promise<string>((resolve, reject) => {
        const request = store.put(value)
        request.onsuccess = () => resolve(request.result as string)
        request.onerror = () => reject(request.error)
      })
    })

    return Promise.all(promises)
  }

  /**
   * 批量删除
   */
  async batchDelete(storeName: string, keys: string[]): Promise<void> {
    const db = await this.ensureDB()
    const tx = db.transaction(storeName, 'readwrite')
    const store = tx.objectStore(storeName)

    const promises = keys.map((key) => {
      return new Promise<void>((resolve, reject) => {
        const request = store.delete(key)
        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
      })
    })

    await Promise.all(promises)
  }

  /**
   * 使用索引查询
   */
  async getByIndex<T>(
    storeName: string,
    indexName: string,
    value: any
  ): Promise<T[]> {
    const db = await this.ensureDB()
    const tx = db.transaction(storeName, 'readonly')
    const store = tx.objectStore(storeName)
    const index = store.index(indexName)

    return new Promise<T[]>((resolve, reject) => {
      const request = index.getAll(value)
      request.onsuccess = () => resolve(request.result as T[])
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * 使用索引查询单个值
   */
  async getOneByIndex<T>(
    storeName: string,
    indexName: string,
    value: any
  ): Promise<T | null> {
    const db = await this.ensureDB()
    const tx = db.transaction(storeName, 'readonly')
    const store = tx.objectStore(storeName)
    const index = store.index(indexName)

    return new Promise<T | null>((resolve, reject) => {
      const request = index.get(value)
      request.onsuccess = () => resolve(request.result as T || null)
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * 游标查询（高级）
   */
  async cursor<T>(
    storeName: string,
    callback: (value: T) => boolean | void,
    options?: {
      index?: string
      range?: IDBKeyRange
      direction?: IDBCursorDirection
    }
  ): Promise<T[]> {
    const db = await this.ensureDB()
    const tx = db.transaction(storeName, 'readonly')
    const store = options?.index ? store.index(options.index) : tx.objectStore(storeName)

    return new Promise<T[]>((resolve, reject) => {
      const results: T[] = []
      const request = store.openCursor(options?.range, options?.direction)

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result as IDBCursorWithValue | null
        if (cursor) {
          const shouldContinue = callback(cursor.value)
          results.push(cursor.value)
          if (shouldContinue !== false) {
            cursor.continue()
          } else {
            resolve(results)
          }
        } else {
          resolve(results)
        }
      }

      request.onerror = () => reject(request.error)
    })
  }

  /**
   * 统计记录数
   */
  async count(storeName: string): Promise<number> {
    const db = await this.ensureDB()
    return this.transaction<number>(db, [storeName], 'readonly', (store) => {
      return store.count() as Promise<IDBRequest>
    })
  }

  /**
   * 确保 DB 已打开
   */
  private async ensureDB(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.open()
    }
    return this.db!
  }

  /**
   * 执行事务
   */
  private transaction<T>(
    db: IDBDatabase,
    storeNames: string | string[],
    mode: IDBTransactionMode,
    callback: (store: IDBObjectStore) => IDBRequest
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeNames, mode)
      const store = Array.isArray(storeNames)
        ? tx.objectStore(storeNames[0])
        : tx.objectStore(storeNames)

      const request = callback(store)

      request.onsuccess = () => resolve(request.result as T)
      request.onerror = () => reject(request.error)

      tx.oncomplete = () => {
        // 事务完成
      }

      tx.onerror = () => {
        reject(tx.error)
      }
    })
  }
}

// 单例
let idbInstance: IndexedDB | null = null

/**
 * 获取 IndexedDB 实例
 */
export function getIndexedDB(): IndexedDB {
  if (!idbInstance) {
    idbInstance = new IndexedDB()
  }
  return idbInstance
}

/**
 * 初始化 IndexedDB
 */
export async function initIndexedDB(): Promise<void> {
  const idb = getIndexedDB()
  await idb.open()
}

// 导出 store 名称常量
export { STORES }

/**
 * 使用示例：

// 初始化
await initIndexedDB()

// 基本操作
const idb = getIndexedDB()

// 添加
await idb.add('nodes', node)

// 获取
const node = await idb.get('nodes', 'node-id')

// 更新
await idb.put('nodes', { ...node, title: 'New Title' })

// 删除
await idb.delete('nodes', 'node-id')

// 获取所有
const allNodes = await idb.getAll('nodes')

// 使用索引查询
const reactNodes = await idb.getByIndex('nodes', 'type', 'branch')

// 统计
const count = await idb.count('nodes')
*/
