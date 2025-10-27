/**
 * X6 渲染器工厂
 */

import type { IRendererFactory, IRenderer, RendererCapabilities } from '../../core/plugin/types'
import { X6Renderer } from './X6Renderer'

export class X6RendererFactory implements IRendererFactory {
  create(config?: any): IRenderer {
    return new X6Renderer(config)
  }

  getCapabilities(): RendererCapabilities {
    return {
      nodeTypes: [
        'rect', 'circle', 'ellipse', 'polygon', 'image', 'text',
        'html', 'svg', 'group', 'path', 'line', 'arrow'
      ],
      edgeTypes: [
        'edge', 'double-edge', 'curved-edge', 'orthogonal-edge', 'shadow-edge'
      ],
      layouts: [
        'dagre', 'force', 'circular', 'grid', 'hierarchical', 'organic'
      ],
      interactions: [
        'select', 'move', 'resize', 'rotate', 'connect', 'pan', 'zoom',
        'keyboard', 'contextmenu', 'tooltip', 'highlight'
      ],
      exports: [
        'png', 'jpg', 'svg', 'pdf', 'json', 'xml'
      ],
      features: [
        'undo-redo', 'minimap', 'clipboard', 'snapline', 'history',
        'virtualization', 'lazy-loading', 'custom-rendering'
      ]
    }
  }

  getDefaultConfig(): any {
    return {
      width: 800,
      height: 600,
      grid: {
        size: 10,
        visible: true,
        type: 'dot',
        args: {
          color: '#e5e5e5',
          thickness: 1
        }
      },
      mousewheel: {
        enabled: true,
        modifiers: ['ctrl', 'meta']
      },
      connecting: {
        router: 'manhattan',
        connector: {
          name: 'rounded',
          args: {
            radius: 8
          }
        },
        anchor: 'center',
        connectionPoint: 'anchor',
        allowBlank: false,
        allowLoop: false,
        allowNode: false,
        allowEdge: false,
        allowMulti: false,
        snap: {
          radius: 20
        },
        createEdge() {
          return new X6Renderer.Edge({
            attrs: {
              line: {
                stroke: '#A2B1C3',
                strokeWidth: 2,
                targetMarker: {
                  name: 'block',
                  width: 12,
                  height: 8
                }
              }
            },
            zIndex: 0
          })
        },
        validateConnection({ targetMagnet }) {
          return !!targetMagnet
        }
      },
      highlighting: {
        magnetAvailable: {
          name: 'stroke',
          args: {
            attrs: {
              fill: '#fff',
              stroke: '#31d0c6',
              strokeWidth: 4
            }
          }
        }
      },
      resizing: true,
      rotating: true,
      selecting: {
        enabled: true,
        rubberband: true,
        movable: true,
        showNodeSelectionBox: true
      },
      snapline: true,
      keyboard: {
        enabled: true
      },
      clipboard: {
        enabled: true
      }
    }
  }

  validateConfig(config: any): boolean {
    return config && typeof config === 'object'
  }
}
