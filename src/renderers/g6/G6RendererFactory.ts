/**
 * G6 渲染器工厂
 */

import type { IRenderer, IRendererFactory, RendererCapabilities } from '../../core/plugin/types'
import { G6Renderer } from './G6Renderer'
import { logger } from '../../core/logger/Logger'

export class G6RendererFactory implements IRendererFactory {
  readonly id = 'g6'
  readonly name = 'G6 Renderer Factory'
  readonly version = '1.0.0'
  
  private renderers = new Map<string, G6Renderer>()

  create(config?: any): IRenderer {
    logger.info('Creating G6 renderer with config:', config)
    
    const renderer = new G6Renderer(config)
    this.renderers.set(renderer.id, renderer)
    
    return renderer
  }

  getCapabilities(): RendererCapabilities {
    return {
      nodeTypes: ['circle', 'rect', 'ellipse', 'diamond', 'triangle', 'star', 'image', 'model'],
      edgeTypes: ['line', 'polyline', 'arc', 'quadratic', 'cubic', 'arrow'],
      layouts: ['force', 'circular', 'radial', 'dagre', 'concentric', 'grid', 'tree'],
      interactions: ['drag-canvas', 'zoom-canvas', 'drag-node', 'click-select', 'brush-select'],
      exports: ['png', 'jpg', 'svg', 'json'],
      features: [
        'graph-analysis',
        'layout-algorithms',
        'animation',
        'interaction',
        'custom-nodes',
        'custom-edges',
        'minimap',
        'toolbar'
      ]
    }
  }

  getDefaultConfig(): any {
    return {
      width: 800,
      height: 600,
      modes: {
        default: ['drag-canvas', 'zoom-canvas', 'drag-node'],
        edit: ['click-select', 'drag-node']
      },
      defaultNode: {
        type: 'circle',
        size: 30,
        style: {
          fill: '#C6E5FF',
          stroke: '#5B8FF9',
          lineWidth: 2
        }
      },
      defaultEdge: {
        type: 'line',
        style: {
          stroke: '#e2e2e2',
          lineWidth: 2
        }
      },
      layout: {
        type: 'force',
        preventOverlap: true,
        nodeSize: 30,
        linkDistance: 100,
        nodeStrength: -50,
        edgeStrength: 0.1
      },
      animate: true,
      renderer: 'canvas',
      fitView: true,
      fitCenter: true
    }
  }

  validateConfig(config: any): boolean {
    return config && typeof config === 'object'
  }

  // G6 特定的工厂方法
  createGraphRenderer(container: HTMLElement, data?: any): IRenderer {
    const config = {
      ...this.getDefaultConfig(),
      container,
      data,
      type: 'graph'
    }
    
    return this.create(config)
  }

  createTreeRenderer(container: HTMLElement, data?: any): IRenderer {
    const config = {
      ...this.getDefaultConfig(),
      container,
      data,
      type: 'tree',
      layout: {
        type: 'dendrogram',
        direction: 'TB',
        nodeSep: 50,
        rankSep: 100
      }
    }
    
    return this.create(config)
  }

  createNetworkRenderer(container: HTMLElement, data?: any): IRenderer {
    const config = {
      ...this.getDefaultConfig(),
      container,
      data,
      type: 'network'
    }
    
    return this.create(config)
  }
}
