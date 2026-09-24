<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import KmBadge from '@/components/ui/KmBadge.vue'
import KmBotonIcono from '@/components/ui/KmBotonIcono.vue'
import KmCard from '@/components/ui/KmCard.vue'
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

/**
 * La franja de arriba contesta la pregunta con la que se entra al almacén
 * —«¿qué tengo que pedir?»— antes de que nadie lea una sola fila.
 */
const bajoMinimo = ref<Repuesto[]>([])

onMounted(async () => {
  bajoMinimo.value = await almacenService.bajoMinimo()
})

const agotados = computed(() => bajoMinimo.value.filter((r) => r.stock === 0).length)

/** Lo que cuesta dejar el almacén en su mínimo, al costo. */
const valorReposicion = computed(() =>
  bajoMinimo.value.reduce((s, r) => s + r.costo * Math.max(0, r.stockMinimo - r.stock), 0),
)

/**
 * Nivel de la barra. El mínimo se sitúa siempre a media barra, de modo que
 * «por debajo de la mitad» significa lo mismo en todas las piezas por mucho
 * que sus cantidades no tengan nada que ver.
 */
function nivel(r: Repuesto) {
  const tope = Math.max(r.stockMinimo * 2, r.stock, 1)
  return Math.min(100, (r.stock / tope) * 100)
}

/** El margen se enseña al editar: nadie debería fijar un precio a ciegas. */
function margen(costo: number, precio: number) {
  if (!precio) return '—'
  return `${Math.round(((precio - costo) / precio) * 100)} %`
}
</script>

<template>
  <div class="flex flex-col gap-5">
    <!--
      El parte del almacén. Va arriba y no en un informe porque la falta de una
      pieza es la causa más común de una orden parada, y siempre se sabía.
    -->
    <KmCard
      v-if="bajoMinimo.length"
      titulo="Hay que reponer"
      :subtitulo="`${bajoMinimo.length} referencias por debajo del mínimo.`"
    >
      <div class="flex flex-wrap items-end gap-x-10 gap-y-4">
        <div>
          <p class="ts-etiqueta text-tenue">Sin stock</p>
          <p
            class="ts-display mt-1 text-3xl leading-none font-semibold tabular-nums"
            :class="agotados ? 'text-rojo-texto' : 'text-tinta'"
          >
            {{ agotados }}
          </p>
        </div>
        <div>
          <p class="ts-etiqueta text-tenue">Bajo mínimo</p>
          <p class="ts-display mt-1 text-3xl leading-none font-semibold text-ambar tabular-nums">
            {{ bajoMinimo.length - agotados }}
          </p>
        </div>
        <div>
          <p class="ts-etiqueta text-tenue">Costo de la reposición</p>
          <p class="ts-display mt-1 text-3xl leading-none font-semibold text-tinta tabular-nums">
            {{ formatearSoles(valorReposicion) }}
          </p>
        </div>
      </div>
    </KmCard>

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
      vista-por-defecto="tarjetas"
      sin-tarjeta
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

      <!--
      La tarjeta de stock. Lo que se mira no es el nombre, es la barra: dónde
      está la pieza respecto de su mínimo, que es lo que decide si se pide.
    -->
      <template #tarjeta="{ fila, editar, eliminar }">
        <article
          class="group flex flex-col rounded-card border bg-panel p-4 transition-colors"
          :class="
            fila.stock === 0
              ? 'border-rojo-200'
              : fila.stock <= fila.stockMinimo
                ? 'border-ambar/45'
                : 'border-linea hover:border-acero'
          "
        >
          <header class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <p class="truncate font-medium text-tinta">{{ fila.nombre }}</p>
              <p class="ts-placa text-[10px] text-tenue">
                {{ fila.codigo }}
                <span v-if="fila.numeroParte"> · {{ fila.numeroParte }}</span>
              </p>
            </div>
            <KmBadge tono="neutro">{{ etiquetaCategoriaRepuesto[fila.categoria] }}</KmBadge>
          </header>

          <!-- La barra con la marca del mínimo a media altura. -->
          <div class="mt-4">
            <div class="flex items-baseline justify-between">
              <p class="ts-display text-2xl leading-none font-semibold text-tinta tabular-nums">
                {{ fila.stock }}
                <span class="text-xs font-medium text-tenue">en stock</span>
              </p>
              <p class="text-[11px] text-tenue tabular-nums">mín. {{ fila.stockMinimo }}</p>
            </div>

            <div class="relative mt-2 h-2 overflow-hidden rounded-full bg-panel-2">
              <div
                class="h-full rounded-full transition-[width] duration-500"
                :class="
                  fila.stock === 0
                    ? 'bg-rojo'
                    : fila.stock <= fila.stockMinimo
                      ? 'bg-ambar'
                      : 'bg-verde'
                "
                :style="{ width: `${nivel(fila)}%` }"
              />
              <span class="absolute inset-y-0 left-1/2 w-px bg-tinta/35" aria-hidden="true" />
            </div>
          </div>

          <!--
            El estado nunca se fía del color, pero solo se marca la excepción:
            en una rejilla, una insignia «con holgura» repetida veinte veces
            tapa justo la que hay que ver. Lo normal ya lo dicen la cifra y la
            barra.
          -->
          <div class="mt-3 flex flex-wrap items-center gap-2">
            <KmBadge v-if="fila.stock === 0" tono="rojo">✕ Sin stock</KmBadge>
            <KmBadge v-else-if="fila.stock <= fila.stockMinimo" tono="ambar">⚠ Reponer</KmBadge>
            <span v-if="fila.ubicacion" class="ts-placa text-[10px] text-tenue">
              {{ fila.ubicacion }}
            </span>
          </div>

          <footer class="mt-auto flex items-end justify-between gap-3 pt-4">
            <p class="text-sm text-tinta tabular-nums">
              {{ formatearSoles(fila.precio) }}
              <span class="text-[11px] text-tenue"
                >· margen {{ margen(fila.costo, fila.precio) }}</span
              >
            </p>
            <span
              class="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100"
            >
              <KmBotonIcono
                icono="editar"
                etiqueta="Editar"
                :contexto="fila.nombre"
                @click="editar"
              />
              <KmBotonIcono
                v-if="eliminar"
                icono="eliminar"
                etiqueta="Eliminar"
                :contexto="fila.nombre"
                tono="peligro"
                @click="eliminar"
              />
            </span>
          </footer>
        </article>
      </template>

      <template #formulario="{ borrador, errores }">
        <div class="grid gap-4 sm:grid-cols-[9rem_1fr]">
          <KmField v-slot="{ id, invalido }" label="Código" :error="errores.codigo" requerido>
            <KmInput
              :id="id"
              v-model="borrador.codigo"
              placeholder="FIL-001"
              :invalido="invalido"
            />
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
          <KmField
            v-slot="{ id }"
            label="Número de parte"
            ayuda="Lo que identifica la pieza exacta."
          >
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
  </div>
</template>
