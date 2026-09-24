<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import PanelOrden from '@/components/ordenes/PanelOrden.vue'
import KmBadge from '@/components/ui/KmBadge.vue'
import KmButton from '@/components/ui/KmButton.vue'
import KmCard from '@/components/ui/KmCard.vue'
import { useCarga } from '@/composables/useCarga'
import { ordenesService } from '@/services/ordenes.service'
import { useLocalStore } from '@/stores/local.store'
import { useUiStore } from '@/stores/ui.store'
import type { MotivoDetencion, OrdenResuelta } from '@/types'
import { desdeHace, formatearSoles } from '@/utils/formato'
import {
  etiquetaDetencion,
  etiquetaFase,
  glifoFase,
  motivosDetencion,
  salidaDetencion,
} from '@/utils/ordenes'

/**
 * Lo que ocupa taller y no avanza.
 *
 * Es la pantalla que justifica separar fase y detención: aquí no importa en
 * qué punto del trabajo están las órdenes, sino qué las bloquea y a quién hay
 * que llamar. Por eso se agrupan por motivo y se ordenan por antigüedad: lo
 * que lleva más tiempo parado es lo que más cuesta.
 */

const localStore = useLocalStore()
const ui = useUiStore()

const ordenes = ref<OrdenResuelta[]>([])
const { cargando, refrescando, iniciar, terminar } = useCarga()
const seleccionada = ref<string | null>(null)
const panelAbierto = ref(false)

/** Un grupo por motivo, con los más antiguos arriba. Vacíos no se pintan. */
const grupos = computed(() =>
  motivosDetencion
    .map((motivo: MotivoDetencion) => ({
      motivo,
      ordenes: ordenes.value
        .filter((o) => o.detencion === motivo)
        .sort((a, b) => (a.detenidaDesde ?? '').localeCompare(b.detenidaDesde ?? '')),
    }))
    .filter((g) => g.ordenes.length),
)

/** Dinero parado: el argumento que mueve a quien decide. */
const inmovilizado = computed(() => ordenes.value.reduce((s, o) => s + o.total, 0))

async function cargar() {
  const localId = localStore.localId
  if (!localId) return
  iniciar()
  try {
    ordenes.value = await ordenesService.detenidas(localId)
  } catch {
    ui.error('No se pudieron cargar las órdenes detenidas.')
  } finally {
    terminar()
  }
}

onMounted(cargar)
watch(() => localStore.localId, cargar)

function abrir(orden: OrdenResuelta) {
  seleccionada.value = orden.id
  panelAbierto.value = true
}

async function reanudar(orden: OrdenResuelta) {
  try {
    await ordenesService.reanudar(orden.id)
    ui.exito(`${orden.codigo} reanudada.`)
    await cargar()
  } catch {
    ui.error('No se pudo reanudar la orden.')
  }
}
</script>

<template>
  <div
    class="ts-operacion flex flex-col gap-5"
    :class="{ 'ts-refrescando': refrescando }"
    :aria-busy="refrescando"
  >
    <KmCard
      titulo="Órdenes detenidas"
      :subtitulo="`${ordenes.length} órdenes ocupan sitio sin avanzar · ${formatearSoles(inmovilizado)} inmovilizados`"
    >
      <p v-if="cargando" class="py-8 text-center text-sm text-tenue">Cargando…</p>
      <p v-else-if="!ordenes.length" class="py-10 text-center text-sm text-verde">
        ✓ No hay ninguna orden detenida. Todo el taller avanza.
      </p>
      <p v-else class="text-sm text-tenue">
        Detener no es retroceder: cada orden sigue en su fase y volverá a ella. Lo que hace falta
        para desbloquearla va escrito en cada grupo.
      </p>
    </KmCard>

    <section v-for="grupo in grupos" :key="grupo.motivo">
      <header class="mb-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2 class="ts-titulo-seccion text-tinta">‖ {{ etiquetaDetencion[grupo.motivo] }}</h2>
        <span class="text-sm text-tenue">{{ salidaDetencion[grupo.motivo] }}</span>
        <span class="ts-etiqueta ml-auto text-tenue">
          {{ grupo.ordenes.length }} {{ grupo.ordenes.length === 1 ? 'orden' : 'órdenes' }}
        </span>
      </header>

      <ul class="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <li
          v-for="o in grupo.ordenes"
          :key="o.id"
          class="flex flex-col rounded-card border border-linea bg-panel p-4"
        >
          <div class="flex items-start justify-between gap-3">
            <div>
              <span
                class="ts-placa rounded-[4px] border-2 border-tinta px-1.5 py-0.5 text-xs text-tinta"
              >
                {{ o.vehiculo?.placa ?? '—' }}
              </span>
              <p class="mt-1.5 text-sm font-medium text-tinta">
                {{ o.vehiculo?.marca }} {{ o.vehiculo?.modelo }}
              </p>
              <p class="text-xs text-tenue">{{ o.cliente?.nombre ?? '—' }}</p>
            </div>
            <!-- La antigüedad es el dato que ordena la acción. -->
            <span class="ts-cifra-sm shrink-0 text-right text-rojo-texto">
              {{ o.detenidaDesde ? desdeHace(o.detenidaDesde) : '—' }}
            </span>
          </div>

          <p v-if="o.notaDetencion" class="mt-3 text-sm text-tinta">{{ o.notaDetencion }}</p>

          <div class="mt-3 flex flex-wrap items-center gap-2">
            <KmBadge tono="neutro">{{ glifoFase[o.fase] }} {{ etiquetaFase[o.fase] }}</KmBadge>
            <span class="text-xs text-tenue tabular-nums">{{ formatearSoles(o.total) }}</span>
            <span v-if="o.tecnico" class="text-xs text-tenue">· {{ o.tecnico.nombre }}</span>
          </div>

          <div class="mt-4 flex gap-2 pt-1">
            <KmButton @click="reanudar(o)">Ya se resolvió</KmButton>
            <KmButton variante="fantasma" @click="abrir(o)">Ver ficha</KmButton>
          </div>
        </li>
      </ul>
    </section>
  </div>

  <PanelOrden v-model="panelAbierto" :orden-id="seleccionada" @cambio="cargar" />
</template>
