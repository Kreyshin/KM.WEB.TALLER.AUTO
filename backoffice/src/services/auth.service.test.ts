import { beforeEach, describe, expect, it } from 'vitest'
import { authService } from './auth.service'
import { db, reiniciarMock } from './mock/db'

beforeEach(() => {
  localStorage.clear()
  reiniciarMock()
})

describe('acceso por usuario', () => {
  it('permite ingresar con el usuario sin correo y normaliza espacios y mayúsculas', async () => {
    const sesion = await authService.login(' ADMIN ', 'demo')
    expect(sesion.usuario.email).toBe('admin@torqueautos.pe')
    expect(sesion.token).toContain(`mock.${sesion.usuario.id}.`)
  })

  it('rechaza un correo como identificador de acceso', async () => {
    await expect(authService.login('admin@torqueautos.pe', 'demo')).rejects.toMatchObject({
      campos: { usuario: 'Usuario no registrado' },
    })
  })

  it('mantiene bloqueadas las cuentas desactivadas', async () => {
    db.usuarios.find((u) => u.email === 'admin@torqueautos.pe')!.activo = false
    await expect(authService.login('admin', 'demo')).rejects.toMatchObject({
      mensaje: 'La cuenta está desactivada. Contacta al administrador.',
    })
  })
})
