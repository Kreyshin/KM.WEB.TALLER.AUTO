import { describe, expect, it } from 'vitest'
import { etiquetaZona, zonasLateral, zonasPlanta } from './carroceria'

describe('etiquetaZona', () => {
  it('concuerda el lado con el género de la pieza', () => {
    expect(etiquetaZona('izquierda.puerta-delantera')).toBe('Puerta delantera izquierda')
    expect(etiquetaZona('derecha.estribo')).toBe('Estribo derecho')
    expect(etiquetaZona('izquierda.cristales')).toBe('Cristales laterales izquierdos')
  })

  it('no le pone lado a las piezas que no lo tienen', () => {
    expect(etiquetaZona('izquierda.paragolpes-delantero')).toBe('Paragolpes delantero')
    expect(etiquetaZona('planta.capo')).toBe('Capó')
  })

  it('aguanta una zona que ya no existe en el catálogo', () => {
    expect(etiquetaZona('izquierda.aleron-inventado')).toBe('aleron-inventado')
  })
})

describe('catálogo de zonas', () => {
  it('no repite identificadores', () => {
    for (const catalogo of [zonasLateral, zonasPlanta]) {
      const ids = catalogo.map((z) => z.id)
      expect(new Set(ids).size).toBe(ids.length)
    }
  })

  it('el estribo va el último: la franja estrecha gana el clic a las puertas', () => {
    expect(zonasLateral.at(-1)?.id).toBe('estribo')
  })
})
