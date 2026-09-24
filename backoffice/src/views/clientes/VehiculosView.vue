<script setup lang="ts">
import { onMounted, ref } from 'vue'
import KmBadge from '@/components/ui/KmBadge.vue'
import KmCatalogo, { type ServicioCatalogo } from '@/components/ui/KmCatalogo.vue'
import KmField from '@/components/ui/KmField.vue'
import KmInput from '@/components/ui/KmInput.vue'
import KmNumero from '@/components/ui/KmNumero.vue'
import KmSelect from '@/components/ui/KmSelect.vue'
import KmSwitch from '@/components/ui/KmSwitch.vue'
import { clientesService } from '@/services/clientes.service'
import { vehiculosService } from '@/services/vehiculos.service'
import type { Combustible, Transmision, VehiculoResuelto } from '@/types'
import type { ColumnaTabla, OpcionSelect } from '@/types/ui'
import { etiquetaCombustible, etiquetaTransmision, formatearKm } from '@/utils/formato'

/**
 * El vehículo, no el cliente, es la unidad que atiende el taller: el historial
 * de reparaciones cuelga de la placa aunque el coche cambie de dueño. Por eso
 * la placa es la clave de búsqueda de todo el sistema.
 */

const propietarios = ref<OpcionSelect[]>([])

onMounted(async () => {
  const { items } = await clientesService.consultar({ porPagina: 300 })
  propietarios.value = items.map((c) => ({ valor: c.id, etiqueta: c.nombre }))
})

/**
 * KmCatalogo lista vehículos con su propietario ya resuelto, así que el alta y
 * la edición devuelven también la forma resuelta.
 */
const servicio: ServicioCatalogo<VehiculoResuelto> = {
  consultar: vehiculosService.consultarResueltos,
  async crear(datos) {
    const creado = await vehiculosService.crear(datos)
    return vehiculosService.obtenerResuelto(creado.id)
  },
  async actualizar(id, datos) {
    await vehiculosService.actualizar(id, datos)
    return vehiculosService.obtenerResuelto(id)
  },
  eliminar: vehiculosService.eliminar,
}

const columnas: ColumnaTabla[] = [
  { clave: 'placa', etiqueta: 'Placa', clase: 'w-36', ordenable: true },
  { clave: 'marca', etiqueta: 'Vehículo', ordenable: true },
  { clave: 'clienteId', etiqueta: 'Propietario', clase: 'w-60' },
  { clave: 'kilometraje', etiqueta: 'Kilometraje', clase: 'w-40 text-right', ordenable: true },
  { clave: 'combustible', etiqueta: 'Motorización', clase: 'w-48' },
]

const combustibles: OpcionSelect[] = (
  ['gasolina', 'diesel', 'glp', 'gnv', 'hibrido', 'electrico'] as Combustible[]
).map((c) => ({ valor: c, etiqueta: etiquetaCombustible[c] }))

const transmisiones: OpcionSelect[] = (['manual', 'automatica', 'cvt'] as Transmision[]).map(
  (t) => ({ valor: t, etiqueta: etiquetaTransmision[t] }),
)

const nuevo = (): Omit<VehiculoResuelto, 'id'> => ({
  placa: '',
  clienteId: '',
  marca: '',
  modelo: '',
  anio: new Date().getFullYear(),
  vin: '',
  motor: '',
  combustible: 'gasolina',
  transmision: 'manual',
  color: '',
  kilometraje: 0,
  activo: true,
})

function validar(v: Omit<VehiculoResuelto, 'id'>): Record<string, string> {
  const errores: Record<string, string> = {}
  if (!/^[A-Z][A-Z0-9]{2}-[0-9][A-Z0-9]{2}$/.test(v.placa.trim().toUpperCase())) {
    errores.placa = 'Formato de placa esperado: ABC-123.'
  }
  if (!v.clienteId) errores.clienteId = 'Elige el propietario.'
  if (!v.marca.trim()) errores.marca = 'La marca es obligatoria.'
  if (!v.modelo.trim()) errores.modelo = 'El modelo es obligatorio.'
  if (v.vin && v.vin.trim().length !== 17) errores.vin = 'El VIN tiene 17 caracteres.'
  return errores
}
</script>

<template>
  <KmCatalogo
    titulo="Vehículos"
    subtitulo="La ficha por placa: lo que entra al taller y todo lo que se le ha hecho."
    entidad="vehículo"
    :servicio="servicio"
    :columnas="columnas"
    :nuevo="nuevo"
    :validar="validar"
    :nombre-de="(v: VehiculoResuelto) => `${v.placa} · ${v.marca} ${v.modelo}`"
    ancho-drawer="lg"
    :exportacion="[
      { etiqueta: 'Placa', valor: (v: VehiculoResuelto) => v.placa },
      { etiqueta: 'Marca', valor: (v: VehiculoResuelto) => v.marca },
      { etiqueta: 'Modelo', valor: (v: VehiculoResuelto) => v.modelo },
      { etiqueta: 'Año', valor: (v: VehiculoResuelto) => v.anio },
      { etiqueta: 'Propietario', valor: (v: VehiculoResuelto) => v.cliente?.nombre ?? '' },
      { etiqueta: 'Kilometraje', valor: (v: VehiculoResuelto) => v.kilometraje },
    ]"
    archivo="vehiculos"
  >
    <template #col-placa="{ fila }">
      <span class="ts-placa text-sm text-tinta">{{ fila.placa }}</span>
    </template>
    <template #col-marca="{ fila }">
      <span class="font-medium text-tinta">{{ fila.marca }} {{ fila.modelo }}</span>
      <span class="block text-xs text-tenue">
        {{ fila.anio }}<span v-if="fila.color"> · {{ fila.color }}</span>
      </span>
    </template>
    <template #col-clienteId="{ fila }">
      <span class="text-sm text-tinta">{{ fila.cliente?.nombre ?? '—' }}</span>
      <span v-if="fila.cliente?.esEmpresa" class="block text-xs text-tenue">Flota</span>
    </template>
    <template #col-kilometraje="{ fila }">
      <span class="text-sm text-tinta tabular-nums">{{ formatearKm(fila.kilometraje) }}</span>
    </template>
    <template #col-combustible="{ fila }">
      <KmBadge tono="neutro">{{ etiquetaCombustible[fila.combustible] }}</KmBadge>
      <span class="ml-1 text-xs text-tenue">{{ etiquetaTransmision[fila.transmision] }}</span>
    </template>

    <template #formulario="{ borrador, errores }">
      <div class="grid gap-4 sm:grid-cols-2">
        <KmField
          v-slot="{ id, invalido }"
          label="Placa"
          :error="errores.placa"
          ayuda="Como aparece en la tarjeta de propiedad."
          requerido
        >
          <KmInput :id="id" v-model="borrador.placa" placeholder="ABC-123" :invalido="invalido" />
        </KmField>
        <KmField v-slot="{ id, invalido }" label="Propietario" :error="errores.clienteId" requerido>
          <KmSelect
            :id="id"
            v-model="borrador.clienteId"
            :opciones="propietarios"
            :invalido="invalido"
            placeholder="Elige un cliente"
          />
        </KmField>
      </div>

      <div class="grid gap-4 sm:grid-cols-3">
        <KmField v-slot="{ id, invalido }" label="Marca" :error="errores.marca" requerido>
          <KmInput :id="id" v-model="borrador.marca" placeholder="Toyota" :invalido="invalido" />
        </KmField>
        <KmField v-slot="{ id, invalido }" label="Modelo" :error="errores.modelo" requerido>
          <KmInput :id="id" v-model="borrador.modelo" placeholder="Hilux" :invalido="invalido" />
        </KmField>
        <KmField v-slot="{ id }" label="Año">
          <KmNumero :id="id" v-model="borrador.anio" :min="1950" :max="2030" />
        </KmField>
      </div>

      <div class="grid gap-4 sm:grid-cols-2">
        <KmField v-slot="{ id }" label="Combustible">
          <KmSelect :id="id" v-model="borrador.combustible" :opciones="combustibles" />
        </KmField>
        <KmField v-slot="{ id }" label="Transmisión">
          <KmSelect :id="id" v-model="borrador.transmision" :opciones="transmisiones" />
        </KmField>
      </div>

      <div class="grid gap-4 sm:grid-cols-2">
        <KmField
          v-slot="{ id, invalido }"
          label="VIN"
          :error="errores.vin"
          ayuda="17 caracteres. Identifica el repuesto exacto."
        >
          <KmInput :id="id" v-model="borrador.vin" :invalido="invalido" />
        </KmField>
        <KmField v-slot="{ id }" label="Motor">
          <KmInput :id="id" v-model="borrador.motor" />
        </KmField>
      </div>

      <div class="grid gap-4 sm:grid-cols-2">
        <KmField v-slot="{ id }" label="Color">
          <KmInput :id="id" v-model="borrador.color" />
        </KmField>
        <KmField
          v-slot="{ id }"
          label="Kilometraje"
          ayuda="El odómetro nunca retrocede: se corrige solo hacia arriba."
        >
          <KmNumero :id="id" v-model="borrador.kilometraje" :min="0" :step="100" />
        </KmField>
      </div>

      <KmSwitch v-model="borrador.activo" etiqueta="Vehículo activo" />
    </template>
  </KmCatalogo>
</template>
