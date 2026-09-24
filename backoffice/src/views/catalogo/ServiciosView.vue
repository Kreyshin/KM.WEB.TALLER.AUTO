<script setup lang="ts">
import KmBadge from '@/components/ui/KmBadge.vue'
import KmCatalogo from '@/components/ui/KmCatalogo.vue'
import KmField from '@/components/ui/KmField.vue'
import KmInput from '@/components/ui/KmInput.vue'
import KmNumero from '@/components/ui/KmNumero.vue'
import KmSelect from '@/components/ui/KmSelect.vue'
import KmSwitch from '@/components/ui/KmSwitch.vue'
import { catalogoService } from '@/services/catalogo.service'
import type { Especialidad, NuevoServicio, Servicio } from '@/types'
import type { ColumnaTabla, OpcionSelect } from '@/types/ui'
import { etiquetaEspecialidad, formatearHoras, formatearSoles } from '@/utils/formato'

/**
 * Catálogo de mano de obra.
 *
 * El **tiempo baremo** es lo que sostiene todo el taller: sin él se cotiza a
 * ojo, no se puede prometer una hora de entrega y no hay forma de saber si el
 * taller rinde. Con él, el precio de un trabajo es una multiplicación y el
 * rendimiento del técnico es una comparación.
 */

const columnas: ColumnaTabla[] = [
  { clave: 'codigo', etiqueta: 'Código', clase: 'w-28', ordenable: true },
  { clave: 'nombre', etiqueta: 'Servicio', ordenable: true },
  { clave: 'especialidad', etiqueta: 'Especialidad', clase: 'w-48' },
  { clave: 'horas', etiqueta: 'Baremo', clase: 'w-28 text-right', ordenable: true },
  { clave: 'precioHora', etiqueta: 'Precio', clase: 'w-44 text-right', ordenable: true },
]

const especialidades: OpcionSelect[] = (
  [
    'mecanica',
    'electricidad',
    'electronica',
    'suspension',
    'frenos',
    'planchado',
    'pintura',
    'aire',
  ] as Especialidad[]
).map((e) => ({ valor: e, etiqueta: etiquetaEspecialidad[e] }))

const nuevo = (): NuevoServicio => ({
  codigo: '',
  nombre: '',
  descripcion: '',
  especialidad: 'mecanica',
  horas: 1,
  precioHora: 60,
  activo: true,
})

function validar(s: NuevoServicio): Record<string, string> {
  const errores: Record<string, string> = {}
  if (!s.codigo.trim()) errores.codigo = 'El código es obligatorio.'
  if (!s.nombre.trim()) errores.nombre = 'El nombre es obligatorio.'
  if (s.horas <= 0) errores.horas = 'El baremo debe ser mayor que cero.'
  if (s.precioHora <= 0) errores.precioHora = 'El precio por hora debe ser mayor que cero.'
  return errores
}
</script>

<template>
  <KmCatalogo
    titulo="Servicios y baremos"
    subtitulo="Cada trabajo con su tiempo estándar: con él se cotiza y se promete una entrega."
    entidad="servicio"
    :servicio="catalogoService.servicios"
    :columnas="columnas"
    :orden="{ campo: 'codigo', direccion: 'asc' }"
    :nuevo="nuevo"
    :validar="validar"
    :nombre-de="(s: Servicio) => s.nombre"
    :exportacion="[
      { etiqueta: 'Código', valor: (s: Servicio) => s.codigo },
      { etiqueta: 'Servicio', valor: (s: Servicio) => s.nombre },
      { etiqueta: 'Especialidad', valor: (s: Servicio) => etiquetaEspecialidad[s.especialidad] },
      { etiqueta: 'Horas baremo', valor: (s: Servicio) => s.horas },
      { etiqueta: 'Precio hora', valor: (s: Servicio) => s.precioHora },
      { etiqueta: 'Precio total', valor: (s: Servicio) => s.horas * s.precioHora },
    ]"
    archivo="servicios"
  >
    <template #col-codigo="{ fila }">
      <span class="ts-placa text-xs text-tinta">{{ fila.codigo }}</span>
    </template>
    <template #col-nombre="{ fila }">
      <span class="font-medium text-tinta">{{ fila.nombre }}</span>
      <span v-if="fila.descripcion" class="block truncate text-xs text-tenue">
        {{ fila.descripcion }}
      </span>
    </template>
    <template #col-especialidad="{ fila }">
      <KmBadge tono="acero">{{ etiquetaEspecialidad[fila.especialidad] }}</KmBadge>
    </template>
    <template #col-horas="{ fila }">
      <span class="text-sm text-tinta tabular-nums">{{ formatearHoras(fila.horas) }}</span>
    </template>
    <template #col-precioHora="{ fila }">
      <span class="ts-display text-sm font-semibold text-tinta tabular-nums">
        {{ formatearSoles(fila.horas * fila.precioHora) }}
      </span>
      <span class="block text-xs text-tenue tabular-nums">
        {{ formatearSoles(fila.precioHora) }}/h
      </span>
    </template>

    <template #formulario="{ borrador, errores }">
      <div class="grid gap-4 sm:grid-cols-[8rem_1fr]">
        <KmField v-slot="{ id, invalido }" label="Código" :error="errores.codigo" requerido>
          <KmInput :id="id" v-model="borrador.codigo" placeholder="MEC-01" :invalido="invalido" />
        </KmField>
        <KmField v-slot="{ id, invalido }" label="Nombre" :error="errores.nombre" requerido>
          <KmInput
            :id="id"
            v-model="borrador.nombre"
            placeholder="Cambio de aceite y filtro"
            :invalido="invalido"
          />
        </KmField>
      </div>

      <KmField v-slot="{ id }" label="Descripción">
        <KmInput :id="id" v-model="borrador.descripcion" placeholder="Qué incluye el trabajo" />
      </KmField>

      <KmField v-slot="{ id }" label="Especialidad" ayuda="Decide qué técnico puede tomarlo.">
        <KmSelect :id="id" v-model="borrador.especialidad" :opciones="especialidades" />
      </KmField>

      <div class="grid gap-4 sm:grid-cols-2">
        <KmField
          v-slot="{ id }"
          label="Tiempo baremo (horas)"
          :error="errores.horas"
          ayuda="Lo que el trabajo debería costar, no lo que costó."
        >
          <KmNumero :id="id" v-model="borrador.horas" :min="0.1" :step="0.1" />
        </KmField>
        <KmField v-slot="{ id }" label="Precio de la hora" :error="errores.precioHora">
          <KmNumero :id="id" v-model="borrador.precioHora" :min="0" :step="5" />
        </KmField>
      </div>

      <p class="ts-tono ts-tono-neutro rounded-control border px-3 py-2 text-sm">
        Precio del servicio:
        <strong class="tabular-nums">
          {{ formatearSoles((borrador.horas || 0) * (borrador.precioHora || 0)) }}
        </strong>
      </p>

      <KmSwitch
        v-model="borrador.activo"
        etiqueta="Servicio activo"
        descripcion="Uno inactivo deja de ofrecerse, pero sigue en el histórico de órdenes."
      />
    </template>
  </KmCatalogo>
</template>
