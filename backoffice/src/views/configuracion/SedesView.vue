<script setup lang="ts">
import KmCatalogo from '@/components/ui/KmCatalogo.vue'
import KmField from '@/components/ui/KmField.vue'
import KmInput from '@/components/ui/KmInput.vue'
import KmSwitch from '@/components/ui/KmSwitch.vue'
import { localesService } from '@/services/locales.service'
import type { Local, NuevoLocal } from '@/types'
import type { ColumnaTabla } from '@/types/ui'

/**
 * Talleres de la cadena. Cada uno tiene sus bahías, su almacén y su serie de
 * comprobantes, así que la sede es el primer filtro de casi todo el sistema.
 */

const columnas: ColumnaTabla[] = [
  { clave: 'nombre', etiqueta: 'Taller', ordenable: true },
  { clave: 'direccion', etiqueta: 'Dirección' },
  { clave: 'telefono', etiqueta: 'Teléfono', clase: 'w-40' },
  { clave: 'codigoEstablecimiento', etiqueta: 'Cód. SUNAT', clase: 'w-36', ordenable: true },
]

const nuevo = (): NuevoLocal => ({
  nombre: '',
  direccion: '',
  distrito: '',
  codigoEstablecimiento: '',
  activo: true,
})

function validar(l: NuevoLocal): Record<string, string> {
  const errores: Record<string, string> = {}
  if (!l.nombre.trim()) errores.nombre = 'El nombre es obligatorio.'
  if (!l.direccion.trim()) errores.direccion = 'La dirección es obligatoria.'
  if (!/^\d{4}$/.test(l.codigoEstablecimiento)) {
    errores.codigoEstablecimiento = 'Son 4 dígitos, p. ej. 0001.'
  }
  return errores
}
</script>

<template>
  <KmCatalogo
    titulo="Sedes"
    subtitulo="Talleres de la cadena. Cada uno tiene sus bahías, su almacén y su serie."
    entidad="sede"
    femenino
    :servicio="localesService"
    :columnas="columnas"
    :nuevo="nuevo"
    :validar="validar"
    :nombre-de="(l: Local) => l.nombre"
  >
    <template #col-nombre="{ fila }">
      <span class="font-medium text-tinta">{{ fila.nombre }}</span>
    </template>
    <template #col-direccion="{ fila }">
      <span class="text-sm text-tinta">{{ fila.direccion }}</span>
      <span class="block text-xs text-tenue">{{ fila.distrito }}</span>
    </template>
    <template #col-telefono="{ fila }">
      <span class="text-sm text-tenue tabular-nums">{{ fila.telefono ?? '—' }}</span>
    </template>
    <template #col-codigoEstablecimiento="{ fila }">
      <span class="font-mono text-xs text-tenue">{{ fila.codigoEstablecimiento }}</span>
    </template>

    <template #formulario="{ borrador, errores }">
      <KmField v-slot="{ id, invalido }" label="Nombre" :error="errores.nombre" requerido>
        <KmInput :id="id" v-model="borrador.nombre" :invalido="invalido" />
      </KmField>
      <KmField v-slot="{ id, invalido }" label="Dirección" :error="errores.direccion" requerido>
        <KmInput :id="id" v-model="borrador.direccion" :invalido="invalido" />
      </KmField>
      <div class="grid gap-4 sm:grid-cols-2">
        <KmField v-slot="{ id }" label="Distrito">
          <KmInput :id="id" v-model="borrador.distrito" />
        </KmField>
        <KmField v-slot="{ id }" label="Teléfono">
          <KmInput :id="id" v-model="borrador.telefono" />
        </KmField>
      </div>
      <KmField
        v-slot="{ id, invalido }"
        label="Código de establecimiento"
        :error="errores.codigoEstablecimiento"
        ayuda="El que declara SUNAT para esta sede."
        requerido
      >
        <KmInput
          :id="id"
          v-model="borrador.codigoEstablecimiento"
          placeholder="0001"
          :invalido="invalido"
        />
      </KmField>
      <KmSwitch v-model="borrador.activo" etiqueta="Sede activa" />
    </template>
  </KmCatalogo>
</template>
