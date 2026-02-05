/**
 * 图标映射
 * 将所有 emoji 映射到对应的 Lucide Vue 组件
 */

import * as Icons from 'lucide-vue-next'

// 图标映射表
export const IconMap = {
  // 树节点图标
  'tree-root': Icons.TreePine,
  'tree-branch': Icons.TreeDeciduous,
  'tree-leaf': Icons.Leaf,
  'tree-virtual': Icons.Lightbulb,

  // 操作图标
  'edit': Icons.Pencil,
  'delete': Icons.Trash2,
  'close': Icons.X,
  'add': Icons.Plus,

  // 信息图标
  'info': Icons.Info,
  'warning': Icons.AlertTriangle,
  'error': Icons.AlertOctagon,
  'success': Icons.CheckCircle,

  // 描述/文档图标
  'description': Icons.FileText,
  'metadata': Icons.BarChart3,
  'tags': Icons.Tags,
  'link': Icons.Link,
  'library': Icons.Library,

  // 养料类型图标
  'nutrient-web': Icons.Globe,
  'nutrient-markdown': Icons.FileCode,
  'nutrient-pdf': Icons.FileText,
  'nutrient-image': Icons.Image,
  'nutrient-note': Icons.StickyNote,

  // 其他图标
  'star': Icons.Star,
  'star-filled': Icons.Star,
  'calendar': Icons.Calendar,
  'chevron-right': Icons.ChevronRight,
} as const

// 图标组件 props
export interface IconProps {
  name: keyof typeof IconMap
  size?: number
  class?: string
  strokeWidth?: number
}
