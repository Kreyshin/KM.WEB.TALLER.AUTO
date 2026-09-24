<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import FilaParametro from '@/components/configuracion/FilaParametro.vue'
import KmAyuda from '@/components/ui/KmAyuda.vue'
import KmBadge from '@/components/ui/KmBadge.vue'
import KmButton from '@/components/ui/KmButton.vue'
import { gruposParametros, parametrosService } from '@/services/parametros.service'
import { useUiStore } from '@/stores/ui.store'
import type { ApiError, ParametroResuelto, ValorParametro } from '@/types'
import { etiquetaFase } from '@/utils/ordenes'

/**
 * Configuración de la vertical.
 *
 * Es la pantalla que le da carácter a todo lo demás: de aquí salen las reglas
 * que después impiden diagnosticar sin hoja firmada, obligan a volver a pedir
 * aprobación cuando el presupuesto sube, o deciden en qué momento un repuesto
 * deja de estar disponible para otro.
 *
 * Tres decisiones de diseño la sostienen:
 *
 * **Se guarda al final, no en cada clic.** Configurar es una sesión, no veinte
 * operaciones sueltas. Acumular los cambios permite descartarlos enteros sin
 * haber roto nada por el camino, y ver cuántos llevas.
 *
 * **Cada parámetro cuenta su escenario.** Quien configura el sistema no es
 * quien lo programó: sin saber qué pasa de verdad al activar algo, una casilla
 * es una adivinanza.
 *
 * **El límite con el ERP se dice aquí.** La vertical resuelve lo básico y
 * transversal de cada cosa; ese mismo concepto llevado a su versión avanzada
 * vive en un módulo del ERP. Decirlo en el sitio donde se decide es más útil
 * que esconderlo.
 */

const ui = useUiStore()

const parametros = ref<ParametroResuelto[]>([])
const cargando = ref(true)
const guardando = ref(false)
const grupoActivo = ref(gruposParametros[0]!)

/** Cambios en curso, sin guardar. La clave es la del parámetro. */
const borrador = ref<Record<string, ValorParametro>>({})

/** Órdenes que se quedarían sin sitio si se apaga una fase que hoy se usa. */
const impacto = ref<{ fase: string; ordenes: number }[]>([])

function esIgual(a: ValorParametro, b: ValorParametro) {
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((x, i) => x === b[i])
  }
  return a === b
}

function valorDe(p: ParametroResuelto): ValorParametro {
  const enBorrador = borrador.value[p.definicion.clave]
  return enBorrador !== undefined ? enBorrador : p.valor
}

const cambios = computed(() => Object.keys(borrador.value).length)

/**
 * Un parámetro que depende de otro solo se enseña cuando toca. Preguntar
 * cuántas fotos son obligatorias cuando las fotos no lo son es ruido.
 */
function visible(p: ParametroResuelto) {
  const dep = p.definicion.depende
  if (!dep) return true
  const objetivo = parametros.value.find((x) => x.definicion.clave === dep.clave)
  if (!objetivo) return true
  const actual = valorDe(objetivo)
  if (dep.igualA !== undefined) return esIgual(actual, dep.igualA)
  if (dep.distintoDe !== undefined) return !esIgual(actual, dep.distintoDe)
  return true
}

const delGrupo = computed(() =>
  parametros.value.filter((p) => p.definicion.grupo === grupoActivo.value && visible(p)),
)

/** Cuántos cambios sin guardar hay en cada grupo, para marcarlo en el carril. */
const cambiosPorGrupo = computed(() => {
  const mapa: Record<string, number> = {}
  for (const clave of Object.keys(borrador.value)) {
    const p = parametros.value.find((x) => x.definicion.clave === clave)
    if (p) mapa[p.definicion.grupo] = (mapa[p.definicion.grupo] ?? 0) + 1
  }
  return mapa
})

/** Cuántos parámetros tiene cada grupo apartados del valor de fábrica. */
const personalizadosPorGrupo = computed(() => {
  const mapa: Record<string, number> = {}
  for (const p of parametros.value) {
    if (p.origen === 'cadena') {
      mapa[p.definicion.grupo] = (mapa[p.definicion.grupo] ?? 0) + 1
    }
  }
  return mapa
})

const conErp = computed(() => parametros.value.filter((p) => p.definicion.erp).length)

async function cargar() {
  cargando.value = true
  try {
    parametros.value = await parametrosService.listar()
  } catch {
    ui.error('No se pudo cargar la configuración.')
  } finally {
    cargando.value = false
  }
}

onMounted(cargar)

function cambiar(clave: string, valor: ValorParametro) {
  const original = parametros.value.find((p) => p.definicion.clave === clave)
  if (!original) return
  // Volver al valor guardado deja de ser un cambio: el contador no miente.
  if (esIgual(valor, original.valor)) delete borrador.value[clave]
  else borrador.value[clave] = valor
  borrador.value = { ...borrador.value }
}

/** El aviso de fases se recalcula solo mientras se toca la lista. */
watch(
  () => borrador.value['taller.fases'],
  async (fases) => {
    impacto.value = Array.isArray(fases) ? await parametrosService.impactoFases(fases) : []
  },
)

function descartar() {
  borrador.value = {}
  impacto.value = []
}

async function guardar() {
  guardando.value = true
  try {
    parametros.value = await parametrosService.guardar(borrador.value)
    ui.exito(
      `${cambios.value} cambio${cambios.value === 1 ? '' : 's'} guardado${cambios.value === 1 ? '' : 's'}.`,
    )
    descartar()
  } catch (e) {
    ui.error((e as ApiError).mensaje ?? 'No se pudo guardar la configuración.')
  } finally {
    guardando.value = false
  }
}

async function restablecer(clave: string) {
  try {
    parametros.value = await parametrosService.restablecer(clave)
    delete borrador.value[clave]
    borrador.value = { ...borrador.value }
    ui.exito('Vuelve al valor de fábrica.')
  } catch {
    ui.error('No se pudo restablecer.')
  }
}
</script>

<template>
  <div class="flex flex-col gap-5 pb-24">
    <!--
      La explicación de cómo funciona la pantalla hace falta la primera vez y
      estorba las cien siguientes, así que vive en la ayuda del título en vez
      de empujar hacia abajo los parámetros, que es a lo que se viene.
    -->
    <header class="flex items-center gap-2">
      <h2 class="ts-titulo-pagina text-tinta">Configuración del taller</h2>
      <KmAyuda titulo="Cómo funciona esta pantalla" etiqueta="Cómo funciona esta pantalla">
        <p>
          Las reglas con las que trabaja <strong>toda la cadena</strong>. Lo que se fija aquí vale
          en todos los talleres.
        </p>
        <p>
          Los parámetros marcados como <strong>«cada taller puede cambiarlo»</strong> son el punto
          de partida: cada sede podrá apartarse de ellos en su propia pantalla.
        </p>
        <p v-if="conErp">
          <strong>{{ conErp }}</strong> de estos parámetros tienen una versión avanzada en un módulo
          del ERP. Está dicho en cada uno, para que se vea qué se puede hacer hoy y qué daría ir más
          lejos.
        </p>
        <p>
          Los cambios se acumulan y se guardan al final: puedes descartarlos enteros sin haber roto
          nada.
        </p>
      </KmAyuda>
    </header>

    <p v-if="cargando" class="py-16 text-center text-sm text-tenue">Cargando la configuración…</p>

    <div v-else class="grid gap-5 lg:grid-cols-[13rem_1fr]">
      <!-- Carril de grupos, en el orden en que se recorre el trabajo. -->
      <nav aria-label="Secciones de configuración">
        <ul class="flex gap-1 overflow-x-auto lg:sticky lg:top-4 lg:flex-col lg:overflow-visible">
          <li v-for="g in gruposParametros" :key="g" class="shrink-0">
            <button
              type="button"
              class="ts-grupo flex w-full items-center gap-2 rounded-control px-3 py-2 text-left text-sm font-medium transition-colors"
              :class="
                grupoActivo === g
                  ? 'bg-accion text-white'
                  : 'text-tenue hover:bg-seleccion hover:text-tinta'
              "
              :aria-current="grupoActivo === g ? 'page' : undefined"
              @click="grupoActivo = g"
            >
              <span class="flex-1">{{ g }}</span>
              <!-- Un punto ámbar dice dónde quedaron cambios sin guardar. -->
              <span
                v-if="cambiosPorGrupo[g]"
                class="size-1.5 shrink-0 rounded-full bg-ambar"
                :title="`${cambiosPorGrupo[g]} sin guardar`"
              />
              <span
                v-else-if="personalizadosPorGrupo[g]"
                class="shrink-0 text-[10px] font-semibold opacity-60"
                :title="`${personalizadosPorGrupo[g]} personalizados`"
              >
                {{ personalizadosPorGrupo[g] }}
              </span>
            </button>
          </li>
        </ul>
      </nav>

      <section class="rounded-card border border-linea bg-panel px-6">
        <div class="divide-y divide-linea">
          <template v-for="p in delGrupo" :key="p.definicion.clave">
            <FilaParametro
              :parametro="p"
              :valor="valorDe(p)"
              :modificado="borrador[p.definicion.clave] !== undefined"
              @cambiar="cambiar(p.definicion.clave, $event)"
              @restablecer="restablecer(p.definicion.clave)"
            />

            <!--
              El aviso va pegado a lo que lo provoca, no al final de la
              pantalla: un aviso que hay que ir a buscar no es un aviso. Apagar
              una fase con coches dentro los deja sin sitio, y eso se dice
              antes de guardar.
            -->
            <div
              v-if="p.definicion.clave === 'taller.fases' && impacto.length"
              class="ts-tono ts-tono-ambar mb-5 rounded-control border px-4 py-3"
              role="status"
            >
              <p class="ts-etiqueta">⚠ Hay trabajo en las fases que vas a apagar</p>
              <ul class="mt-2 flex flex-col gap-1 text-sm">
                <li v-for="i in impacto" :key="i.fase">
                  <strong>{{ i.ordenes }}</strong> orden{{ i.ordenes === 1 ? '' : 'es' }} en «{{
                    etiquetaFase[i.fase as keyof typeof etiquetaFase]
                  }}». Tendrás que moverlas antes de que la fase desaparezca del tablero.
                </li>
              </ul>
            </div>
          </template>
        </div>
      </section>
    </div>

    <!--
      Barra de guardado. Aparece solo cuando hay algo que guardar, y dice
      cuánto: configurar a ciegas es lo que hace que nadie toque la pantalla.
    -->
    <Transition name="ts-barra">
      <div
        v-if="cambios"
        class="ts-barra-guardado fixed inset-x-0 bottom-0 z-40 border-t border-linea bg-panel px-6 py-3"
      >
        <div class="mx-auto flex max-w-5xl flex-wrap items-center justify-end gap-3">
          <KmBadge tono="ambar">
            {{ cambios }} cambio{{ cambios === 1 ? '' : 's' }} sin guardar
          </KmBadge>
          <div class="flex-1" />
          <KmButton variante="fantasma" :disabled="guardando" @click="descartar">
            Descartar
          </KmButton>
          <KmButton :cargando="guardando" @click="guardar">Guardar cambios</KmButton>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.ts-barra-guardado {
  box-shadow: 0 -8px 24px -12px rgb(0 0 0 / 0.4);
  /* El shell tiene su barra de módulos a la izquierda: la barra no la tapa. */
  padding-left: calc(var(--ts-rail-ancho) + 1.5rem);
}

.ts-barra-enter-active,
.ts-barra-leave-active {
  transition:
    transform 200ms ease,
    opacity 200ms ease;
}

.ts-barra-enter-from,
.ts-barra-leave-to {
  transform: translateY(100%);
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .ts-barra-enter-active,
  .ts-barra-leave-active {
    transition: none;
  }
}
</style>
