<script setup lang="ts">
import FormularioAcceso from '@/components/acceso/FormularioAcceso.vue'
import KarmaLogo from '@/components/marca/KarmaLogo.vue'
import MarcaTorque from '@/components/marca/MarcaTorque.vue'
import { marca } from '@/config/marca'

/**
 * Variante «Nave»: el taller de frente, con los portones a media altura.
 *
 * En vez de una fotografía de archivo, la escena se dibuja con la propia
 * unidad de negocio: cada bahía es un puesto y su lámpara dice en qué estado
 * está. Es la misma lectura que el usuario tendrá en el tablero, contada como
 * nave, así que la pantalla de acceso ya enseña el producto.
 *
 * Las verticales hermanas usan este mismo armazón con su unidad —ventanas de
 * habitación en Hospedaje, mesas de salón en Restaurante—. De ahí el aire de
 * familia; lo que cambia es la pieza que se repite y, sobre todo, la luz: un
 * hotel de noche se ve por las ventanas encendidas y un taller, por el cono de
 * las lámparas cenitales sobre el coche.
 */

type Estado = 'trabajando' | 'detenida' | 'libre'

interface Bahia {
  codigo: string
  estado: Estado
  /** Un coche en el aire es la silueta que identifica un taller al instante. */
  elevador?: boolean
}

/**
 * Escena fija, no aleatoria: una nave que cambia en cada recarga parece un
 * error, y además impediría comparar capturas entre despliegues.
 */
const bahias: Bahia[] = [
  { codigo: 'B-01', estado: 'trabajando', elevador: true },
  { codigo: 'B-02', estado: 'detenida' },
  { codigo: 'B-03', estado: 'trabajando' },
  { codigo: 'B-04', estado: 'libre' },
  { codigo: 'B-05', estado: 'trabajando', elevador: true },
  { codigo: 'B-06', estado: 'libre' },
]

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
      <div class="absolute inset-0 bg-[#070c14]" />
      <div
        class="absolute inset-x-0 top-0 h-2/3 opacity-60"
        style="background: radial-gradient(56rem 26rem at 50% -20%, #23405f 0%, transparent 70%)"
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

      <!-- La nave: un puesto por bahía. -->
      <div class="relative my-6 flex min-h-0 flex-1 items-center justify-center">
        <div
          class="acceso-nave w-full max-w-[31rem] rounded-card border border-white/10 p-5"
          role="img"
          :aria-label="`Nave del taller con ${bahias.length} bahías en distintos estados`"
        >
          <!-- Cercha: la estructura metálica que toda nave tiene encima. -->
          <svg
            class="block w-full text-white/12"
            viewBox="0 0 300 26"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path d="M0 25h300M0 3h300" stroke="currentColor" stroke-width="1.5" />
            <path
              d="M0 25 25 3 50 25 75 3 100 25 125 3 150 25 175 3 200 25 225 3 250 25 275 3 300 25"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
            />
          </svg>

          <div class="mt-4 grid grid-cols-6 gap-2.5">
            <div
              v-for="(b, i) in bahias"
              :key="b.codigo"
              class="acceso-bahia"
              :class="`es-${b.estado}`"
              :style="{ animationDelay: `${i * 110}ms` }"
            >
              <!-- Lámpara cenital y su cono: la luz propia de una nave. -->
              <span class="acceso-lampara" aria-hidden="true" />
              <span class="acceso-cono" aria-hidden="true" />

              <div class="acceso-porton">
                <!-- Lo que se ve por debajo del portón entreabierto. -->
                <svg
                  v-if="b.estado !== 'libre'"
                  class="acceso-coche"
                  viewBox="0 0 60 44"
                  aria-hidden="true"
                >
                  <!--
                    Coche de frente, en negro contra la luz de la bahía. Los
                    faros son lo único encendido: dos puntos bastan para que el
                    bulto se lea como un coche y no como una mancha.
                  -->
                  <path
                    d="M9 40V24c0-2.2 1-4.3 2.8-5.8l4.4-4.6c1.2-1.2 2.8-2 4.5-2h18.6c1.7 0 3.3.8 4.5 2l4.4 4.6C50 19.7 51 21.8 51 24v16z"
                    fill="#05090f"
                  />
                  <path
                    d="M18 21.5h24l-3.4-4.6c-.6-.8-1.5-1.3-2.5-1.3H23.9c-1 0-1.9.5-2.5 1.3z"
                    fill="#0d1622"
                  />
                  <circle cx="16" cy="30" r="2.6" fill="currentColor" />
                  <circle cx="44" cy="30" r="2.6" fill="currentColor" />
                  <template v-if="b.elevador">
                    <path d="M7 40v4M53 40v4" stroke="#05090f" stroke-width="3" />
                  </template>
                </svg>
              </div>

              <span class="ts-placa mt-1.5 block text-center text-[8px] text-white/35">
                {{ b.codigo }}
              </span>
            </div>
          </div>

          <!-- Solera: la pintura del suelo, que es lo que ordena un taller. -->
          <div class="acceso-solera mt-3" aria-hidden="true" />
        </div>
      </div>

      <!-- El filete de la marca cierra la escena por abajo. -->
      <div class="ts-filete relative" role="presentation" />

      <div class="relative">
        <h1
          class="ts-display mt-8 max-w-sm text-[2.4rem] leading-[1.12] font-semibold text-[#f2f5f9]"
        >
          {{ marca.lema }}
        </h1>

        <!-- El estado nunca se fía del color: lámpara + palabra. -->
        <ul class="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2">
          <li
            v-for="l in leyenda"
            :key="l.estado"
            class="flex items-center gap-2 text-xs text-[#9aa6b6]"
          >
            <span class="acceso-punto" :class="`es-${l.estado}`" aria-hidden="true" />
            {{ l.etiqueta }}
          </li>
        </ul>

        <div class="mt-8 flex items-center gap-2.5">
          <KarmaLogo :tamano="18" />
          <p class="text-xs text-[#66778e]">{{ marca.plataforma }}</p>
        </div>
      </div>
    </div>

    <!-- Acceso -->
    <div class="flex items-center justify-center bg-panel p-6">
      <div class="w-full max-w-sm">
        <div class="mb-9 flex items-center gap-3 lg:hidden">
          <MarcaTorque :tamano="40" />
          <p class="ts-display text-lg leading-none font-semibold text-tinta">{{ marca.nombre }}</p>
        </div>

        <p class="ts-etiqueta text-rojo-texto">Bahías</p>
        <h2 class="ts-titulo-pagina mt-2 text-tinta">Abre el taller</h2>
        <p class="mt-2 text-sm text-tenue">
          Las luces ya están encendidas. Entra para ver cuáles avanzan.
        </p>

        <div class="mt-8">
          <FormularioAcceso accion="Abrir turno" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/*
 * La nave se insinúa con un degradado vertical: arriba se funde con la noche,
 * abajo se apoya en la solera.
 */
.acceso-nave {
  background: linear-gradient(180deg, rgb(11 20 33 / 0.25) 0%, rgb(11 20 33 / 0.92) 100%);
  backdrop-filter: blur(2px);
}

.acceso-bahia {
  position: relative;
  padding-top: 14px;
  opacity: 0;
  animation: acceso-encender 0.7s ease-out forwards;
}

/* La lámpara: un punto de luz colgado del techo, uno por bahía. */
.acceso-lampara {
  position: absolute;
  top: 4px;
  left: 50%;
  width: 5px;
  height: 5px;
  margin-left: -2.5px;
  border-radius: 999px;
  background: currentColor;
  box-shadow: 0 0 9px 1px currentColor;
}

/*
 * El cono de luz. Es el equivalente de la ventana encendida de Hospedaje: lo
 * que hace que la escena se lea como un sitio con gente trabajando dentro y no
 * como un diagrama.
 */
.acceso-cono {
  position: absolute;
  top: 7px;
  left: 50%;
  width: 150%;
  height: 100%;
  margin-left: -75%;
  clip-path: polygon(44% 0, 56% 0, 100% 100%, 0 100%);
  background: linear-gradient(180deg, currentColor 0%, transparent 78%);
  opacity: 0.18;
}

/*
 * La bahía encendida. Aquí está la diferencia con la vertical hermana: un
 * hotel de noche se lee por la ventana iluminada; un taller, por la boca de la
 * bahía con la luz dentro y el coche recortado en negro contra ella.
 *
 * Arriba, la franja de lamas del portón recogido: sin ella el rectángulo no es
 * un portón, es un hueco.
 */
.acceso-porton {
  position: relative;
  height: 6rem;
  overflow: hidden;
  border: 1px solid rgb(255 255 255 / 0.12);
  border-bottom: none;
  border-radius: 3px 3px 0 0;
  background-color: #080f19;
  background-image:
    repeating-linear-gradient(to bottom, #1f3048 0 4px, #16243a 4px 8px),
    linear-gradient(
      180deg,
      color-mix(in srgb, currentColor 14%, transparent) 0%,
      color-mix(in srgb, currentColor 30%, transparent) 42%,
      color-mix(in srgb, currentColor 62%, transparent) 100%
    );
  background-size:
    100% 1.15rem,
    100% 100%;
  background-repeat: no-repeat, no-repeat;
  box-shadow: inset 0 -14px 22px -12px currentColor;
}

.acceso-coche {
  position: absolute;
  right: 8%;
  bottom: 0;
  left: 8%;
  width: 84%;
  filter: drop-shadow(0 0 5px color-mix(in srgb, currentColor 45%, transparent));
}

/* La solera pintada: dos líneas y la marca de los puestos. */
.acceso-solera {
  height: 10px;
  border-top: 1px solid rgb(255 255 255 / 0.14);
  background: repeating-linear-gradient(
    90deg,
    rgb(255 255 255 / 0.1) 0 2px,
    transparent 2px 16.6667%
  );
}

.acceso-punto {
  display: inline-block;
  width: 9px;
  height: 9px;
  border-radius: 999px;
}

/*
 * El color lo pone el estado y lo heredan la lámpara, el cono y el coche, que
 * es lo que mantiene la escena coherente sin repetir el token tres veces.
 */
.es-trabajando {
  color: #7bd3a8;
}

.es-detenida {
  color: #fd263f;
}

.es-libre {
  color: #5e87b8;
}

.acceso-punto.es-trabajando {
  background: #7bd3a8;
}

.acceso-punto.es-detenida {
  background: #fd263f;
}

.acceso-punto.es-libre {
  background: #5e87b8;
}

/* La bahía libre está apagada: no hay nadie trabajando ahí. */
.acceso-bahia.es-libre .acceso-lampara {
  opacity: 0.32;
  box-shadow: none;
}

.acceso-bahia.es-libre .acceso-cono {
  opacity: 0.05;
}

/* Bahía libre: a oscuras. No hay nadie trabajando ahí. */
.acceso-bahia.es-libre .acceso-porton {
  background-image:
    repeating-linear-gradient(to bottom, #1f3048 0 4px, #16243a 4px 8px),
    linear-gradient(180deg, rgb(94 135 184 / 0.05) 0%, rgb(94 135 184 / 0.13) 100%);
  box-shadow: none;
}

/* Lo detenido late muy despacio, igual que en el tablero. */
.acceso-bahia.es-detenida .acceso-lampara {
  animation: acceso-aviso 3.4s ease-in-out infinite 1.1s;
}

@keyframes acceso-encender {
  from {
    opacity: 0;
    transform: translateY(8px) scale(0.96);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

@keyframes acceso-aviso {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.35;
  }
}

/* Quien pide menos movimiento ve la nave encendida, sin transición. */
@media (prefers-reduced-motion: reduce) {
  .acceso-bahia,
  .acceso-bahia.es-detenida .acceso-lampara {
    opacity: 1;
    animation: none;
  }
}
</style>
