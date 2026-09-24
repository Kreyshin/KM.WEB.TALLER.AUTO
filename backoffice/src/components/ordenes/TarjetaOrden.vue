<script setup lang="ts">
import { computed } from 'vue'
import KmBadge from '@/components/ui/KmBadge.vue'
import KmButton from '@/components/ui/KmButton.vue'
import type { FaseOrden, OrdenResuelta } from '@/types'
import { desdeHace, faltanPara, formatearSoles } from '@/utils/formato'
import {
  accionSiguienteFase,
  etiquetaDetencion,
  etiquetaFase,
  etiquetaPrioridad,
  glifoFase,
  salidaDetencion,
  siguienteFase,
  tonoPrioridad,
} from '@/utils/ordenes'

/**
 * Una orden, de un vistazo y de lejos.
 *
 * La tabla contestaba «¿qué dice cada campo?». La tarjeta contesta las tres
 * preguntas que se hacen de verdad delante del mostrador: **por dónde va**,
 * **si avanza** y **si llega a tiempo**. Por eso el riel de fases ocupa el
 * centro: una orden no es un estado, es un recorrido, y lo que importa es
 * cuánto le queda.
 *
 * Las acciones rápidas se reciben, no se deciden aquí: cada sede configura
 * qué se puede hacer sin abrir la ficha.
 */

const props = defineProps<{
  orden: OrdenResuelta
  /** Las fases vigentes según la configuración, en orden. */
  fases: FaseOrden[]
  /** Acciones permitidas en esta sede: avanzar, detener, prioridad, reprogramar. */
  acciones: string[]
  /** Horas antes de la promesa a partir de las cuales se avisa. */
  avisoHoras: number
}>()

const emit = defineEmits<{
  abrir: []
  avanzar: []
  detener: []
  reanudar: []
  prioridad: []
  reprogramar: []
}>()

const o = computed(() => props.orden)

/** Posición en el recorrido. -1 si la fase ya no está configurada. */
const indice = computed(() => props.fases.indexOf(o.value.fase))

const entrega = computed(() => {
  if (!o.value.promesa) return null
  const { atrasado, texto } = faltanPara(o.value.promesa)
  const horas = (new Date(o.value.promesa).getTime() - Date.now()) / 3_600_000
  return { atrasado, texto, cerca: !atrasado && horas <= props.avisoHoras }
})

/**
 * El borde dice el estado más grave, y nunca sólo con color: la tarjeta lleva
 * además su glifo y su palabra.
 */
const tono = computed(() => {
  if (entrega.value?.atrasado) return 'rojo'
  if (o.value.detencion) return 'rojo'
  if (entrega.value?.cerca) return 'ambar'
  return 'neutro'
})

const puede = (accion: string) => props.acciones.includes(accion)
const siguiente = computed(() => siguienteFase[o.value.fase])
</script>

<template>
  <article class="ts-orden" :class="`es-${tono}`">
    <!-- Cabecera: la placa manda, que es como el taller llama a los coches. -->
    <header class="flex items-start justify-between gap-3">
      <div class="min-w-0">
        <div class="flex flex-wrap items-center gap-2">
          <span
            class="ts-placa rounded-[4px] border-2 border-tinta px-1.5 py-0.5 text-xs text-tinta"
          >
            {{ o.vehiculo?.placa ?? '—' }}
          </span>
          <span class="truncate text-sm font-semibold text-tinta">
            {{ o.vehiculo?.marca }} {{ o.vehiculo?.modelo }}
          </span>
          <KmBadge v-if="o.prioridad !== 'normal'" :tono="tonoPrioridad[o.prioridad]">
            {{ etiquetaPrioridad[o.prioridad] }}
          </KmBadge>
        </div>
        <p class="mt-1 text-xs text-balance text-tenue">
          {{ o.cliente?.nombre }} · {{ o.codigo }} · entró {{ desdeHace(o.ingreso) }}
        </p>
      </div>
      <p
        class="ts-display shrink-0 text-right text-base leading-none font-semibold text-tinta tabular-nums"
      >
        {{ formatearSoles(o.total) }}
        <span class="ts-etiqueta mt-1 block text-[10px] font-normal text-tenue">aprobado</span>
      </p>
    </header>

    <!-- El riel: una orden es un recorrido, no un estado suelto. -->
    <div class="ts-riel" :aria-label="`Fase ${etiquetaFase[o.fase]}`">
      <span
        v-for="(f, i) in fases"
        :key="f"
        class="ts-riel-tramo"
        :class="{
          'es-hecho': indice >= 0 && i < indice,
          'es-actual': i === indice,
          'es-detenido': i === indice && o.detencion,
        }"
        :title="etiquetaFase[f]"
      />
    </div>
    <p class="-mt-1 text-xs font-semibold text-tinta">
      {{ glifoFase[o.fase] }} {{ etiquetaFase[o.fase] }}
      <span class="font-normal text-tenue">
        · {{ indice >= 0 ? `paso ${indice + 1} de ${fases.length}` : 'fase fuera del flujo' }}
      </span>
    </p>

    <!-- ¿Avanza? Y si no, qué hay que hacer para desatascarla. -->
    <div v-if="o.detencion" class="ts-detencion">
      <p class="text-xs font-semibold text-rojo-texto">
        ‖ {{ etiquetaDetencion[o.detencion] }}
        <span v-if="o.detenidaDesde" class="font-normal">· {{ desdeHace(o.detenidaDesde) }}</span>
      </p>
      <p class="mt-0.5 text-[11px] text-tenue">
        {{ o.notaDetencion || salidaDetencion[o.detencion] }}
      </p>
    </div>

    <!-- Lo que se mira al final: quién la lleva y si llega a tiempo. -->
    <dl class="flex flex-wrap items-baseline gap-x-5 gap-y-1 text-xs">
      <div>
        <dt class="ts-etiqueta text-[10px] text-tenue">Técnico</dt>
        <dd class="text-tinta">
          {{ o.tecnico?.nombre ?? 'Sin asignar' }}
          <span class="text-tenue">· {{ o.bahia?.codigo ?? 'sin bahía' }}</span>
        </dd>
      </div>
      <div>
        <dt class="ts-etiqueta text-[10px] text-tenue">Entrega</dt>
        <dd
          class="font-semibold tabular-nums"
          :class="
            entrega?.atrasado ? 'text-rojo-texto' : entrega?.cerca ? 'text-ambar' : 'text-tinta'
          "
        >
          <template v-if="entrega">
            {{ entrega.atrasado ? '⚠ ' : entrega.cerca ? '◷ ' : '' }}{{ entrega.texto }}
          </template>
          <span v-else class="font-normal text-tenue">sin fecha</span>
        </dd>
      </div>
    </dl>

    <!-- Lo que se puede hacer de pie. El resto vive en la ficha. -->
    <footer class="ts-acciones">
      <div class="flex flex-wrap items-center gap-2">
        <KmButton
          v-if="puede('avanzar') && siguiente && !o.detencion"
          tamano="sm"
          @click="emit('avanzar')"
        >
          {{ accionSiguienteFase[o.fase] }}
        </KmButton>
        <KmButton
          v-if="puede('detener')"
          variante="secundario"
          tamano="sm"
          @click="o.detencion ? emit('reanudar') : emit('detener')"
        >
          {{ o.detencion ? '▶ Reanudar' : '‖ Detener' }}
        </KmButton>
        <KmButton
          v-if="puede('prioridad')"
          variante="fantasma"
          tamano="sm"
          @click="emit('prioridad')"
        >
          Prioridad
        </KmButton>
        <KmButton
          v-if="puede('reprogramar')"
          variante="fantasma"
          tamano="sm"
          @click="emit('reprogramar')"
        >
          Mover fecha
        </KmButton>
      </div>
      <KmButton variante="fantasma" tamano="sm" @click="emit('abrir')">Ver ficha →</KmButton>
    </footer>
  </article>
</template>

<style scoped>
.ts-orden {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem;
  border: 1px solid var(--ts-border);
  /* El estado más grave se lee en el filo, que es lo que se ve de lejos. */
  border-left-width: 4px;
  border-left-color: var(--ts-border);
  border-radius: var(--ts-radio-card);
  background-color: var(--ts-surface);
  transition: border-color 140ms ease;
}

.ts-orden.es-rojo {
  border-left-color: var(--ts-rojo-500);
}

.ts-orden.es-ambar {
  border-left-color: var(--ts-ambar);
}

.ts-orden:hover {
  border-color: var(--ts-acero-400);
}

/* El riel de fases: tramos iguales, el recorrido completo a la vista. */
.ts-riel {
  display: flex;
  gap: 3px;
}

.ts-riel-tramo {
  height: 5px;
  flex: 1;
  border-radius: 3px;
  background-color: var(--ts-surface-2);
  border: 1px solid var(--ts-border);
}

.ts-riel-tramo.es-hecho {
  background-color: var(--ts-acero-400);
  border-color: transparent;
}

.ts-riel-tramo.es-actual {
  background-color: var(--ts-acero-600);
  border-color: transparent;
}

.ts-riel-tramo.es-detenido {
  background-color: var(--ts-rojo-500);
}

.ts-detencion {
  padding: 0.5rem 0.75rem;
  border-radius: var(--ts-radio-control, 8px);
  background-color: color-mix(in srgb, var(--ts-rojo-500) 10%, var(--ts-surface));
}

.ts-acciones {
  /* Empuja el pie abajo: en una rejilla, las acciones de todas las tarjetas
     quedan en la misma línea de mira aunque unas tengan detención y otras no. */
  margin-top: auto;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  /* «Ver ficha» al final de la fila: con cuatro atajos activos, el grupo de la
     izquierda envuelve solo y la salida a la ficha no se descuelga. */
  justify-content: space-between;
  gap: 0.5rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--ts-border);
}

@media (prefers-reduced-motion: reduce) {
  .ts-orden {
    transition: none;
  }
}
</style>
