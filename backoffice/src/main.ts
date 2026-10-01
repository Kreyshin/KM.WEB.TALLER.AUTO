import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { router } from './router'
import { useAuthStore } from './stores/auth.store'
import '@vuepic/vue-datepicker/dist/main.css'
import './assets/main.css'

const app = createApp(App)

/*
 * Lo que `onErrorCaptured` no alcanza —errores fuera del árbol de pintado—
 * acaba aquí en vez de perderse en silencio.
 */
app.config.errorHandler = (e, _instancia, info) => {
  console.error('[Torque]', info, e)
}

app.use(createPinia())

// La sesión debe estar restaurada antes de que el router evalúe sus guardas.
useAuthStore().restaurar()

app.use(router)
app.mount('#app')
