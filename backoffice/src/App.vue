<script setup lang="ts">
import { onErrorCaptured, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import KmButton from '@/components/ui/KmButton.vue'
import KmToaster from '@/components/ui/KmToaster.vue'
import { fallo, limpiarFallo, registrarFallo } from '@/utils/fallos'

/**
 * Red de seguridad de la aplicación.
 *
 * Vue desmonta el árbol cuando una vista falla al pintarse, y lo que queda es
 * una página en blanco: el peor error posible, porque no dice qué pasó, no
 * deja volver y hace pensar que se perdió el trabajo. Un taller con el cliente
 * delante no puede quedarse mirando una pantalla vacía.
 *
 * Lo de dentro del árbol lo atrapa `onErrorCaptured`; lo de fuera —promesas,
 * vistas que no se descargan, errores del navegador— llega por `utils/fallos`.
 * Ninguno de los dos caminos puede acabar en silencio.
 */

const route = useRoute()
const router = useRouter()

const version = __VERSION__

onErrorCaptured((e) => {
  registrarFallo({
    mensaje: e instanceof Error ? e.message : String(e),
    detalle: e instanceof Error ? e.stack : undefined,
    origen: 'pintado',
  })
  // Se queda aquí: dejarlo subir volvería a desmontar la pantalla.
  return false
})

// Al cambiar de pantalla se vuelve a intentar: el fallo era de la anterior.
watch(() => route.fullPath, limpiarFallo)

function reintentar() {
  window.location.reload()
}

function alInicio() {
  limpiarFallo()
  router.push({ name: 'inicio' })
}

async function copiar() {
  const f = fallo.value
  if (!f) return
  const texto = [
    `Torque ${version}`,
    `${f.origen}: ${f.mensaje}`,
    route.fullPath,
    f.detalle ?? '',
  ].join('\n')
  try {
    await navigator.clipboard.writeText(texto)
  } catch {
    // Sin portapapeles queda el detalle a la vista, que es para lo que está.
  }
}
</script>

<template>
  <RouterView v-if="!fallo" />

  <div v-else class="grid min-h-screen place-items-center bg-fondo p-6">
    <section
      class="flex w-full max-w-lg flex-col gap-4 rounded-card border border-linea bg-panel p-6"
    >
      <h1 class="ts-titulo-seccion text-tinta">Esta pantalla se ha roto</h1>
      <p class="text-sm text-tenue">
        No es culpa tuya y no se ha perdido nada de lo guardado. Puedes volver a intentarlo o ir al
        inicio.
      </p>

      <div class="flex flex-wrap gap-2">
        <KmButton @click="reintentar">Volver a intentarlo</KmButton>
        <KmButton variante="secundario" @click="alInicio">Ir al inicio</KmButton>
        <KmButton variante="fantasma" @click="copiar">Copiar el detalle</KmButton>
      </div>

      <div class="flex flex-col gap-1 border-t border-linea pt-3">
        <p class="text-xs text-tenue">
          <span class="font-semibold text-tinta">{{ fallo.origen }}</span> · versión
          {{ version }}
        </p>
        <p class="text-xs break-words text-tinta">{{ fallo.mensaje }}</p>
        <pre
          v-if="fallo.detalle"
          class="mt-1 max-h-48 overflow-auto rounded-control border border-linea bg-panel-2 p-3 text-xs text-tenue"
          >{{ fallo.detalle }}</pre>
      </div>
    </section>
  </div>

  <KmToaster />
</template>
