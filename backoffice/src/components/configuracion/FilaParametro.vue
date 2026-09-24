<script setup lang="ts">
import { computed } from 'vue'
import ListaOrdenable from './ListaOrdenable.vue'
import KmBadge from '@/components/ui/KmBadge.vue'
import KmCheckbox from '@/components/ui/KmCheckbox.vue'
import KmNumero from '@/components/ui/KmNumero.vue'
import KmSwitch from '@/components/ui/KmSwitch.vue'
import type { ParametroResuelto, ValorParametro } from '@/types'

/**
 * Un parámetro, con el control que le corresponde.
 *
 * El tipo decide el control y no al revés: un sí/no es un interruptor, una
 * política excluyente son opciones a la vista —no un desplegable que las
 * esconde—, varias cosas a la vez son casillas y una secuencia es una lista
 * que se arrastra.
 *
 * Debajo de cada parámetro va su **escenario**: qué pasa de verdad en el
 * taller si se activa. Es lo que convierte una casilla en una decisión.
 */

const props = defineProps<{
  parametro: ParametroResuelto
  /** Valor en edición, que puede diferir del guardado. */
  valor: ValorParametro
  modificado: boolean
  /**
   * En qué pantalla se está editando. La misma fila sirve para la cadena y
   * para una sede; lo único que cambia es qué cuenta como «propio» y a dónde
   * se vuelve al restablecer.
   */
  nivel?: 'cadena' | 'local'
}>()

const emit = defineEmits<{ cambiar: [ValorParametro]; restablecer: [] }>()

const d = computed(() => props.parametro.definicion)

/** El valor está fijado en el nivel que se está editando, no heredado. */
const esPropio = computed(
  () => props.parametro.origen === (props.nivel === 'local' ? 'local' : 'cadena'),
)

/** Una sede sin valor propio no tiene un hueco: hereda, y conviene decirlo. */
const heredado = computed(() => props.nivel === 'local' && !esPropio.value)

function alternarOpcionMultiple(valor: string) {
  const actuales = Array.isArray(props.valor) ? props.valor : []
  emit(
    'cambiar',
    actuales.includes(valor) ? actuales.filter((v) => v !== valor) : [...actuales, valor],
  )
}
</script>

<template>
  <div class="flex flex-col gap-3 py-5">
    <div class="flex flex-wrap items-start justify-between gap-x-6 gap-y-2">
      <div class="min-w-0 flex-1 basis-80">
        <div class="flex flex-wrap items-center gap-2">
          <p class="font-medium text-tinta">{{ d.etiqueta }}</p>
          <KmBadge v-if="modificado" tono="ambar">Sin guardar</KmBadge>
          <KmBadge v-else-if="esPropio" tono="acero">
            {{ nivel === 'local' ? 'Propio de esta sede' : 'Personalizado' }}
          </KmBadge>
          <KmBadge v-else-if="heredado" tono="neutro">↑ Heredado de la cadena</KmBadge>
          <!-- Un parámetro de alcance local se fija aquí y cada sede puede apartarse. -->
          <span v-if="d.alcance === 'local'" class="text-[10px] font-semibold text-tenue">
            · cada taller puede cambiarlo
          </span>
        </div>
        <p v-if="d.descripcion" class="mt-1 text-sm text-tenue">{{ d.descripcion }}</p>
      </div>

      <!-- Controles de una sola línea: a la derecha, alineados entre sí. -->
      <div v-if="d.tipo === 'booleano'" class="w-48 shrink-0">
        <KmSwitch
          :model-value="Boolean(valor)"
          :etiqueta="valor ? 'Sí' : 'No'"
          @update:model-value="emit('cambiar', $event)"
        />
      </div>

      <div v-else-if="d.tipo === 'numero'" class="flex w-48 shrink-0 items-center gap-2">
        <KmNumero
          :model-value="Number(valor)"
          :min="d.minimo"
          :max="d.maximo"
          :aria-label="d.etiqueta"
          @update:model-value="emit('cambiar', $event ?? 0)"
        />
        <span v-if="d.unidad" class="shrink-0 text-xs font-semibold text-tenue">
          {{ d.unidad }}
        </span>
      </div>
    </div>

    <!--
      Opciones excluyentes: a la vista y con su consecuencia escrita. Un
      desplegable obligaría a abrirlo para saber qué se está descartando.
    -->
    <fieldset v-if="d.tipo === 'opcion'" class="mt-1">
      <legend class="sr-only">{{ d.etiqueta }}</legend>
      <div class="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        <label
          v-for="o in d.opciones"
          :key="o.valor"
          class="ts-opcion flex cursor-pointer items-start gap-2.5 rounded-control border px-3 py-2.5"
          :class="valor === o.valor ? 'ts-opcion-elegida' : 'border-linea'"
        >
          <input
            type="radio"
            class="sr-only"
            :name="d.clave"
            :value="o.valor"
            :checked="valor === o.valor"
            @change="emit('cambiar', o.valor)"
          />
          <span class="ts-radio mt-0.5 shrink-0" aria-hidden="true" />
          <span class="min-w-0">
            <span class="block text-sm font-medium text-tinta">{{ o.etiqueta }}</span>
            <span v-if="o.descripcion" class="block text-xs text-tenue">{{ o.descripcion }}</span>
          </span>
        </label>
      </div>
    </fieldset>

    <!-- Varias cosas a la vez: casillas. -->
    <div v-else-if="d.tipo === 'multiple'" class="mt-1 grid gap-2.5 sm:grid-cols-2">
      <KmCheckbox
        v-for="o in d.opciones"
        :key="o.valor"
        :model-value="Array.isArray(valor) && valor.includes(o.valor)"
        @update:model-value="alternarOpcionMultiple(o.valor)"
      >
        {{ o.etiqueta }}
        <span v-if="o.descripcion" class="block text-xs font-normal text-tenue">
          {{ o.descripcion }}
        </span>
      </KmCheckbox>
    </div>

    <!-- Una secuencia: lista que se arrastra. -->
    <ListaOrdenable
      v-else-if="d.tipo === 'orden'"
      class="mt-1"
      :opciones="d.opciones ?? []"
      :model-value="Array.isArray(valor) ? valor : []"
      @update:model-value="emit('cambiar', $event)"
    />

    <!-- El escenario: qué pasa de verdad en el taller. -->
    <p v-if="d.escenario" class="ts-escenario text-sm">{{ d.escenario }}</p>

    <!--
      El límite con el ERP, dicho donde se toma la decisión. La vertical
      resuelve lo básico y transversal; lo avanzado de ese mismo concepto vive
      en un módulo. Se cuenta, no se esconde ni se insiste.
    -->
    <div
      v-if="d.erp"
      class="ts-erp flex flex-wrap items-center gap-x-2 gap-y-1 rounded-control border px-3 py-2"
    >
      <span class="ts-etiqueta shrink-0">
        <svg
          viewBox="0 0 16 16"
          class="mr-1 inline-block size-3 align-[-2px]"
          fill="none"
          stroke="currentColor"
          stroke-width="1.6"
        >
          <rect x="3.5" y="7" width="9" height="6.5" rx="1.5" />
          <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" />
        </svg>
        Módulo ERP · {{ d.erp.modulo }}
      </span>
      <span class="text-xs">Añade {{ d.erp.que }}</span>
    </div>

    <div v-if="esPropio && !modificado">
      <button
        type="button"
        class="text-xs font-semibold text-tenue underline underline-offset-2 hover:text-tinta"
        @click="emit('restablecer')"
      >
        {{ nivel === 'local' ? 'Volver a lo que diga la cadena' : 'Volver al valor de fábrica' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.ts-opcion {
  transition:
    border-color 140ms ease,
    background-color 140ms ease;
}

.ts-opcion:has(input:focus-visible) {
  outline: none;
  box-shadow: var(--ts-foco);
}

.ts-opcion-elegida {
  border-color: var(--ts-acero-500);
  background-color: color-mix(in srgb, var(--ts-acero-500) 8%, transparent);
}

/* La marca del radio: anillo y punto, dibujados para no depender del nativo. */
.ts-radio {
  width: 16px;
  height: 16px;
  border-radius: 999px;
  border: 1.5px solid var(--ts-border);
  display: grid;
  place-items: center;
}

.ts-opcion-elegida .ts-radio {
  border-color: var(--ts-acero-500);
  border-width: 5px;
}

/*
 * El escenario se lee como una nota al margen: sangrado y con un filete a la
 * izquierda, para que no compita con la etiqueta del parámetro.
 */
.ts-escenario {
  border-left: 2px solid color-mix(in srgb, var(--ts-acero-400) 45%, transparent);
  padding-left: 0.75rem;
  color: var(--ts-muted);
}

/*
 * El aviso del ERP va en el azul de la casa, no en rojo: en esta vertical el
 * rojo significa «vehículo detenido», y un módulo que se puede contratar no es
 * una alarma. Informa, no interrumpe.
 */
.ts-erp {
  border-color: color-mix(in srgb, var(--ts-acero-500) 30%, transparent);
  background-color: color-mix(in srgb, var(--ts-acero-500) 7%, transparent);
  color: color-mix(in srgb, var(--ts-acero-600) 92%, var(--ts-text));
}

[data-theme='dark'] .ts-erp {
  color: var(--ts-acero-400);
}

@media (prefers-reduced-motion: reduce) {
  .ts-opcion {
    transition: none;
  }
}
</style>
