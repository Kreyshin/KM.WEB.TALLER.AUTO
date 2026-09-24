<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import KmBadge from '@/components/ui/KmBadge.vue'
import KmButton from '@/components/ui/KmButton.vue'
import KmCard from '@/components/ui/KmCard.vue'
import KmDrawer from '@/components/ui/KmDrawer.vue'
import KmField from '@/components/ui/KmField.vue'
import KmInput from '@/components/ui/KmInput.vue'
import KmNumero from '@/components/ui/KmNumero.vue'
import KmSelect from '@/components/ui/KmSelect.vue'
import KmTable from '@/components/ui/KmTable.vue'
import { almacenService } from '@/services/almacen.service'
import { useAuthStore } from '@/stores/auth.store'
import { useUiStore } from '@/stores/ui.store'
import type { ApiError, Movimiento, Repuesto, TipoMovimiento } from '@/types'
import type { ColumnaTabla, OpcionSelect, TonoTaller } from '@/types/ui'
import { etiquetaMovimiento, hora } from '@/utils/formato'

/**
 * Kardex del almacén: qué entró, qué salió y a qué orden se imputó.
 *
 * El movimiento es el único sitio donde cambia el stock. La ficha del repuesto
 * no se edita para «cuadrar» el almacén: se registra un ajuste, que deja
 * rastro de quién lo hizo y por qué.
 */

const ui = useUiStore()
const auth = useAuthStore()

const movimientos = ref<Movimiento[]>([])
const repuestos = ref<Repuesto[]>([])
const cargando = ref(true)
const abierto = ref(false)
const guardando = ref(false)
const errores = ref<Record<string, string>>({})

const borrador = ref({
  repuestoId: '',
  tipo: 'ingreso' as TipoMovimiento,
  cantidad: 1,
  motivo: '',
})

const columnas: ColumnaTabla[] = [
  { clave: 'fecha', etiqueta: 'Fecha', clase: 'w-36' },
  { clave: 'repuestoId', etiqueta: 'Repuesto' },
  { clave: 'tipo', etiqueta: 'Tipo', clase: 'w-36' },
  { clave: 'cantidad', etiqueta: 'Cantidad', clase: 'w-32 text-right' },
  { clave: 'motivo', etiqueta: 'Motivo' },
]

const tonos: Record<TipoMovimiento, TonoTaller> = {
  ingreso: 'verde',
  salida: 'acero',
  ajuste: 'ambar',
  devolucion: 'neutro',
}

/** El signo aclara el sentido; el ajuste fija el stock, no lo suma. */
const signo: Record<TipoMovimiento, string> = {
  ingreso: '+',
  salida: '−',
  ajuste: '=',
  devolucion: '+',
}

const tipos: OpcionSelect[] = (
  ['ingreso', 'salida', 'ajuste', 'devolucion'] as TipoMovimiento[]
).map((t) => ({ valor: t, etiqueta: etiquetaMovimiento[t] }))

const opcionesRepuesto = computed<OpcionSelect[]>(() =>
  repuestos.value.map((r) => ({ valor: r.id, etiqueta: `${r.codigo} · ${r.nombre}` })),
)

async function cargar() {
  cargando.value = true
  try {
    ;[movimientos.value, repuestos.value] = await Promise.all([
      almacenService.movimientos(),
      almacenService.listar(),
    ])
  } catch {
    ui.error('No se pudieron cargar los movimientos.')
  } finally {
    cargando.value = false
  }
}

onMounted(cargar)

function abrir() {
  borrador.value = { repuestoId: '', tipo: 'ingreso', cantidad: 1, motivo: '' }
  errores.value = {}
  abierto.value = true
}

async function guardar() {
  errores.value = {}
  if (!borrador.value.repuestoId) {
    errores.value.repuestoId = 'Elige el repuesto.'
    return
  }
  guardando.value = true
  try {
    await almacenService.registrarMovimiento({
      ...borrador.value,
      usuarioId: auth.usuario?.id ?? '',
    })
    ui.exito('Movimiento registrado y stock actualizado.')
    abierto.value = false
    await cargar()
  } catch (e) {
    const err = e as ApiError
    errores.value = err.campos ?? {}
    ui.error(err.mensaje ?? 'No se pudo registrar el movimiento.')
  } finally {
    guardando.value = false
  }
}

function nombreRepuesto(id: string) {
  const r = repuestos.value.find((x) => x.id === id)
  return r ? `${r.nombre}` : id
}
</script>

<template>
  <KmCard
    titulo="Movimientos"
    subtitulo="El único sitio donde cambia el stock: ingresos, consumos, devoluciones y ajustes."
    sin-padding
  >
    <template #acciones>
      <KmButton @click="abrir">Registrar movimiento</KmButton>
    </template>

    <KmTable
      :columnas="columnas"
      :filas="movimientos"
      :cargando="cargando"
      mensaje-vacio="Todavía no hay movimientos registrados."
    >
      <template #col-fecha="{ fila }">
        <span class="text-xs text-tenue tabular-nums">
          {{ fila.fecha.slice(8, 10) }}/{{ fila.fecha.slice(5, 7) }} · {{ hora(fila.fecha) }}
        </span>
      </template>
      <template #col-repuestoId="{ fila }">
        <span class="text-sm text-tinta">{{ nombreRepuesto(fila.repuestoId) }}</span>
      </template>
      <template #col-tipo="{ fila }">
        <KmBadge :tono="tonos[fila.tipo]">{{ etiquetaMovimiento[fila.tipo] }}</KmBadge>
      </template>
      <template #col-cantidad="{ fila }">
        <span class="text-sm font-semibold text-tinta tabular-nums">
          {{ signo[fila.tipo] }}{{ fila.cantidad }}
        </span>
      </template>
      <template #col-motivo="{ fila }">
        <span class="text-sm text-tenue">{{ fila.motivo ?? '—' }}</span>
      </template>
    </KmTable>
  </KmCard>

  <KmDrawer v-model="abierto" titulo="Registrar movimiento" ancho="md">
    <div class="flex flex-col gap-4">
      <KmField v-slot="{ id, invalido }" label="Repuesto" :error="errores.repuestoId" requerido>
        <KmSelect
          :id="id"
          v-model="borrador.repuestoId"
          :opciones="opcionesRepuesto"
          :invalido="invalido"
          placeholder="Elige un repuesto"
        />
      </KmField>

      <div class="grid gap-4 sm:grid-cols-2">
        <KmField v-slot="{ id }" label="Tipo">
          <KmSelect :id="id" v-model="borrador.tipo" :opciones="tipos" />
        </KmField>
        <KmField
          v-slot="{ id, invalido }"
          label="Cantidad"
          :error="errores.cantidad"
          :ayuda="borrador.tipo === 'ajuste' ? 'El ajuste fija el stock a este número.' : undefined"
        >
          <KmNumero :id="id" v-model="borrador.cantidad" :min="0" :invalido="invalido" />
        </KmField>
      </div>

      <KmField v-slot="{ id }" label="Motivo" ayuda="Quedará en el kardex.">
        <KmInput :id="id" v-model="borrador.motivo" placeholder="Compra a proveedor, recuento…" />
      </KmField>
    </div>

    <template #footer>
      <KmButton variante="fantasma" @click="abierto = false">Cancelar</KmButton>
      <KmButton :cargando="guardando" @click="guardar">Registrar</KmButton>
    </template>
  </KmDrawer>
</template>
