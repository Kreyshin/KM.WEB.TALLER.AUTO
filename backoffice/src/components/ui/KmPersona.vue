<script setup lang="ts">
import KmField from './KmField.vue'
import KmInput from './KmInput.vue'
import KmSelect from './KmSelect.vue'
import type { PersonaIdentificada } from '@/types'
import type { OpcionSelect } from '@/types/ui'

/**
 * Nombre y documento de alguien de carne y hueso.
 *
 * No es el cliente del padrón: es quien está delante del mostrador, que puede
 * no estar dado de alta y aun así tiene que constar —quien firma la hoja,
 * quien se lleva el coche—. Sin documento no hay a quién señalar después.
 */

defineProps<{ errorNombre?: string; errorDocumento?: string; disabled?: boolean }>()

const persona = defineModel<PersonaIdentificada>({ required: true })

const tipos: OpcionSelect[] = [
  { valor: 'dni', etiqueta: 'DNI' },
  { valor: 'ce', etiqueta: 'CE' },
  { valor: 'ruc', etiqueta: 'RUC' },
]
</script>

<template>
  <div class="grid gap-3 sm:grid-cols-[1fr_6rem_9rem]">
    <KmField v-slot="{ id, invalido }" label="Nombre" :error="errorNombre" requerido>
      <KmInput
        :id="id"
        v-model="persona.nombre"
        :invalido="invalido"
        :disabled="disabled"
        placeholder="Nombre y apellidos"
      />
    </KmField>
    <KmField v-slot="{ id }" label="Tipo">
      <KmSelect :id="id" v-model="persona.tipoDocumento" :opciones="tipos" :disabled="disabled" />
    </KmField>
    <KmField v-slot="{ id, invalido }" label="Documento" :error="errorDocumento" requerido>
      <KmInput
        :id="id"
        v-model="persona.documento"
        :invalido="invalido"
        :disabled="disabled"
        placeholder="12345678"
      />
    </KmField>
  </div>
</template>
