<script setup lang="ts">
import { ref } from 'vue'
import KmIcono from '@/components/ui/KmIcono.vue'
import { useAcceso } from '@/composables/useAcceso'

withDefaults(defineProps<{ accion?: string; sobreOscuro?: boolean }>(), {
  accion: 'Ingresar al taller',
  sobreOscuro: false,
})
const { usuario, password, errores, errorGeneral, enviar, auth, cuentasDemo } = useAcceso()
const visible = ref(false)
const ayuda = ref(false)
function probar(cuenta: string) {
  usuario.value = cuenta
  password.value = 'demo'
}
</script>

<template>
  <form class="acceso-form" :class="{ oscuro: sobreOscuro }" @submit.prevent="enviar">
    <div class="campo">
      <label for="acceso-usuario">Usuario <span>*</span></label>
      <input
        id="acceso-usuario"
        v-model="usuario"
        autocomplete="username"
        placeholder="Tu usuario"
        required
        :aria-invalid="!!errores.usuario"
        :aria-describedby="errores.usuario ? 'error-usuario' : undefined"
      />
      <p v-if="errores.usuario" id="error-usuario" class="error" role="alert">
        {{ errores.usuario }}
      </p>
    </div>
    <div class="campo">
      <label for="acceso-password">Contraseña <span>*</span></label>
      <div class="password">
        <input
          id="acceso-password"
          v-model="password"
          :type="visible ? 'text' : 'password'"
          autocomplete="current-password"
          placeholder="Tu contraseña"
          required
          :aria-invalid="!!errores.password"
          :aria-describedby="errores.password ? 'error-password' : undefined"
        />
        <button
          type="button"
          class="ver"
          :aria-label="visible ? 'Ocultar contraseña' : 'Mostrar contraseña'"
          :aria-pressed="visible"
          @click="visible = !visible"
        >
          <KmIcono v-if="visible" nombre="ojoCerrado" />
          <svg
            v-else
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            aria-hidden="true"
          >
            <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </button>
      </div>
      <p v-if="errores.password" id="error-password" class="error" role="alert">
        {{ errores.password }}
      </p>
    </div>
    <button
      type="button"
      class="recuperar"
      :aria-expanded="ayuda"
      aria-controls="acceso-ayuda"
      @click="ayuda = !ayuda"
    >
      ¿Olvidaste tu contraseña?
    </button>
    <p v-if="ayuda" id="acceso-ayuda" class="ayuda">
      Contacta al administrador de tu taller para restablecer tu contraseña.
    </p>
    <p v-if="errorGeneral" class="error" role="alert">{{ errorGeneral }}</p>
    <button class="ingresar" type="submit" data-testid="acceso-enviar" :disabled="auth.cargando">
      {{ auth.cargando ? 'Ingresando…' : accion }} <span aria-hidden="true">→</span>
    </button>
    <details class="demo">
      <summary>Probar con una cuenta demo</summary>
      <p>Cuentas de prueba · cualquier contraseña</p>
      <div class="cuentas">
        <button v-for="c in cuentasDemo" :key="c.usuario" type="button" @click="probar(c.usuario)">
          {{ c.rol }}
        </button>
      </div>
    </details>
  </form>
</template>

<style scoped>
.acceso-form {
  --texto: var(--ts-text, #24364b);
  --tenue: #64748b;
  --campo: var(--ts-surface, #fff);
  --borde: #cbd5e1;
  display: flex;
  flex-direction: column;
  gap: 22px;
  color: var(--texto);
}
.oscuro {
  --texto: #e8edf5;
  --tenue: #94a3b8;
  --campo: #263346;
  --borde: #2d3b4e;
}
.campo label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 9px;
}
.campo label span {
  color: #ff5c70;
}
input {
  width: 100%;
  height: 44px;
  border: 1px solid var(--borde);
  border-radius: 5px;
  background: var(--campo);
  padding: 0 13px;
  color: var(--texto);
  font-size: 13px;
  outline: none;
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
}
input::placeholder {
  color: var(--tenue);
}
input:focus {
  border-color: #ff5c70;
  box-shadow: 0 0 0 3px #fd263f18;
}
input[aria-invalid='true'] {
  border-color: #ff5c70;
}
.password {
  position: relative;
}
.password input {
  padding-right: 46px;
}
.ver {
  position: absolute;
  right: 5px;
  top: 5px;
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  color: var(--tenue);
  border-radius: 4px;
}
.ver svg {
  width: 17px;
  height: 17px;
}
.recuperar {
  align-self: flex-end;
  margin-top: -8px;
  color: var(--tenue);
  font-size: 11px;
}
.recuperar:hover,
.ver:hover {
  color: var(--texto);
}
.ingresar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 46px;
  padding: 12px 17px;
  border-radius: 5px;
  background: #e9213b;
  color: white;
  font-size: 12px;
  font-weight: 650;
  transition: background 0.2s;
}
.ingresar:hover {
  background: #fd263f;
}
.ingresar:disabled {
  opacity: 0.6;
  cursor: wait;
}
button:focus-visible,
summary:focus-visible {
  outline: 2px solid #ff5c70;
  outline-offset: 4px;
}
.demo {
  color: var(--tenue);
  font-size: 11px;
  margin-top: -4px;
}
.demo summary {
  cursor: pointer;
}
.demo p {
  margin-top: 12px;
}
.cuentas {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 10px;
}
.cuentas button {
  border: 1px solid var(--borde);
  border-radius: 4px;
  padding: 7px 9px;
}
.cuentas button:hover {
  color: var(--texto);
  border-color: #ff5c70;
}
.error {
  color: #ff7283;
  font-size: 12px;
  margin-top: 5px;
}
.ayuda {
  color: var(--tenue);
  font-size: 12px;
  line-height: 1.6;
}
</style>
