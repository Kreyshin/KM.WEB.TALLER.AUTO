<script setup lang="ts">
import FormularioAcceso from '@/components/acceso/FormularioAcceso.vue'
import KarmaLogo from '@/components/marca/KarmaLogo.vue'
import MarcaTorque from '@/components/marca/MarcaTorque.vue'
import { marca } from '@/config/marca'

/**
 * Variante «Portada»: la sobria. Mitad manifiesto, mitad formulario.
 *
 * Es la que mejor funciona cuando la pantalla se usa para presentar el
 * producto a alguien que no lo conoce todavía.
 */
</script>

<template>
  <div class="grid h-full lg:grid-cols-[1.05fr_1fr]">
    <!--
      Portada: azul marino con una veta roja al fondo. El rojo es acento de
      marca, nunca superficie: aquí aparece como resplandor y como filete, no
      como relleno.
    -->
    <div class="relative hidden flex-col justify-between overflow-hidden p-14 lg:flex">
      <div class="absolute inset-0 bg-[#0b1421]" />
      <div
        class="absolute top-[-22rem] left-1/2 size-[46rem] -translate-x-1/2 rounded-full opacity-30 blur-3xl"
        style="background: radial-gradient(circle, #23405f 0%, transparent 65%)"
      />
      <div
        class="absolute right-[-16rem] bottom-[-20rem] size-[38rem] rounded-full opacity-25 blur-3xl"
        style="background: radial-gradient(circle, #fd263f 0%, transparent 70%)"
      />

      <!-- Filigrana del isotipo, a gran escala y muy tenue. -->
      <MarcaTorque
        :tamano="520"
        class="pointer-events-none absolute right-[-9rem] bottom-[-7rem] opacity-[0.07]"
        aria-hidden="true"
      />

      <div class="relative flex items-center gap-3.5">
        <MarcaTorque :tamano="46" />
        <div>
          <p class="ts-display text-xl leading-none font-semibold text-[#f2f5f9]">
            {{ marca.nombre }}
          </p>
          <p class="ts-etiqueta mt-1.5 text-[#ff5c70]">{{ marca.descriptor }}</p>
        </div>
      </div>

      <div class="relative">
        <h1 class="ts-display max-w-lg text-[3.2rem] leading-[1.06] font-semibold text-[#f2f5f9]">
          {{ marca.lema }}
        </h1>

        <div class="ts-filete mt-8 max-w-md" role="presentation" />

        <ul class="mt-7 flex max-w-md flex-col gap-3.5">
          <li
            v-for="c in marca.capacidades"
            :key="c"
            class="flex items-start gap-3 text-sm text-[#bfc6d1]"
          >
            <span class="mt-[7px] size-1 shrink-0 rounded-full bg-[#fd263f]" aria-hidden="true" />
            {{ c }}
          </li>
        </ul>
      </div>

      <!-- La pertenencia a la plataforma se mantiene explícita. -->
      <div class="relative flex items-center gap-2.5">
        <KarmaLogo :tamano="20" />
        <p class="text-xs text-[#8e9aac]">{{ marca.plataforma }}</p>
      </div>
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

        <h2 class="ts-titulo-pagina text-tinta">Iniciar sesión</h2>
        <p class="mt-2 text-sm text-tenue">Ingresa con tu cuenta del taller.</p>

        <div class="mt-9">
          <FormularioAcceso />
        </div>
      </div>
    </div>
  </div>
</template>
