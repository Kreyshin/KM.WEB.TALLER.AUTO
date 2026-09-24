<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { modulos } from './navegacion'
import { ordenesService } from '@/services/ordenes.service'
import { vehiculosService } from '@/services/vehiculos.service'
import { useLocalStore } from '@/stores/local.store'
import { useAuthStore } from '@/stores/auth.store'
import { useUiStore } from '@/stores/ui.store'
import { etiquetaFase } from '@/utils/ordenes'

interface Resultado {
  id: string
  grupo: 'Ir a' | 'Órdenes' | 'Vehículos' | 'Acciones'
  titulo: string
  detalle?: string
  ejecutar: () => void
}

const iconoGrupo: Record<Resultado['grupo'], string> = {
  'Ir a': 'M5 12h14M13 6l6 6-6 6',
  Órdenes: 'M8 4h8a2 2 0 0 1 2 2v14l-3-2-3 2-3-2-3 2V6a2 2 0 0 1 2-2zM9 9h6M9 13h4',
  Vehículos: 'M5 17h14M4 17v-4l2-5h12l2 5v4M7.5 17a1.5 1.5 0 1 0 3 0M13.5 17a1.5 1.5 0 1 0 3 0',
  Acciones: 'M13 3 5 14h6l-1 7 8-11h-6z',
}

const ui = useUiStore()
const auth = useAuthStore()
const localStore = useLocalStore()
const router = useRouter()

const termino = ref('')
const indice = ref(0)
const entrada = ref<HTMLInputElement | null>(null)
const lista = ref<HTMLElement | null>(null)
const registros = ref<Resultado[]>([])

const normalizar = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

function irA(nombreRuta: string, query?: Record<string, string>) {
  ui.buscadorAbierto = false
  router.push({ name: nombreRuta, query })
}

const secciones = computed<Resultado[]>(() =>
  modulos.flatMap((m) =>
    m.secciones
      .filter((s) => auth.puede(s.roles))
      .map((s) => ({
        id: `nav-${s.nombreRuta}`,
        grupo: 'Ir a' as const,
        titulo: s.etiqueta,
        detalle: `${m.etiqueta} · ${s.descripcion ?? ''}`,
        ejecutar: () => irA(s.nombreRuta),
      })),
  ),
)

const acciones = computed<Resultado[]>(() => [
  {
    id: 'acc-tema',
    grupo: 'Acciones',
    titulo: ui.tema === 'oscuro' ? 'Cambiar a taller de día' : 'Cambiar a taller de noche',
    ejecutar: () => {
      ui.alternarTema()
      ui.buscadorAbierto = false
    },
  },
  {
    id: 'acc-datos',
    grupo: 'Acciones',
    titulo: 'Datos de ejemplo',
    detalle: 'Latencia, errores simulados y reinicio',
    ejecutar: () => {
      ui.buscadorAbierto = false
      ui.panelDatosAbierto = true
    },
  },
])

/** Registros de dominio: se cargan al abrir para que la búsqueda sea instantánea. */
async function cargarRegistros() {
  const localId = localStore.localId
  const [ordenes, vehiculos] = await Promise.all([
    localId ? ordenesService.enTaller(localId) : Promise.resolve([]),
    vehiculosService.consultarResueltos({ porPagina: 200 }),
  ])
  registros.value = [
    ...ordenes.map((o) => ({
      id: `ot-${o.id}`,
      grupo: 'Órdenes' as const,
      titulo: o.codigo,
      detalle: [o.vehiculo?.placa, o.vehiculo?.marca, etiquetaFase[o.fase]]
        .filter(Boolean)
        .join(' · '),
      ejecutar: () => irA('ordenes', { q: o.codigo }),
    })),
    ...vehiculos.items.map((v) => ({
      id: `veh-${v.id}`,
      grupo: 'Vehículos' as const,
      titulo: v.placa,
      detalle: [`${v.marca} ${v.modelo}`, v.cliente?.nombre].filter(Boolean).join(' · '),
      ejecutar: () => irA('vehiculos', { q: v.placa }),
    })),
  ]
}

const resultados = computed(() => {
  const t = normalizar(termino.value.trim())
  if (!t) return [...secciones.value, ...acciones.value]
  const coincide = (r: Resultado) => normalizar(`${r.titulo} ${r.detalle ?? ''}`).includes(t)
  return [
    ...secciones.value.filter(coincide),
    ...registros.value.filter(coincide).slice(0, 8),
    ...acciones.value.filter(coincide),
  ]
})

const agrupados = computed(() => {
  const grupos = new Map<string, { r: Resultado; i: number }[]>()
  resultados.value.forEach((r, i) => {
    if (!grupos.has(r.grupo)) grupos.set(r.grupo, [])
    grupos.get(r.grupo)!.push({ r, i })
  })
  return [...grupos.entries()]
})

watch(termino, () => (indice.value = 0))

watch(
  () => ui.buscadorAbierto,
  async (abierto) => {
    if (!abierto) return
    termino.value = ''
    indice.value = 0
    await nextTick()
    entrada.value?.focus()
    cargarRegistros().catch(() => (registros.value = []))
  },
)

async function mover(delta: number) {
  const n = resultados.value.length
  if (!n) return
  indice.value = (indice.value + delta + n) % n
  await nextTick()
  lista.value?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' })
}

function alTeclear(e: KeyboardEvent) {
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    e.preventDefault()
    mover(e.key === 'ArrowDown' ? 1 : -1)
  } else if (e.key === 'Enter') resultados.value[indice.value]?.ejecutar()
  else if (e.key === 'Escape') ui.buscadorAbierto = false
}

function atajoGlobal(e: KeyboardEvent) {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault()
    ui.buscadorAbierto = !ui.buscadorAbierto
  }
}

onMounted(() => window.addEventListener('keydown', atajoGlobal))
onBeforeUnmount(() => window.removeEventListener('keydown', atajoGlobal))
</script>

<template>
  <Teleport to="body">
    <div v-if="ui.buscadorAbierto" class="fixed inset-0 z-50 flex justify-center p-4 pt-[12vh]">
      <div
        class="absolute inset-0 bg-black/45 backdrop-blur-sm"
        @click="ui.buscadorAbierto = false"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Buscar en el back office"
        class="ts-entrada relative flex max-h-[70vh] w-full max-w-xl flex-col overflow-hidden rounded-overlay border border-linea bg-panel"
        style="box-shadow: var(--ts-sombra-flotante)"
      >
        <div class="flex items-center gap-3 border-b border-linea px-4">
          <svg
            class="size-5 shrink-0 text-tenue"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7" />
            <path stroke-linecap="round" d="m20 20-3.5-3.5" />
          </svg>
          <input
            ref="entrada"
            v-model="termino"
            type="text"
            role="combobox"
            aria-expanded="true"
            aria-controls="buscador-resultados"
            :aria-activedescendant="resultados[indice] ? `res-${resultados[indice].id}` : undefined"
            placeholder="Secciones, órdenes, placas…"
            class="h-14 flex-1 bg-transparent text-base text-tinta outline-none placeholder:text-tenue/70 ts-sin-anillo"
            @keydown="alTeclear"
          />
          <kbd class="rounded border border-linea px-1.5 text-[11px] text-tenue">Esc</kbd>
        </div>

        <div id="buscador-resultados" ref="lista" role="listbox" class="overflow-y-auto p-2">
          <p v-if="resultados.length === 0" class="px-3 py-10 text-center text-sm text-tenue">
            Nada coincide con «{{ termino }}».
          </p>

          <div
            v-for="[grupo, items] in agrupados"
            :key="grupo"
            class="mb-1"
            role="group"
            :aria-label="grupo"
          >
            <p class="ts-etiqueta px-3 pt-2 pb-1 text-tenue">{{ grupo }}</p>
            <button
              v-for="{ r, i } in items"
              :id="`res-${r.id}`"
              :key="r.id"
              type="button"
              role="option"
              :aria-selected="i === indice"
              tabindex="-1"
              class="flex w-full items-center gap-3 rounded-control px-2.5 py-2 text-left transition-colors"
              :class="i === indice ? 'bg-seleccion' : ''"
              @mousemove="indice = i"
              @click="r.ejecutar()"
            >
              <span
                class="grid size-8 shrink-0 place-items-center rounded-control border transition-colors"
                :class="
                  i === indice
                    ? 'border-acero/40 bg-panel text-acero'
                    : 'border-linea bg-panel-2 text-tenue'
                "
                aria-hidden="true"
              >
                <svg
                  class="size-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.8"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path :d="iconoGrupo[r.grupo]" />
                </svg>
              </span>
              <span class="min-w-0 flex-1">
                <span class="block truncate text-sm font-medium text-tinta">{{ r.titulo }}</span>
                <span v-if="r.detalle" class="block truncate text-xs text-tenue">{{
                  r.detalle
                }}</span>
              </span>
              <kbd
                v-if="i === indice"
                class="rounded border border-linea bg-panel px-1.5 font-sans text-[11px] text-tenue"
                aria-hidden="true"
              >
                ↵
              </kbd>
            </button>
          </div>
        </div>

        <footer
          class="flex items-center gap-4 border-t border-linea bg-panel-2 px-4 py-2 text-[11px] text-tenue"
        >
          <span class="flex items-center gap-1.5">
            <kbd class="rounded border border-linea bg-panel px-1 font-sans">↑</kbd>
            <kbd class="rounded border border-linea bg-panel px-1 font-sans">↓</kbd>
            navegar
          </span>
          <span class="flex items-center gap-1.5">
            <kbd class="rounded border border-linea bg-panel px-1 font-sans">↵</kbd>
            abrir
          </span>
          <span class="ml-auto">{{ resultados.length }} resultados</span>
        </footer>
      </div>
    </div>
  </Teleport>
</template>
