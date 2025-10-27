/**
 * 思维导图场景工厂
 */

import type { 
  ISceneFactory, 
  IScene,
  SceneConfig
} from '../../../core/plugin/types'
import { MindmapScene } from './MindmapScene'

export class MindmapSceneFactory implements ISceneFactory {
  readonly id = 'mindmap-scene-factory'
  readonly name = 'Mindmap Scene Factory'
  readonly version = '1.0.0'

  create(container: HTMLElement, config?: any): IScene {
    return new MindmapScene(container, config)
  }

  getConfig(): SceneConfig {
    return {
      renderer: {
        type: 'x6',
        config: {
          grid: {
            visible: false,
            size: 10,
            type: 'dot'
          },
          mousewheel: {
            enabled: true,
            modifiers: ['ctrl', 'meta'],
            factor: 1.1,
            maxScale: 5,
            minScale: 0.1
          },
          connecting: {
            router: {
              name: 'mindmap'
            },
            connector: {
              name: 'mindmap'
            },
            anchor: 'center',
            connectionPoint: 'anchor',
            allowBlank: false,
            snap: {
              radius: 20
            }
          },
          selecting: {
            enabled: true,
            rubberband: true,
            movable: true,
            showNodeSelectionBox: true
          },
          keyboard: true,
          clipboard: true,
          history: true
        }
      },
      toolbar: {
        enabled: true,
        tools: ['zoom-in', 'zoom-out', 'fit-view', 'add-node', 'delete-node']
      },
      sidebar: {
        enabled: true,
        panels: ['outline', 'properties']
      },
      autoLayout: true,
      validation: true,
      mindmap: {
        direction: 'H',
        nodeSpacing: 40,
        levelSpacing: 80,
        animation: true,
        theme: 'default'
      }
    }
  }

  validateConfig(config: any): boolean {
    return config && 
           typeof config === 'object' &&
           typeof config.renderer === 'object'
  }
}
