<script setup lang="ts">
import KmBadge from '@/components/ui/KmBadge.vue'
import KmCatalogo from '@/components/ui/KmCatalogo.vue'
import KmField from '@/components/ui/KmField.vue'
import KmInput from '@/components/ui/KmInput.vue'
import KmNumero from '@/components/ui/KmNumero.vue'
import KmSelect from '@/components/ui/KmSelect.vue'
import KmSwitch from '@/components/ui/KmSwitch.vue'
import { almacenService } from '@/services/almacen.service'
import type { CategoriaRepuesto, NuevoRepuesto, Repuesto } from '@/types'
import type { ColumnaTabla, OpcionSelect } from '@/types/ui'
import { etiquetaCategoriaRepuesto, formatearSoles } from '@/utils/formato'

/**
 * Almacén de repuestos.
 *
 * El stock mínimo no es un adorno: la causa más común de que una orden se
 * quede detenida es que falta una pieza que se sabía que iba a hacer falta.
 * Por eso el listado avisa antes de llegar a cero, no cuando ya llegó.
 */

const columnas: ColumnaTabla[] = [
  { clave: 'codigo', etiqueta: 'Código', clase: 'w-32', ordenable: true },
  { clave: 'nombre', etiqueta: 'Repuesto', ordenable: true },
  { clave: 'categoria', etiqueta: 'Categoría', clase: 'w-44' },
  { clave: 'stock', etiqueta: 'Stock', clase: 'w-44', ordenable: true },
  { clave: 'precio', etiqueta: 'Precio', clase: 'w-36 text-right', ordenable: true },
  { clave: 'ubicacion', etiqueta: 'Ubicación', clase: 'w-32' },
]

const categorias: OpcionSelect[] = (
  [
    'filtros',
    'lubricantes',
    'frenos',
    'suspension',
    'electrico',
    'motor',
    'carroceria',
    'consumibles',
  ] as CategoriaRepuesto[]
).map((c) => ({ valor: c, etiqueta: etiquetaCategoriaRepuesto[c] }))

const nuevo = (): NuevoRepuesto => ({
  codigo: '',
  nombre: '',
  categoria: 'filtros',
  marca: '',
  numeroParte: '',
  costo: 0,
  precio: 0,
  stock: 0,
  stockMinimo: 2,
  ubicacion: '',
  activo: true,
})

function validar(r: NuevoRepuesto): Record<string, string> {
  const errores: Record<string, string> = {}
  if (!r.codigo.trim()) errores.codigo = 'El código es obligatorio.'
  if (!r.nombre.trim()) errores.nombre = 'El nombre es obligatorio.'
  if (r.precio < r.costo) errores.precio = 'El precio de venta no puede ser menor que el costo.'
  if (r.stockMinimo < 0) errores.stockMinimo = 'El mínimo no puede ser negativo.'
  return errores
}

/** El margen se enseña al editar: nadie debería fijar un precio a ciegas. */
function margen(costo: number, precio: number) {
  if (!precio) return '—'
  return `${Math.round(((precio - costo) / precio) * 100)} %`
}
</script>

<template>
  <KmCatalogo
    titulo="Repuestos"
    subtitulo="Lo que hay en el almacén y a partir de cuándo hay que reponer."
    entidad="repuesto"
    :servicio="almacenService"
    :columnas="columnas"
    :orden="{ campo: 'nombre', direccion: 'asc' }"
    :nuevo="nuevo"
    :validar="validar"
    :nombre-de="(r: Repuesto) => r.nombre"
    ancho-drawer="lg"
    :exportacion="[
      { etiqueta: 'Código', valor: (r: Repuesto) => r.codigo },
      { etiqueta: 'Repuesto', valor: (r: Repuesto) => r.nombre },
      { etiqueta: 'Categoría', valor: (r: Repuesto) => etiquetaCategoriaRepuesto[r.categoria] },
      { etiqueta: 'Stock', valor: (r: Repuesto) => r.stock },
      { etiqueta: 'Stock mínimo', valor: (r: Repuesto) => r.stockMinimo },
      { etiqueta: 'Costo', valor: (r: Repuesto) => r.costo },
      { etiqueta: 'Precio', valor: (r: Repuesto) => r.precio },
    ]"
    archivo="repuestos"
  >
    <template #col-codigo="{ fila }">
      <span class="ts-placa text-xs text-tinta">{{ fila.codigo }}</span>
    </template>
    <template #col-nombre="{ fila }">
      <span class="font-medium text-tinta">{{ fila.nombre }}</span>
      <span class="block text-xs text-tenue">
        {{ fila.marca ?? '' }}
        <span v-if="fila.numeroParte" class="ts-placa">· {{ fila.numeroParte }}</span>
      </span>
    </template>
    <template #col-categoria="{ fila }">
      <KmBadge tono="neutro">{{ etiquetaCategoriaRepuesto[fila.categoria] }}</KmBadge>
    </template>
    <!-- Bajo mínimo: color + glifo + palabra, nunca solo color. -->
    <template #col-stock="{ fila }">
      <span class="text-sm font-semibold text-tinta tabular-nums">{{ fila.stock }}</span>
      <span class="text-xs text-tenue"> / mín. {{ fila.stockMinimo }}</span>
      <KmBadge v-if="fila.stock === 0" tono="rojo" class="ml-1.5">✕ Sin stock</KmBadge>
      <KmBadge v-else-if="fila.stock <= fila.stockMinimo" tono="ambar" class="ml-1.5">
        ⚠ Reponer
      </KmBadge>
    </template>
    <template #col-precio="{ fila }">
      <span class="ts-display text-sm font-semibold text-tinta tabular-nums">
        {{ formatearSoles(fila.precio) }}
      </span>
      <span class="block text-xs text-tenue tabular-nums">
        margen {{ margen(fila.costo, fila.precio) }}
      </span>
    </template>
    <template #col-ubicacion="{ fila }">
      <span class="ts-placa text-xs text-tenue">{{ fila.ubicacion ?? '—' }}</span>
    </template>

    <template #formulario="{ borrador, errores }">
      <div class="grid gap-4 sm:grid-cols-[9rem_1fr]">
        <KmField v-slot="{ id, invalido }" label="Código" :error="errores.codigo" requerido>
          <KmInput :id="id" v-model="borrador.codigo" placeholder="FIL-001" :invalido="invalido" />
        </KmField>
        <KmField v-slot="{ id, invalido }" label="Nombre" :error="errores.nombre" requerido>
          <KmInput
            :id="id"
            v-model="borrador.nombre"
            placeholder="Filtro de aceite"
            :invalido="invalido"
          />
        </KmField>
      </div>

      <div class="grid gap-4 sm:grid-cols-3">
        <KmField v-slot="{ id }" label="Categoría">
          <KmSelect :id="id" v-model="borrador.categoria" :opciones="categorias" />
        </KmField>
        <KmField v-slot="{ id }" label="Marca">
          <KmInput :id="id" v-model="borrador.marca" />
        </KmField>
        <KmField v-slot="{ id }" label="Número de parte" ayuda="Lo que identifica la pieza exacta.">
          <KmInput :id="id" v-model="borrador.numeroParte" />
        </KmField>
      </div>

      <div class="grid gap-4 sm:grid-cols-2">
        <KmField v-slot="{ id }" label="Costo">
          <KmNumero :id="id" v-model="borrador.costo" :min="0" :step="1" />
        </KmField>
        <KmField v-slot="{ id }" label="Precio de venta" :error="errores.precio">
          <KmNumero :id="id" v-model="borrador.precio" :min="0" :step="1" />
        </KmField>
      </div>

      <div class="grid gap-4 sm:grid-cols-3">
        <KmField v-slot="{ id }" label="Stock" ayuda="Se ajusta desde Movimientos, no aquí.">
          <KmNumero :id="id" v-model="borrador.stock" :min="0" />
        </KmField>
        <KmField
          v-slot="{ id }"
          label="Stock mínimo"
          :error="errores.stockMinimo"
          ayuda="Por debajo, el almacén avisa."
        >
          <KmNumero :id="id" v-model="borrador.stockMinimo" :min="0" />
        </KmField>
        <KmField v-slot="{ id }" label="Ubicación">
          <KmInput :id="id" v-model="borrador.ubicacion" placeholder="A-3-2" />
        </KmField>
      </div>

      <KmSwitch v-model="borrador.activo" etiqueta="Repuesto activo" />
    </template>
  </KmCatalogo>
</template>
