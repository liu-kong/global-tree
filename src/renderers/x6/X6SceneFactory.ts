/**
 * X6 场景工厂
 */

import type { ISceneFactory, IScene, SceneConfig } from '../../core/plugin/types'
import { X6Scene } from './X6Scene'

export class X6SceneFactory implements ISceneFactory {
  create(container: HTMLElement, config?: any): IScene {
    return new X6Scene(container, config)
  }

  getConfig(): SceneConfig {
    return {
      renderer: {
        type: 'x6',
        config: {}
      },
      toolbar: {
        enabled: true,
        tools: ['select', 'pan', 'zoom', 'add-node', 'add-edge', 'delete']
      },
      sidebar: {
        enabled: true,
        panels: ['properties', 'layers', 'outline']
      },
      autoLayout: false,
      validation: true,
      theme: 'default',
      grid: {
        enabled: true,
        size: 10,
        visible: true
      },
      minimap: {
        enabled: true,
        position: 'bottom-right'
      },
      history: {
        enabled: true,
        maxSteps: 50
      }
    }
  }

  validateConfig(config: any): boolean {
    return config && typeof config === 'object'
  }
}
