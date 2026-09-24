<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import KmBadge from '@/components/ui/KmBadge.vue'
import KmCard from '@/components/ui/KmCard.vue'
import { ordenesService } from '@/services/ordenes.service'
import { parametrosService } from '@/services/parametros.service'
import { useLocalStore } from '@/stores/local.store'
import { useUiStore } from '@/stores/ui.store'
import type { Usuario } from '@/types'
import { etiquetaEspecialidad, formatearHoras, iniciales } from '@/utils/formato'

/**
 * Carga de trabajo por técnico.
 *
 * Las horas que se comparan son las **de baremo**, no las del reloj: es el
 * trabajo comprometido, lo que el taller ya vendió. Con eso se decide a quién
 * darle la siguiente orden sin preguntarle a nadie.
 */

interface Carga {
  usuario: Usuario
  ordenes: number
  horas: number
  detenidas: number
}

const localStore = useLocalStore()
const ui = useUiStore()

const cargas = ref<Carga[]>([])
const cargando = ref(true)

/**
 * Jornada de referencia. Sale de la configuración de la vertical: un taller de
 * mecánica rápida y uno de flota no miden la carga con la misma vara.
 */
const JORNADA = computed(() => parametrosService.valor<number>('taller.jornadaHoras'))

const maximo = computed(() => Math.max(JORNADA.value, ...cargas.value.map((c) => c.horas)))

const totalHoras = computed(() => cargas.value.reduce((s, c) => s + c.horas, 0))

/** Sobre la jornada, el reparto está desequilibrado; no es un error, es un aviso. */
function estado(horas: number) {
  if (horas > JORNADA.value) return { tono: 'rojo' as const, texto: '⚠ Sobrecargado' }
  if (horas >= JORNADA.value * 0.75) return { tono: 'ambar' as const, texto: '◑ Jornada llena' }
  if (horas === 0) return { tono: 'neutro' as const, texto: '○ Libre' }
  return { tono: 'verde' as const, texto: '✓ Con margen' }
}

async function cargar() {
  const localId = localStore.localId
  if (!localId) return
  cargando.value = true
  try {
    cargas.value = await ordenesService.cargaPorTecnico(localId)
  } catch {
    ui.error('No se pudo calcular la carga de los técnicos.')
  } finally {
    cargando.value = false
  }
}

onMounted(cargar)
watch(() => localStore.localId, cargar)
</script>

<template>
  <KmCard
    titulo="Carga de técnicos"
    :subtitulo="`${formatearHoras(totalHoras)} de baremo comprometidas · jornada de referencia: ${JORNADA} h por persona`"
  >
    <p v-if="cargando" class="py-8 text-center text-sm text-tenue">Calculando carga…</p>
    <p v-else-if="!cargas.length" class="py-8 text-center text-sm text-tenue">
      No hay técnicos activos en esta sede.
    </p>

    <ul v-else class="flex flex-col gap-5">
      <li v-for="c in cargas" :key="c.usuario.id">
        <div class="flex flex-wrap items-center gap-3">
          <span
            class="ts-display grid size-10 shrink-0 place-items-center rounded-full bg-acero text-sm font-semibold text-white"
            aria-hidden="true"
          >
            {{ iniciales(c.usuario.nombre) }}
          </span>

          <div class="min-w-40 flex-1">
            <p class="text-sm font-medium text-tinta">{{ c.usuario.nombre }}</p>
            <p class="flex flex-wrap gap-1 text-xs text-tenue">
              <span v-for="e in c.usuario.especialidades ?? []" :key="e">
                {{ etiquetaEspecialidad[e] }}
              </span>
            </p>
          </div>

          <span class="ts-cifra text-tinta">{{ formatearHoras(c.horas) }}</span>
          <KmBadge :tono="estado(c.horas).tono">{{ estado(c.horas).texto }}</KmBadge>
        </div>

        <!-- Barra comparativa: la jornada se marca para que se lea de un vistazo. -->
        <div class="relative mt-2 h-2 overflow-hidden rounded-full bg-panel-2">
          <div
            class="h-full rounded-full transition-[width] duration-500"
            :class="c.horas > JORNADA ? 'bg-rojo' : 'bg-acero'"
            :style="{ width: `${(c.horas / maximo) * 100}%` }"
          />
          <span
            class="absolute inset-y-0 w-px bg-tinta/40"
            :style="{ left: `${(JORNADA / maximo) * 100}%` }"
            aria-hidden="true"
          />
        </div>

        <p class="mt-1.5 text-xs text-tenue">
          {{ c.ordenes }} orden{{ c.ordenes === 1 ? '' : 'es' }} a su nombre
          <span v-if="c.detenidas" class="font-semibold text-rojo-texto">
            · {{ c.detenidas }} detenida{{ c.detenidas === 1 ? '' : 's' }}
          </span>
        </p>
      </li>
    </ul>
  </KmCard>
</template>
