<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'

/**
 * Firma del cliente sobre la hoja de ingreso.
 *
 * Sin firma, la hoja no protege a nadie: es exactamente el trámite por el que
 * existe el papel. Se traza con el dedo sobre la tablet, que es como se firma
 * en una bahía, y se guarda como imagen junto a la orden.
 *
 * El botón de limpiar está siempre a mano porque una firma sale mal a la
 * primera más veces de las que uno cree.
 */

const firma = defineModel<string | undefined>()

const props = withDefaults(defineProps<{ soloLectura?: boolean }>(), { soloLectura: false })

const lienzo = ref<HTMLCanvasElement | null>(null)
const trazando = ref(false)
const vacio = ref(true)

function contexto() {
  const c = lienzo.value
  if (!c) return null
  const ctx = c.getContext('2d')
  if (!ctx) return null
  ctx.lineWidth = 2.2
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.strokeStyle = '#0b1421'
  return ctx
}

/** El lienzo se dimensiona al ancho real para que el trazo no salga borroso. */
function preparar() {
  const c = lienzo.value
  if (!c) return
  const ratio = window.devicePixelRatio || 1
  const caja = c.getBoundingClientRect()
  c.width = caja.width * ratio
  c.height = caja.height * ratio
  const ctx = c.getContext('2d')
  ctx?.scale(ratio, ratio)
  if (firma.value) pintarGuardada(firma.value)
}

function pintarGuardada(dataUrl: string) {
  const c = lienzo.value
  const ctx = c?.getContext('2d')
  if (!c || !ctx) return
  const img = new Image()
  img.onload = () => {
    ctx.clearRect(0, 0, c.width, c.height)
    ctx.drawImage(img, 0, 0, c.getBoundingClientRect().width, c.getBoundingClientRect().height)
    vacio.value = false
  }
  img.src = dataUrl
}

function punto(e: PointerEvent) {
  const caja = lienzo.value!.getBoundingClientRect()
  return { x: e.clientX - caja.left, y: e.clientY - caja.top }
}

function empezar(e: PointerEvent) {
  if (props.soloLectura) return
  const ctx = contexto()
  if (!ctx) return
  trazando.value = true
  const { x, y } = punto(e)
  ctx.beginPath()
  ctx.moveTo(x, y)
  lienzo.value?.setPointerCapture(e.pointerId)
}

function seguir(e: PointerEvent) {
  if (!trazando.value) return
  const ctx = contexto()
  if (!ctx) return
  const { x, y } = punto(e)
  ctx.lineTo(x, y)
  ctx.stroke()
  vacio.value = false
}

function terminar() {
  if (!trazando.value) return
  trazando.value = false
  if (!vacio.value) firma.value = lienzo.value?.toDataURL('image/png')
}

function limpiar() {
  const c = lienzo.value
  const ctx = c?.getContext('2d')
  if (!c || !ctx) return
  ctx.clearRect(0, 0, c.width, c.height)
  vacio.value = true
  firma.value = undefined
}

onMounted(preparar)
watch(() => props.soloLectura, preparar)
</script>

<template>
  <div>
    <div class="flex items-baseline justify-between">
      <p class="ts-etiqueta text-tenue">Firma del cliente</p>
      <button
        v-if="!soloLectura && !vacio"
        type="button"
        class="text-[11px] font-semibold text-tenue underline underline-offset-2 hover:text-tinta"
        @click="limpiar"
      >
        Limpiar
      </button>
    </div>

    <div class="ts-firma relative mt-2">
      <canvas
        ref="lienzo"
        class="block h-28 w-full touch-none"
        :class="soloLectura ? '' : 'cursor-crosshair'"
        aria-label="Firma del cliente"
        @pointerdown="empezar"
        @pointermove="seguir"
        @pointerup="terminar"
        @pointerleave="terminar"
      />
      <p
        v-if="vacio"
        class="pointer-events-none absolute inset-0 grid place-items-center text-xs text-[#7a8699]"
      >
        {{ soloLectura ? 'Sin firmar' : 'Firma aquí' }}
      </p>
      <!-- La raya del papel: se firma sobre una línea, no sobre el vacío. -->
      <span
        class="pointer-events-none absolute right-6 bottom-6 left-6 border-b border-[#c6cedb]"
      />
    </div>
  </div>
</template>

<style scoped>
.ts-firma {
  /* Papel claro en los dos temas: un documento no cambia de color. */
  background-color: #f4f6f9;
  border: 1px solid #c6cedb;
  border-radius: var(--ts-radio-control);
}
</style>
