<script setup lang="ts">
import { computed } from 'vue'
import KmBadge from '@/components/ui/KmBadge.vue'
import KmField from '@/components/ui/KmField.vue'
import KmInput from '@/components/ui/KmInput.vue'
import KmSelect from '@/components/ui/KmSelect.vue'
import KmSwitch from '@/components/ui/KmSwitch.vue'
import { controlesRelacion, etiquetaRelacion } from '@/services/tenencia.service'
import type { RelacionTenencia } from '@/types'
import type { OpcionSelect } from '@/types/ui'

/**
 * Con qué derecho deja el vehículo quien lo deja.
 *
 * El taller responde de un bien que no es suyo. Cuando quien lo trae no es el
 * titular hay que preguntar, y esas preguntas se enseñan aquí en vez de
 * confiarlas a la memoria del asesor: un control que hay que recordar es un
 * control que un martes con prisa no se hace.
 *
 * Reconocer no es verificar. Aunque el taller ya sepa la relación, el asesor
 * la confirma en cada ingreso, porque una autorización de hace un año no dice
 * nada de hoy.
 */

const props = defineProps<{
  /** A nombre de quién está el vehículo. */
  titular?: string
  /** Lo que el taller ya sabe de esta pareja persona–vehículo. */
  conocida?: RelacionTenencia | null
  /** Un tercero necesita documento anotado para poder dejar el vehículo. */
  exigeRespaldo?: boolean
  error?: string
  errorRespaldo?: string
}>()

const modelo = defineModel<{
  relacion: RelacionTenencia | ''
  respaldo: string
  nota: string
  recordar: boolean
}>({ required: true })

const opciones: OpcionSelect[] = (
  ['titular', 'familiar', 'empresa', 'autorizado', 'otro'] as RelacionTenencia[]
).map((r) => ({ valor: r, etiqueta: etiquetaRelacion[r] }))

const esTercero = computed(() => !!modelo.value.relacion && modelo.value.relacion !== 'titular')

const preguntas = computed(() =>
  modelo.value.relacion ? controlesRelacion[modelo.value.relacion] : [],
)
</script>

<template>
  <section class="flex flex-col gap-4 rounded-card border border-linea bg-panel-2 p-4">
    <header class="flex flex-wrap items-center gap-x-3 gap-y-1">
      <h3 class="ts-etiqueta text-tenue">Quién deja el vehículo</h3>
      <KmBadge v-if="props.conocida" tono="acero">
        Ya declarado: {{ etiquetaRelacion[props.conocida] }}
      </KmBadge>
      <span v-if="props.titular" class="ms-auto text-xs text-tenue">
        A nombre de {{ props.titular }}
      </span>
    </header>

    <KmField v-slot="{ id, invalido }" label="Relación con el vehículo" :error="props.error">
      <KmSelect
        :id="id"
        v-model="modelo.relacion"
        :opciones="opciones"
        :invalido="invalido"
        placeholder="Elige la relación"
      />
    </KmField>

    <!-- Las preguntas del oficio, a la vista: no son un aviso, son el control. -->
    <ul v-if="preguntas.length" class="flex flex-col gap-1.5">
      <li v-for="p in preguntas" :key="p" class="flex gap-2 text-sm text-tinta">
        <span aria-hidden="true" class="text-ambar">•</span>
        <span>{{ p }}</span>
      </li>
    </ul>

    <template v-if="esTercero">
      <KmField
        v-slot="{ id, invalido }"
        label="Documento que lo respalda"
        :error="props.errorRespaldo"
        :requerido="props.exigeRespaldo"
        ayuda="Qué se vio: carta poder, contrato, DNI del titular."
      >
        <KmInput
          :id="id"
          v-model="modelo.respaldo"
          :invalido="invalido"
          placeholder="Carta poder legalizada del 12/03"
        />
      </KmField>

      <KmField v-slot="{ id }" label="Nota">
        <KmInput :id="id" v-model="modelo.nota" placeholder="Hijo de la titular; ella autoriza." />
      </KmField>

      <KmSwitch
        v-model="modelo.recordar"
        etiqueta="Recordar esta relación"
        descripcion="Los próximos ingresos la reconocen, pero se seguirá confirmando en cada uno."
      />
    </template>
  </section>
</template>
