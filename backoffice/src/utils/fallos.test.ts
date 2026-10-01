import { beforeEach, describe, expect, it } from 'vitest'
import { esTrozoPerdido, fallo, limpiarFallo, registrarFallo } from './fallos'

/**
 * El caso real: se publica una versión y la pestaña abierta pide trozos de la
 * anterior, que ya no están. Antes eso era una página en blanco sin una sola
 * pista; el navegador no lanza nada que el árbol de componentes pueda ver.
 */

beforeEach(limpiarFallo)

describe('esTrozoPerdido', () => {
  it('reconoce que falta un trozo de la versión anterior', () => {
    expect(
      esTrozoPerdido(new TypeError('Failed to fetch dynamically imported module: /assets/x.js')),
    ).toBe(true)
    expect(esTrozoPerdido(new Error('Importing a module script failed.'))).toBe(true)
    expect(esTrozoPerdido(new Error('ChunkLoadError'))).toBe(true)
  })

  it('no confunde un error cualquiera con eso', () => {
    expect(esTrozoPerdido(new Error('Cannot read properties of undefined'))).toBe(false)
  })
})

describe('registrarFallo', () => {
  it('guarda el primero: los siguientes suelen ser consecuencia suya', () => {
    registrarFallo({ mensaje: 'el de verdad', origen: 'pintado' })
    registrarFallo({ mensaje: 'el de rebote', origen: 'promesa' })
    expect(fallo.value?.mensaje).toBe('el de verdad')
  })
})
