<script setup lang="ts">
/**
 * Isotipo de la vertical Taller.
 *
 * Es el activo maestro entregado por la marca (`TallerSystem.png` en la raíz
 * del repositorio, recortado y reescalado a 512 px en
 * `src/assets/marca/logo-torque.png`). Se usa tal cual: no se recolorea, no se
 * recorta y no se redibuja, igual que el isotipo de plataforma.
 *
 * Al ser un mapa de bits con transparencia, sirve sobre cualquier fondo y no
 * cambia con el tema de la interfaz.
 */
import logo from '@/assets/marca/logo-torque.png'

withDefaults(defineProps<{ tamano?: number }>(), { tamano: 44 })
</script>

<template>
  <img
    :src="logo"
    :width="tamano"
    :height="tamano"
    alt="Torque · Taller mecánico"
    decoding="async"
    class="block object-contain"
  />
</template>
