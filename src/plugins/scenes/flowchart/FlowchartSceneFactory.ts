/**
 * 流程图场景工厂实现
 */

import type { IScene, ISceneFactory, SceneConfig } from '../../../core/plugin/types'
import { FlowchartScene } from './FlowchartScene'

export class FlowchartSceneFactory implements ISceneFactory {
  readonly id = 'flowchart-scene-factory'
  readonly name = 'Flowchart Scene Factory'
  readonly version = '1.0.0'

  create(container: HTMLElement, config?: any): IScene {
    return new FlowchartScene(container, config)
  }

  getConfig(): SceneConfig {
    return {
      renderer: { type: 'x6' },
      width: '100%',
      height: '100%',
      grid: {
        size: 10,
        visible: true
      },
      keyboard: true,
      connecting: {
        enabled: true,
        router: 'manhattan',
        connector: 'rounded'
      }
    }
  }

  validateConfig(config: any): boolean {
    return config && typeof config === 'object'
  }
}
