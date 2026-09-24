<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import KmBotonIcono from '@/components/ui/KmBotonIcono.vue'
import KmCheckbox from '@/components/ui/KmCheckbox.vue'
import type { OpcionParametro } from '@/types'

/**
 * Lista con orden y activación.
 *
 * Hay decisiones de taller que no son un sí/no ni una opción entre varias: por
 * qué fases pasa el trabajo es una **secuencia**, y cada taller la ordena a su
 * manera. Un desplegable no sabe contar eso; una lista que se arrastra, sí.
 *
 * Arrastrar es lo cómodo, pero nunca lo único: cada fila lleva sus flechas y
 * se recorre con el tabulador. Un control que solo funciona con el ratón deja
 * fuera a quien no puede arrastrar, y en un taller también a quien lleva
 * guantes.
 *
 * Las opciones marcadas como `fijo` no se pueden desactivar —recibir y
 * entregar pasan siempre— pero sí moverse.
 */

const props = defineProps<{ opciones: OpcionParametro[]; modelValue: string[] }>()
const emit = defineEmits<{ 'update:modelValue': [string[]] }>()

/** Orden de TODAS las opciones; lo activo es un subconjunto que lo respeta. */
const orden = ref<string[]>([])
const activos = ref<Set<string>>(new Set())

function sincronizar() {
  const restantes = props.opciones.map((o) => o.valor).filter((v) => !props.modelValue.includes(v))
  orden.value = [...props.modelValue, ...restantes]
  activos.value = new Set(props.modelValue)
}

watch(() => props.modelValue, sincronizar, { immediate: true, deep: true })

const filas = computed(() =>
  orden.value
    .map((valor) => props.opciones.find((o) => o.valor === valor))
    .filter((o): o is OpcionParametro => Boolean(o)),
)

function publicar() {
  emit(
    'update:modelValue',
    orden.value.filter((v) => activos.value.has(v)),
  )
}

function alternar(valor: string) {
  const opcion = props.opciones.find((o) => o.valor === valor)
  if (opcion?.fijo) return
  if (activos.value.has(valor)) activos.value.delete(valor)
  else activos.value.add(valor)
  activos.value = new Set(activos.value)
  publicar()
}

function mover(desde: number, hasta: number) {
  if (hasta < 0 || hasta >= orden.value.length || desde === hasta) return
  const copia = [...orden.value]
  const [pieza] = copia.splice(desde, 1)
  copia.splice(hasta, 0, pieza!)
  orden.value = copia
  publicar()
}

// ── Arrastre ─────────────────────────────────────────────────────────────────

const arrastrando = ref<number | null>(null)
const encima = ref<number | null>(null)

function empezar(i: number, evento: DragEvent) {
  arrastrando.value = i
  evento.dataTransfer?.setData('text/plain', String(i))
  if (evento.dataTransfer) evento.dataTransfer.effectAllowed = 'move'
}

function sobre(i: number) {
  encima.value = i
}

function soltar(i: number) {
  if (arrastrando.value !== null) mover(arrastrando.value, i)
  arrastrando.value = null
  encima.value = null
}

function terminar() {
  arrastrando.value = null
  encima.value = null
}
</script>

<template>
  <ul class="flex flex-col gap-1.5">
    <li
      v-for="(o, i) in filas"
      :key="o.valor"
      draggable="true"
      class="ts-fila-orden flex items-center gap-3 rounded-control border px-3 py-2"
      :class="[
        activos.has(o.valor) ? 'border-linea bg-panel' : 'border-dashed border-linea bg-panel-2',
        arrastrando === i ? 'opacity-40' : '',
        encima === i && arrastrando !== null && arrastrando !== i ? 'ts-fila-destino' : '',
      ]"
      @dragstart="empezar(i, $event)"
      @dragover.prevent="sobre(i)"
      @drop.prevent="soltar(i)"
      @dragend="terminar"
    >
      <!-- Asa: dice que la fila se puede coger antes de intentarlo. -->
      <span class="ts-asa shrink-0 cursor-grab text-tenue" aria-hidden="true">
        <svg viewBox="0 0 16 16" class="size-4" fill="currentColor">
          <circle cx="6" cy="4" r="1.3" />
          <circle cx="10" cy="4" r="1.3" />
          <circle cx="6" cy="8" r="1.3" />
          <circle cx="10" cy="8" r="1.3" />
          <circle cx="6" cy="12" r="1.3" />
          <circle cx="10" cy="12" r="1.3" />
        </svg>
      </span>

      <!-- La posición, para poder hablar de «la tercera». -->
      <span
        class="ts-placa w-5 shrink-0 text-center text-[10px]"
        :class="activos.has(o.valor) ? 'text-tinta' : 'text-tenue'"
      >
        {{ activos.has(o.valor) ? orden.filter((v) => activos.has(v)).indexOf(o.valor) + 1 : '—' }}
      </span>

      <KmCheckbox
        :model-value="activos.has(o.valor)"
        :disabled="o.fijo"
        class="min-w-0 flex-1"
        @update:model-value="alternar(o.valor)"
      >
        {{ o.etiqueta }}
        <span v-if="o.fijo" class="ml-1 text-[10px] font-semibold text-tenue">· siempre</span>
        <span v-if="o.descripcion" class="block text-xs font-normal text-tenue">
          {{ o.descripcion }}
        </span>
      </KmCheckbox>

      <!-- El mismo movimiento, sin arrastrar. -->
      <span class="flex shrink-0 gap-0.5">
        <KmBotonIcono
          icono="subir"
          etiqueta="Subir"
          :contexto="o.etiqueta"
          :disabled="i === 0"
          @click="mover(i, i - 1)"
        />
        <KmBotonIcono
          icono="bajar"
          etiqueta="Bajar"
          :contexto="o.etiqueta"
          :disabled="i === filas.length - 1"
          @click="mover(i, i + 1)"
        />
      </span>
    </li>
  </ul>
</template>

<style scoped>
.ts-fila-orden {
  transition:
    border-color 140ms ease,
    background-color 140ms ease,
    opacity 140ms ease;
}

.ts-fila-destino {
  border-color: var(--ts-acero-500);
  box-shadow: inset 0 2px 0 0 var(--ts-acero-500);
}

.ts-asa:active {
  cursor: grabbing;
}

@media (prefers-reduced-motion: reduce) {
  .ts-fila-orden {
    transition: none;
  }
}
</style>
