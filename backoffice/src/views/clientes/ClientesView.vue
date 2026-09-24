<script setup lang="ts">
import KmBadge from '@/components/ui/KmBadge.vue'
import KmCatalogo from '@/components/ui/KmCatalogo.vue'
import KmField from '@/components/ui/KmField.vue'
import KmInput from '@/components/ui/KmInput.vue'
import KmSelect from '@/components/ui/KmSelect.vue'
import KmSwitch from '@/components/ui/KmSwitch.vue'
import { clientesService } from '@/services/clientes.service'
import type { Cliente, NuevoCliente, TipoDocumento } from '@/types'
import type { ColumnaTabla, OpcionSelect } from '@/types/ui'
import { etiquetaDocumento } from '@/utils/formato'

/**
 * El cliente es quien paga y quien aprueba el presupuesto; el vehículo es lo
 * que se repara. Se guardan por separado a propósito: un coche cambia de dueño
 * sin perder su historial, y una flota tiene muchos coches con un solo dueño.
 */

const columnas: ColumnaTabla[] = [
  { clave: 'nombre', etiqueta: 'Cliente', ordenable: true },
  { clave: 'documento', etiqueta: 'Documento', clase: 'w-48' },
  { clave: 'telefono', etiqueta: 'Contacto', clase: 'w-56' },
  { clave: 'esEmpresa', etiqueta: 'Tipo', clase: 'w-32' },
]

const documentos: OpcionSelect[] = (['dni', 'ce', 'ruc'] as TipoDocumento[]).map((d) => ({
  valor: d,
  etiqueta: etiquetaDocumento[d],
}))

const nuevo = (): NuevoCliente => ({
  tipoDocumento: 'dni',
  documento: '',
  nombre: '',
  email: '',
  telefono: '',
  esEmpresa: false,
  notas: '',
  activo: true,
})

function validar(c: NuevoCliente): Record<string, string> {
  const errores: Record<string, string> = {}
  if (!c.nombre.trim()) errores.nombre = 'El nombre es obligatorio.'
  if (!c.documento.trim()) errores.documento = 'El documento es obligatorio.'
  if (c.esEmpresa && c.tipoDocumento !== 'ruc') {
    errores.tipoDocumento = 'Una empresa se identifica con RUC.'
  }
  if (!c.telefono?.trim()) {
    errores.telefono = 'Sin teléfono no se puede pedir la aprobación del presupuesto.'
  }
  return errores
}
</script>

<template>
  <KmCatalogo
    titulo="Clientes"
    subtitulo="Quién es el dueño del vehículo y quién aprueba el presupuesto."
    entidad="cliente"
    :servicio="clientesService"
    :columnas="columnas"
    :nuevo="nuevo"
    :validar="validar"
    :nombre-de="(c: Cliente) => c.nombre"
    :exportacion="[
      { etiqueta: 'Cliente', valor: (c: Cliente) => c.nombre },
      { etiqueta: 'Documento', valor: (c: Cliente) => c.documento },
      { etiqueta: 'Teléfono', valor: (c: Cliente) => c.telefono ?? '' },
      { etiqueta: 'Empresa', valor: (c: Cliente) => c.esEmpresa },
    ]"
    archivo="clientes"
  >
    <template #col-nombre="{ fila }">
      <span class="font-medium text-tinta">{{ fila.nombre }}</span>
      <span v-if="fila.notas" class="block truncate text-xs text-tenue">{{ fila.notas }}</span>
    </template>
    <template #col-documento="{ fila }">
      <span class="text-sm text-tinta tabular-nums">{{ fila.documento }}</span>
      <span class="block text-xs text-tenue">{{ etiquetaDocumento[fila.tipoDocumento] }}</span>
    </template>
    <template #col-telefono="{ fila }">
      <span class="text-sm text-tinta tabular-nums">{{ fila.telefono ?? '—' }}</span>
      <span v-if="fila.email" class="block truncate text-xs text-tenue">{{ fila.email }}</span>
    </template>
    <template #col-esEmpresa="{ fila }">
      <KmBadge :tono="fila.esEmpresa ? 'acero' : 'neutro'">
        {{ fila.esEmpresa ? 'Flota' : 'Particular' }}
      </KmBadge>
    </template>

    <template #formulario="{ borrador, errores }">
      <KmField
        v-slot="{ id, invalido }"
        label="Nombre o razón social"
        :error="errores.nombre"
        requerido
      >
        <KmInput :id="id" v-model="borrador.nombre" :invalido="invalido" />
      </KmField>

      <div class="grid gap-4 sm:grid-cols-2">
        <KmField v-slot="{ id }" label="Tipo de documento" :error="errores.tipoDocumento">
          <KmSelect :id="id" v-model="borrador.tipoDocumento" :opciones="documentos" />
        </KmField>
        <KmField v-slot="{ id, invalido }" label="Documento" :error="errores.documento" requerido>
          <KmInput :id="id" v-model="borrador.documento" :invalido="invalido" />
        </KmField>
      </div>

      <div class="grid gap-4 sm:grid-cols-2">
        <KmField
          v-slot="{ id, invalido }"
          label="Teléfono"
          :error="errores.telefono"
          ayuda="Por aquí se aprueba el presupuesto."
          requerido
        >
          <KmInput :id="id" v-model="borrador.telefono" :invalido="invalido" />
        </KmField>
        <KmField v-slot="{ id }" label="Correo">
          <KmInput :id="id" v-model="borrador.email" type="email" />
        </KmField>
      </div>

      <KmField v-slot="{ id }" label="Notas del asesor" ayuda="Forma de pago, quién autoriza…">
        <KmInput :id="id" v-model="borrador.notas" />
      </KmField>

      <KmSwitch
        v-model="borrador.esEmpresa"
        etiqueta="Es empresa con flota"
        descripcion="Cambia el trato comercial y obliga a facturar con RUC."
      />
      <KmSwitch v-model="borrador.activo" etiqueta="Cliente activo" />
    </template>
  </KmCatalogo>
</template>
