import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/vue'
import App from '@/App.vue'
import { defineComponent } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import { createPinia, setActivePinia } from 'pinia'

/**
 * La página en blanco es el peor error posible: no dice qué pasó, no deja
 * volver y hace pensar que se perdió el trabajo.
 */

const Rota = defineComponent({
  setup() {
    const nada: string[] = undefined as unknown as string[]
    return () => nada.includes('x')
  },
})

describe('red de seguridad', () => {
  it('una vista que falla al pintarse no deja la pantalla vacía', async () => {
    setActivePinia(createPinia())
    const router = createRouter({
      history: createWebHistory(),
      routes: [
        { path: '/', name: 'inicio', component: { template: '<p>Inicio</p>' } },
        { path: '/rota', name: 'rota', component: Rota },
      ],
    })

    router.push('/rota')
    await router.isReady()
    render(App, { global: { plugins: [router] } })

    expect(await screen.findByText(/se ha roto/i)).toBeTruthy()
    // Y deja salir: sin esto, el panel sería otro callejón.
    expect(screen.getByRole('button', { name: /ir al inicio/i })).toBeTruthy()
  })
})
