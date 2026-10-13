import { beforeEach, describe, expect, it } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/vue'
import { createPinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import LoginView from './LoginView.vue'
import { reiniciarMock } from '@/services/mock/db'

beforeEach(() => {
  localStorage.clear()
  reiniciarMock()
})

async function abrir() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/login', component: LoginView },
      { path: '/inicio', component: { template: '<p>Taller</p>' } },
    ],
  })
  await router.push('/login')
  await router.isReady()
  render(LoginView, { global: { plugins: [createPinia(), router] } })
  return router
}

describe('nuevo login Torque', () => {
  it('usa un campo de usuario y permite mostrar y ocultar la contraseña', async () => {
    await abrir()
    expect(screen.getByLabelText(/Usuario/)).toHaveAttribute('autocomplete', 'username')
    expect(screen.queryByLabelText(/Correo/)).not.toBeInTheDocument()
    const password = screen.getByLabelText(/^Contraseña/)
    expect(password).toHaveAttribute('type', 'password')
    await fireEvent.click(screen.getByRole('button', { name: 'Mostrar contraseña' }))
    expect(password).toHaveAttribute('type', 'text')
    await fireEvent.click(screen.getByRole('button', { name: 'Ocultar contraseña' }))
    expect(password).toHaveAttribute('type', 'password')
  })

  it('inicia sesión con usuario y redirige al taller', async () => {
    const router = await abrir()
    await fireEvent.update(screen.getByLabelText(/Usuario/), 'admin')
    await fireEvent.update(screen.getByLabelText(/^Contraseña/), 'demo')
    await fireEvent.click(screen.getByTestId('acceso-enviar'))
    await waitFor(() => expect(router.currentRoute.value.path).toBe('/inicio'))
    expect(JSON.parse(localStorage.getItem('km.taller.sesion')!).usuario.email).toBe(
      'admin@torqueautos.pe',
    )
  })
})
