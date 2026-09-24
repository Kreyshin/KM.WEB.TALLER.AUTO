<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import KmBadge from '@/components/ui/KmBadge.vue'
import KmButton from '@/components/ui/KmButton.vue'
import KmDrawer from '@/components/ui/KmDrawer.vue'
import KmField from '@/components/ui/KmField.vue'
import KmInput from '@/components/ui/KmInput.vue'
import KmModal from '@/components/ui/KmModal.vue'
import KmNumero from '@/components/ui/KmNumero.vue'
import KmSelect from '@/components/ui/KmSelect.vue'
import { almacenService } from '@/services/almacen.service'
import { bahiasService } from '@/services/bahias.service'
import { catalogoService } from '@/services/catalogo.service'
import { ordenesService } from '@/services/ordenes.service'
import { usuariosService } from '@/services/usuarios.service'
import { useUiStore } from '@/stores/ui.store'
import type { ApiError, MotivoDetencion, OrdenResuelta } from '@/types'
import type { OpcionSelect } from '@/types/ui'
import { desdeHace, faltanPara, formatearHoras, formatearKm, formatearSoles } from '@/utils/formato'
import {
  accionSiguienteFase,
  etiquetaDetencion,
  etiquetaFase,
  etiquetaPrioridad,
  glifoFase,
  motivosDetencion,
  salidaDetencion,
  tonoFase,
  tonoPrioridad,
} from '@/utils/ordenes'

/**
 * Ficha de una orden de trabajo.
 *
 * Reúne en un sitio las dos decisiones que gobiernan la vertical —en qué fase
 * está y si avanza o no— junto al presupuesto, porque en el mostrador se
 * responden a la vez: «¿cómo va mi coche?» y «¿cuánto me va a costar?».
 */

const props = defineProps<{ ordenId: string | null }>()
const emit = defineEmits<{ cambio: [] }>()

const abierto = defineModel<boolean>({ required: true })

const ui = useUiStore()

const orden = ref<OrdenResuelta | null>(null)
const cargando = ref(false)
const trabajando = ref(false)

const bahias = ref<OpcionSelect[]>([])
const tecnicos = ref<OpcionSelect[]>([])
const servicios = ref<OpcionSelect[]>([])
const repuestos = ref<OpcionSelect[]>([])

/** Alta de línea del presupuesto. */
const nuevaLinea = ref({
  tipo: 'servicio' as 'servicio' | 'repuesto',
  referenciaId: '',
  cantidad: 1,
})

/** Detención: el motivo es obligatorio, la nota solo cuando aporta. */
const modalDetener = ref(false)
const detencion = ref({ motivo: 'esperaRepuesto' as MotivoDetencion, nota: '' })

const opcionesMotivo: OpcionSelect[] = motivosDetencion.map((m) => ({
  valor: m,
  etiqueta: etiquetaDetencion[m],
}))

const tiposLinea: OpcionSelect[] = [
  { valor: 'servicio', etiqueta: 'Mano de obra' },
  { valor: 'repuesto', etiqueta: 'Repuesto' },
]

const referencias = computed(() =>
  nuevaLinea.value.tipo === 'servicio' ? servicios.value : repuestos.value,
)

const accionAvanzar = computed(() =>
  orden.value ? accionSiguienteFase[orden.value.fase] : undefined,
)

const promesa = computed(() => (orden.value?.promesa ? faltanPara(orden.value.promesa) : null))

async function cargar() {
  if (!props.ordenId) return
  cargando.value = true
  try {
    orden.value = await ordenesService.obtenerResuelta(props.ordenId)
  } catch {
    ui.error('No se pudo cargar la orden.')
  } finally {
    cargando.value = false
  }
}

watch(
  () => [abierto.value, props.ordenId],
  async ([visible]) => {
    if (!visible) return
    await cargar()
    if (bahias.value.length) return
    const [listaBahias, listaTecnicos, listaServicios, listaRepuestos] = await Promise.all([
      bahiasService.listar(orden.value?.localId),
      usuariosService.tecnicos(),
      catalogoService.servicios.listar(),
      almacenService.listar(),
    ])
    bahias.value = listaBahias
      .filter((b) => b.operativa)
      .map((b) => ({ valor: b.id, etiqueta: `${b.codigo} · ${b.nombre}` }))
    tecnicos.value = listaTecnicos.map((t) => ({ valor: t.id, etiqueta: t.nombre }))
    servicios.value = listaServicios.map((s) => ({
      valor: s.id,
      etiqueta: `${s.nombre} · ${formatearHoras(s.horas)}`,
    }))
    repuestos.value = listaRepuestos.map((r) => ({
      valor: r.id,
      etiqueta: `${r.nombre} · ${r.stock} en stock`,
    }))
  },
  { immediate: true },
)

/** Toda acción sigue el mismo guion: ejecutar, avisar, recargar, notificar. */
async function ejecutar(accion: () => Promise<unknown>, mensaje: string) {
  if (!orden.value) return
  trabajando.value = true
  try {
    await accion()
    ui.exito(mensaje)
    await cargar()
    emit('cambio')
  } catch (e) {
    ui.error((e as ApiError).mensaje ?? 'No se pudo completar la acción.')
  } finally {
    trabajando.value = false
  }
}

const avanzar = () =>
  ejecutar(() => ordenesService.avanzar(orden.value!.id), 'La orden avanzó de fase.')

const aprobar = () =>
  ejecutar(
    () => ordenesService.aprobar(orden.value!.id),
    'Presupuesto aprobado: ya se puede trabajar.',
  )

const reanudar = () => ejecutar(() => ordenesService.reanudar(orden.value!.id), 'Orden reanudada.')

function detener() {
  detencion.value = { motivo: 'esperaRepuesto', nota: '' }
  modalDetener.value = true
}

async function confirmarDetencion() {
  modalDetener.value = false
  await ejecutar(
    () => ordenesService.detener(orden.value!.id, detencion.value.motivo, detencion.value.nota),
    'Orden detenida. Sigue en su fase, pero no avanza.',
  )
}

const asignar = (bahiaId?: string, tecnicoId?: string) =>
  ejecutar(
    () => ordenesService.asignar(orden.value!.id, bahiaId, tecnicoId),
    'Asignación actualizada.',
  )

async function agregarLinea() {
  if (!nuevaLinea.value.referenciaId || !orden.value) return
  const { tipo, referenciaId, cantidad } = nuevaLinea.value

  if (tipo === 'servicio') {
    const cotizacion = await catalogoService.cotizar(referenciaId)
    await ejecutar(
      () =>
        ordenesService.agregarItem(orden.value!.id, {
          tipo,
          referenciaId,
          descripcion: cotizacion.servicio.nombre,
          cantidad,
          precio: cotizacion.precio,
          horas: cotizacion.horas,
          aprobado: false,
        }),
      'Mano de obra añadida al presupuesto.',
    )
  } else {
    const pieza = (await almacenService.listar()).find((r) => r.id === referenciaId)
    if (!pieza) return
    await ejecutar(
      () =>
        ordenesService.agregarItem(orden.value!.id, {
          tipo,
          referenciaId,
          descripcion: pieza.nombre,
          cantidad,
          precio: pieza.precio,
          aprobado: false,
        }),
      'Repuesto añadido al presupuesto.',
    )
  }
  nuevaLinea.value = { tipo, referenciaId: '', cantidad: 1 }
}

const alternar = (itemId: string) =>
  ejecutar(() => ordenesService.alternarItem(orden.value!.id, itemId), 'Línea actualizada.')

const quitar = (itemId: string) =>
  ejecutar(() => ordenesService.quitarItem(orden.value!.id, itemId), 'Línea eliminada.')
</script>

<template>
  <KmDrawer v-model="abierto" ancho="xl" :titulo="orden?.codigo ?? 'Orden de trabajo'">
    <p v-if="cargando || !orden" class="py-12 text-center text-sm text-tenue">Cargando orden…</p>

    <div v-else class="flex flex-col gap-6">
      <!-- Cabecera: las dos dimensiones, separadas y visibles a la vez. -->
      <header class="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div class="flex items-center gap-2.5">
            <span
              class="ts-placa rounded-[4px] border-2 border-tinta px-2 py-0.5 text-sm text-tinta"
            >
              {{ orden.vehiculo?.placa ?? '—' }}
            </span>
            <span class="ts-display text-lg leading-none font-semibold text-tinta">
              {{ orden.vehiculo?.marca }} {{ orden.vehiculo?.modelo }}
            </span>
          </div>
          <p class="mt-1.5 text-sm text-tenue">
            {{ orden.cliente?.nombre ?? '—' }} · {{ formatearKm(orden.kilometraje) }} al ingreso ·
            entró {{ desdeHace(orden.ingreso) }}
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <KmBadge :tono="tonoFase[orden.fase]" punto>
            {{ glifoFase[orden.fase] }} {{ etiquetaFase[orden.fase] }}
          </KmBadge>
          <KmBadge v-if="orden.prioridad !== 'normal'" :tono="tonoPrioridad[orden.prioridad]">
            {{ etiquetaPrioridad[orden.prioridad] }}
          </KmBadge>
        </div>
      </header>

      <!-- Detención: si la hay, manda sobre todo lo demás. -->
      <div v-if="orden.detencion" class="ts-tono ts-tono-rojo rounded-card border p-4">
        <p class="ts-etiqueta">⏸ Detenida · {{ etiquetaDetencion[orden.detencion] }}</p>
        <p class="ts-display mt-1 text-lg leading-tight font-semibold">
          {{ salidaDetencion[orden.detencion] }}
        </p>
        <p v-if="orden.notaDetencion" class="mt-1 text-sm">{{ orden.notaDetencion }}</p>
        <p v-if="orden.detenidaDesde" class="mt-2 text-xs font-semibold">
          Sin avanzar desde {{ desdeHace(orden.detenidaDesde) }}
        </p>
      </div>

      <div class="grid gap-4 sm:grid-cols-2">
        <div class="rounded-card border border-linea bg-panel-2 p-4">
          <p class="ts-etiqueta text-tenue">Lo que dijo el cliente</p>
          <p class="mt-1.5 text-sm text-tinta">{{ orden.motivo }}</p>
        </div>
        <div class="rounded-card border border-linea bg-panel-2 p-4">
          <p class="ts-etiqueta text-tenue">Lo que encontró el técnico</p>
          <p class="mt-1.5 text-sm" :class="orden.diagnostico ? 'text-tinta' : 'text-tenue'">
            {{ orden.diagnostico ?? 'Todavía sin diagnóstico.' }}
          </p>
        </div>
      </div>

      <!-- Asignación: bahía y técnico se cambian aquí mismo, sin salir. -->
      <div class="grid gap-4 sm:grid-cols-3">
        <KmField v-slot="{ id }" label="Bahía">
          <KmSelect
            :id="id"
            :model-value="orden.bahiaId ?? ''"
            :opciones="bahias"
            placeholder="Sin asignar"
            @update:model-value="asignar(String($event), orden!.tecnicoId)"
          />
        </KmField>
        <KmField v-slot="{ id }" label="Técnico">
          <KmSelect
            :id="id"
            :model-value="orden.tecnicoId ?? ''"
            :opciones="tecnicos"
            placeholder="Sin asignar"
            @update:model-value="asignar(orden!.bahiaId, String($event))"
          />
        </KmField>
        <div>
          <p class="ts-etiqueta text-tenue">Entrega prometida</p>
          <p
            v-if="promesa"
            class="ts-cifra-sm mt-1"
            :class="promesa.atrasado ? 'text-rojo-texto' : 'text-tinta'"
          >
            {{ promesa.atrasado ? '⚠ ' : '' }}{{ promesa.texto }}
          </p>
          <p v-else class="mt-1 text-sm text-tenue">Sin fecha comprometida.</p>
        </div>
      </div>

      <!-- Presupuesto -->
      <section>
        <div class="flex flex-wrap items-baseline justify-between gap-3">
          <h3 class="ts-titulo-seccion text-tinta">Presupuesto</h3>
          <p class="text-sm text-tenue">
            {{ formatearHoras(orden.horas) }} de mano de obra ·
            <strong class="ts-cifra-sm text-tinta">{{ formatearSoles(orden.total) }}</strong>
            aprobado
          </p>
        </div>

        <ul class="mt-3 flex flex-col gap-1.5">
          <li
            v-for="item in orden.items"
            :key="item.id"
            class="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-control border border-linea bg-panel-2 px-3 py-2"
          >
            <KmBadge :tono="item.tipo === 'servicio' ? 'acero' : 'neutro'">
              {{ item.tipo === 'servicio' ? 'Obra' : 'Pieza' }}
            </KmBadge>
            <span class="min-w-40 flex-1 text-sm text-tinta">{{ item.descripcion }}</span>
            <span class="text-xs text-tenue tabular-nums">×{{ item.cantidad }}</span>
            <span class="w-24 text-right text-sm text-tinta tabular-nums">
              {{ formatearSoles(item.precio * item.cantidad) }}
            </span>
            <!-- Una línea se rechaza sin tumbar el resto del presupuesto. -->
            <KmButton
              :variante="item.aprobado ? 'secundario' : 'fantasma'"
              tamano="sm"
              @click="alternar(item.id)"
            >
              {{ item.aprobado ? '✓ Aprobada' : 'Sin aprobar' }}
            </KmButton>
            <KmButton variante="fantasma" tamano="sm" @click="quitar(item.id)">Quitar</KmButton>
          </li>
          <li v-if="!orden.items.length" class="py-4 text-center text-sm text-tenue">
            El presupuesto está vacío.
          </li>
        </ul>

        <div class="mt-4 flex flex-wrap items-end gap-3">
          <KmField v-slot="{ id }" label="Añadir" class="w-40">
            <KmSelect :id="id" v-model="nuevaLinea.tipo" :opciones="tiposLinea" />
          </KmField>
          <KmField v-slot="{ id }" label="Concepto" class="min-w-56 flex-1">
            <KmSelect
              :id="id"
              v-model="nuevaLinea.referenciaId"
              :opciones="referencias"
              placeholder="Elige del catálogo"
            />
          </KmField>
          <KmField v-slot="{ id }" label="Cant." class="w-24">
            <KmNumero :id="id" v-model="nuevaLinea.cantidad" :min="1" />
          </KmField>
          <KmButton
            variante="secundario"
            :disabled="!nuevaLinea.referenciaId"
            @click="agregarLinea"
          >
            Añadir línea
          </KmButton>
        </div>
      </section>
    </div>

    <template #footer>
      <template v-if="orden">
        <KmButton v-if="orden.detencion" :cargando="trabajando" @click="reanudar">
          Reanudar
        </KmButton>
        <KmButton v-else variante="secundario" :cargando="trabajando" @click="detener">
          Detener
        </KmButton>

        <KmButton
          v-if="!orden.aprobada && orden.fase === 'presupuesto'"
          :cargando="trabajando"
          @click="aprobar"
        >
          El cliente aprueba
        </KmButton>
        <KmButton
          v-else-if="accionAvanzar"
          :cargando="trabajando"
          :disabled="Boolean(orden.detencion)"
          @click="avanzar"
        >
          {{ accionAvanzar }}
        </KmButton>
      </template>
    </template>
  </KmDrawer>

  <KmModal v-model="modalDetener" titulo="Detener la orden">
    <p class="text-sm text-tenue">
      La orden se queda en su fase actual. Detener no es retroceder: cuando se resuelva el motivo,
      el trabajo sigue donde lo dejó.
    </p>
    <div class="mt-4 flex flex-col gap-4">
      <KmField v-slot="{ id }" label="Motivo">
        <KmSelect :id="id" v-model="detencion.motivo" :opciones="opcionesMotivo" />
      </KmField>
      <KmField v-slot="{ id }" label="Detalle" ayuda="Qué pieza falta, a quién se espera…">
        <KmInput :id="id" v-model="detencion.nota" />
      </KmField>
      <p class="ts-tono ts-tono-ambar rounded-control border px-3 py-2 text-sm">
        Para desatascarla: {{ salidaDetencion[detencion.motivo].toLowerCase() }}
      </p>
    </div>

    <template #footer>
      <KmButton variante="fantasma" @click="modalDetener = false">Cancelar</KmButton>
      <KmButton @click="confirmarDetencion">Detener</KmButton>
    </template>
  </KmModal>
</template>
