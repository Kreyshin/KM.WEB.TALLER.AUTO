<script setup lang="ts">
import type { TonoTaller } from '@/types/ui'

withDefaults(defineProps<{ tono?: TonoTaller; punto?: boolean }>(), {
  tono: 'neutro',
  punto: false,
})

/** Los tonos se resuelven con color-mix en main.css, así valen en ambos temas. */
const clases: Record<TonoTaller, string> = {
  neutro: 'ts-tono-neutro',
  acero: 'ts-tono-acero',
  rojo: 'ts-tono-rojo',
  ambar: 'ts-tono-ambar',
  verde: 'ts-tono-verde',
}
</script>

<template>
  <span
    class="ts-tono inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold"
    :class="clases[tono]"
  >
    <span
      v-if="punto"
      class="size-1.5 shrink-0 rounded-full"
      style="background-color: var(--ts-tono-color)"
      aria-hidden="true"
    />
    <slot />
  </span>
</template>
