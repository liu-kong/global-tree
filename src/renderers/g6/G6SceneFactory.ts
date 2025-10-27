/**
 * G6 场景工厂实现
 */

import type { ISceneFactory, IScene, SceneConfig } from '../../core/plugin/types'
import { G6Scene } from './G6Scene'

export class G6SceneFactory implements ISceneFactory {
  create(container: HTMLElement, config?: any): IScene {
    return new G6Scene(container, config)
  }

  getConfig(): SceneConfig {
    return {
      renderer: 'g6',
      toolbar: {
        enabled: true,
        tools: ['select', 'pan', 'zoom', 'lasso-select']
      },
      sidebar: {
        enabled: true,
        panels: ['properties', 'layers', 'data']
      },
      autoLayout: true,
      validation: true,
      layout: {
        type: 'force',
        preset: {
          type: 'force'
        },
        nodeSize: 30,
        nodeSpacing: 100,
        rankSpacing: 100
      },
      modes: {
        default: ['drag-canvas', 'zoom-canvas', 'drag-node'],
        edit: ['drag-node', 'click-select']
      }
    }
  }

  validateConfig(config: any): boolean {
    return config && typeof config === 'object'
  }
}
