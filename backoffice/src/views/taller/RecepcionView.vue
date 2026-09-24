<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DiagramaVehiculo from '@/components/inspeccion/DiagramaVehiculo.vue'
import MostradorRecepcion from '@/components/recepcion/MostradorRecepcion.vue'
import FirmaCliente from '@/components/inspeccion/FirmaCliente.vue'
import KmBadge from '@/components/ui/KmBadge.vue'
import KmButton from '@/components/ui/KmButton.vue'
import KmCard from '@/components/ui/KmCard.vue'
import KmCheckbox from '@/components/ui/KmCheckbox.vue'
import KmField from '@/components/ui/KmField.vue'
import KmInput from '@/components/ui/KmInput.vue'
import KmNumero from '@/components/ui/KmNumero.vue'
import { ordenesService } from '@/services/ordenes.service'
import { useAuthStore } from '@/stores/auth.store'
import { useLocalStore } from '@/stores/local.store'
import { useUiStore } from '@/stores/ui.store'
import type {
  ApiError,
  EstadoPunto,
  Inspeccion,
  MarcaInspeccion,
  OrdenResuelta,
  TipoDanio,
  VistaVehiculo,
} from '@/types'
import { etiquetaZona } from '@/utils/carroceria'
import { formatearKm } from '@/utils/formato'
import {
  etiquetaDanio,
  etiquetaPunto,
  glifoDanio,
  glifoPunto,
  octavos,
  pertenenciasHabituales,
  puntosRevision,
  tonoDanio,
} from '@/utils/inspeccion'

/**
 * La hoja de ingreso: la vuelta al vehículo.
 *
 * Es el papel que todo taller rellena y ninguno digitaliza, y el que separa
 * «se lo rayaron aquí» de «entró así». Por eso esta pantalla no es un
 * formulario con campos: es la hoja, con su dibujo, su aguja de combustible,
 * su lista de revisión y su firma, en el mismo orden en que se recorre el
 * coche.
 *
 * Sin `ordenId` en la ruta enseña lo que falta por recibir, que es la pregunta
 * con la que un asesor abre esta sección.
 */

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const localStore = useLocalStore()
const ui = useUiStore()

const pendientes = ref<OrdenResuelta[]>([])
const orden = ref<OrdenResuelta | null>(null)
const cargando = ref(true)
const guardando = ref(false)
const errores = ref<Record<string, string>>({})

const herramienta = ref<TipoDanio>('rayon')

const hoja = ref<Inspeccion>(nuevaHoja())

function nuevaHoja(): Inspeccion {
  return {
    fecha: new Date().toISOString(),
    usuarioId: auth.usuario?.id ?? '',
    kilometraje: 0,
    combustible: 4,
    marcas: [],
    puntos: {},
    pertenencias: [],
    observaciones: '',
    firma: undefined,
  }
}

const ordenId = computed(() => (route.params.ordenId as string | undefined) ?? null)

/** Los puntos se agrupan como se recorre el coche: fuera, dentro, debajo. */
const grupos = computed(() => {
  const mapa = new Map<string, typeof puntosRevision>()
  for (const p of puntosRevision) {
    mapa.set(p.grupo, [...(mapa.get(p.grupo) ?? []), p])
  }
  return [...mapa.entries()]
})

const observados = computed(
  () => Object.values(hoja.value.puntos).filter((e) => e === 'observado').length,
)

const listaParaCerrar = computed(() => Boolean(hoja.value.firma) && hoja.value.kilometraje > 0)

async function cargar() {
  const localId = localStore.localId
  if (!localId) return
  cargando.value = true
  try {
    if (ordenId.value) {
      orden.value = await ordenesService.obtenerResuelta(ordenId.value)
      hoja.value = orden.value.inspeccion
        ? { ...orden.value.inspeccion }
        : {
            ...nuevaHoja(),
            kilometraje: orden.value.vehiculo?.kilometraje ?? 0,
          }
    } else {
      orden.value = null
      pendientes.value = await ordenesService.sinInspeccion(localId)
    }
  } catch {
    ui.error('No se pudo cargar la recepción.')
  } finally {
    cargando.value = false
  }
}

onMounted(cargar)
watch([ordenId, () => localStore.localId], cargar)

// ── El dibujo ────────────────────────────────────────────────────────────────

function marcar(vista: VistaVehiculo, zona: string, x: number, y: number) {
  const marca: MarcaInspeccion = {
    id: `m${Date.now()}${Math.random().toString(36).slice(2, 6)}`,
    vista,
    zona,
    x,
    y,
    tipo: herramienta.value,
  }
  hoja.value.marcas = [...hoja.value.marcas, marca]
}

function quitarMarca(id: string) {
  hoja.value.marcas = hoja.value.marcas.filter((m) => m.id !== id)
}

// ── La revisión ──────────────────────────────────────────────────────────────

function marcarPunto(clave: string, estado: EstadoPunto) {
  hoja.value.puntos = { ...hoja.value.puntos, [clave]: estado }
}

function alternarPertenencia(p: string) {
  const actuales = hoja.value.pertenencias
  hoja.value.pertenencias = actuales.includes(p)
    ? actuales.filter((x) => x !== p)
    : [...actuales, p]
}

// ── Guardar ──────────────────────────────────────────────────────────────────

async function guardar() {
  if (!orden.value) return
  errores.value = {}
  if (!hoja.value.firma) {
    errores.value.firma = 'Sin la firma del cliente la hoja no protege a nadie.'
    ui.error('Falta la firma del cliente.')
    return
  }
  guardando.value = true
  try {
    await ordenesService.guardarInspeccion(orden.value.id, {
      ...hoja.value,
      fecha: new Date().toISOString(),
      usuarioId: auth.usuario?.id ?? '',
    })
    ui.exito(`Hoja de ingreso de ${orden.value.vehiculo?.placa} firmada.`)
    router.push({ name: 'recepcion' })
  } catch (e) {
    const err = e as ApiError
    errores.value = err.campos ?? {}
    ui.error(err.mensaje ?? 'No se pudo guardar la hoja.')
  } finally {
    guardando.value = false
  }
}
</script>

<template>
  <!-- El mostrador: se empieza por la placa, no por el coche ya sabido. -->
  <MostradorRecepcion
    v-if="!ordenId"
    :local-id="localStore.localId ?? ''"
    @recibida="(id) => router.push({ name: 'recepcion', params: { ordenId: id } })"
  />

  <!-- La hoja -->
  <div v-else-if="orden" class="ts-operacion flex flex-col gap-5">
    <header class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <p class="ts-etiqueta text-tenue">Hoja de ingreso · {{ orden.codigo }}</p>
        <div class="mt-1.5 flex items-center gap-2.5">
          <span
            class="ts-placa rounded-[4px] border-2 border-tinta px-2 py-0.5 text-base text-tinta"
          >
            {{ orden.vehiculo?.placa }}
          </span>
          <span class="ts-display text-xl leading-none font-semibold text-tinta">
            {{ orden.vehiculo?.marca }} {{ orden.vehiculo?.modelo }}
          </span>
        </div>
        <p class="mt-1.5 text-sm text-tenue">
          {{ orden.cliente?.nombre }} · último odómetro conocido
          {{ formatearKm(orden.vehiculo?.kilometraje ?? 0) }}
        </p>
      </div>
      <KmButton variante="fantasma" @click="router.push({ name: 'recepcion' })">
        Volver a la lista
      </KmButton>
    </header>

    <div class="grid gap-5 xl:grid-cols-[minmax(0,32rem)_1fr]">
      <!-- Columna izquierda: el coche -->
      <KmCard titulo="La vuelta al vehículo" subtitulo="Marca sobre el dibujo lo que ya venía así.">
        <!-- Elegir qué se marca antes de marcarlo, como el bolígrafo de colores. -->
        <div class="mb-4 flex flex-wrap gap-1.5">
          <button
            v-for="t in ['rayon', 'abolladura', 'rotura', 'oxido', 'faltante'] as TipoDanio[]"
            :key="t"
            type="button"
            class="min-h-[var(--km-toque,2.5rem)] rounded-control border px-3 text-xs font-semibold transition-colors"
            :class="
              herramienta === t
                ? 'border-transparent bg-accion text-white'
                : 'border-linea text-tenue hover:border-acero hover:text-acero'
            "
            @click="herramienta = t"
          >
            {{ glifoDanio[t] }} {{ etiquetaDanio[t] }}
          </button>
        </div>

        <DiagramaVehiculo :marcas="hoja.marcas" @marcar="marcar" @quitar="quitarMarca" />

        <!--
          La nota va detrás de la marca, no delante: primero se señala el
          golpe y luego se describe, que es el orden en que se mira un coche.
        -->
        <ul v-if="hoja.marcas.length" class="mt-4 flex flex-col gap-2">
          <li
            v-for="(m, i) in hoja.marcas"
            :key="m.id"
            class="flex flex-wrap items-center gap-2 rounded-control border border-linea bg-panel-2 px-3 py-2"
          >
            <span class="ts-placa w-5 text-[10px] text-tenue">{{ i + 1 }}</span>
            <KmBadge :tono="tonoDanio[m.tipo]">
              {{ glifoDanio[m.tipo] }} {{ etiquetaDanio[m.tipo] }}
            </KmBadge>
            <span class="min-w-0 flex-1 truncate text-xs font-medium text-tinta">
              {{ etiquetaZona(m.zona) }}
            </span>
            <button
              type="button"
              class="text-[11px] font-semibold text-tenue hover:text-rojo-texto"
              @click="quitarMarca(m.id)"
            >
              Quitar
            </button>
            <KmInput
              v-model="m.nota"
              class="w-full text-xs"
              :aria-label="`Nota del daño en ${etiquetaZona(m.zona)}`"
              placeholder="Añade el detalle: «rayón profundo, 20 cm»"
            />
          </li>
        </ul>
        <p v-else class="mt-4 text-center text-xs text-tenue">
          Sin daños anotados. El vehículo entra conforme.
        </p>
      </KmCard>

      <!-- Columna derecha: lo que se mide y lo que se revisa -->
      <div class="flex flex-col gap-5">
        <KmCard titulo="Lo que se mide">
          <div class="grid gap-5 sm:grid-cols-2">
            <KmField
              v-slot="{ id }"
              label="Kilometraje de entrada"
              :error="errores.kilometraje"
              ayuda="El odómetro nunca retrocede."
            >
              <KmNumero :id="id" v-model="hoja.kilometraje" :min="0" :step="100" />
            </KmField>

            <!-- La aguja: se anota en octavos porque es lo que marca el tablero. -->
            <div>
              <div class="flex items-baseline justify-between">
                <p class="ts-etiqueta text-tenue">Combustible</p>
                <p class="text-xs font-semibold text-tinta">{{ octavos(hoja.combustible) }}</p>
              </div>
              <div class="mt-2 flex items-center gap-1.5">
                <span class="text-[10px] font-bold text-tenue">E</span>
                <div class="flex flex-1 gap-0.5">
                  <button
                    v-for="n in 8"
                    :key="n"
                    type="button"
                    class="h-5 flex-1 rounded-[3px] border transition-colors"
                    :class="
                      hoja.combustible >= n
                        ? 'border-acero bg-acero'
                        : 'border-linea bg-panel-2 hover:border-acero'
                    "
                    :aria-label="`${n} octavos`"
                    :aria-pressed="hoja.combustible >= n"
                    @click="hoja.combustible = hoja.combustible === n ? n - 1 : n"
                  />
                </div>
                <span class="text-[10px] font-bold text-tenue">F</span>
              </div>
            </div>
          </div>
        </KmCard>

        <KmCard
          titulo="Revisión de recepción"
          :subtitulo="
            observados
              ? `${observados} punto${observados === 1 ? '' : 's'} con observación.`
              : 'Marca cada punto conforme o con observación.'
          "
        >
          <div class="flex flex-col gap-5">
            <section v-for="[grupo, puntos] in grupos" :key="grupo">
              <p class="ts-etiqueta mb-2 text-tenue">{{ grupo }}</p>
              <ul class="flex flex-col gap-1.5">
                <li
                  v-for="p in puntos"
                  :key="p.clave"
                  class="flex flex-wrap items-center gap-2 rounded-control border border-linea bg-panel-2 px-3 py-2"
                >
                  <span class="min-w-40 flex-1 text-sm text-tinta">{{ p.etiqueta }}</span>
                  <!-- Tres estados explícitos: «sin marcar» no es «conforme». -->
                  <span class="flex gap-1">
                    <button
                      v-for="e in ['conforme', 'observado', 'noAplica'] as EstadoPunto[]"
                      :key="e"
                      type="button"
                      class="min-h-[var(--km-toque,2.5rem)] rounded-control border px-2.5 text-[11px] font-semibold transition-colors"
                      :class="
                        hoja.puntos[p.clave] === e
                          ? 'border-transparent bg-accion text-white'
                          : 'border-linea text-tenue hover:border-acero hover:text-acero'
                      "
                      @click="marcarPunto(p.clave, e)"
                    >
                      {{ glifoPunto[e] }} {{ etiquetaPunto[e] }}
                    </button>
                  </span>
                </li>
              </ul>
            </section>
          </div>
        </KmCard>

        <KmCard
          titulo="Lo que se queda dentro"
          subtitulo="Marcar las pertenencias evita la mitad de los líos de la entrega."
        >
          <div class="grid grid-cols-2 gap-x-4 gap-y-2.5">
            <KmCheckbox
              v-for="p in pertenenciasHabituales"
              :key="p"
              :model-value="hoja.pertenencias.includes(p)"
              @update:model-value="alternarPertenencia(p)"
            >
              {{ p }}
            </KmCheckbox>
          </div>

          <KmField v-slot="{ id }" label="Observaciones" class="mt-5">
            <KmInput
              :id="id"
              v-model="hoja.observaciones"
              placeholder="Lo que el cliente quiere que conste"
            />
          </KmField>
        </KmCard>

        <KmCard titulo="Conformidad">
          <FirmaCliente v-model="hoja.firma" />
          <p
            v-if="errores.firma"
            class="ts-tono ts-tono-rojo mt-3 rounded-control border px-3 py-2 text-sm"
          >
            {{ errores.firma }}
          </p>

          <div class="mt-5 flex flex-wrap items-center justify-between gap-3">
            <p class="text-xs text-tenue">
              {{ hoja.marcas.length }} daño{{ hoja.marcas.length === 1 ? '' : 's' }} anotado{{
                hoja.marcas.length === 1 ? '' : 's'
              }}
              · {{ octavos(hoja.combustible) }} de combustible ·
              {{ formatearKm(hoja.kilometraje) }}
            </p>
            <KmButton :cargando="guardando" :disabled="!listaParaCerrar" @click="guardar">
              Cerrar la recepción
            </KmButton>
          </div>
        </KmCard>
      </div>
    </div>
  </div>

  <p v-else class="py-16 text-center text-sm text-tenue">Cargando la hoja…</p>
</template>
