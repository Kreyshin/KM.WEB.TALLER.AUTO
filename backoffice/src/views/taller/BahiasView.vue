<script setup lang="ts">
import { computed } from 'vue'
import KmBadge from '@/components/ui/KmBadge.vue'
import KmCatalogo from '@/components/ui/KmCatalogo.vue'
import KmField from '@/components/ui/KmField.vue'
import KmInput from '@/components/ui/KmInput.vue'
import KmNumero from '@/components/ui/KmNumero.vue'
import KmSelect from '@/components/ui/KmSelect.vue'
import KmSwitch from '@/components/ui/KmSwitch.vue'
import { bahiasService } from '@/services/bahias.service'
import { useLocalStore } from '@/stores/local.store'
import type { Bahia, NuevaBahia, TipoBahia } from '@/types'
import type { ColumnaTabla, OpcionSelect } from '@/types/ui'
import { etiquetaTipoBahia } from '@/utils/formato'

/**
 * Las bahías son la capacidad real del taller: el número de coches que puede
 * tener dentro a la vez. Todo lo demás —promesas de entrega, agenda de citas,
 * carga de técnicos— se apoya en este número.
 *
 * `operativa` y `activo` son cosas distintas: una bahía en mantenimiento sigue
 * existiendo en el plano (no admite trabajo hoy), mientras que una desactivada
 * desaparece del tablero sin borrar su histórico.
 */

const localStore = useLocalStore()

const columnas: ColumnaTabla[] = [
  { clave: 'codigo', etiqueta: 'Código', clase: 'w-28', ordenable: true },
  { clave: 'nombre', etiqueta: 'Puesto', ordenable: true },
  { clave: 'tipo', etiqueta: 'Tipo', clase: 'w-48' },
  { clave: 'posicion', etiqueta: 'Posición', clase: 'w-28 text-right', ordenable: true },
  { clave: 'operativa', etiqueta: 'Disponibilidad', clase: 'w-52' },
]

const tipos: OpcionSelect[] = (
  ['elevador', 'plano', 'alineacion', 'diagnostico', 'pintura'] as TipoBahia[]
).map((t) => ({ valor: t, etiqueta: etiquetaTipoBahia[t] }))

const filtrosFijos = computed(() => ({ localId: localStore.localId ?? '' }))

const nuevo = (): NuevaBahia => ({
  codigo: '',
  nombre: '',
  localId: localStore.localId ?? '',
  tipo: 'elevador',
  posicion: 1,
  operativa: true,
  activo: true,
})

function validar(b: NuevaBahia): Record<string, string> {
  const errores: Record<string, string> = {}
  if (!b.codigo.trim()) errores.codigo = 'El código es obligatorio.'
  if (!b.nombre.trim()) errores.nombre = 'El nombre es obligatorio.'
  if (!b.operativa && !b.nota?.trim()) {
    errores.nota = 'Si no está operativa, indica por qué.'
  }
  return errores
}
</script>

<template>
  <KmCatalogo
    titulo="Bahías"
    subtitulo="Los puestos de trabajo de esta sede: la capacidad real del taller."
    entidad="bahía"
    femenino
    :servicio="bahiasService"
    :columnas="columnas"
    :filtros-fijos="filtrosFijos"
    :orden="{ campo: 'posicion', direccion: 'asc' }"
    :nuevo="nuevo"
    :validar="validar"
    :nombre-de="(b: Bahia) => `${b.codigo} · ${b.nombre}`"
    :exportacion="[
      { etiqueta: 'Código', valor: (b: Bahia) => b.codigo },
      { etiqueta: 'Puesto', valor: (b: Bahia) => b.nombre },
      { etiqueta: 'Tipo', valor: (b: Bahia) => etiquetaTipoBahia[b.tipo] },
      { etiqueta: 'Operativa', valor: (b: Bahia) => b.operativa },
    ]"
    archivo="bahias"
  >
    <template #col-codigo="{ fila }">
      <span class="ts-placa text-xs text-tinta">{{ fila.codigo }}</span>
    </template>
    <template #col-nombre="{ fila }">
      <span class="font-medium text-tinta">{{ fila.nombre }}</span>
      <span v-if="fila.nota" class="block text-xs text-tenue">{{ fila.nota }}</span>
    </template>
    <template #col-tipo="{ fila }">
      <KmBadge tono="acero">{{ etiquetaTipoBahia[fila.tipo] }}</KmBadge>
    </template>
    <template #col-posicion="{ fila }">
      <span class="text-sm text-tenue tabular-nums">{{ fila.posicion }}</span>
    </template>
    <template #col-operativa="{ fila }">
      <KmBadge :tono="fila.operativa ? 'verde' : 'ambar'">
        {{ fila.operativa ? '✓ Operativa' : '⚠ En mantenimiento' }}
      </KmBadge>
    </template>

    <template #formulario="{ borrador, errores }">
      <div class="grid gap-4 sm:grid-cols-2">
        <KmField v-slot="{ id, invalido }" label="Código" :error="errores.codigo" requerido>
          <KmInput :id="id" v-model="borrador.codigo" placeholder="B-01" :invalido="invalido" />
        </KmField>
        <KmField v-slot="{ id, invalido }" label="Nombre" :error="errores.nombre" requerido>
          <KmInput
            :id="id"
            v-model="borrador.nombre"
            placeholder="Elevador 1"
            :invalido="invalido"
          />
        </KmField>
      </div>

      <div class="grid gap-4 sm:grid-cols-2">
        <KmField v-slot="{ id }" label="Tipo de puesto">
          <KmSelect :id="id" v-model="borrador.tipo" :opciones="tipos" />
        </KmField>
        <KmField
          v-slot="{ id }"
          label="Posición en el plano"
          ayuda="Ordena el tablero de izquierda a derecha."
        >
          <KmNumero :id="id" v-model="borrador.posicion" :min="1" :max="99" />
        </KmField>
      </div>

      <KmSwitch
        v-model="borrador.operativa"
        etiqueta="Bahía operativa"
        descripcion="Si no lo está, no se le puede asignar ninguna orden."
      />

      <KmField
        v-if="!borrador.operativa"
        v-slot="{ id, invalido }"
        label="Motivo"
        :error="errores.nota"
        requerido
      >
        <KmInput
          :id="id"
          v-model="borrador.nota"
          placeholder="Elevador en mantenimiento hasta el viernes"
          :invalido="invalido"
        />
      </KmField>

      <KmSwitch
        v-model="borrador.activo"
        etiqueta="Bahía activa"
        descripcion="Una bahía inactiva sale del tablero pero conserva su histórico."
      />
    </template>
  </KmCatalogo>
</template>
