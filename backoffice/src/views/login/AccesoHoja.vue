<script setup lang="ts">
import FormularioAcceso from '@/components/acceso/FormularioAcceso.vue'
import KarmaLogo from '@/components/marca/KarmaLogo.vue'
import MarcaTorque from '@/components/marca/MarcaTorque.vue'
import { marca } from '@/config/marca'

/**
 * Variante «Hoja de ingreso»: el acceso sobre el papel que abre cada trabajo.
 *
 * El taller empieza siempre con la misma hoja —placa, kilometraje, nivel de
 * combustible y la vuelta al vehículo— y esta pantalla la toma prestada: el
 * talón izquierdo es el documento y el derecho, donde iría la firma del
 * cliente, es el formulario. Entrar al sistema y abrir una orden se parecen.
 *
 * Es la hermana de la «Llave» de Hospedaje: mismo gesto de meter el acceso
 * dentro de un objeto del oficio, distinto objeto.
 */

/** Revisión de recepción. Marcada = comprobado; el texto no depende del color. */
const revision = [
  { etiqueta: 'Luces y señalización', ok: true },
  { etiqueta: 'Neumáticos y repuesto', ok: true },
  { etiqueta: 'Nivel de fluidos', ok: true },
  { etiqueta: 'Carrocería y cristales', ok: false },
]
</script>

<template>
  <div class="relative flex h-full items-center justify-center overflow-hidden p-6">
    <div class="absolute inset-0 bg-[#080d16]" />
    <div
      class="absolute inset-0 opacity-70"
      style="background: radial-gradient(52rem 30rem at 50% -10%, #23405f 0%, transparent 70%)"
    />
    <!-- Rejilla tenue: el tablero de la mesa de recepción. -->
    <div
      class="absolute inset-0 opacity-[0.05]"
      style="
        background-image:
          linear-gradient(#fff 1px, transparent 1px),
          linear-gradient(90deg, #fff 1px, transparent 1px);
        background-size: 34px 34px;
      "
      aria-hidden="true"
    />

    <div class="relative w-full max-w-4xl">
      <header class="mb-6 flex items-center justify-center gap-3">
        <MarcaTorque :tamano="34" />
        <p class="ts-display text-lg leading-none font-semibold text-[#f2f5f9]">
          {{ marca.nombre }}
        </p>
        <span class="h-4 w-px bg-white/15" aria-hidden="true" />
        <p class="ts-etiqueta text-[#ff5c70]">{{ marca.descriptor }}</p>
      </header>

      <!-- La hoja. Papel claro en ambos temas: un documento no cambia de color. -->
      <div class="acceso-hoja grid overflow-hidden rounded-card md:grid-cols-[1.05fr_1fr]">
        <!-- Talón izquierdo: el documento. -->
        <section class="relative bg-[#f4f6f9] p-8">
          <div class="flex items-start justify-between gap-4">
            <div>
              <p class="ts-etiqueta text-[#7a8699]">Hoja de ingreso</p>
              <p class="ts-display mt-1 text-xl leading-none font-semibold text-[#0b1421]">
                OT-2026-0148
              </p>
            </div>
            <!-- La placa, en la tipografía de placa del sistema. -->
            <span
              class="ts-placa rounded-[4px] border-2 border-[#0b1421] bg-white px-2.5 py-1 text-base text-[#0b1421]"
            >
              BQX-417
            </span>
          </div>

          <div class="my-6 border-t border-dashed border-[#c6cedb]" role="presentation" />

          <dl class="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
            <div>
              <dt class="ts-etiqueta text-[#7a8699]">Vehículo</dt>
              <dd class="mt-1 font-semibold text-[#0b1421]">Toyota Hilux 2019</dd>
            </div>
            <div>
              <dt class="ts-etiqueta text-[#7a8699]">Kilometraje</dt>
              <dd class="mt-1 font-semibold text-[#0b1421]">86 420 km</dd>
            </div>
          </dl>

          <!-- Aguja de combustible: el dato que siempre se anota a mano. -->
          <div class="mt-6">
            <div class="flex items-center justify-between">
              <p class="ts-etiqueta text-[#7a8699]">Combustible</p>
              <p class="text-xs font-semibold text-[#0b1421]">3/4</p>
            </div>
            <div class="mt-2 flex items-center gap-1.5" aria-hidden="true">
              <span class="text-[10px] font-bold text-[#7a8699]">E</span>
              <div class="h-1.5 flex-1 overflow-hidden rounded-full bg-[#dde3ec]">
                <div class="h-full w-3/4 rounded-full bg-[#18293f]" />
              </div>
              <span class="text-[10px] font-bold text-[#7a8699]">F</span>
            </div>
          </div>

          <ul class="mt-6 flex flex-col gap-2.5">
            <li
              v-for="r in revision"
              :key="r.etiqueta"
              class="flex items-center gap-2.5 text-sm text-[#0b1421]"
            >
              <span
                class="grid size-4 shrink-0 place-items-center rounded-[3px] border"
                :class="r.ok ? 'border-[#157a4d] bg-[#157a4d]' : 'border-[#c6cedb] bg-white'"
                aria-hidden="true"
              >
                <svg
                  v-if="r.ok"
                  viewBox="0 0 12 12"
                  class="size-2.5"
                  fill="none"
                  stroke="#fff"
                  stroke-width="2.4"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M2 6.4 4.6 9 10 3.2" />
                </svg>
              </span>
              <span :class="r.ok ? '' : 'text-[#7a8699]'">{{ r.etiqueta }}</span>
              <span
                class="ml-auto text-[11px] font-semibold"
                :class="r.ok ? 'text-[#157a4d]' : 'text-[#a86a05]'"
              >
                {{ r.ok ? 'Conforme' : 'Con observación' }}
              </span>
            </li>
          </ul>

          <p class="mt-7 max-w-xs text-xs leading-relaxed text-[#7a8699]">
            {{ marca.lema }}
          </p>
        </section>

        <!-- Talón derecho: donde firma el cliente; aquí, el acceso. -->
        <section class="relative bg-panel p-8">
          <!-- Línea de troquel entre ambos talones. -->
          <span
            class="absolute inset-y-0 left-0 hidden w-px border-l border-dashed border-linea md:block"
            aria-hidden="true"
          />

          <p class="ts-etiqueta text-tenue">Recepción</p>
          <h2 class="ts-titulo-pagina mt-1 text-tinta">Firma de entrada</h2>
          <p class="mt-2 text-sm text-tenue">
            Identifícate para registrar quién recibe el vehículo.
          </p>

          <div class="mt-8">
            <FormularioAcceso accion="Registrar entrada" />
          </div>
        </section>
      </div>

      <div class="mt-6 flex items-center justify-center gap-2.5">
        <KarmaLogo :tamano="18" />
        <p class="text-[11px] text-[#66778e]">{{ marca.plataforma }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* La hoja se levanta del tablero: sombra larga y un canto de papel. */
.acceso-hoja {
  box-shadow:
    0 1px 0 rgb(255 255 255 / 0.08),
    0 28px 60px -20px rgb(0 0 0 / 0.75);
}
</style>
