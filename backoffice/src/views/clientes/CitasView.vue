<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import KmBadge from '@/components/ui/KmBadge.vue'
import KmButton from '@/components/ui/KmButton.vue'
import KmCard from '@/components/ui/KmCard.vue'
import KmDrawer from '@/components/ui/KmDrawer.vue'
import KmFecha from '@/components/ui/KmFecha.vue'
import KmField from '@/components/ui/KmField.vue'
import KmHora from '@/components/ui/KmHora.vue'
import KmInput from '@/components/ui/KmInput.vue'
import KmNumero from '@/components/ui/KmNumero.vue'
import KmSelect from '@/components/ui/KmSelect.vue'
import KmTabs from '@/components/ui/KmTabs.vue'
import { useCarga } from '@/composables/useCarga'
import { citasService } from '@/services/citas.service'
import { parametrosService } from '@/services/parametros.service'
import { vehiculosService } from '@/services/vehiculos.service'
import { useLocalStore } from '@/stores/local.store'
import { useUiStore } from '@/stores/ui.store'
import type { ApiError, CitaResuelta, EstadoCita, VehiculoResuelto } from '@/types'
import type { OpcionSelect, Pestana } from '@/types/ui'
import { fechaLarga } from '@/utils/formato'
import { etiquetaCita, tonoCita } from '@/utils/ordenes'

/**
 * La agenda del taller.
 *
 * Una cita no es una orden: es una promesa de que habrá sitio. Se convierte en
 * orden cuando el vehículo entra de verdad, y por eso aquí importa sobre todo
 * lo que aún no llegó y lo que no vino.
 */

const localStore = useLocalStore()
const ui = useUiStore()

const hoy = new Date().toISOString().slice(0, 10)
const fecha = ref(hoy)
const vista = ref('dia')

const citas = ref<CitaResuelta[]>([])
const vehiculos = ref<VehiculoResuelto[]>([])
const { cargando, refrescando, iniciar, terminar } = useCarga()
const abierto = ref(false)
const guardando = ref(false)
const errores = ref<Record<string, string>>({})

const pestanas: Pestana[] = [
  { valor: 'dia', etiqueta: 'El día' },
  { valor: 'semana', etiqueta: 'Los próximos 7 días' },
]

const borrador = ref({
  vehiculoId: '',
  fecha: hoy,
  hora: '09:00',
  motivo: '',
  duracion: 60,
  notas: '',
})

const opcionesVehiculo = computed<OpcionSelect[]>(() =>
  vehiculos.value.map((v) => ({
    valor: v.id,
    etiqueta: `${v.placa} · ${v.marca} ${v.modelo}`,
  })),
)

/** Agrupa por día para la vista de semana: cada jornada con su cabecera. */
const porDia = computed(() => {
  const mapa = new Map<string, CitaResuelta[]>()
  for (const c of citas.value) {
    const lista = mapa.get(c.fecha) ?? []
    lista.push(c)
    mapa.set(c.fecha, lista)
  }
  return [...mapa.entries()].sort(([a], [b]) => a.localeCompare(b))
})

/** Minutos de bahía comprometidos: la agenda también ocupa taller. */
const minutos = computed(() =>
  citas.value
    .filter((c) => c.estado !== 'cancelada' && c.estado !== 'noVino')
    .reduce((s, c) => s + c.duracion, 0),
)

async function cargar() {
  const localId = localStore.localId
  if (!localId) return
  iniciar()
  try {
    citas.value =
      vista.value === 'dia'
        ? await citasService.delDia(localId, fecha.value)
        : await citasService.proximas(localId, fecha.value, 7)
  } catch {
    ui.error('No se pudo cargar la agenda.')
  } finally {
    terminar()
  }
}

onMounted(async () => {
  vehiculos.value = (await vehiculosService.consultarResueltos({ porPagina: 300 })).items
  await cargar()
})

watch([fecha, vista, () => localStore.localId], cargar)

function abrir() {
  borrador.value = {
    vehiculoId: '',
    fecha: fecha.value,
    hora: '09:00',
    motivo: '',
    // La duración por defecto la fija la configuración de cada taller.
    duracion: parametrosService.valor<number>('agenda.duracionDefecto'),
    notas: '',
  }
  errores.value = {}
  abierto.value = true
}

async function guardar() {
  errores.value = {}
  const vehiculo = vehiculos.value.find((v) => v.id === borrador.value.vehiculoId)
  if (!vehiculo) {
    errores.value.vehiculoId = 'Elige el vehículo.'
    return
  }
  if (!borrador.value.motivo.trim()) {
    errores.value.motivo = 'Anota con qué viene.'
    return
  }
  guardando.value = true
  try {
    await citasService.crear({
      ...borrador.value,
      localId: localStore.localId ?? '',
      clienteId: vehiculo.clienteId,
      estado: 'pendiente',
    })
    ui.exito('Cita agendada.')
    abierto.value = false
    await cargar()
  } catch (e) {
    const err = e as ApiError
    errores.value = err.campos ?? {}
    ui.error(err.mensaje ?? 'No se pudo agendar la cita.')
  } finally {
    guardando.value = false
  }
}

/** Cambio de estado en un clic: es lo que hace recepción todo el día. */
async function marcar(cita: CitaResuelta, estado: EstadoCita) {
  try {
    await citasService.actualizar(cita.id, { estado })
    ui.exito(`${cita.vehiculo?.placa ?? 'La cita'} · ${etiquetaCita[estado].toLowerCase()}.`)
    await cargar()
  } catch {
    ui.error('No se pudo actualizar la cita.')
  }
}
</script>

<template>
  <div
    class="flex flex-col gap-5"
    :class="{ 'ts-refrescando': refrescando }"
    :aria-busy="refrescando"
  >
    <div class="flex flex-wrap items-end justify-between gap-4">
      <KmTabs v-model="vista" :pestanas="pestanas" />
      <div class="flex items-end gap-3">
        <KmField v-slot="{ id }" label="Desde" class="w-48">
          <KmFecha :id="id" v-model="fecha" />
        </KmField>
        <KmButton @click="abrir">Agendar cita</KmButton>
      </div>
    </div>

    <KmCard
      :titulo="vista === 'dia' ? fechaLarga(fecha) : 'Próximos 7 días'"
      :subtitulo="`${citas.length} cita${citas.length === 1 ? '' : 's'} · ${Math.round(minutos / 60)} h de bahía comprometidas`"
    >
      <p v-if="cargando" class="py-10 text-center text-sm text-tenue">Cargando agenda…</p>
      <p v-else-if="!citas.length" class="py-10 text-center text-sm text-tenue">
        No hay nada agendado en este periodo.
      </p>

      <div v-else class="flex flex-col gap-6">
        <section v-for="[dia, delDia] in porDia" :key="dia">
          <h3 v-if="vista === 'semana'" class="ts-titulo-seccion mb-3 text-tinta">
            {{ fechaLarga(dia) }}
          </h3>

          <ul class="flex flex-col gap-2">
            <li
              v-for="c in delDia"
              :key="c.id"
              class="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-control border border-linea bg-panel-2 px-4 py-3"
            >
              <span class="ts-cifra-sm w-16 shrink-0 text-tinta">{{ c.hora }}</span>

              <span class="w-24 shrink-0">
                <span class="ts-placa text-xs text-tinta">{{ c.vehiculo?.placa ?? '—' }}</span>
              </span>

              <span class="min-w-48 flex-1">
                <span class="block text-sm font-medium text-tinta">{{ c.motivo }}</span>
                <span class="block text-xs text-tenue">
                  {{ c.cliente?.nombre ?? '—' }} · {{ c.duracion }} min
                </span>
              </span>

              <KmBadge :tono="tonoCita[c.estado]" punto>{{ etiquetaCita[c.estado] }}</KmBadge>

              <span v-if="c.estado === 'pendiente' || c.estado === 'confirmada'" class="flex gap-2">
                <KmButton
                  v-if="c.estado === 'pendiente'"
                  variante="secundario"
                  tamano="sm"
                  @click="marcar(c, 'confirmada')"
                >
                  Confirmar
                </KmButton>
                <KmButton tamano="sm" @click="marcar(c, 'llego')">Llegó</KmButton>
                <KmButton variante="fantasma" tamano="sm" @click="marcar(c, 'noVino')">
                  No vino
                </KmButton>
              </span>
            </li>
          </ul>
        </section>
      </div>
    </KmCard>
  </div>

  <KmDrawer v-model="abierto" titulo="Agendar cita" ancho="md">
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

      <div class="grid gap-4 sm:grid-cols-3">
        <KmField v-slot="{ id }" label="Fecha">
          <KmFecha :id="id" v-model="borrador.fecha" />
        </KmField>
        <KmField v-slot="{ id, invalido }" label="Hora" :error="errores.hora">
          <KmHora :id="id" v-model="borrador.hora" :invalido="invalido" />
        </KmField>
        <KmField
          v-slot="{ id }"
          label="Duración (min)"
          :error="errores.duracion"
          ayuda="Ocupa bahía."
        >
          <KmNumero :id="id" v-model="borrador.duracion" :min="15" :step="15" />
        </KmField>
      </div>

      <KmField
        v-slot="{ id, invalido }"
        label="Motivo"
        :error="errores.motivo"
        ayuda="Con las palabras del cliente."
        requerido
      >
        <KmInput :id="id" v-model="borrador.motivo" :invalido="invalido" />
      </KmField>

      <KmField v-slot="{ id }" label="Notas">
        <KmInput :id="id" v-model="borrador.notas" />
      </KmField>
    </div>

    <template #footer>
      <KmButton variante="fantasma" @click="abierto = false">Cancelar</KmButton>
      <KmButton :cargando="guardando" @click="guardar">Agendar</KmButton>
    </template>
  </KmDrawer>
</template>
