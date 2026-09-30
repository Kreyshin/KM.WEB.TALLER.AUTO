<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import ControlTenencia from '@/components/recepcion/ControlTenencia.vue'
import KmBadge from '@/components/ui/KmBadge.vue'
import KmButton from '@/components/ui/KmButton.vue'
import KmCard from '@/components/ui/KmCard.vue'
import KmFecha from '@/components/ui/KmFecha.vue'
import KmField from '@/components/ui/KmField.vue'
import KmHora from '@/components/ui/KmHora.vue'
import KmInput from '@/components/ui/KmInput.vue'
import KmNumero from '@/components/ui/KmNumero.vue'
import KmSelect from '@/components/ui/KmSelect.vue'
import { citasService } from '@/services/citas.service'
import { parametrosService } from '@/services/parametros.service'
import { recepcionService } from '@/services/recepcion.service'
import { tenenciaService } from '@/services/tenencia.service'
import { useAuthStore } from '@/stores/auth.store'
import { useLocalStore } from '@/stores/local.store'
import { useUiStore } from '@/stores/ui.store'
import type {
  ApiError,
  PrioridadOrden,
  RelacionTenencia,
  TipoDocumento,
  VehiculoResuelto,
} from '@/types'
import type { OpcionSelect } from '@/types/ui'
import { formatearKm } from '@/utils/formato'
import { esPlacaValida, normalizarPlaca } from '@/utils/placa'

/**
 * Matrícula: el cliente y su vehículo, en una sola pantalla.
 *
 * Antes esto eran tres. Para agendar hacía falta un vehículo; para tener un
 * vehículo, un cliente; y el asesor daba el rodeo con el cliente esperando al
 * teléfono. Pero el taller no necesita tres altas, necesita dos datos —**DNI y
 * placa**—, que son los que lo cubren legalmente, y saber qué pasa después.
 *
 * Por eso la pantalla acaba en tres puertas y no en un botón de guardar: el
 * coche está aquí, vendrá otro día, o de momento solo queda apuntado. Las tres
 * ocurren, y ninguna debería obligar a cambiar de pantalla.
 *
 * El orden es el del mostrador: primero la placa, porque es lo que el taller
 * pregunta y lo que sabe contestar.
 */

const router = useRouter()
const auth = useAuthStore()
const localStore = useLocalStore()
const ui = useUiStore()

const hoy = new Date().toISOString().slice(0, 10)

const placa = ref('')
const buscada = ref<string | null>(null)
const conocido = ref<VehiculoResuelto | null>(null)
const buscando = ref(false)
const guardando = ref(false)
const errores = ref<Record<string, string>>({})

const tiposDocumento: OpcionSelect[] = [
  { valor: 'dni', etiqueta: 'DNI' },
  { valor: 'ce', etiqueta: 'Carné de extranjería' },
  { valor: 'ruc', etiqueta: 'RUC' },
]

const cliente = ref({
  tipoDocumento: 'dni' as TipoDocumento,
  documento: '',
  nombre: '',
  telefono: '',
  email: '',
})
const vehiculo = ref({ marca: '', modelo: '', anio: new Date().getFullYear(), color: '' })
const kilometraje = ref(0)

// ── Qué pasa después ─────────────────────────────────────────────────────────
const motivo = ref('')
const prioridad = ref<PrioridadOrden>('normal')
const cita = ref({ fecha: hoy, hora: '09:00', duracion: 60 })

const controla = computed(
  () => parametrosService.valor<string>('recepcion.verificarTenencia') !== 'no',
)
const exigeRespaldo = computed(() => parametrosService.valor<boolean>('recepcion.respaldoTerceros'))
const tenencia = ref({
  relacion: '' as RelacionTenencia | '',
  respaldo: '',
  nota: '',
  recordar: false,
})
const conocida = ref<RelacionTenencia | null>(null)

const placaCompleta = computed(() => esPlacaValida(placa.value))

/**
 * Un botón apagado sin explicación no dice qué falta: quien escribe una placa
 * que el sistema no acepta se queda mirando, y lo que concluye es que la
 * pantalla está rota.
 */
const avisoPlaca = computed(() => {
  if (placa.value.length < 6 || placaCompleta.value) return ''
  return 'Formatos válidos: ABC-123 y A12-345 (autos y camiones), AB-1234 (motos y mototaxis).'
})
const esDesconocido = computed(() => buscada.value === placa.value && !conocido.value)
/** Sin placa buscada no hay nada que decidir: las puertas no existen todavía. */
const listo = computed(() => !!buscada.value)

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
    if (conocido.value) {
      kilometraje.value = conocido.value.kilometraje
      conocida.value = await tenenciaService.relacionConocida(
        conocido.value.clienteId,
        conocido.value.id,
      )
      tenencia.value.relacion = conocida.value ?? ''
      cita.value.duracion = parametrosService.valor<number>('agenda.duracionDefecto')
    } else {
      conocida.value = null
      // Placa nueva: se matricula a nombre de quien la trae.
      tenencia.value.relacion = 'titular'
    }
  } finally {
    buscando.value = false
  }
}

/** Sin relación elegida no se manda nada: que el servicio sea quien se niegue. */
function confirmada() {
  const t = tenencia.value
  if (!controla.value || !t.relacion) return undefined
  return { relacion: t.relacion, respaldo: t.respaldo, nota: t.nota, recordar: t.recordar }
}

/** Los datos comunes a las tres puertas. */
function datos() {
  return {
    placa: placa.value,
    vehiculoId: conocido.value?.id,
    clienteId: conocido.value?.clienteId,
    clienteNuevo: conocido.value ? undefined : { ...cliente.value },
    vehiculoNuevo: conocido.value ? undefined : { ...vehiculo.value },
    kilometraje: kilometraje.value,
  }
}

function fallo(e: unknown, porDefecto: string) {
  const err = e as ApiError
  errores.value = err.campos ?? {}
  ui.error(err.mensaje ?? porDefecto)
}

/** Puerta 1: el coche está aquí. */
async function recibirAhora() {
  guardando.value = true
  errores.value = {}
  try {
    const orden = await recepcionService.recibir({
      ...datos(),
      localId: localStore.localId ?? '',
      motivo: motivo.value,
      prioridad: prioridad.value,
      usuarioId: auth.usuario?.id,
      tenencia: confirmada(),
    })
    ui.exito(`${placa.value} recibido. Toca darle la vuelta.`)
    router.push({ name: 'recepcion', params: { ordenId: orden.id } })
  } catch (e) {
    fallo(e, 'No se pudo abrir la orden.')
  } finally {
    guardando.value = false
  }
}

/** Puerta 2: vendrá otro día. */
async function agendar() {
  guardando.value = true
  errores.value = {}
  try {
    const { clienteId, vehiculoId } = await recepcionService.matricular(datos())
    await citasService.crear({
      localId: localStore.localId ?? '',
      vehiculoId,
      clienteId,
      fecha: cita.value.fecha,
      hora: cita.value.hora,
      duracion: cita.value.duracion,
      motivo: motivo.value,
      estado: 'pendiente',
    })
    ui.exito(`${placa.value} agendado para el ${cita.value.fecha}.`)
    router.push({ name: 'citas' })
  } catch (e) {
    fallo(e, 'No se pudo agendar la cita.')
  } finally {
    guardando.value = false
  }
}

/** Puerta 3: de momento, solo que exista. */
async function soloRegistrar() {
  guardando.value = true
  errores.value = {}
  try {
    await recepcionService.matricular(datos())
    ui.exito(`${placa.value} queda registrado.`)
    router.push({ name: 'vehiculos' })
  } catch (e) {
    fallo(e, 'No se pudo registrar.')
  } finally {
    guardando.value = false
  }
}
</script>

<template>
  <div class="flex flex-col gap-5">
    <KmCard
      titulo="Empieza por la placa"
      subtitulo="El taller contesta lo que sabe de ella. Si no la conoce, se apunta aquí mismo."
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

        <p v-if="avisoPlaca" class="-mt-1 text-xs text-ambar">{{ avisoPlaca }}</p>

        <div
          v-if="conocido"
          class="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-card border border-verde bg-panel-2 px-4 py-3"
        >
          <span class="text-sm font-semibold text-tinta">
            {{ conocido.marca }} {{ conocido.modelo }} {{ conocido.anio }}
          </span>
          <span class="text-xs text-tenue">
            {{ conocido.cliente?.nombre }} · {{ formatearKm(conocido.kilometraje) }}
          </span>
          <KmBadge tono="verde" class="ms-auto">✓ Ya lo conocemos</KmBadge>
        </div>
      </form>
    </KmCard>

    <!-- Placa nueva: los dos datos que cubren al taller, y poco más. -->
    <KmCard
      v-if="esDesconocido"
      titulo="Cliente y vehículo"
      subtitulo="Lo justo para que existan. La ficha completa se afina después."
    >
      <div class="flex flex-col gap-4">
        <div class="grid gap-4 sm:grid-cols-[10rem_1fr]">
          <KmField v-slot="{ id }" label="Tipo">
            <KmSelect :id="id" v-model="cliente.tipoDocumento" :opciones="tiposDocumento" />
          </KmField>
          <KmField
            v-slot="{ id, invalido }"
            label="Documento"
            :error="errores.documento"
            requerido
            ayuda="Junto con la placa, es lo que cubre legalmente al taller."
          >
            <KmInput
              :id="id"
              v-model="cliente.documento"
              :invalido="invalido"
              placeholder="12345678"
            />
          </KmField>
        </div>

        <div class="grid gap-4 sm:grid-cols-3">
          <KmField v-slot="{ id, invalido }" label="Nombre" :error="errores.nombre" requerido>
            <KmInput
              :id="id"
              v-model="cliente.nombre"
              :invalido="invalido"
              placeholder="Nombre y apellidos"
            />
          </KmField>
          <KmField v-slot="{ id }" label="Teléfono">
            <KmInput :id="id" v-model="cliente.telefono" placeholder="9xx xxx xxx" />
          </KmField>
          <KmField v-slot="{ id }" label="Correo">
            <KmInput :id="id" v-model="cliente.email" placeholder="cliente@correo.pe" />
          </KmField>
        </div>

        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KmField v-slot="{ id }" label="Marca" :error="errores.marca" requerido>
            <KmInput :id="id" v-model="vehiculo.marca" placeholder="Toyota" />
          </KmField>
          <KmField v-slot="{ id }" label="Modelo" requerido>
            <KmInput :id="id" v-model="vehiculo.modelo" placeholder="Yaris" />
          </KmField>
          <KmField v-slot="{ id }" label="Año">
            <KmNumero :id="id" v-model="vehiculo.anio" :min="1950" :step="1" />
          </KmField>
          <KmField v-slot="{ id }" label="Color">
            <KmInput :id="id" v-model="vehiculo.color" placeholder="Plata" />
          </KmField>
        </div>
      </div>
    </KmCard>

    <!-- Las tres puertas: el coche está aquí, vendrá, o solo queda apuntado. -->
    <KmCard
      v-if="listo"
      titulo="¿Qué pasa ahora?"
      subtitulo="Las tres ocurren en un taller. Ninguna debería obligar a cambiar de pantalla."
    >
      <div class="flex flex-col gap-5">
        <div class="grid gap-4 sm:grid-cols-[1fr_9rem]">
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
        </div>

        <ControlTenencia
          v-if="controla"
          v-model="tenencia"
          :titular="conocido?.cliente?.nombre"
          :conocida="conocida"
          :exige-respaldo="exigeRespaldo"
          :error="errores.relacion"
          :error-respaldo="errores.respaldo"
        />

        <div class="grid gap-4 md:grid-cols-3">
          <!-- Puerta 1 -->
          <section class="flex flex-col gap-3 rounded-card border border-linea bg-panel-2 p-4">
            <h3 class="ts-titulo-seccion text-tinta">El coche está aquí</h3>
            <p class="flex-1 text-xs text-tenue">Abre la orden y sigue a la hoja de ingreso.</p>
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
            <KmButton :disabled="!motivo.trim() || guardando" @click="recibirAhora">
              Recibir ahora
            </KmButton>
          </section>

          <!-- Puerta 2 -->
          <section class="flex flex-col gap-3 rounded-card border border-linea bg-panel-2 p-4">
            <h3 class="ts-titulo-seccion text-tinta">Vendrá otro día</h3>
            <p class="flex-1 text-xs text-tenue">Queda en la agenda, con su hueco de bahía.</p>
            <div class="grid grid-cols-2 gap-2">
              <KmField v-slot="{ id }" label="Fecha">
                <KmFecha :id="id" v-model="cita.fecha" />
              </KmField>
              <KmField v-slot="{ id }" label="Hora" :error="errores.hora">
                <KmHora :id="id" v-model="cita.hora" />
              </KmField>
            </div>
            <KmButton
              variante="secundario"
              :disabled="!motivo.trim() || guardando"
              @click="agendar"
            >
              Agendar cita
            </KmButton>
          </section>

          <!-- Puerta 3 -->
          <section class="flex flex-col gap-3 rounded-card border border-linea bg-panel-2 p-4">
            <h3 class="ts-titulo-seccion text-tinta">Solo registrar</h3>
            <p class="flex-1 text-xs text-tenue">
              Queda en el padrón. Llamó para preguntar y aún no se sabe cuándo viene.
            </p>
            <KmButton variante="fantasma" :disabled="guardando" @click="soloRegistrar">
              Guardar y cerrar
            </KmButton>
          </section>
        </div>
      </div>
    </KmCard>
  </div>
</template>
