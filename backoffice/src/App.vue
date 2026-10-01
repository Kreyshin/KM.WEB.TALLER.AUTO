<script setup lang="ts">
import { onErrorCaptured, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import KmButton from '@/components/ui/KmButton.vue'
import KmToaster from '@/components/ui/KmToaster.vue'

/**
 * Red de seguridad de la aplicación.
 *
 * Vue desmonta el árbol cuando una vista falla al pintarse, y lo que queda es
 * una página en blanco: el peor error posible, porque no dice qué pasó, no
 * deja volver y hace pensar que se perdió el trabajo. Un taller con el cliente
 * delante no puede quedarse mirando una pantalla vacía.
 *
 * Esto no arregla el fallo —ese se arregla en su sitio—, pero lo convierte en
 * algo que se puede contar y de lo que se puede salir.
 */

const route = useRoute()
const router = useRouter()

const fallo = ref<Error | null>(null)
const detalleAbierto = ref(false)

onErrorCaptured((e) => {
  fallo.value = e as Error
  // Se queda aquí: dejarlo subir volvería a desmontar la pantalla.
  return false
})

// Al cambiar de pantalla se vuelve a intentar: el fallo era de la anterior.
watch(
  () => route.fullPath,
  () => {
    fallo.value = null
    detalleAbierto.value = false
  },
)

function reintentar() {
  window.location.reload()
}

function alInicio() {
  fallo.value = null
  router.push({ name: 'inicio' })
}
</script>

<template>
  <RouterView v-if="!fallo" />

  <div v-else class="grid min-h-screen place-items-center bg-fondo p-6">
    <section
      class="flex w-full max-w-md flex-col gap-4 rounded-card border border-linea bg-panel p-6"
    >
      <h1 class="ts-titulo-seccion text-tinta">Esta pantalla se ha roto</h1>
      <p class="text-sm text-tenue">
        No es culpa tuya y no se ha perdido nada de lo guardado. Puedes volver a intentarlo o ir al
        inicio.
      </p>

      <div class="flex flex-wrap gap-2">
        <KmButton @click="reintentar">Volver a intentarlo</KmButton>
        <KmButton variante="secundario" @click="alInicio">Ir al inicio</KmButton>
      </div>

      <button
        type="button"
        class="self-start text-xs text-tenue underline"
        @click="detalleAbierto = !detalleAbierto"
      >
        {{ detalleAbierto ? 'Ocultar el detalle' : 'Ver el detalle técnico' }}
      </button>
      <pre
        v-if="detalleAbierto"
        class="overflow-auto rounded-control border border-linea bg-panel-2 p-3 text-xs text-tenue"
        >{{ fallo?.stack ?? fallo?.message }}</pre>
    </section>
  </div>

  <KmToaster />
</template>
