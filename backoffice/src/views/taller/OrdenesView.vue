<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import PanelOrden from '@/components/ordenes/PanelOrden.vue'
import KmBadge from '@/components/ui/KmBadge.vue'
import KmBusqueda from '@/components/ui/KmBusqueda.vue'
import KmButton from '@/components/ui/KmButton.vue'
import KmCard from '@/components/ui/KmCard.vue'
import KmDrawer from '@/components/ui/KmDrawer.vue'
import KmField from '@/components/ui/KmField.vue'
import KmInput from '@/components/ui/KmInput.vue'
import KmNumero from '@/components/ui/KmNumero.vue'
import KmSelect from '@/components/ui/KmSelect.vue'
import KmTable from '@/components/ui/KmTable.vue'
import { ordenesService } from '@/services/ordenes.service'
import { vehiculosService } from '@/services/vehiculos.service'
import { useLocalStore } from '@/stores/local.store'
import { useUiStore } from '@/stores/ui.store'
import type { ApiError, OrdenResuelta, PrioridadOrden, VehiculoResuelto } from '@/types'
import type { ColumnaTabla, OpcionSelect } from '@/types/ui'
import { desdeHace, faltanPara, formatearSoles } from '@/utils/formato'
import {
  etiquetaDetencion,
  etiquetaFase,
  etiquetaPrioridad,
  fasesActivas,
  glifoFase,
  tonoFase,
  tonoPrioridad,
} from '@/utils/ordenes'

/**
 * Las órdenes vivas del taller, en modo lista.
 *
 * El tablero responde «¿qué hay en cada bahía?»; esta pantalla responde
 * «¿dónde está la orden de este cliente?». Por eso aquí se busca por placa y
 * se filtra por fase, y la detención se muestra como una columna propia: son
 * dos preguntas distintas sobre la misma orden.
 */

const route = useRoute()
const localStore = useLocalStore()
const ui = useUiStore()

const ordenes = ref<OrdenResuelta[]>([])
const vehiculos = ref<VehiculoResuelto[]>([])
const cargando = ref(true)
const buscar = ref(String(route.query.q ?? ''))
const filtroFase = ref<string | number | undefined>('')
const soloDetenidas = ref(false)

const seleccionada = ref<string | null>(null)
const panelAbierto = ref(false)

const nuevaAbierta = ref(false)
const guardando = ref(false)
const errores = ref<Record<string, string>>({})
const borrador = ref({
  vehiculoId: '',
  motivo: '',
  kilometraje: 0,
  prioridad: 'normal' as PrioridadOrden,
})

const columnas: ColumnaTabla[] = [
  { clave: 'codigo', etiqueta: 'Orden', clase: 'w-32' },
  { clave: 'vehiculo', etiqueta: 'Vehículo', clase: 'w-60' },
  { clave: 'fase', etiqueta: 'Fase', clase: 'w-48' },
  { clave: 'detencion', etiqueta: '¿Avanza?', clase: 'w-52' },
  { clave: 'tecnico', etiqueta: 'Técnico / bahía', clase: 'w-52' },
  { clave: 'promesa', etiqueta: 'Entrega', clase: 'w-36' },
  { clave: 'total', etiqueta: 'Aprobado', clase: 'w-32 text-right' },
  { clave: 'acciones', etiqueta: '', clase: 'w-24 text-right' },
]

const opcionesFase: OpcionSelect[] = [
  { valor: '', etiqueta: 'Todas las fases' },
  ...fasesActivas.map((f) => ({ valor: f, etiqueta: etiquetaFase[f] })),
]

const prioridades: OpcionSelect[] = (['normal', 'alta', 'urgente'] as PrioridadOrden[]).map(
  (p) => ({
    valor: p,
    etiqueta: etiquetaPrioridad[p],
  }),
)

const opcionesVehiculo = computed<OpcionSelect[]>(() =>
  vehiculos.value.map((v) => ({ valor: v.id, etiqueta: `${v.placa} · ${v.marca} ${v.modelo}` })),
)

const normalizar = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

const filtradas = computed(() => {
  const t = normalizar(buscar.value.trim())
  return ordenes.value.filter((o) => {
    if (filtroFase.value && o.fase !== filtroFase.value) return false
    if (soloDetenidas.value && !o.detencion) return false
    if (!t) return true
    const texto = `${o.codigo} ${o.vehiculo?.placa ?? ''} ${o.vehiculo?.marca ?? ''} ${o.cliente?.nombre ?? ''} ${o.motivo}`
    return normalizar(texto).includes(t)
  })
})

const detenidas = computed(() => ordenes.value.filter((o) => o.detencion).length)

async function cargar() {
  const localId = localStore.localId
  if (!localId) return
  cargando.value = true
  try {
    ordenes.value = await ordenesService.enTaller(localId)
  } catch {
    ui.error('No se pudieron cargar las órdenes.')
  } finally {
    cargando.value = false
  }
}

onMounted(async () => {
  vehiculos.value = (await vehiculosService.consultarResueltos({ porPagina: 300 })).items
  await cargar()
})

watch(() => localStore.localId, cargar)

function abrir(orden: OrdenResuelta) {
  seleccionada.value = orden.id
  panelAbierto.value = true
}

function nueva() {
  borrador.value = { vehiculoId: '', motivo: '', kilometraje: 0, prioridad: 'normal' }
  errores.value = {}
  nuevaAbierta.value = true
}

/** Al elegir vehículo se propone su último kilometraje: nunca se parte de cero. */
watch(
  () => borrador.value.vehiculoId,
  (id) => {
    const v = vehiculos.value.find((x) => x.id === id)
    if (v) borrador.value.kilometraje = v.kilometraje
  },
)

async function guardar() {
  errores.value = {}
  const vehiculo = vehiculos.value.find((v) => v.id === borrador.value.vehiculoId)
  if (!vehiculo) {
    errores.value.vehiculoId = 'Elige el vehículo que entra.'
    return
  }
  guardando.value = true
  try {
    await ordenesService.crear({
      localId: localStore.localId ?? '',
      vehiculoId: vehiculo.id,
      clienteId: vehiculo.clienteId,
      motivo: borrador.value.motivo,
      kilometraje: borrador.value.kilometraje,
      prioridad: borrador.value.prioridad,
      fase: 'recepcion',
    })
    ui.exito('Orden abierta. El vehículo ya está en el taller.')
    nuevaAbierta.value = false
    await cargar()
  } catch (e) {
    const err = e as ApiError
    errores.value = err.campos ?? {}
    ui.error(err.mensaje ?? 'No se pudo abrir la orden.')
  } finally {
    guardando.value = false
  }
}
</script>

<template>
  <div class="flex flex-col gap-5">
    <div class="flex flex-wrap items-center gap-3">
      <KmBusqueda v-model="buscar" placeholder="Placa, orden o cliente…" class="min-w-64 flex-1" />
      <KmSelect
        v-model="filtroFase"
        :opciones="opcionesFase"
        etiqueta="Filtrar por fase"
        class="w-56"
      />
      <!-- Atajo al problema del día: lo detenido es lo que hay que desatascar. -->
      <KmButton
        :variante="soloDetenidas ? 'primario' : 'secundario'"
        @click="soloDetenidas = !soloDetenidas"
      >
        ⏸ Detenidas ({{ detenidas }})
      </KmButton>
      <KmButton @click="nueva">Abrir orden</KmButton>
    </div>

    <KmCard
      titulo="Órdenes en el taller"
      :subtitulo="`${filtradas.length} de ${ordenes.length} órdenes vivas en esta sede.`"
      sin-padding
    >
      <KmTable
        :columnas="columnas"
        :filas="filtradas"
        :cargando="cargando"
        mensaje-vacio="No hay órdenes que coincidan."
      >
        <template #col-codigo="{ fila }">
          <span class="ts-placa text-xs text-tinta">{{ fila.codigo }}</span>
          <span class="block text-[11px] text-tenue">{{ desdeHace(fila.ingreso) }}</span>
        </template>

        <template #col-vehiculo="{ fila }">
          <span class="ts-placa text-xs text-tinta">{{ fila.vehiculo?.placa ?? '—' }}</span>
          <span class="block truncate text-xs text-tenue">
            {{ fila.vehiculo?.marca }} {{ fila.vehiculo?.modelo }} · {{ fila.cliente?.nombre }}
          </span>
        </template>

        <template #col-fase="{ fila }">
          <KmBadge :tono="tonoFase[fila.fase]" punto>
            {{ glifoFase[fila.fase] }} {{ etiquetaFase[fila.fase] }}
          </KmBadge>
          <KmBadge
            v-if="fila.prioridad !== 'normal'"
            :tono="tonoPrioridad[fila.prioridad]"
            class="ml-1"
          >
            {{ etiquetaPrioridad[fila.prioridad] }}
          </KmBadge>
        </template>

        <!-- Fase y detención, lado a lado: son dos preguntas distintas. -->
        <template #col-detencion="{ fila }">
          <template v-if="fila.detencion">
            <KmBadge tono="rojo">⏸ {{ etiquetaDetencion[fila.detencion] }}</KmBadge>
            <span v-if="fila.detenidaDesde" class="block text-[11px] text-tenue">
              {{ desdeHace(fila.detenidaDesde) }}
            </span>
          </template>
          <span v-else class="text-xs font-semibold text-verde">✓ Avanza</span>
        </template>

        <template #col-tecnico="{ fila }">
          <span class="text-sm text-tinta">{{ fila.tecnico?.nombre ?? 'Sin asignar' }}</span>
          <span class="block text-xs text-tenue">{{ fila.bahia?.codigo ?? 'sin bahía' }}</span>
        </template>

        <template #col-promesa="{ fila }">
          <span v-if="!fila.promesa" class="text-xs text-tenue">—</span>
          <span
            v-else
            class="text-sm font-semibold tabular-nums"
            :class="faltanPara(fila.promesa).atrasado ? 'text-rojo-texto' : 'text-tinta'"
          >
            {{ faltanPara(fila.promesa).atrasado ? '⚠ ' : '' }}{{ faltanPara(fila.promesa).texto }}
          </span>
        </template>

        <template #col-total="{ fila }">
          <span class="text-sm text-tinta tabular-nums">{{ formatearSoles(fila.total) }}</span>
        </template>

        <template #col-acciones="{ fila }">
          <KmButton variante="fantasma" tamano="sm" @click="abrir(fila)">Ver ficha</KmButton>
        </template>
      </KmTable>
    </KmCard>
  </div>

  <PanelOrden v-model="panelAbierto" :orden-id="seleccionada" @cambio="cargar" />

  <KmDrawer v-model="nuevaAbierta" titulo="Abrir orden de trabajo" ancho="md">
    <div class="flex flex-col gap-4">
      <KmField v-slot="{ id, invalido }" label="Vehículo" :error="errores.vehiculoId" requerido>
        <KmSelect
          :id="id"
          v-model="borrador.vehiculoId"
          :opciones="opcionesVehiculo"
          :invalido="invalido"
          placeholder="Busca por placa"
        />
      </KmField>

      <KmField
        v-slot="{ id, invalido }"
        label="Con qué viene"
        :error="errores.motivo"
        ayuda="Con las palabras del cliente, no las del técnico."
        requerido
      >
        <KmInput
          :id="id"
          v-model="borrador.motivo"
          placeholder="Hace un ruido al frenar en bajada"
          :invalido="invalido"
        />
      </KmField>

      <div class="grid gap-4 sm:grid-cols-2">
        <KmField
          v-slot="{ id }"
          label="Kilometraje de ingreso"
          ayuda="Alimenta el plan de mantenimiento."
        >
          <KmNumero :id="id" v-model="borrador.kilometraje" :min="0" :step="100" />
        </KmField>
        <KmField v-slot="{ id }" label="Prioridad">
          <KmSelect :id="id" v-model="borrador.prioridad" :opciones="prioridades" />
        </KmField>
      </div>
    </div>

    <template #footer>
      <KmButton variante="fantasma" @click="nuevaAbierta = false">Cancelar</KmButton>
      <KmButton :cargando="guardando" @click="guardar">Abrir orden</KmButton>
    </template>
  </KmDrawer>
</template>
