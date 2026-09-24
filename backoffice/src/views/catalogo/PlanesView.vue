<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import KmBadge from '@/components/ui/KmBadge.vue'
import KmCard from '@/components/ui/KmCard.vue'
import KmField from '@/components/ui/KmField.vue'
import KmNumero from '@/components/ui/KmNumero.vue'
import { catalogoService } from '@/services/catalogo.service'
import { almacenService } from '@/services/almacen.service'
import { useUiStore } from '@/stores/ui.store'
import type { PlanMantenimiento, Repuesto, Servicio } from '@/types'
import { formatearHoras, formatearKm, formatearSoles } from '@/utils/formato'

/**
 * Planes de mantenimiento: el clásico «servicio de los 10 000».
 *
 * Su valor está en que convierten el kilometraje del vehículo en una
 * recomendación concreta al recibirlo, con su precio ya calculado. El asesor
 * no tiene que acordarse de nada.
 */

const ui = useUiStore()
const planes = ref<PlanMantenimiento[]>([])
const servicios = ref<Servicio[]>([])
const repuestos = ref<Repuesto[]>([])
const cargando = ref(true)

/** Simulador: qué plan toca a un kilometraje dado. */
const kilometraje = ref(30000)
const sugerido = ref<PlanMantenimiento | null>(null)

onMounted(async () => {
  try {
    ;[planes.value, servicios.value, repuestos.value] = await Promise.all([
      catalogoService.planes.listar(),
      catalogoService.servicios.listar(),
      almacenService.listar(),
    ])
    await calcular()
  } catch {
    ui.error('No se pudieron cargar los planes de mantenimiento.')
  } finally {
    cargando.value = false
  }
})

async function calcular() {
  sugerido.value = (await catalogoService.planPara(kilometraje.value)) ?? null
}

watch(kilometraje, calcular)

function serviciosDe(plan: PlanMantenimiento) {
  return plan.servicioIds
    .map((id) => servicios.value.find((s) => s.id === id))
    .filter((s): s is Servicio => Boolean(s))
}

function repuestosDe(plan: PlanMantenimiento) {
  return plan.repuestoIds
    .map((id) => repuestos.value.find((r) => r.id === id))
    .filter((r): r is Repuesto => Boolean(r))
}

/** Precio del paquete: mano de obra por baremo más los repuestos habituales. */
function totalDe(plan: PlanMantenimiento) {
  const obra = serviciosDe(plan).reduce((s, x) => s + x.horas * x.precioHora, 0)
  const piezas = repuestosDe(plan).reduce((s, x) => s + x.precio, 0)
  return obra + piezas
}

function horasDe(plan: PlanMantenimiento) {
  return serviciosDe(plan).reduce((s, x) => s + x.horas, 0)
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <!-- Simulador: el uso real del plan es «me entró un coche con X km». -->
    <KmCard
      titulo="¿Qué le toca a este vehículo?"
      subtitulo="Escribe el kilometraje del ingreso y el sistema dice qué mantenimiento corresponde."
    >
      <div class="flex flex-wrap items-end gap-4">
        <KmField v-slot="{ id }" label="Kilometraje" class="w-56">
          <KmNumero :id="id" v-model="kilometraje" :min="0" :step="1000" />
        </KmField>

        <div v-if="sugerido" class="ts-tono ts-tono-verde rounded-control border px-4 py-3">
          <p class="ts-etiqueta">✓ Corresponde</p>
          <p class="ts-display mt-0.5 text-lg leading-none font-semibold">{{ sugerido.nombre }}</p>
          <p class="mt-1 text-sm tabular-nums">
            {{ formatearSoles(totalDe(sugerido)) }} · {{ formatearHoras(horasDe(sugerido)) }}
          </p>
        </div>
        <div v-else class="ts-tono ts-tono-neutro rounded-control border px-4 py-3 text-sm">
          A ese kilometraje no le toca ningún plan completo.
        </div>
      </div>
    </KmCard>

    <KmCard
      titulo="Planes de mantenimiento"
      subtitulo="Qué incluye cada paquete y cuánto ocupa de taller."
    >
      <p v-if="cargando" class="py-8 text-center text-sm text-tenue">Cargando planes…</p>

      <div v-else class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <article
          v-for="plan in planes"
          :key="plan.id"
          class="flex flex-col rounded-card border border-linea bg-panel-2 p-5"
        >
          <header class="flex items-start justify-between gap-3">
            <div>
              <p class="ts-display text-lg leading-tight font-semibold text-tinta">
                {{ plan.nombre }}
              </p>
              <p class="ts-etiqueta mt-1 text-tenue">cada {{ formatearKm(plan.cadaKm) }}</p>
            </div>
            <KmBadge :tono="plan.activo ? 'verde' : 'neutro'">
              {{ plan.activo ? '✓ Vigente' : '✕ Retirado' }}
            </KmBadge>
          </header>

          <div class="ts-filete my-4" role="presentation" />

          <p class="ts-etiqueta text-tenue">Mano de obra</p>
          <ul class="mt-2 flex flex-col gap-1.5">
            <li
              v-for="s in serviciosDe(plan)"
              :key="s.id"
              class="flex items-baseline justify-between gap-3 text-sm"
            >
              <span class="text-tinta">{{ s.nombre }}</span>
              <span class="shrink-0 text-xs text-tenue tabular-nums">
                {{ formatearHoras(s.horas) }}
              </span>
            </li>
          </ul>

          <template v-if="repuestosDe(plan).length">
            <p class="ts-etiqueta mt-4 text-tenue">Repuestos habituales</p>
            <ul class="mt-2 flex flex-wrap gap-1.5">
              <li v-for="r in repuestosDe(plan)" :key="r.id">
                <KmBadge tono="neutro">{{ r.nombre }}</KmBadge>
              </li>
            </ul>
          </template>

          <footer class="mt-auto flex items-end justify-between gap-3 pt-5">
            <span class="text-xs text-tenue tabular-nums">
              ocupa {{ formatearHoras(horasDe(plan)) }}
            </span>
            <span class="ts-cifra-sm text-tinta">{{ formatearSoles(totalDe(plan)) }}</span>
          </footer>
        </article>
      </div>
    </KmCard>
  </div>
</template>
