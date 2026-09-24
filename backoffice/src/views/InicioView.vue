<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import KmBadge from '@/components/ui/KmBadge.vue'
import KmButton from '@/components/ui/KmButton.vue'
import KmCard from '@/components/ui/KmCard.vue'
import MarcaTorque from '@/components/marca/MarcaTorque.vue'
import { almacenService } from '@/services/almacen.service'
import { citasService } from '@/services/citas.service'
import { ordenesService } from '@/services/ordenes.service'
import { useAuthStore } from '@/stores/auth.store'
import { useLocalStore } from '@/stores/local.store'
import { useUiStore } from '@/stores/ui.store'
import type { CitaResuelta, OrdenResuelta, Repuesto } from '@/types'
import { desdeHace, faltanPara, fechaLarga, formatearHoras, formatearSoles } from '@/utils/formato'
import { etiquetaCita, etiquetaDetencion, etiquetaFase, glifoFase, tonoCita } from '@/utils/ordenes'

/**
 * La portada del sistema: el parte del taller.
 *
 * No es un cuadro de mando de fin de mes; es lo que hay que saber al abrir la
 * persiana. Se organiza por la pregunta que se hace el jefe de taller a las
 * ocho de la mañana, en este orden: qué está parado, qué hay que entregar hoy
 * y qué va a entrar.
 */

const router = useRouter()
const auth = useAuthStore()
const localStore = useLocalStore()
const ui = useUiStore()

type Resumen = Awaited<ReturnType<typeof ordenesService.resumen>>

const resumen = ref<Resumen | null>(null)
const detenidas = ref<OrdenResuelta[]>([])
const enTaller = ref<OrdenResuelta[]>([])
const citas = ref<CitaResuelta[]>([])
const reponer = ref<Repuesto[]>([])
const cargando = ref(true)

const hoy = new Date().toISOString().slice(0, 10)

const saludo = computed(() => {
  const h = new Date().getHours()
  if (h < 12) return 'Buenos días'
  if (h < 19) return 'Buenas tardes'
  return 'Buenas noches'
})

const nombre = computed(() => auth.usuario?.nombre.split(' ')[0] ?? '')

/** Lo prometido para hoy, con lo atrasado primero: es lo que quema. */
const entregasHoy = computed(() =>
  enTaller.value
    .filter((o) => o.promesa?.slice(0, 10) === hoy)
    .sort((a, b) => (a.promesa ?? '').localeCompare(b.promesa ?? '')),
)

const porLlegar = computed(() =>
  citas.value.filter((c) => c.estado === 'pendiente' || c.estado === 'confirmada'),
)

async function cargar() {
  const localId = localStore.localId
  if (!localId) return
  cargando.value = true
  try {
    ;[resumen.value, detenidas.value, enTaller.value, citas.value, reponer.value] =
      await Promise.all([
        ordenesService.resumen(localId),
        ordenesService.detenidas(localId),
        ordenesService.enTaller(localId),
        citasService.delDia(localId, hoy),
        almacenService.bajoMinimo(),
      ])
  } catch {
    ui.error('No se pudo cargar el parte del taller.')
  } finally {
    cargando.value = false
  }
}

onMounted(cargar)
watch(() => localStore.localId, cargar)
</script>

<template>
  <div class="flex flex-col gap-6">
    <!--
      Franja de jornada: el único bloque de color pleno del sistema. Lo que
      dice es siempre lo mismo —cuánto hay dentro y cuánto no avanza— porque
      es la pregunta con la que se abre el taller todos los días.
    -->
    <section class="ts-jornada relative overflow-hidden rounded-card p-7 sm:p-8">
      <MarcaTorque
        :tamano="300"
        class="pointer-events-none absolute right-[-3rem] bottom-[-5rem] opacity-[0.07]"
        aria-hidden="true"
      />

      <div class="relative flex flex-wrap items-end justify-between gap-6">
        <div>
          <p class="ts-etiqueta text-white/60">{{ fechaLarga(hoy) }}</p>
          <h1 class="ts-display mt-1.5 text-3xl leading-none font-semibold text-white">
            {{ saludo }}<span v-if="nombre">, {{ nombre }}</span>
          </h1>
          <p class="mt-2 max-w-md text-sm text-white/70">
            {{
              resumen?.detenidas
                ? `Hay ${resumen.detenidas} ${resumen.detenidas === 1 ? 'orden parada' : 'órdenes paradas'}. Eso es lo primero.`
                : 'Ninguna orden está detenida. El taller avanza entero.'
            }}
          </p>
        </div>

        <dl class="flex flex-wrap gap-x-10 gap-y-4">
          <div>
            <dt class="ts-etiqueta text-white/60">En el taller</dt>
            <dd class="ts-display mt-1 text-4xl leading-none font-semibold text-white tabular-nums">
              {{ resumen?.enTaller ?? '—' }}
            </dd>
          </div>
          <div>
            <dt class="ts-etiqueta text-white/60">Detenidas</dt>
            <dd
              class="ts-display mt-1 text-4xl leading-none font-semibold tabular-nums"
              :class="resumen?.detenidas ? 'text-[#ff5c70]' : 'text-white'"
            >
              {{ resumen?.detenidas ?? '—' }}
            </dd>
          </div>
          <div>
            <dt class="ts-etiqueta text-white/60">Listas</dt>
            <dd class="ts-display mt-1 text-4xl leading-none font-semibold text-white tabular-nums">
              {{ resumen?.listas ?? '—' }}
            </dd>
          </div>
          <div>
            <dt class="ts-etiqueta text-white/60">Bahías</dt>
            <dd class="ts-display mt-1 text-4xl leading-none font-semibold text-white tabular-nums">
              {{ resumen?.ocupadas ?? '—'
              }}<span class="text-xl text-white/50"> /{{ resumen?.operativas ?? '—' }}</span>
            </dd>
          </div>
        </dl>
      </div>
    </section>

    <div class="grid gap-6 xl:grid-cols-3">
      <!-- 1. Lo que no avanza. -->
      <KmCard
        titulo="Lo que no avanza"
        :subtitulo="
          detenidas.length
            ? 'Ordenado por tiempo parado: lo de arriba es lo que más cuesta.'
            : 'Nada bloqueado ahora mismo.'
        "
      >
        <template #acciones>
          <KmButton
            v-if="detenidas.length"
            variante="fantasma"
            tamano="sm"
            @click="router.push({ name: 'detenidas' })"
          >
            Ver todas
          </KmButton>
        </template>

        <p v-if="cargando" class="py-6 text-center text-sm text-tenue">Cargando…</p>
        <p v-else-if="!detenidas.length" class="py-6 text-center text-sm text-verde">
          ✓ Todas las órdenes avanzan.
        </p>
        <ul v-else class="flex flex-col gap-2.5">
          <li
            v-for="o in detenidas.slice(0, 5)"
            :key="o.id"
            class="flex items-start gap-3 rounded-control border border-linea bg-panel-2 px-3 py-2.5"
          >
            <span class="ts-placa mt-0.5 text-xs text-tinta">{{ o.vehiculo?.placa ?? '—' }}</span>
            <span class="min-w-0 flex-1">
              <span class="block text-sm text-tinta">
                {{ o.detencion ? etiquetaDetencion[o.detencion] : '' }}
              </span>
              <span class="block truncate text-xs text-tenue">
                {{ o.notaDetencion ?? o.motivo }}
              </span>
            </span>
            <span class="shrink-0 text-xs font-semibold text-rojo-texto">
              {{ o.detenidaDesde ? desdeHace(o.detenidaDesde) : '' }}
            </span>
          </li>
        </ul>
      </KmCard>

      <!-- 2. Lo prometido para hoy. -->
      <KmCard
        titulo="Se entrega hoy"
        :subtitulo="`${entregasHoy.length} vehículo${entregasHoy.length === 1 ? '' : 's'} con hora comprometida.`"
      >
        <template #acciones>
          <KmButton variante="fantasma" tamano="sm" @click="router.push({ name: 'ordenes' })">
            Ver órdenes
          </KmButton>
        </template>

        <p v-if="cargando" class="py-6 text-center text-sm text-tenue">Cargando…</p>
        <p v-else-if="!entregasHoy.length" class="py-6 text-center text-sm text-tenue">
          Hoy no hay nada prometido.
        </p>
        <ul v-else class="flex flex-col gap-2.5">
          <li
            v-for="o in entregasHoy"
            :key="o.id"
            class="flex items-center gap-3 rounded-control border border-linea bg-panel-2 px-3 py-2.5"
          >
            <span class="ts-placa text-xs text-tinta">{{ o.vehiculo?.placa ?? '—' }}</span>
            <span class="min-w-0 flex-1">
              <KmBadge tono="neutro">{{ glifoFase[o.fase] }} {{ etiquetaFase[o.fase] }}</KmBadge>
            </span>
            <span
              class="shrink-0 text-xs font-semibold tabular-nums"
              :class="faltanPara(o.promesa!).atrasado ? 'text-rojo-texto' : 'text-tinta'"
            >
              {{ faltanPara(o.promesa!).atrasado ? '⚠ ' : '' }}{{ faltanPara(o.promesa!).texto }}
            </span>
          </li>
        </ul>
      </KmCard>

      <!-- 3. Lo que va a entrar. -->
      <KmCard
        titulo="Va a entrar hoy"
        :subtitulo="`${porLlegar.length} cita${porLlegar.length === 1 ? '' : 's'} por llegar.`"
      >
        <template #acciones>
          <KmButton variante="fantasma" tamano="sm" @click="router.push({ name: 'citas' })">
            Ver agenda
          </KmButton>
        </template>

        <p v-if="cargando" class="py-6 text-center text-sm text-tenue">Cargando…</p>
        <p v-else-if="!citas.length" class="py-6 text-center text-sm text-tenue">
          Hoy no hay citas agendadas.
        </p>
        <ul v-else class="flex flex-col gap-2.5">
          <li
            v-for="c in citas"
            :key="c.id"
            class="flex items-center gap-3 rounded-control border border-linea bg-panel-2 px-3 py-2.5"
          >
            <span class="ts-cifra-sm w-16 shrink-0 text-tinta">{{ c.hora }}</span>
            <span class="min-w-0 flex-1">
              <span class="block truncate text-sm text-tinta">{{ c.motivo }}</span>
              <span class="ts-placa block text-[11px] text-tenue">
                {{ c.vehiculo?.placa ?? '—' }}
              </span>
            </span>
            <KmBadge :tono="tonoCita[c.estado]">{{ etiquetaCita[c.estado] }}</KmBadge>
          </li>
        </ul>
      </KmCard>
    </div>

    <div class="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <!-- Carga vendida: lo que el taller ya se comprometió a producir. -->
      <KmCard
        titulo="Trabajo comprometido"
        subtitulo="Horas de baremo que ya están vendidas y aún no salieron por la puerta."
      >
        <div class="flex flex-wrap items-end gap-x-10 gap-y-5">
          <div>
            <p class="ts-etiqueta text-tenue">Horas en taller</p>
            <p class="ts-display mt-1 text-4xl leading-none font-semibold text-tinta tabular-nums">
              {{ resumen ? formatearHoras(resumen.horasComprometidas) : '—' }}
            </p>
          </div>
          <div>
            <p class="ts-etiqueta text-tenue">Ocupación de bahías</p>
            <p class="ts-display mt-1 text-4xl leading-none font-semibold text-tinta tabular-nums">
              {{ resumen?.ocupacion ?? '—' }}<span class="text-xl text-tenue">%</span>
            </p>
          </div>
          <div v-if="resumen?.sinAprobar">
            <p class="ts-etiqueta text-tenue">Sin aprobar</p>
            <p class="ts-display mt-1 text-4xl leading-none font-semibold text-ambar tabular-nums">
              {{ resumen.sinAprobar }}
            </p>
            <p class="mt-1 text-xs text-tenue">Presupuestos esperando al cliente.</p>
          </div>
        </div>

        <div class="ts-filete my-5" role="presentation" />

        <ul class="flex flex-wrap gap-x-6 gap-y-2">
          <li
            v-for="(cantidad, fase) in resumen?.porFase ?? {}"
            :key="fase"
            class="text-sm text-tenue"
          >
            <span class="ts-cifra-sm mr-1.5 text-tinta">{{ cantidad }}</span>
            {{ etiquetaFase[fase] }}
          </li>
        </ul>
      </KmCard>

      <!-- Almacén: la causa más común de que algo se detenga. -->
      <KmCard
        titulo="Hay que reponer"
        subtitulo="La falta de una pieza es la causa más común de una orden parada."
      >
        <template #acciones>
          <KmButton variante="fantasma" tamano="sm" @click="router.push({ name: 'repuestos' })">
            Ver almacén
          </KmButton>
        </template>

        <p v-if="cargando" class="py-6 text-center text-sm text-tenue">Cargando…</p>
        <p v-else-if="!reponer.length" class="py-6 text-center text-sm text-verde">
          ✓ Nada por debajo del mínimo.
        </p>
        <ul v-else class="flex flex-col gap-2">
          <li
            v-for="r in reponer"
            :key="r.id"
            class="flex items-center justify-between gap-3 rounded-control border border-linea bg-panel-2 px-3 py-2"
          >
            <span class="min-w-0">
              <span class="block truncate text-sm text-tinta">{{ r.nombre }}</span>
              <span class="ts-placa block text-[11px] text-tenue">{{ r.codigo }}</span>
            </span>
            <KmBadge :tono="r.stock === 0 ? 'rojo' : 'ambar'">
              {{ r.stock === 0 ? '✕ Sin stock' : `⚠ ${r.stock} / ${r.stockMinimo}` }}
            </KmBadge>
          </li>
        </ul>

        <p v-if="reponer.length" class="mt-4 text-xs text-tenue">
          Valor a reponer:
          <strong class="text-tinta">
            {{ formatearSoles(reponer.reduce((s, r) => s + r.costo * r.stockMinimo, 0)) }}
          </strong>
        </p>
      </KmCard>
    </div>
  </div>
</template>

<style scoped>
/* Azul marino de la casa, con la veta roja del isotipo al fondo. */
.ts-jornada {
  background:
    radial-gradient(38rem 20rem at 88% 120%, rgb(253 38 63 / 0.35) 0%, transparent 65%),
    linear-gradient(135deg, #18293f 0%, #0b1421 100%);
}
</style>
