<script setup lang="ts">
import FormularioAcceso from '@/components/acceso/FormularioAcceso.vue'
import KarmaLogo from '@/components/marca/KarmaLogo.vue'
import MarcaTorque from '@/components/marca/MarcaTorque.vue'
import { marca } from '@/config/marca'

/**
 * Variante «Nave»: el taller visto de frente, con el portón a media altura.
 *
 * En vez de una fotografía de archivo, la escena se dibuja con la propia
 * unidad de negocio: cada portón es una bahía y su lámpara dice en qué estado
 * está. Es la misma lectura que el usuario tendrá en el tablero, contada como
 * fachada, así que la pantalla de acceso ya enseña el producto.
 *
 * Las verticales hermanas usan este mismo armazón con su unidad —ventanas de
 * habitación en Hospedaje, mesas de salón en Restaurante—. De ahí el aire de
 * familia; lo que cambia es la pieza que se repite.
 */

type Estado = 'trabajando' | 'libre' | 'detenida'

interface Puerta {
  codigo: string
  estado: Estado
  /** El portón abierto deja ver el interior; solo uno, para que sea el foco. */
  abierta?: boolean
}

/**
 * Escena fija, no aleatoria: una nave que cambia en cada recarga parece un
 * error, y además impediría comparar capturas entre despliegues.
 */
const puertas: Puerta[] = [
  { codigo: 'B-01', estado: 'trabajando' },
  { codigo: 'B-02', estado: 'detenida' },
  { codigo: 'B-03', estado: 'trabajando', abierta: true },
  { codigo: 'B-04', estado: 'libre' },
  { codigo: 'B-05', estado: 'trabajando' },
]

const lampara: Record<Estado, string> = {
  trabajando: '#7bd3a8',
  detenida: '#fd263f',
  libre: '#5e87b8',
}

const leyenda: { estado: Estado; etiqueta: string }[] = [
  { estado: 'trabajando', etiqueta: 'En trabajo' },
  { estado: 'detenida', etiqueta: 'Detenida' },
  { estado: 'libre', etiqueta: 'Bahía libre' },
]
</script>

<template>
  <div class="grid h-full lg:grid-cols-[1.1fr_1fr]">
    <!-- Escena -->
    <div class="relative hidden flex-col justify-between overflow-hidden p-12 lg:flex">
      <div class="absolute inset-0 bg-[#080d16]" />
      <div
        class="absolute inset-x-0 top-0 h-2/3 opacity-70"
        style="background: radial-gradient(58rem 28rem at 50% -18%, #23405f 0%, transparent 70%)"
      />
      <!-- Suelo de hormigón: la nave se apoya en algo, no flota. -->
      <div
        class="absolute inset-x-0 bottom-0 h-40"
        style="background: linear-gradient(to top, #101a2b 0%, transparent 100%)"
      />

      <header class="relative flex items-center gap-3.5">
        <MarcaTorque :tamano="44" />
        <div>
          <p class="ts-display text-xl leading-none font-semibold text-[#f2f5f9]">
            {{ marca.nombre }}
          </p>
          <p class="ts-etiqueta mt-1.5 text-[#ff5c70]">{{ marca.descriptor }}</p>
        </div>
      </header>

      <!-- La nave: un portón por bahía. -->
      <div class="relative my-6 flex min-h-0 flex-1 items-center justify-center">
        <div class="w-full max-w-[32rem]">
          <!-- Techo de diente de sierra, la silueta industrial de toda nave. -->
          <svg
            class="block w-full text-[#18293f]"
            viewBox="0 0 300 26"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path d="M0 26 L0 10 L60 0 L60 26 Z" fill="currentColor" />
            <path d="M60 26 L60 10 L120 0 L120 26 Z" fill="currentColor" />
            <path d="M120 26 L120 10 L180 0 L180 26 Z" fill="currentColor" />
            <path d="M180 26 L180 10 L240 0 L240 26 Z" fill="currentColor" />
            <path d="M240 26 L240 10 L300 0 L300 26 Z" fill="currentColor" />
          </svg>

          <div class="acceso-nave grid grid-cols-5 gap-2.5 border-x border-t border-white/10 p-3">
            <div v-for="(p, i) in puertas" :key="p.codigo" class="flex flex-col items-center gap-2">
              <!-- Lámpara de bahía: color + posición, y el texto va en la leyenda. -->
              <span
                class="acceso-lampara size-1.5 rounded-full"
                :style="{
                  background: lampara[p.estado],
                  boxShadow: `0 0 10px ${lampara[p.estado]}`,
                  animationDelay: `${i * 220}ms`,
                }"
                aria-hidden="true"
              />

              <div class="acceso-porton relative w-full overflow-hidden rounded-t-[4px]">
                <!-- Portón cerrado: lamas de chapa. -->
                <div
                  v-if="!p.abierta"
                  class="h-[9.5rem] w-full"
                  :style="{
                    background:
                      'repeating-linear-gradient(to bottom, #1b2b40 0 6px, #162435 6px 12px)',
                  }"
                />

                <!-- Portón abierto: se ve el elevador con un coche encima. -->
                <div v-else class="h-[9.5rem] w-full bg-[#050a12]">
                  <div
                    class="h-[1.6rem] w-full"
                    :style="{
                      background:
                        'repeating-linear-gradient(to bottom, #1b2b40 0 6px, #162435 6px 12px)',
                    }"
                  />
                  <svg
                    class="mt-3 w-full px-2"
                    viewBox="0 0 64 30"
                    fill="none"
                    stroke="#5e87b8"
                    stroke-width="2"
                    stroke-linecap="round"
                    aria-hidden="true"
                  >
                    <path d="M6 14h52M12 14l4-7h32l4 7" />
                    <circle cx="18" cy="14" r="2.4" fill="#0b1421" />
                    <circle cx="46" cy="14" r="2.4" fill="#0b1421" />
                    <path d="M32 16v9M22 25h20" stroke="#fd263f" />
                  </svg>
                </div>
              </div>

              <span class="ts-placa text-[9px] leading-none text-[#66778e]">{{ p.codigo }}</span>
            </div>
          </div>
        </div>
      </div>

      <footer class="relative flex items-end justify-between gap-6">
        <div>
          <p class="ts-display max-w-sm text-2xl leading-snug font-semibold text-[#f2f5f9]">
            {{ marca.lema }}
          </p>
          <!-- El estado nunca se fía del color: lámpara + palabra. -->
          <ul class="mt-4 flex flex-wrap gap-x-5 gap-y-2">
            <li
              v-for="l in leyenda"
              :key="l.estado"
              class="flex items-center gap-2 text-[11px] font-semibold text-[#8e9aac]"
            >
              <span
                class="size-1.5 rounded-full"
                :style="{ background: lampara[l.estado] }"
                aria-hidden="true"
              />
              {{ l.etiqueta }}
            </li>
          </ul>
        </div>
        <div class="flex shrink-0 items-center gap-2.5 pb-1">
          <KarmaLogo :tamano="18" />
          <p class="text-[11px] text-[#66778e]">{{ marca.plataforma }}</p>
        </div>
      </footer>
    </div>

    <!-- Formulario -->
    <div class="flex items-center justify-center bg-panel p-6">
      <div class="w-full max-w-sm">
        <div class="mb-10 flex items-center gap-3 lg:hidden">
          <MarcaTorque :tamano="42" />
          <div>
            <p class="ts-display text-lg leading-none font-semibold text-tinta">
              {{ marca.nombre }}
            </p>
            <p class="ts-etiqueta mt-1.5 text-rojo-texto">{{ marca.descriptor }}</p>
          </div>
        </div>

        <h2 class="ts-titulo-pagina text-tinta">Abrir el taller</h2>
        <p class="mt-2 text-sm text-tenue">Ingresa con tu cuenta para tomar el turno.</p>

        <div class="mt-9">
          <FormularioAcceso accion="Abrir turno" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.acceso-nave {
  background: linear-gradient(to bottom, #101b2c 0%, #0a1119 100%);
}

.acceso-porton {
  border: 1px solid rgb(255 255 255 / 0.08);
  border-bottom: none;
}

/* Latido lento de la lámpara: la nave respira, no parpadea. */
.acceso-lampara {
  animation: acceso-lampara 4.5s ease-in-out infinite;
}

@keyframes acceso-lampara {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.45;
  }
}

@media (prefers-reduced-motion: reduce) {
  .acceso-lampara {
    animation: none;
  }
}
</style>
