/**
 * D3.js 渲染器工厂
 */

import type { IRendererFactory, IRenderer, RendererCapabilities } from '../../core/plugin/types'
import { D3Renderer } from './D3Renderer'
import { logger } from '../../core/logger/Logger'

export class D3RendererFactory implements IRendererFactory {
  create(config?: any): IRenderer {
    logger.info('Creating D3 renderer with config:', config)
    return new D3Renderer(config)
  }

  getCapabilities(): RendererCapabilities {
    return {
      nodeTypes: ['circle', 'rect', 'text', 'image', 'custom'],
      edgeTypes: ['line', 'curve', 'arrow', 'dashed'],
      layouts: ['force', 'tree', 'pack', 'cluster', 'radial'],
      interactions: ['click', 'drag', 'zoom', 'pan', 'hover'],
      exports: ['svg', 'png', 'json'],
      features: [
        'svg-rendering',
        'canvas-rendering',
        'transitions',
        'data-binding',
        'force-simulation',
        'tree-layout',
        'pack-layout',
        'zoom-behavior',
        'drag-behavior',
        'brush-selection',
        'tooltip',
        'legend',
        'axis',
        'scale'
      ]
    }
  }

  getDefaultConfig(): any {
    return {
      width: 800,
      height: 600,
      margin: { top: 20, right: 20, bottom: 20, left: 20 },
      animationDuration: 300,
      enableTransitions: true,
      defaultNodeSize: 8,
      defaultLinkDistance: 50,
      defaultStrength: -100,
      colors: {
        nodes: ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd'],
        edges: ['#999', '#666', '#333'],
        text: '#333',
        background: '#fff'
      },
      interaction: {
        enableZoom: true,
        enablePan: true,
        enableDrag: true,
        enableHover: true,
        enableClick: true
      },
      layout: {
        type: 'force',
        iterations: 300,
        alphaMin: 0.001,
        velocityDecay: 0.4
      }
    }
  }

  validateConfig(config: any): boolean {
    if (!config || typeof config !== 'object') {
      return false
    }

    // 检查必需的配置项
    const required = ['width', 'height']
    for (const key of required) {
      if (typeof config[key] !== 'number' || config[key] <= 0) {
        return false
      }
    }

    return true
  }
}
