<template>
  <component
    :is="iconComponent"
    :size="size"
    :class="className"
    :stroke-width="strokeWidth"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import * as Icons from 'lucide-vue-next'
import type { IconProps } from './Icons'

const props = withDefaults(defineProps<IconProps>(), {
  size: 20,
  strokeWidth: 2
})

const iconComponent = computed(() => {
  return Icons[props.name.charAt(0).toUpperCase() + props.name.slice(1) as keyof typeof Icons] || Icons.Circle
})

const className = computed(() => props.class || '')
</script>
