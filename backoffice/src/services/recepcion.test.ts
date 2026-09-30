import { beforeEach, describe, expect, it } from 'vitest'
import { recepcionService } from './recepcion.service'
import { parametrosService } from './parametros.service'
import { tenenciaService } from './tenencia.service'
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
      usuarioId: 'u2',
      tenencia: { relacion: 'titular' },
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
      usuarioId: 'u2',
      tenencia: { relacion: 'titular' },
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
      usuarioId: 'u2',
      tenencia: { relacion: 'titular' },
    })
    expect(db.vehiculos.find((v) => v.id === vehiculo.id)?.kilometraje).toBe(antes)
  })
})

/**
 * El control que cubre al taller: quién trae el vehículo y con qué derecho.
 *
 * Lo que se prueba es que la regla vive en el servicio y no en el formulario.
 * Una regla que solo existe en una pantalla se la salta la siguiente pantalla
 * que abra una orden.
 */
describe('tenencia', () => {
  const conocido = () => db.vehiculos.find((v) => v.placa === 'AEQ-731')!

  it('no abre la orden si nadie comprobó quién trae el vehículo', async () => {
    const v = conocido()
    await expect(
      recepcionService.recibir({
        localId: LOCAL,
        placa: v.placa,
        vehiculoId: v.id,
        clienteId: v.clienteId,
        motivo: 'Revisión',
      }),
    ).rejects.toMatchObject({ campos: { relacion: expect.any(String) } })
  })

  it('deja constancia de quién lo comprobó y cuándo', async () => {
    const v = conocido()
    const orden = await recepcionService.recibir({
      localId: LOCAL,
      placa: v.placa,
      vehiculoId: v.id,
      clienteId: v.clienteId,
      motivo: 'Revisión',
      usuarioId: 'u2',
      tenencia: { relacion: 'titular' },
    })

    expect(orden.tenencia?.relacion).toBe('titular')
    expect(orden.tenencia?.verificadoPor).toBe('u2')
    expect(orden.tenencia?.verificadoEl).toBeTruthy()
  })

  it('con «solo terceros» reconoce al titular sin preguntar', async () => {
    await parametrosService.guardar({ 'recepcion.verificarTenencia': 'terceros' })
    const v = conocido()
    const orden = await recepcionService.recibir({
      localId: LOCAL,
      placa: v.placa,
      vehiculoId: v.id,
      clienteId: v.clienteId,
      motivo: 'Revisión',
      usuarioId: 'u2',
    })
    expect(orden.tenencia?.relacion).toBe('titular')
  })

  it('exige respaldo al tercero cuando la cadena lo pide', async () => {
    await parametrosService.guardar({ 'recepcion.respaldoTerceros': true })
    const v = conocido()
    const otro = db.clientes.find((c) => c.id !== v.clienteId)!

    const sinPapel = recepcionService.recibir({
      localId: LOCAL,
      placa: v.placa,
      vehiculoId: v.id,
      clienteId: otro.id,
      motivo: 'Revisión',
      usuarioId: 'u2',
      tenencia: { relacion: 'autorizado' },
    })
    await expect(sinPapel).rejects.toMatchObject({ campos: { respaldo: expect.any(String) } })

    const orden = await recepcionService.recibir({
      localId: LOCAL,
      placa: v.placa,
      vehiculoId: v.id,
      clienteId: otro.id,
      motivo: 'Revisión',
      usuarioId: 'u2',
      tenencia: { relacion: 'autorizado', respaldo: 'Carta poder legalizada' },
    })
    expect(orden.tenencia?.respaldo).toBe('Carta poder legalizada')
  })

  it('recordar declara el vínculo; el ingreso siguiente ya lo reconoce', async () => {
    const v = conocido()
    const otro = db.clientes.find((c) => c.id !== v.clienteId)!

    await recepcionService.recibir({
      localId: LOCAL,
      placa: v.placa,
      vehiculoId: v.id,
      clienteId: otro.id,
      motivo: 'Revisión',
      usuarioId: 'u2',
      tenencia: { relacion: 'familiar', nota: 'Hermano del titular', recordar: true },
    })

    expect(await tenenciaService.relacionConocida(otro.id, v.id)).toBe('familiar')
  })

  it('«no comprobar» abre la orden sin tenencia: el riesgo es del taller', async () => {
    await parametrosService.guardar({ 'recepcion.verificarTenencia': 'no' })
    const v = conocido()
    const orden = await recepcionService.recibir({
      localId: LOCAL,
      placa: v.placa,
      vehiculoId: v.id,
      clienteId: v.clienteId,
      motivo: 'Revisión',
    })
    expect(orden.tenencia).toBeUndefined()
  })
})

/**
 * Matricular y recibir son dos cosas distintas.
 *
 * Quien llama el martes para venir el jueves ya es cliente del taller aunque
 * su coche no esté aquí. Confundirlas era lo que obligaba a abrir una orden
 * para poder agendar una cita.
 */
describe('matricular', () => {
  it('da de alta cliente y vehículo sin abrir ninguna orden', async () => {
    const ordenesAntes = db.ordenes.length

    const { clienteId, vehiculoId } = await recepcionService.matricular({
      placa: 'XYZ-987',
      clienteNuevo: { nombre: 'Rosa Quispe', documento: '44556677' },
      vehiculoNuevo: { marca: 'Nissan', modelo: 'March', anio: 2018 },
    })

    expect(db.clientes.find((c) => c.id === clienteId)?.nombre).toBe('Rosa Quispe')
    expect(db.vehiculos.find((v) => v.id === vehiculoId)?.placa).toBe('XYZ-987')
    expect(db.ordenes.length).toBe(ordenesAntes)
  })

  it('un RUC entra como empresa, que es otro trato comercial', async () => {
    const { clienteId } = await recepcionService.matricular({
      placa: 'XYZ-988',
      clienteNuevo: {
        nombre: 'Servicios Lima S.A.C.',
        documento: '20512345678',
        tipoDocumento: 'ruc',
      },
      vehiculoNuevo: { marca: 'Hyundai', modelo: 'H1', anio: 2020 },
    })
    expect(db.clientes.find((c) => c.id === clienteId)?.esEmpresa).toBe(true)
  })

  it('exige el documento: sin él el taller no está cubierto', async () => {
    await expect(
      recepcionService.matricular({
        placa: 'XYZ-989',
        clienteNuevo: { nombre: 'Sin Papeles', documento: '' },
        vehiculoNuevo: { marca: 'Kia', modelo: 'Rio', anio: 2019 },
      }),
    ).rejects.toMatchObject({ campos: { documento: expect.any(String) } })
  })

  it('reconoce al que ya existe en vez de duplicarlo', async () => {
    const v = db.vehiculos.find((x) => x.placa === 'AEQ-731')!
    const { clienteId, vehiculoId } = await recepcionService.matricular({
      placa: v.placa,
      vehiculoId: v.id,
      clienteId: v.clienteId,
    })
    expect(vehiculoId).toBe(v.id)
    expect(clienteId).toBe(v.clienteId)
    expect(db.vehiculos.filter((x) => x.placa === 'AEQ-731')).toHaveLength(1)
  })
})
