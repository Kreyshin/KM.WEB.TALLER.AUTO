<script setup lang="ts">
import { computed, ref } from 'vue'
import type { MarcaInspeccion, VistaVehiculo } from '@/types'
import {
  VIEWBOX_LATERAL,
  VIEWBOX_PLANTA,
  etiquetaZona,
  zonasLateral,
  zonasPlanta,
} from '@/utils/carroceria'
import { etiquetaDanio, glifoDanio } from '@/utils/inspeccion'

/**
 * El vehículo por sus tres vistas, para marcar encima lo que ya venía roto.
 *
 * No existe librería mantenida que resuelva esto: lo que hay son plantillas de
 * pago de la era jQuery, POCs abandonados y SDK comerciales que atacan otro
 * problema —detectar daños por IA desde fotos—. Así que el dibujo es nuestro,
 * y eso permite dos cosas que una plantilla no daría: que cada zona tenga
 * nombre de taller y que el trazo se lea igual en claro que en oscuro, que es
 * donde acaba una tablet en una bahía.
 *
 * **Cada marca pertenece a una pieza, no a un píxel.** Se guarda la zona
 * («puerta delantera izquierda») además del punto exacto, de modo que el daño
 * se puede nombrar, buscar y contar.
 *
 * Las zonas son polígonos transparentes bajo el trazo. Son botones: se
 * recorren con el tabulador y se marcan con Enter, que pone la señal en el
 * centro de la pieza. Con el ratón se marca el punto exacto.
 */

const props = defineProps<{
  marcas: MarcaInspeccion[]
  soloLectura?: boolean
}>()

const emit = defineEmits<{
  marcar: [vista: VistaVehiculo, zona: string, x: number, y: number]
  quitar: [id: string]
}>()

const vistas: { vista: VistaVehiculo; etiqueta: string }[] = [
  { vista: 'izquierda', etiqueta: 'Costado izquierdo' },
  { vista: 'planta', etiqueta: 'Vista superior' },
  { vista: 'derecha', etiqueta: 'Costado derecho' },
]

const resaltada = ref<string | null>(null)

/**
 * Una vista a la vez, y grande.
 *
 * Las tres juntas caben, pero caben pequeñas: el asesor acaba marcando a
 * ciegas sobre un coche de dos centímetros. Con un selector, la vista que se
 * está mirando ocupa todo el ancho y el resto sigue a un toque, con su
 * contador para que no se olvide lo que ya hay marcado en las otras.
 */
const activa = ref<VistaVehiculo>('izquierda')

function zonasDe(vista: VistaVehiculo) {
  return vista === 'planta' ? zonasPlanta : zonasLateral
}

function viewBoxDe(vista: VistaVehiculo) {
  return vista === 'planta' ? VIEWBOX_PLANTA : VIEWBOX_LATERAL
}

const marcasDe = computed(
  () => (vista: VistaVehiculo) => props.marcas.filter((m) => m.vista === vista),
)

const vistaActiva = computed(() => vistas.find((v) => v.vista === activa.value) ?? vistas[0])

/**
 * El punto del clic, en porcentaje de la vista. Se guarda relativo para que el
 * dibujo pueda crecer o encogerse sin mover las marcas.
 */
function alTocar(evento: MouseEvent, vista: VistaVehiculo, zonaId: string) {
  if (props.soloLectura) return
  const caja = (evento.currentTarget as SVGElement).ownerSVGElement?.getBoundingClientRect()
  if (!caja) return
  const x = ((evento.clientX - caja.left) / caja.width) * 100
  const y = ((evento.clientY - caja.top) / caja.height) * 100
  emit('marcar', vista, `${vista}.${zonaId}`, redondear(x), redondear(y))
}

/** Con el teclado no hay puntero: la marca va al centro de la pieza. */
function alPulsarTecla(evento: KeyboardEvent, vista: VistaVehiculo, zonaId: string) {
  if (props.soloLectura) return
  const objetivo = evento.currentTarget as SVGGraphicsElement
  const svg = objetivo.ownerSVGElement
  if (!svg) return
  const caja = objetivo.getBBox()
  const vb = svg.viewBox.baseVal
  const x = ((caja.x + caja.width / 2 - vb.x) / vb.width) * 100
  const y = ((caja.y + caja.height / 2 - vb.y) / vb.height) * 100
  emit('marcar', vista, `${vista}.${zonaId}`, redondear(x), redondear(y))
}

const redondear = (n: number) => Math.round(n * 10) / 10

const nombreResaltada = computed(() => (resaltada.value ? etiquetaZona(resaltada.value) : ''))
</script>

<template>
  <div class="flex flex-col gap-3">
    <!-- Qué lado se está mirando. Con su contador: lo marcado no se olvida. -->
    <div class="ts-selector-vista flex gap-1" role="tablist" aria-label="Vista del vehículo">
      <button
        v-for="v in vistas"
        :key="v.vista"
        type="button"
        role="tab"
        :aria-selected="activa === v.vista"
        class="flex flex-1 items-center justify-center gap-2 rounded-control px-3 py-2 text-xs font-semibold transition-colors"
        :class="
          activa === v.vista ? 'bg-panel text-tinta shadow-sm' : 'text-tenue hover:text-acero'
        "
        @click="activa = v.vista"
      >
        {{ v.etiqueta }}
        <span
          v-if="marcasDe(v.vista).length"
          class="ts-placa rounded-full bg-rojo-500 px-1.5 text-[10px] leading-4 text-white"
        >
          {{ marcasDe(v.vista).length }}
        </span>
      </button>
    </div>

    <figure class="ts-diagrama">
      <svg
        :viewBox="viewBoxDe(activa)"
        class="ts-lienzo block w-full"
        :class="activa === 'planta' ? 'mx-auto max-h-[22rem] w-auto' : ''"
        :aria-label="vistaActiva.etiqueta"
        role="group"
      >
        <!-- Zonas: transparentes, debajo del trazo, y navegables. -->
        <g :transform="activa === 'derecha' ? 'translate(300,0) scale(-1,1)' : undefined">
          <path
            v-for="z in zonasDe(activa)"
            :key="z.id"
            :d="z.d"
            class="ts-zona"
            :class="{
              'ts-zona-activa': resaltada === `${activa}.${z.id}`,
              'ts-zona-fija': soloLectura,
            }"
            :tabindex="soloLectura ? undefined : 0"
            role="button"
            :aria-label="`Marcar ${etiquetaZona(`${activa}.${z.id}`)}`"
            @mouseenter="resaltada = `${activa}.${z.id}`"
            @mouseleave="resaltada = null"
            @focus="resaltada = `${activa}.${z.id}`"
            @blur="resaltada = null"
            @click="alTocar($event, activa, z.id)"
            @keydown.enter.prevent="alPulsarTecla($event, activa, z.id)"
            @keydown.space.prevent="alPulsarTecla($event, activa, z.id)"
          />
        </g>

        <!-- Trazo: lo que se ve. No recibe puntero. -->
        <g
          class="ts-trazo"
          :transform="activa === 'derecha' ? 'translate(300,0) scale(-1,1)' : undefined"
          aria-hidden="true"
        >
          <template v-if="activa === 'planta'">
            <!-- Carrocería vista desde arriba -->
            <path
              d="M38 36C38 20 60 10 95 10s57 10 57 26v300c0 16-22 26-57 26s-57-10-57-26z"
              stroke-width="3"
            />
            <path d="M50 136h90M50 232h90" stroke-width="2" />
            <path d="M38 104h114M38 264h114" stroke-width="1.5" />
            <path d="M38 44h114M38 322h114" stroke-width="1.2" stroke-dasharray="4 4" />
            <rect x="24" y="92" width="16" height="46" rx="4" stroke-width="2.5" />
            <rect x="150" y="92" width="16" height="46" rx="4" stroke-width="2.5" />
            <rect x="24" y="238" width="16" height="46" rx="4" stroke-width="2.5" />
            <rect x="150" y="238" width="16" height="46" rx="4" stroke-width="2.5" />
            <path d="M38 124l-12 5M152 124l12 5" stroke-width="2.5" />
            <path d="M52 20h26M112 20h26M52 348h26M112 348h26" stroke-width="4" />
          </template>

          <template v-else>
            <!-- Costado -->
            <path
              d="M12 80V64c0-5 3-8 10-9l54-8 30-21h90l40 26 50 5c6 1 8 4 8 10v13z"
              stroke-width="3"
            />
            <path d="M12 80h282" stroke-width="1.5" />
            <path d="M112 32h34v18H98z" stroke-width="2" />
            <path d="M152 32h38l26 18h-64z" stroke-width="2" />
            <path d="M98 50v30M149 50v30M216 50v30" stroke-width="1.5" />
            <path d="M128 58h14M188 58h14" stroke-width="2.5" />
            <path d="M98 74h118" stroke-width="1.5" />
            <path d="M98 46l-14-4v6z" stroke-width="2" />
            <circle cx="66" cy="80" r="16" stroke-width="3" />
            <circle cx="66" cy="80" r="7" stroke-width="2" />
            <circle cx="232" cy="80" r="16" stroke-width="3" />
            <circle cx="232" cy="80" r="7" stroke-width="2" />
            <path d="M14 62h10M290 60h4" stroke-width="3" />
          </template>
        </g>

        <!-- Lo marcado. Cada señal es un botón que se quita al pulsarlo. -->
        <g>
          <g
            v-for="m in marcasDe(activa)"
            :key="m.id"
            class="ts-marca"
            :class="{ 'ts-marca-fija': soloLectura }"
            :transform="`translate(${(m.x / 100) * (activa === 'planta' ? 190 : 300)} ${(m.y / 100) * (activa === 'planta' ? 360 : 104)})`"
            :tabindex="soloLectura ? undefined : 0"
            role="button"
            :aria-label="`${etiquetaDanio[m.tipo]} en ${etiquetaZona(m.zona)}${m.nota ? `, ${m.nota}` : ''}. Pulsa para quitar.`"
            @click.stop="!soloLectura && emit('quitar', m.id)"
            @keydown.enter.prevent="!soloLectura && emit('quitar', m.id)"
            @keydown.delete.prevent="!soloLectura && emit('quitar', m.id)"
          >
            <title>{{ etiquetaDanio[m.tipo] }} · {{ etiquetaZona(m.zona) }}</title>
            <circle r="9" class="ts-marca-fondo" />
            <text y="3.5" text-anchor="middle" class="ts-marca-glifo">
              {{ glifoDanio[m.tipo] }}
            </text>
          </g>
        </g>
      </svg>
    </figure>

    <!-- Qué pieza hay debajo del cursor: el dibujo dice su nombre. -->
    <p
      class="h-5 text-center text-xs font-semibold"
      :class="resaltada ? 'text-acero' : 'text-tenue'"
    >
      {{ nombreResaltada || 'Señala una pieza para marcarla' }}
    </p>
  </div>
</template>

<style scoped>
.ts-selector-vista {
  padding: 0.25rem;
  border: 1px solid var(--ts-border);
  border-radius: var(--ts-radio-card);
  background-color: var(--ts-surface-2);
}

.ts-diagrama {
  align-items: center;
  display: flex;
  justify-content: center;
  padding: 1.25rem 1rem;
  border: 1px solid var(--ts-border);
  border-radius: var(--ts-radio-card);
  background-color: var(--ts-surface-2);
}

.ts-lienzo {
  overflow: visible;
}

/* El trazo no recibe puntero: manda la zona que hay debajo. */
.ts-trazo {
  pointer-events: none;
  fill: none;
  stroke: var(--ts-acero-500);
  stroke-linecap: round;
  stroke-linejoin: round;
}

.ts-zona {
  fill: transparent;
  stroke: none;
  cursor: crosshair;
  transition: fill 120ms ease;
}

.ts-zona-fija {
  cursor: default;
}

.ts-zona-activa {
  fill: color-mix(in srgb, var(--ts-acero-500) 20%, transparent);
}

.ts-zona:focus-visible {
  outline: none;
  fill: color-mix(in srgb, var(--ts-acero-500) 26%, transparent);
  stroke: var(--ts-acero-500);
  stroke-width: 2;
}

.ts-marca {
  cursor: pointer;
}

.ts-marca-fija {
  cursor: default;
}

.ts-marca-fondo {
  fill: color-mix(in srgb, var(--ts-rojo-500) 18%, var(--ts-surface));
  stroke: var(--ts-rojo-500);
  stroke-width: 2;
}

.ts-marca-glifo {
  fill: var(--ts-rojo-texto);
  font-size: 10px;
  font-weight: 800;
}

.ts-marca:hover .ts-marca-fondo,
.ts-marca:focus-visible .ts-marca-fondo {
  fill: var(--ts-rojo-500);
}

.ts-marca:hover .ts-marca-glifo,
.ts-marca:focus-visible .ts-marca-glifo {
  fill: #ffffff;
}

.ts-marca:focus-visible {
  outline: none;
}

@media (prefers-reduced-motion: reduce) {
  .ts-zona {
    transition: none;
  }
}
</style>
