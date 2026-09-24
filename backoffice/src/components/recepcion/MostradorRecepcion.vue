<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import KmBadge from '@/components/ui/KmBadge.vue'
import KmButton from '@/components/ui/KmButton.vue'
import KmCard from '@/components/ui/KmCard.vue'
import KmField from '@/components/ui/KmField.vue'
import KmInput from '@/components/ui/KmInput.vue'
import KmNumero from '@/components/ui/KmNumero.vue'
import KmSelect from '@/components/ui/KmSelect.vue'
import { normalizarPlaca, recepcionService } from '@/services/recepcion.service'
import { useUiStore } from '@/stores/ui.store'
import type {
  ApiError,
  CitaResuelta,
  OrdenResuelta,
  PrioridadOrden,
  VehiculoResuelto,
} from '@/types'
import { desdeHace, formatearKm } from '@/utils/formato'

/**
 * El mostrador: lo que ve el asesor antes de tocar el coche.
 *
 * El hilo es la placa. Arriba, quién dijo que vendría hoy; abajo, quién ya
 * está dentro sin hoja firmada. Y en medio, el caso que más ocurre y que
 * ninguna agenda recoge: alguien que aparece sin avisar. Para ese, el sistema
 * no presupone nada —pregunta la placa y contesta lo que sabe; si no sabe
 * nada, se apunta en el momento, que es cuando el taller se entera.
 */

const props = defineProps<{ localId: string }>()
const emit = defineEmits<{ recibida: [ordenId: string] }>()

const ui = useUiStore()

const esperadas = ref<CitaResuelta[]>([])
const enPiso = ref<OrdenResuelta[]>([])
const cargando = ref(true)

// ── Llega un vehículo ────────────────────────────────────────────────────────
const placa = ref('')
const buscada = ref<string | null>(null)
const conocido = ref<VehiculoResuelto | null>(null)
const buscando = ref(false)
const abriendo = ref(false)
const errores = ref<Record<string, string>>({})

const motivo = ref('')
const kilometraje = ref(0)
const prioridad = ref<PrioridadOrden>('normal')
const nuevoVehiculo = ref({ marca: '', modelo: '', anio: new Date().getFullYear(), color: '' })
const nuevoCliente = ref({ nombre: '', documento: '', telefono: '' })

const placaCompleta = computed(() => /^[A-Z][A-Z0-9]{2}-[0-9][A-Z0-9]{2}$/.test(placa.value))
/** Se ha buscado esta placa exacta y no aparece: toca darla de alta. */
const esDesconocido = computed(() => buscada.value === placa.value && !conocido.value)

async function cargar() {
  if (!props.localId) return
  cargando.value = true
  try {
    const mostrador = await recepcionService.mostrador(props.localId)
    esperadas.value = mostrador.esperadas
    enPiso.value = mostrador.enPiso
  } catch {
    ui.error('No se pudo cargar el mostrador.')
  } finally {
    cargando.value = false
  }
}

onMounted(cargar)
watch(() => props.localId, cargar)

function alEscribirPlaca(valor: string) {
  placa.value = normalizarPlaca(valor)
  if (placa.value !== buscada.value) {
    buscada.value = null
    conocido.value = null
  }
}

async function buscar() {
  if (!placaCompleta.value || buscando.value) return
  buscando.value = true
  errores.value = {}
  try {
    conocido.value = await recepcionService.buscarPlaca(placa.value)
    buscada.value = placa.value
    if (conocido.value) kilometraje.value = conocido.value.kilometraje
  } finally {
    buscando.value = false
  }
}

async function recibirSinCita() {
  abriendo.value = true
  errores.value = {}
  try {
    const orden = await recepcionService.recibir({
      localId: props.localId,
      placa: placa.value,
      vehiculoId: conocido.value?.id,
      clienteId: conocido.value?.clienteId,
      clienteNuevo: conocido.value ? undefined : { ...nuevoCliente.value },
      vehiculoNuevo: conocido.value ? undefined : { ...nuevoVehiculo.value },
      motivo: motivo.value,
      prioridad: prioridad.value,
      kilometraje: kilometraje.value,
    })
    emit('recibida', orden.id)
  } catch (e) {
    const err = e as ApiError
    errores.value = err.campos ?? {}
    ui.error(err.mensaje ?? 'No se pudo abrir la orden.')
  } finally {
    abriendo.value = false
  }
}

async function recibirCita(cita: CitaResuelta) {
  abriendo.value = true
  try {
    const orden = await recepcionService.recibir({
      localId: props.localId,
      placa: cita.vehiculo?.placa ?? '',
      vehiculoId: cita.vehiculoId,
      clienteId: cita.clienteId,
      motivo: cita.motivo,
      kilometraje: cita.vehiculo?.kilometraje ?? 0,
      citaId: cita.id,
    })
    emit('recibida', orden.id)
  } catch (e) {
    ui.error((e as ApiError).mensaje ?? 'No se pudo abrir la orden.')
  } finally {
    abriendo.value = false
  }
}

/** Tarde respecto de la hora que se le dio al cliente. */
function retraso(hora: string): number {
  const [h, m] = hora.split(':').map(Number)
  const ahora = new Date()
  return ahora.getHours() * 60 + ahora.getMinutes() - (h * 60 + m)
}
</script>

<template>
  <div class="flex flex-col gap-5">
    <!-- Llega un vehículo: el caso que ninguna agenda recoge. -->
    <KmCard
      titulo="Entra un vehículo"
      subtitulo="Empieza por la placa. El taller contesta lo que sabe de ella."
    >
      <form class="flex flex-col gap-4" @submit.prevent="buscar">
        <div class="flex flex-wrap items-end gap-3">
          <KmField v-slot="{ id }" label="Placa" :error="errores.placa" class="w-[11rem]">
            <KmInput
              :id="id"
              :model-value="placa"
              class="ts-placa text-center text-lg tracking-[0.12em] uppercase"
              placeholder="ABC-123"
              autocomplete="off"
              @update:model-value="alEscribirPlaca(String($event))"
            />
          </KmField>
          <KmButton type="submit" :disabled="!placaCompleta || buscando" :cargando="buscando">
            Buscar placa
          </KmButton>
        </div>

        <!-- Lo que el taller sabe de esa placa. -->
        <div
          v-if="conocido"
          class="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-card border border-verde bg-panel-2 px-4 py-3"
        >
          <span class="text-sm font-semibold text-tinta">
            {{ conocido.marca }} {{ conocido.modelo }} {{ conocido.anio }}
          </span>
          <span class="text-xs text-tenue">{{ conocido.color ?? 'sin color anotado' }}</span>
          <span class="text-xs text-tenue">
            {{ conocido.cliente?.nombre }} · {{ formatearKm(conocido.kilometraje) }}
          </span>
          <KmBadge tono="verde" class="ms-auto">✓ Ya lo conocemos</KmBadge>
        </div>

        <!-- Vehículo nuevo: se apunta ahora, que es cuando se sabe. -->
        <div v-else-if="esDesconocido" class="flex flex-col gap-4">
          <p class="text-sm text-tenue">
            Placa nueva. Anota lo justo para abrir la orden; la ficha completa se afina después.
          </p>
          <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KmField v-slot="{ id }" label="Marca" :error="errores.marca">
              <KmInput :id="id" v-model="nuevoVehiculo.marca" placeholder="Toyota" />
            </KmField>
            <KmField v-slot="{ id }" label="Modelo">
              <KmInput :id="id" v-model="nuevoVehiculo.modelo" placeholder="Yaris" />
            </KmField>
            <KmField v-slot="{ id }" label="Año" :error="errores.anio">
              <KmNumero :id="id" v-model="nuevoVehiculo.anio" :min="1950" :step="1" />
            </KmField>
            <KmField v-slot="{ id }" label="Color">
              <KmInput :id="id" v-model="nuevoVehiculo.color" placeholder="Plata" />
            </KmField>
          </div>
          <div class="grid gap-4 sm:grid-cols-3">
            <KmField v-slot="{ id }" label="Cliente" :error="errores.nombre">
              <KmInput :id="id" v-model="nuevoCliente.nombre" placeholder="Nombre y apellidos" />
            </KmField>
            <KmField v-slot="{ id }" label="Documento" :error="errores.documento">
              <KmInput :id="id" v-model="nuevoCliente.documento" placeholder="DNI" />
            </KmField>
            <KmField v-slot="{ id }" label="Teléfono">
              <KmInput :id="id" v-model="nuevoCliente.telefono" placeholder="9xx xxx xxx" />
            </KmField>
          </div>
        </div>

        <!-- Con qué viene: vale igual para el conocido y para el nuevo. -->
        <template v-if="buscada">
          <div class="grid gap-4 sm:grid-cols-[1fr_9rem_10rem]">
            <KmField
              v-slot="{ id }"
              label="Con qué viene"
              :error="errores.motivo"
              ayuda="Con las palabras del cliente."
            >
              <KmInput :id="id" v-model="motivo" placeholder="Suena al frenar en frío" />
            </KmField>
            <KmField v-slot="{ id }" label="Odómetro">
              <KmNumero :id="id" v-model="kilometraje" :min="0" :step="100" />
            </KmField>
            <KmField v-slot="{ id }" label="Prioridad">
              <KmSelect
                :id="id"
                v-model="prioridad"
                :opciones="[
                  { valor: 'normal', etiqueta: 'Normal' },
                  { valor: 'alta', etiqueta: 'Alta' },
                  { valor: 'urgente', etiqueta: 'Urgente' },
                ]"
              />
            </KmField>
          </div>
          <div class="flex justify-end">
            <KmButton
              type="button"
              :disabled="!motivo.trim() || abriendo"
              :cargando="abriendo"
              @click="recibirSinCita"
            >
              Abrir orden y dar la vuelta
            </KmButton>
          </div>
        </template>
      </form>
    </KmCard>

    <!-- Quién dijo que vendría hoy. -->
    <KmCard titulo="Citados para hoy" :subtitulo="`${esperadas.length} por llegar`">
      <p v-if="cargando" class="py-8 text-center text-sm text-tenue">Cargando…</p>
      <p v-else-if="!esperadas.length" class="py-8 text-center text-sm text-tenue">
        Nadie más citado para hoy.
      </p>
      <ul v-else class="flex flex-col gap-2">
        <li
          v-for="c in esperadas"
          :key="c.id"
          class="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-card border border-linea bg-panel-2 px-4 py-3"
        >
          <span class="ts-display w-14 text-lg font-semibold text-tinta">{{ c.hora }}</span>
          <span
            class="ts-placa rounded-[4px] border-2 border-tinta px-1.5 py-0.5 text-xs text-tinta"
          >
            {{ c.vehiculo?.placa ?? '—' }}
          </span>
          <span class="text-sm text-tinta">{{ c.vehiculo?.marca }} {{ c.vehiculo?.modelo }}</span>
          <span class="min-w-0 flex-1 truncate text-xs text-tenue">
            {{ c.cliente?.nombre }} · {{ c.motivo }}
          </span>
          <KmBadge v-if="retraso(c.hora) > 15" tono="ambar">
            ⏱ {{ retraso(c.hora) }} min tarde
          </KmBadge>
          <KmButton tamano="sm" :disabled="abriendo" @click="recibirCita(c)">Recibir</KmButton>
        </li>
      </ul>
    </KmCard>

    <!-- Ya están dentro y aún no tienen hoja: es una deuda, no una lista. -->
    <KmCard
      titulo="Dentro sin hoja firmada"
      subtitulo="Mientras no esté firmada, «entró así» no se puede demostrar."
    >
      <p v-if="cargando" class="py-8 text-center text-sm text-tenue">Cargando…</p>
      <p v-else-if="!enPiso.length" class="py-8 text-center text-sm text-verde">
        ✓ Todo lo que está en el taller tiene su hoja firmada.
      </p>
      <ul v-else class="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <li v-for="o in enPiso" :key="o.id">
          <button
            type="button"
            class="flex w-full flex-col rounded-card border border-ambar bg-panel-2 p-4 text-left transition-colors hover:border-acero"
            @click="emit('recibida', o.id)"
          >
            <span class="flex items-center justify-between gap-3">
              <span
                class="ts-placa rounded-[4px] border-2 border-tinta px-1.5 py-0.5 text-xs text-tinta"
              >
                {{ o.vehiculo?.placa ?? '—' }}
              </span>
              <span class="text-xs text-tenue">{{ desdeHace(o.ingreso) }}</span>
            </span>
            <span class="mt-2 text-sm font-medium text-tinta">
              {{ o.vehiculo?.marca }} {{ o.vehiculo?.modelo }}
            </span>
            <span class="text-xs text-tenue">{{ o.cliente?.nombre }} · {{ o.codigo }}</span>
            <span class="mt-3">
              <KmBadge tono="ambar">⚠ Sin hoja firmada</KmBadge>
            </span>
          </button>
        </li>
      </ul>
    </KmCard>
  </div>
</template>
