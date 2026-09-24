<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import PanelOrden from '@/components/ordenes/PanelOrden.vue'
import KmBadge from '@/components/ui/KmBadge.vue'
import KmButton from '@/components/ui/KmButton.vue'
import { ordenesService } from '@/services/ordenes.service'
import { useLocalStore } from '@/stores/local.store'
import { useUiStore } from '@/stores/ui.store'
import type { BahiaResuelta, OrdenResuelta } from '@/types'
import { desdeHace, faltanPara, formatearHoras } from '@/utils/formato'
import { etiquetaTipoBahia } from '@/utils/formato'
import {
  accionSiguienteFase,
  etiquetaDetencion,
  etiquetaFase,
  glifoFase,
  tonoFase,
} from '@/utils/ordenes'

/**
 * El tablero de bahías: el taller visto desde la puerta.
 *
 * Es el espejo del KDS de Restaurante —una celda por recurso físico, estado en
 * vivo, pensado para mirarse de lejos— con la unidad cambiada: donde allí hay
 * comandas, aquí hay vehículos ocupando un puesto.
 *
 * Tres reglas de lectura, iguales en toda la plataforma:
 *  1. El estado nunca se comunica solo por color: color + glifo + palabra.
 *  2. Lo detenido se distingue de lo que avanza antes que cualquier otra cosa.
 *  3. La pantalla se refresca sola; nadie debería tener que recargar.
 */

const REFRESCO_MS = 30_000

const localStore = useLocalStore()
const ui = useUiStore()

const bahias = ref<BahiaResuelta[]>([])
const enTaller = ref<OrdenResuelta[]>([])
const cargando = ref(true)
const ahora = ref(Date.now())
const seleccionada = ref<string | null>(null)
const panelAbierto = ref(false)

let temporizador: number | undefined

/** Órdenes vivas que todavía no tienen puesto: la cola de entrada del taller. */
const sinBahia = computed(() => enTaller.value.filter((o) => !o.bahiaId))

const resumen = computed(() => {
  const operativas = bahias.value.filter((b) => b.operativa)
  const ocupadas = operativas.filter((b) => b.ordenTrabajo)
  return {
    ocupadas: ocupadas.length,
    operativas: operativas.length,
    detenidas: ocupadas.filter((b) => b.ordenTrabajo?.detencion).length,
  }
})

async function cargar(silencioso = false) {
  const localId = localStore.localId
  if (!localId) return
  if (!silencioso) cargando.value = true
  try {
    ;[bahias.value, enTaller.value] = await Promise.all([
      ordenesService.tablero(localId),
      ordenesService.enTaller(localId),
    ])
    ahora.value = Date.now()
  } catch {
    if (!silencioso) ui.error('No se pudo cargar el tablero.')
  } finally {
    cargando.value = false
  }
}

onMounted(() => {
  cargar()
  temporizador = window.setInterval(() => cargar(true), REFRESCO_MS)
})

onBeforeUnmount(() => window.clearInterval(temporizador))

watch(
  () => localStore.localId,
  () => cargar(),
)

function abrir(orden: OrdenResuelta) {
  seleccionada.value = orden.id
  panelAbierto.value = true
}

/** Avanzar desde el propio tablero: el técnico no debería abrir una ficha. */
async function avanzar(orden: OrdenResuelta) {
  try {
    await ordenesService.avanzar(orden.id)
    ui.exito(`${orden.codigo} avanzó de fase.`)
    await cargar(true)
  } catch (e) {
    ui.error((e as { mensaje?: string }).mensaje ?? 'No se pudo avanzar la orden.')
  }
}
</script>

<template>
  <div class="flex flex-col gap-5">
    <header class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h2 class="ts-titulo-pagina text-tinta">Tablero de bahías</h2>
        <p class="mt-1 text-sm text-tenue">
          {{ resumen.ocupadas }} de {{ resumen.operativas }} bahías ocupadas
          <span v-if="resumen.detenidas" class="font-semibold text-rojo-texto">
            · {{ resumen.detenidas }} sin avanzar
          </span>
          · se actualiza solo cada 30 s
        </p>
      </div>
      <KmButton variante="secundario" @click="cargar()">Actualizar ahora</KmButton>
    </header>

    <p v-if="cargando" class="py-16 text-center text-sm text-tenue">Cargando el taller…</p>

    <!-- Una celda por bahía, en el orden del plano. -->
    <ul v-else class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      <li
        v-for="b in bahias"
        :key="b.id"
        class="ts-bahia flex min-h-44 flex-col rounded-card border p-4"
        :class="[
          !b.operativa
            ? 'border-dashed border-linea bg-panel-2'
            : b.ordenTrabajo?.detencion
              ? 'ts-bahia-detenida border-rojo-200 bg-panel'
              : b.ordenTrabajo
                ? 'border-linea bg-panel'
                : 'border-dashed border-linea bg-panel-2',
        ]"
      >
        <header class="flex items-center justify-between gap-2">
          <span class="ts-placa text-xs text-tenue">{{ b.codigo }}</span>
          <span class="ts-etiqueta text-tenue">{{ etiquetaTipoBahia[b.tipo] }}</span>
        </header>

        <!-- Bahía fuera de servicio: ocupa sitio en el plano, no en el trabajo. -->
        <div v-if="!b.operativa" class="my-auto py-4 text-center">
          <p class="ts-etiqueta text-ambar">⚠ En mantenimiento</p>
          <p v-if="b.nota" class="mt-1 text-xs text-tenue">{{ b.nota }}</p>
        </div>

        <div v-else-if="!b.ordenTrabajo" class="my-auto py-4 text-center">
          <p class="ts-etiqueta text-tenue">○ Bahía libre</p>
          <p class="mt-1 text-xs text-tenue">{{ b.nombre }}</p>
        </div>

        <template v-else>
          <div class="mt-3 flex items-start justify-between gap-2">
            <span
              class="ts-placa rounded-[4px] border-2 border-tinta px-1.5 py-0.5 text-sm text-tinta"
            >
              {{ b.ordenTrabajo.vehiculo?.placa ?? '—' }}
            </span>
            <span
              v-if="b.ordenTrabajo.promesa"
              class="text-xs font-semibold tabular-nums"
              :class="
                faltanPara(b.ordenTrabajo.promesa, ahora).atrasado
                  ? 'text-rojo-texto'
                  : 'text-tenue'
              "
            >
              {{ faltanPara(b.ordenTrabajo.promesa, ahora).atrasado ? '⚠ ' : ''
              }}{{ faltanPara(b.ordenTrabajo.promesa, ahora).texto }}
            </span>
          </div>

          <p class="mt-1.5 truncate text-sm font-medium text-tinta">
            {{ b.ordenTrabajo.vehiculo?.marca }} {{ b.ordenTrabajo.vehiculo?.modelo }}
          </p>
          <p class="truncate text-xs text-tenue">
            {{ b.ordenTrabajo.tecnico?.nombre ?? 'Sin técnico' }} ·
            {{ formatearHoras(b.ordenTrabajo.horas) }}
          </p>

          <div class="mt-3 flex flex-wrap gap-1.5">
            <KmBadge :tono="tonoFase[b.ordenTrabajo.fase]" punto>
              {{ glifoFase[b.ordenTrabajo.fase] }} {{ etiquetaFase[b.ordenTrabajo.fase] }}
            </KmBadge>
            <KmBadge v-if="b.ordenTrabajo.detencion" tono="rojo">
              ⏸ {{ etiquetaDetencion[b.ordenTrabajo.detencion] }}
            </KmBadge>
          </div>

          <p
            v-if="b.ordenTrabajo.detenidaDesde"
            class="mt-1.5 text-xs font-semibold text-rojo-texto"
          >
            Sin avanzar {{ desdeHace(b.ordenTrabajo.detenidaDesde, ahora) }}
          </p>

          <div class="mt-auto flex flex-wrap gap-2 pt-4">
            <KmButton
              v-if="accionSiguienteFase[b.ordenTrabajo.fase] && !b.ordenTrabajo.detencion"
              tamano="sm"
              @click="avanzar(b.ordenTrabajo)"
            >
              {{ accionSiguienteFase[b.ordenTrabajo.fase] }}
            </KmButton>
            <KmButton variante="fantasma" tamano="sm" @click="abrir(b.ordenTrabajo)">
              Ficha
            </KmButton>
          </div>
        </template>
      </li>
    </ul>

    <!-- La cola: órdenes vivas que aún no tienen puesto asignado. -->
    <section v-if="sinBahia.length">
      <h3 class="ts-titulo-seccion mb-3 text-tinta">Esperando bahía · {{ sinBahia.length }}</h3>
      <ul class="flex flex-wrap gap-2">
        <li v-for="o in sinBahia" :key="o.id">
          <button
            type="button"
            class="flex items-center gap-2.5 rounded-control border border-linea bg-panel px-3 py-2 text-left transition-colors hover:border-acero"
            @click="abrir(o)"
          >
            <span class="ts-placa text-xs text-tinta">{{ o.vehiculo?.placa ?? '—' }}</span>
            <span class="text-xs text-tenue">
              {{ glifoFase[o.fase] }} {{ etiquetaFase[o.fase] }}
            </span>
            <span class="text-xs text-tenue">· {{ desdeHace(o.ingreso, ahora) }}</span>
          </button>
        </li>
      </ul>
    </section>
  </div>

  <PanelOrden v-model="panelAbierto" :orden-id="seleccionada" @cambio="cargar(true)" />
</template>

<style scoped>
/*
 * Lo detenido late muy despacio. Es la única animación del tablero y existe
 * para que la mirada vuelva a ello desde el otro lado de la nave.
 */
.ts-bahia-detenida {
  animation: ts-detenida 5s ease-in-out infinite;
}

@keyframes ts-detenida {
  0%,
  100% {
    box-shadow: 0 0 0 0 rgb(253 38 63 / 0.35);
  }
  50% {
    box-shadow: 0 0 0 4px rgb(253 38 63 / 0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .ts-bahia-detenida {
    animation: none;
    box-shadow: 0 0 0 2px rgb(253 38 63 / 0.35);
  }
}
</style>
