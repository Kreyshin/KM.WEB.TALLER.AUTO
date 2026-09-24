import { beforeEach, describe, expect, it } from 'vitest'
import { normalizarPlaca, recepcionService } from './recepcion.service'
import { db, reiniciarMock } from './mock/db'

/**
 * La recepción empieza en la puerta.
 *
 * Lo que se prueba aquí es justo lo que la pantalla ya no presupone: que el
 * vehículo puede ser desconocido, que se da de alta en el mostrador y que la
 * cita deja de esperar en cuanto el coche entra.
 */

const LOCAL = 'l1'

beforeEach(() => {
  localStorage.clear()
  reiniciarMock()
})

describe('normalizarPlaca', () => {
  it('pone el guion y las mayúsculas por su cuenta', () => {
    expect(normalizarPlaca('aeq731')).toBe('AEQ-731')
    expect(normalizarPlaca('aeq-731')).toBe('AEQ-731')
    expect(normalizarPlaca('ae')).toBe('AE')
  })
})

describe('mostrador', () => {
  it('no cuenta como esperado al que ya está dentro', async () => {
    const { esperadas, enPiso } = await recepcionService.mostrador(LOCAL)
    const dentro = new Set(enPiso.map((o) => o.vehiculoId))
    for (const c of esperadas) expect(dentro.has(c.vehiculoId)).toBe(false)
  })
})

describe('buscarPlaca', () => {
  it('contesta lo que sabe, y null cuando no sabe nada', async () => {
    const conocido = await recepcionService.buscarPlaca('aeq731')
    expect(conocido?.modelo).toBe('Versa')
    expect(conocido?.cliente).toBeDefined()
    expect(await recepcionService.buscarPlaca('ZZZ-999')).toBeNull()
  })
})

describe('recibir', () => {
  it('da de alta cliente y vehículo cuando la placa es nueva', async () => {
    const orden = await recepcionService.recibir({
      localId: LOCAL,
      placa: 'XYZ-987',
      clienteNuevo: { nombre: 'Rosa Quispe', documento: '44556677' },
      vehiculoNuevo: { marca: 'Nissan', modelo: 'March', anio: 2018 },
      motivo: 'Chirría al girar',
      kilometraje: 90000,
    })

    const vehiculo = db.vehiculos.find((v) => v.id === orden.vehiculoId)
    expect(vehiculo?.placa).toBe('XYZ-987')
    expect(db.clientes.find((c) => c.id === orden.clienteId)?.nombre).toBe('Rosa Quispe')
    expect(orden.fase).toBe('recepcion')
    expect(orden.inspeccion).toBeUndefined()
  })

  it('exige marca y modelo: sin eso la orden no dice de qué coche habla', async () => {
    await expect(
      recepcionService.recibir({
        localId: LOCAL,
        placa: 'XYZ-987',
        clienteNuevo: { nombre: 'Rosa Quispe', documento: '44556677' },
        vehiculoNuevo: { marca: '', modelo: '', anio: 2018 },
        motivo: 'Chirría al girar',
      }),
    ).rejects.toMatchObject({ campos: { marca: expect.any(String) } })
  })

  it('la cita deja de esperar en cuanto el coche entra', async () => {
    const { esperadas } = await recepcionService.mostrador(LOCAL)
    const cita = esperadas[0]
    expect(cita).toBeDefined()

    await recepcionService.recibir({
      localId: LOCAL,
      placa: cita.vehiculo?.placa ?? '',
      vehiculoId: cita.vehiculoId,
      clienteId: cita.clienteId,
      motivo: cita.motivo,
      citaId: cita.id,
    })

    expect(db.citas.find((c) => c.id === cita.id)?.estado).toBe('llego')
    const despues = await recepcionService.mostrador(LOCAL)
    expect(despues.esperadas.some((c) => c.id === cita.id)).toBe(false)
  })

  it('no retrocede el odómetro de un vehículo conocido', async () => {
    const vehiculo = db.vehiculos.find((v) => v.placa === 'AEQ-731')!
    const antes = vehiculo.kilometraje
    await recepcionService.recibir({
      localId: LOCAL,
      placa: vehiculo.placa,
      vehiculoId: vehiculo.id,
      clienteId: vehiculo.clienteId,
      motivo: 'Revisión',
      kilometraje: antes - 5000,
    })
    expect(db.vehiculos.find((v) => v.id === vehiculo.id)?.kilometraje).toBe(antes)
  })
})
