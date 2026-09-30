import { describe, expect, it } from 'vitest'
import { esPlacaValida, normalizarPlaca, tipoDePlaca } from './placa'

/**
 * La placa peruana no tiene un solo formato. Darla por «tres letras y tres
 * números» dejaba fuera a las motos, que en un taller son media flota.
 */

describe('esPlacaValida', () => {
  it('acepta los tres formatos del parque peruano', () => {
    expect(esPlacaValida('ABC-123')).toBe(true) // liviano clásico
    expect(esPlacaValida('A12-345')).toBe(true) // zona registral + alfanuméricos
    expect(esPlacaValida('D2M-771')).toBe(true) // mezcla, como las del mock
    expect(esPlacaValida('AB-1234')).toBe(true) // moto o mototaxi
    expect(esPlacaValida('EUA-123')).toBe(true) // especial
  })

  it('rechaza lo que no encaja en ninguno', () => {
    expect(esPlacaValida('SQA-ERE')).toBe(false) // tres letras tras el guion
    expect(esPlacaValida('1BC-123')).toBe(false) // empieza por número
    expect(esPlacaValida('AB-123')).toBe(false) // moto con tres cifras
    expect(esPlacaValida('ABCD-123')).toBe(false)
    expect(esPlacaValida('')).toBe(false)
  })
})

describe('tipoDePlaca', () => {
  it('distingue un vehículo menor de uno mayor', () => {
    expect(tipoDePlaca('AB-1234')).toBe('menor')
    expect(tipoDePlaca('ABC-123')).toBe('mayor')
    expect(tipoDePlaca('nada')).toBeNull()
  })
})

describe('normalizarPlaca', () => {
  it('pone el guion y las mayúsculas por su cuenta', () => {
    expect(normalizarPlaca('aeq731')).toBe('AEQ-731')
    expect(normalizarPlaca('aeq-731')).toBe('AEQ-731')
    expect(normalizarPlaca('ae')).toBe('AE')
  })

  it('reconoce la moto cuando lo escrito solo puede serlo', () => {
    expect(normalizarPlaca('ab1234')).toBe('AB-1234')
    expect(normalizarPlaca('ab-1234')).toBe('AB-1234')
  })

  it('manda el guion que teclea quien escribe', () => {
    // `AB1234` es a la vez AB-1234 y AB1-234: el guion deshace el empate.
    expect(normalizarPlaca('ab1-234')).toBe('AB1-234')
    expect(esPlacaValida(normalizarPlaca('ab1-234'))).toBe(true)
  })

  it('no deja escribir más de lo que cabe en una placa', () => {
    expect(normalizarPlaca('abcdefghij')).toBe('ABC-DEF')
  })
})
