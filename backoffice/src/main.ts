import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { router } from './router'
import { useAuthStore } from './stores/auth.store'
import '@vuepic/vue-datepicker/dist/main.css'
import './assets/main.css'
import { registrarFallo, vigilarFallosGlobales } from './utils/fallos'

// Antes de montar: un fallo durante el arranque también tiene que contarse.
vigilarFallosGlobales()

const app = createApp(App)

/*
 * Lo que `onErrorCaptured` no alcanza —errores fuera del árbol de pintado—
 * acaba aquí en vez de perderse en silencio.
 */
app.config.errorHandler = (e, _instancia, info) => {
  registrarFallo({
    mensaje: e instanceof Error ? e.message : String(e),
    detalle: `${info}\n${e instanceof Error ? e.stack : ''}`,
    origen: 'pintado',
  })
}

app.use(createPinia())

// La sesión debe estar restaurada antes de que el router evalúe sus guardas.
useAuthStore().restaurar()

app.use(router)
/*
 * La versión, en el propio documento. Quien reporta un fallo no tiene por qué
 * abrir la consola, y el panel de error la enseña desde aquí.
 */
document.documentElement.dataset.version = __VERSION__

app.mount('#app')
