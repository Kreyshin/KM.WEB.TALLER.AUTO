<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import PanelOrden from '@/components/ordenes/PanelOrden.vue'
import TarjetaOrden from '@/components/ordenes/TarjetaOrden.vue'
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
import { useCarga } from '@/composables/useCarga'
import { ordenesService } from '@/services/ordenes.service'
import { parametrosService } from '@/services/parametros.service'
import { vehiculosService } from '@/services/vehiculos.service'
import { useLocalStore } from '@/stores/local.store'
import { useUiStore } from '@/stores/ui.store'
import type {
  ApiError,
  FaseOrden,
  MotivoDetencion,
  OrdenResuelta,
  PrioridadOrden,
  VehiculoResuelto,
} from '@/types'
import type { ColumnaTabla, OpcionSelect } from '@/types/ui'
import { desdeHace, faltanPara, formatearSoles } from '@/utils/formato'
import {
  etiquetaDetencion,
  etiquetaFase,
  motivosDetencion,
  etiquetaPrioridad,
  fasesActivas,
  glifoFase,
  tonoFase,
  tonoPrioridad,
} from '@/utils/ordenes'

/**
 * Las órdenes vivas del taller.
 *
 * El tablero responde «¿qué hay en cada bahía?»; esta pantalla responde
 * «¿dónde está la orden de este cliente?» y, sobre todo, «¿cuál se me va a
 * pasar de hora?». Por eso lo primero es la tira de cifras, después la
 * agrupación por compromiso, y sólo al final el detalle.
 *
 * Todo lo que esta pantalla hace de más —cómo se listan, por dónde se agrupan,
 * qué se puede tocar sin abrir la ficha, cuándo una entrega empieza a avisar—
 * **es configuración**, y de la que cada sede puede apartarse. Un atajo que a
 * un taller le ahorra media hora a otro le rompe el proceso, así que aquí no
 * se decide: se lee de `ordenes.*` resuelto para este local.
 */

const route = useRoute()
const localStore = useLocalStore()
const ui = useUiStore()

const ordenes = ref<OrdenResuelta[]>([])
const vehiculos = ref<VehiculoResuelto[]>([])
const { cargando, refrescando, iniciar, terminar } = useCarga()
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

// ── Lo que esta sede tiene configurado ───────────────────────────────────────

const vista = ref<'tarjetas' | 'tabla'>('tarjetas')
const formasDeLista = [
  { valor: 'tarjetas', etiqueta: '▦ Tarjetas' },
  { valor: 'tabla', etiqueta: '≡ Tabla' },
] as const
const agrupar = ref<'compromiso' | 'fase' | 'prioridad' | 'ninguno'>('compromiso')
const acciones = ref<string[]>([])
const avisoHoras = ref(8)
const fases = ref<FaseOrden[]>(fasesActivas)

function leerConfiguracion() {
  const local = localStore.localId ?? undefined
  vista.value = parametrosService.valor<'tarjetas' | 'tabla'>('ordenes.vista', local)
  agrupar.value = parametrosService.valor('ordenes.agrupar', local)
  acciones.value = parametrosService.valor<string[]>('ordenes.accionesRapidas', local)
  avisoHoras.value = parametrosService.valor<number>('ordenes.avisoPromesaHoras', local)
  fases.value = parametrosService.valor<string[]>('taller.fases', local) as FaseOrden[]
}

// ── Las cifras que gobiernan la jornada ──────────────────────────────────────

const detenidas = computed(() => ordenes.value.filter((o) => o.detencion).length)

/** Se pasan de hora o ya se pasaron: es lo que quema. */
const enRiesgo = computed(
  () => ordenes.value.filter((o) => o.promesa && horasHasta(o.promesa) <= avisoHoras.value).length,
)

/** Dinero parado esperando un sí del cliente. */
const esperandoAprobacion = computed(() =>
  ordenes.value.filter((o) => !o.aprobada).reduce((suma, o) => suma + o.total, 0),
)

const horasHasta = (iso: string) => (new Date(iso).getTime() - Date.now()) / 3_600_000

/**
 * Los grupos, según lo que la sede quiera contestar primero.
 *
 * Cada grupo se devuelve con su nombre y sus órdenes; la vista no sabe por
 * qué criterio se agrupó, sólo los pinta en orden.
 */
const grupos = computed<{ clave: string; titulo: string; ordenes: OrdenResuelta[] }[]>(() => {
  const items = [...filtradas.value]

  if (agrupar.value === 'ninguno') {
    return [{ clave: 'todas', titulo: 'Todas', ordenes: items }]
  }

  if (agrupar.value === 'fase') {
    return fases.value
      .map((f) => ({
        clave: f,
        titulo: etiquetaFase[f],
        ordenes: items.filter((o) => o.fase === f),
      }))
      .filter((g) => g.ordenes.length)
  }

  if (agrupar.value === 'prioridad') {
    return (['urgente', 'alta', 'normal'] as PrioridadOrden[])
      .map((p) => ({
        clave: p,
        titulo: etiquetaPrioridad[p],
        ordenes: items.filter((o) => o.prioridad === p),
      }))
      .filter((g) => g.ordenes.length)
  }

  // Por compromiso: lo que arde primero, y lo que no tiene fecha al final.
  const cajones: Record<string, { titulo: string; ordenes: OrdenResuelta[] }> = {
    atrasadas: { titulo: 'Atrasadas', ordenes: [] },
    hoy: { titulo: 'Se entregan hoy', ordenes: [] },
    semana: { titulo: 'Esta semana', ordenes: [] },
    sinFecha: { titulo: 'Sin fecha prometida', ordenes: [] },
  }
  for (const o of items) {
    if (!o.promesa) cajones.sinFecha.ordenes.push(o)
    else {
      const h = horasHasta(o.promesa)
      if (h < 0) cajones.atrasadas.ordenes.push(o)
      else if (h <= 24) cajones.hoy.ordenes.push(o)
      else cajones.semana.ordenes.push(o)
    }
  }
  return Object.entries(cajones)
    .map(([clave, g]) => ({ clave, ...g }))
    .filter((g) => g.ordenes.length)
})

async function cargar() {
  const localId = localStore.localId
  if (!localId) return
  iniciar()
  try {
    ordenes.value = await ordenesService.enTaller(localId)
  } catch {
    ui.error('No se pudieron cargar las órdenes.')
  } finally {
    terminar()
  }
}

onMounted(async () => {
  leerConfiguracion()
  vehiculos.value = (await vehiculosService.consultarResueltos({ porPagina: 300 })).items
  await cargar()
})

watch(
  () => localStore.localId,
  async () => {
    // Cambiar de sede cambia también lo que esa sede tiene configurado.
    leerConfiguracion()
    await cargar()
  },
)

/** La primera cifra es también el atajo para quitar todos los filtros. */
function verTodas() {
  soloDetenidas.value = false
  filtroFase.value = ''
}

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

// ── Acciones rápidas ─────────────────────────────────────────────────────────

const detencionAbierta = ref<OrdenResuelta | null>(null)
const motivoDetencion = ref<MotivoDetencion>('esperaRepuesto')
const notaDetencion = ref('')

const reprogramaAbierta = ref<OrdenResuelta | null>(null)
const nuevaPromesa = ref('')
const motivoPromesa = ref('')

const opcionesMotivo: OpcionSelect[] = motivosDetencion.map((m) => ({
  valor: m,
  etiqueta: etiquetaDetencion[m],
}))

/**
 * Las reglas del servicio siguen mandando.
 *
 * Que la sede permita avanzar desde la tarjeta no salta la hoja firmada ni la
 * aprobación del cliente: el atajo ahorra clics, no controles. Cuando el
 * servicio se niega, se dice por qué.
 */
async function avanzar(orden: OrdenResuelta) {
  try {
    await ordenesService.avanzar(orden.id)
    ui.exito(`${orden.vehiculo?.placa} avanza.`)
    await cargar()
  } catch (e) {
    ui.error((e as ApiError).mensaje ?? 'No se pudo avanzar la orden.')
  }
}

async function reanudar(orden: OrdenResuelta) {
  try {
    await ordenesService.reanudar(orden.id)
    ui.exito(`${orden.vehiculo?.placa} vuelve a avanzar.`)
    await cargar()
  } catch (e) {
    ui.error((e as ApiError).mensaje ?? 'No se pudo reanudar.')
  }
}

function pedirDetencion(orden: OrdenResuelta) {
  detencionAbierta.value = orden
  motivoDetencion.value = 'esperaRepuesto'
  notaDetencion.value = ''
}

async function confirmarDetencion() {
  const orden = detencionAbierta.value
  if (!orden) return
  try {
    await ordenesService.detener(orden.id, motivoDetencion.value, notaDetencion.value)
    ui.exito(`${orden.vehiculo?.placa} queda detenida.`)
    detencionAbierta.value = null
    await cargar()
  } catch (e) {
    ui.error((e as ApiError).mensaje ?? 'No se pudo detener la orden.')
  }
}

/** La prioridad rota: normal → alta → urgente → normal. Un clic, sin diálogo. */
async function rotarPrioridad(orden: OrdenResuelta) {
  const orden_ = ['normal', 'alta', 'urgente'] as PrioridadOrden[]
  const siguiente = orden_[(orden_.indexOf(orden.prioridad) + 1) % orden_.length]
  try {
    await ordenesService.cambiarPrioridad(orden.id, siguiente)
    ui.exito(`${orden.vehiculo?.placa}: prioridad ${etiquetaPrioridad[siguiente].toLowerCase()}.`)
    await cargar()
  } catch (e) {
    ui.error((e as ApiError).mensaje ?? 'No se pudo cambiar la prioridad.')
  }
}

function pedirReprograma(orden: OrdenResuelta) {
  reprogramaAbierta.value = orden
  nuevaPromesa.value = (orden.promesa ?? new Date().toISOString()).slice(0, 16)
  motivoPromesa.value = ''
  errores.value = {}
}

const exigeMotivo = computed(() => parametrosService.valor<boolean>('ordenes.motivoAlReprogramar'))

async function confirmarReprograma() {
  const orden = reprogramaAbierta.value
  if (!orden) return
  errores.value = {}
  try {
    await ordenesService.reprogramar(
      orden.id,
      new Date(nuevaPromesa.value).toISOString(),
      motivoPromesa.value,
    )
    ui.exito(`Nueva fecha para ${orden.vehiculo?.placa}.`)
    reprogramaAbierta.value = null
    await cargar()
  } catch (e) {
    const err = e as ApiError
    errores.value = err.campos ?? {}
    ui.error(err.mensaje ?? 'No se pudo mover la fecha.')
  }
}

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
    <!--
      La tira: cuatro cifras que gobiernan la jornada. Se pone arriba porque
      la primera pregunta de la mañana no es «¿dónde está esta orden?» sino
      «¿cuántas se me están pasando de hora?».
    -->
    <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <button type="button" class="ts-cifra" @click="verTodas">
        <span class="ts-display ts-cifra-valor">{{ ordenes.length }}</span>
        <span class="ts-cifra-nombre">En el taller</span>
      </button>
      <button
        type="button"
        class="ts-cifra"
        :class="{ 'es-alerta': detenidas > 0, 'es-activa': soloDetenidas }"
        @click="soloDetenidas = !soloDetenidas"
      >
        <span class="ts-display ts-cifra-valor">{{ detenidas }}</span>
        <span class="ts-cifra-nombre">‖ Detenidas</span>
      </button>
      <div class="ts-cifra" :class="{ 'es-aviso': enRiesgo > 0 }">
        <span class="ts-display ts-cifra-valor">{{ enRiesgo }}</span>
        <span class="ts-cifra-nombre">◷ Se pasan de hora</span>
      </div>
      <div class="ts-cifra">
        <span class="ts-display ts-cifra-valor">{{ formatearSoles(esperandoAprobacion) }}</span>
        <span class="ts-cifra-nombre">§ Esperando un sí</span>
      </div>
    </div>

    <div class="flex flex-wrap items-center gap-3">
      <KmBusqueda v-model="buscar" placeholder="Placa, orden o cliente…" class="min-w-64 flex-1" />
      <KmSelect
        v-model="filtroFase"
        :opciones="opcionesFase"
        etiqueta="Filtrar por fase"
        class="w-52"
      />
      <!-- Cómo se miran: el valor viene de la sede, pero se puede probar aquí. -->
      <div class="ts-conmutador" role="group" aria-label="Forma de la lista">
        <button
          v-for="f in formasDeLista"
          :key="f.valor"
          type="button"
          class="ts-conmutador-boton"
          :class="{ 'es-activa': vista === f.valor }"
          :aria-pressed="vista === f.valor"
          @click="vista = f.valor"
        >
          {{ f.etiqueta }}
        </button>
      </div>
      <KmButton @click="nueva">Abrir orden</KmButton>
    </div>

    <p v-if="cargando" class="py-16 text-center text-sm text-tenue">Cargando órdenes…</p>

    <!--
      Al refrescar tras una acción rápida se atenúan LOS DATOS, no la barra:
      quien acaba de pulsar «Detener» sigue pudiendo escribir en el buscador
      mientras llega la respuesta, y nada cambia de sitio.
    -->
    <KmCard v-else-if="!filtradas.length" titulo="Órdenes en el taller">
      <p class="py-10 text-center text-sm text-tenue">No hay órdenes que coincidan.</p>
    </KmCard>

    <!-- Tarjetas, agrupadas por lo que esta sede quiera contestar primero. -->
    <template v-else-if="vista === 'tarjetas'">
      <section
        v-for="g in grupos"
        :key="g.clave"
        class="flex flex-col gap-3"
        :class="{ 'ts-refrescando': refrescando }"
        :aria-busy="refrescando"
      >
        <h2 v-if="agrupar !== 'ninguno'" class="flex items-baseline gap-2">
          <span class="ts-display text-base font-semibold text-tinta">{{ g.titulo }}</span>
          <span class="text-xs text-tenue">{{ g.ordenes.length }}</span>
        </h2>
        <div class="grid gap-3 xl:grid-cols-2 2xl:grid-cols-3">
          <TarjetaOrden
            v-for="o in g.ordenes"
            :key="o.id"
            :orden="o"
            :fases="fases"
            :acciones="acciones"
            :aviso-horas="avisoHoras"
            @abrir="abrir(o)"
            @avanzar="avanzar(o)"
            @detener="pedirDetencion(o)"
            @reanudar="reanudar(o)"
            @prioridad="rotarPrioridad(o)"
            @reprogramar="pedirReprograma(o)"
          />
        </div>
      </section>
    </template>

    <!-- Tabla: densa y ordenable, para quien mira la pantalla sentado. -->
    <KmCard
      v-else
      titulo="Órdenes en el taller"
      :subtitulo="`${filtradas.length} de ${ordenes.length} órdenes vivas en esta sede.`"
      sin-padding
      :class="{ 'ts-refrescando': refrescando }"
      :aria-busy="refrescando"
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
            <KmBadge tono="rojo">‖ {{ etiquetaDetencion[fila.detencion] }}</KmBadge>
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

  <!-- Detener: el motivo no es burocracia, es la salida del atasco. -->
  <KmDrawer
    :model-value="Boolean(detencionAbierta)"
    titulo="Detener la orden"
    ancho="sm"
    @update:model-value="detencionAbierta = null"
  >
    <div class="flex flex-col gap-4">
      <p class="text-sm text-tenue">
        {{ detencionAbierta?.vehiculo?.placa }} · {{ detencionAbierta?.codigo }}
      </p>
      <KmField v-slot="{ id }" label="¿Por qué no avanza?">
        <KmSelect :id="id" v-model="motivoDetencion" :opciones="opcionesMotivo" />
      </KmField>
      <KmField
        v-slot="{ id }"
        label="Qué falta exactamente"
        ayuda="Qué repuesto, a quién se espera. Es lo que otro leerá mañana."
      >
        <KmInput :id="id" v-model="notaDetencion" placeholder="Falta el kit de embrague" />
      </KmField>
    </div>
    <template #footer>
      <KmButton variante="fantasma" @click="detencionAbierta = null">Cancelar</KmButton>
      <KmButton @click="confirmarDetencion">Detener</KmButton>
    </template>
  </KmDrawer>

  <!-- Mover la fecha: lo que más molesta al cliente, así que queda escrito. -->
  <KmDrawer
    :model-value="Boolean(reprogramaAbierta)"
    titulo="Mover la fecha prometida"
    ancho="sm"
    @update:model-value="reprogramaAbierta = null"
  >
    <div class="flex flex-col gap-4">
      <p class="text-sm text-tenue">
        {{ reprogramaAbierta?.vehiculo?.placa }} · prometida
        {{ reprogramaAbierta?.promesa ? faltanPara(reprogramaAbierta.promesa).texto : 'sin fecha' }}
      </p>
      <KmField v-slot="{ id }" label="Nueva fecha y hora">
        <KmInput :id="id" v-model="nuevaPromesa" type="datetime-local" />
      </KmField>
      <KmField
        v-slot="{ id, invalido }"
        label="Por qué se mueve"
        :error="errores.motivo"
        ayuda="Queda con tu nombre y la hora. Al cierre de mes dice de qué se aplaza siempre."
        :requerido="exigeMotivo"
      >
        <KmInput
          :id="id"
          v-model="motivoPromesa"
          :invalido="invalido"
          placeholder="El repuesto llega dos días tarde"
        />
      </KmField>
    </div>
    <template #footer>
      <KmButton variante="fantasma" @click="reprogramaAbierta = null">Cancelar</KmButton>
      <KmButton @click="confirmarReprograma">Mover fecha</KmButton>
    </template>
  </KmDrawer>

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

<style scoped>
/*
 * La tira de cifras. Las dos primeras son botones porque filtran; las otras
 * dos informan. Se distinguen por el cursor y el foco, no sólo por el aspecto.
 */
.ts-cifra {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.875rem 1rem;
  text-align: left;
  border: 1px solid var(--ts-border);
  border-radius: var(--ts-radio-card);
  background-color: var(--ts-surface);
  transition: border-color 140ms ease;
}

button.ts-cifra {
  cursor: pointer;
}

button.ts-cifra:hover {
  border-color: var(--ts-acero-400);
}

button.ts-cifra.es-activa {
  border-color: var(--ts-acero-500);
  background-color: var(--ts-acero-50);
}

.ts-cifra.es-alerta .ts-cifra-valor {
  color: var(--ts-rojo-texto);
}

.ts-cifra.es-aviso .ts-cifra-valor {
  color: var(--ts-ambar);
}

.ts-cifra-valor {
  font-size: 1.5rem;
  font-weight: 600;
  line-height: 1.1;
  font-variant-numeric: tabular-nums;
  color: var(--ts-text);
}

.ts-cifra-nombre {
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--ts-muted);
}

.ts-conmutador {
  display: flex;
  gap: 0.125rem;
  padding: 0.1875rem;
  border: 1px solid var(--ts-border);
  border-radius: var(--ts-radio-card);
  background-color: var(--ts-surface-2);
}

.ts-conmutador-boton {
  min-height: var(--km-toque, 2.25rem);
  padding-inline: 0.75rem;
  border-radius: var(--ts-radio-control);
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--ts-muted);
  cursor: pointer;
  transition: background-color 140ms ease;
}

.ts-conmutador-boton.es-activa {
  background-color: var(--ts-surface);
  color: var(--ts-text);
  box-shadow: 0 1px 2px rgb(0 0 0 / 0.08);
}

@media (prefers-reduced-motion: reduce) {
  .ts-cifra,
  .ts-conmutador-boton {
    transition: none;
  }
}
</style>
