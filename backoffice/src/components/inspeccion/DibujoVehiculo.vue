<script setup lang="ts">
import type { MarcaInspeccion, TipoDanio } from '@/types'
import { etiquetaDanio, glifoDanio } from '@/utils/inspeccion'

/**
 * El vehículo visto desde arriba, para marcar encima lo que ya venía roto.
 *
 * Es el dibujo de la hoja de ingreso de toda la vida. Se dibuja a mano en SVG
 * y no se usa una foto por dos razones: una silueta neutra vale para cualquier
 * coche que entre, y un trazo se lee igual en modo claro que en oscuro, que es
 * donde acaba una tablet en una bahía.
 *
 * El marcado no depende del ratón: hay un botón por zona bajo el dibujo que
 * pone la marca en el centro de esa zona, y cada marca puesta es un botón que
 * se puede recorrer con el tabulador y borrar con Supr.
 */

defineProps<{
  marcas: MarcaInspeccion[]
  /** Tipo de daño que se pondrá al tocar el dibujo. */
  herramienta: TipoDanio
  soloLectura?: boolean
}>()

const emit = defineEmits<{
  marcar: [x: number, y: number]
  quitar: [id: string]
}>()

/** Zonas con nombre, para poder marcar sin apuntar con el ratón. */
const zonas = [
  { etiqueta: 'Capó', x: 50, y: 17 },
  { etiqueta: 'Techo', x: 50, y: 50 },
  { etiqueta: 'Maletero', x: 50, y: 84 },
  { etiqueta: 'Lateral izq.', x: 24, y: 50 },
  { etiqueta: 'Lateral der.', x: 76, y: 50 },
  { etiqueta: 'Frontal', x: 50, y: 7 },
  { etiqueta: 'Trasera', x: 50, y: 94 },
]

function alTocar(evento: MouseEvent) {
  const caja = (evento.currentTarget as HTMLElement).getBoundingClientRect()
  const x = ((evento.clientX - caja.left) / caja.width) * 100
  const y = ((evento.clientY - caja.top) / caja.height) * 100
  emit('marcar', Math.round(x * 10) / 10, Math.round(y * 10) / 10)
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <div
      class="ts-dibujo relative mx-auto w-full max-w-[19rem]"
      :class="soloLectura ? '' : 'cursor-crosshair'"
      @click="!soloLectura && alTocar($event)"
    >
      <!-- Planta del vehículo: proporción de una pick-up media, 2:5. -->
      <svg
        viewBox="0 0 200 500"
        class="block w-full text-acero-400"
        fill="none"
        stroke="currentColor"
        stroke-width="3"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <!-- Carrocería -->
        <path
          d="M40 40c0-16 20-26 60-26s60 10 60 26v420c0 16-20 26-60 26s-60-10-60-26z"
          stroke-width="4"
        />
        <!-- Parabrisas y luneta -->
        <path d="M52 150c12-6 30-9 48-9s36 3 48 9l-10 26H62z" />
        <path d="M52 330c12 6 30 9 48 9s36-3 48-9l-10-26H62z" />
        <!-- Techo -->
        <path d="M62 176h76v128H62z" stroke-dasharray="6 5" />
        <!-- Capó y maletero -->
        <path d="M46 60h108M46 96h108" stroke-width="2" />
        <path d="M46 420h108M46 452h108" stroke-width="2" />
        <!-- Ruedas -->
        <rect x="26" y="112" width="18" height="60" rx="5" stroke-width="3" />
        <rect x="156" y="112" width="18" height="60" rx="5" stroke-width="3" />
        <rect x="26" y="330" width="18" height="60" rx="5" stroke-width="3" />
        <rect x="156" y="330" width="18" height="60" rx="5" stroke-width="3" />
        <!-- Espejos -->
        <path d="M40 158l-14 6M160 158l14 6" stroke-width="3" />
        <!-- Faros -->
        <path d="M54 26h24M122 26h24M54 486h24M122 486h24" stroke-width="5" />
      </svg>

      <p class="ts-etiqueta absolute top-1 left-1/2 -translate-x-1/2 text-tenue">Frontal</p>

      <!-- Cada daño anotado es un botón: se recorre con el tabulador. -->
      <button
        v-for="m in marcas"
        :key="m.id"
        type="button"
        class="ts-marca absolute grid -translate-x-1/2 -translate-y-1/2 place-items-center"
        :style="{ left: `${m.x}%`, top: `${m.y}%` }"
        :title="`${etiquetaDanio[m.tipo]}${m.nota ? ` · ${m.nota}` : ''} — quitar`"
        :aria-label="`${etiquetaDanio[m.tipo]}${m.nota ? `, ${m.nota}` : ''}. Pulsa para quitar.`"
        :disabled="soloLectura"
        @click.stop="emit('quitar', m.id)"
        @keydown.delete.prevent="emit('quitar', m.id)"
      >
        {{ glifoDanio[m.tipo] }}
      </button>
    </div>

    <!-- Marcar sin apuntar: el mismo gesto, con el teclado. -->
    <div v-if="!soloLectura" class="flex flex-wrap justify-center gap-1.5">
      <button
        v-for="z in zonas"
        :key="z.etiqueta"
        type="button"
        class="rounded-control border border-linea px-2 py-1 text-[11px] font-semibold text-tenue transition-colors hover:border-acero hover:text-acero"
        @click="emit('marcar', z.x, z.y)"
      >
        + {{ z.etiqueta }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.ts-dibujo {
  /* El papel de la hoja: claro en los dos temas, como el documento real. */
  background-color: var(--ts-surface-2);
  border: 1px solid var(--ts-border);
  border-radius: var(--ts-radio-card);
  padding: 0.75rem;
}

.ts-marca {
  width: 22px;
  height: 22px;
  border-radius: 999px;
  border: 2px solid var(--ts-rojo-500);
  background-color: color-mix(in srgb, var(--ts-rojo-500) 16%, var(--ts-surface));
  color: var(--ts-rojo-texto);
  font-size: 11px;
  font-weight: 800;
  line-height: 1;
  transition: transform 120ms ease;
}

.ts-marca:hover:not(:disabled) {
  transform: translate(-50%, -50%) scale(1.15);
}

.ts-marca:focus-visible {
  outline: none;
  box-shadow: var(--ts-foco);
}

.ts-marca:disabled {
  cursor: default;
}

@media (prefers-reduced-motion: reduce) {
  .ts-marca {
    transition: none;
  }
}
</style>
