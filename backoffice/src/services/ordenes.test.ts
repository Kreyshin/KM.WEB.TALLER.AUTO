import { beforeEach, describe, expect, it } from 'vitest'
import { ordenesService } from './ordenes.service'
import { vehiculosService } from './vehiculos.service'
import { db, reiniciarMock } from './mock/db'

/**
 * Las reglas que sostienen la vertical.
 *
 * Todas nacen de la misma decisión: fase y detención son dimensiones
 * independientes. Si alguna de estas pruebas se rompe, lo que se rompió es el
 * modelo, no el servicio.
 */

/** La sede principal del taller de ejemplo. */
const LOCAL = 'l1'

beforeEach(() => {
  reiniciarMock()
})

describe('avanzar', () => {
  it('no avanza una orden detenida: primero hay que desatascarla', async () => {
    const [detenida] = await ordenesService.detenidas(LOCAL)
    expect(detenida).toBeDefined()

    await expect(ordenesService.avanzar(detenida!.id)).rejects.toMatchObject({
      mensaje: expect.stringContaining('detenida'),
    })
  })

  it('no empieza la reparación sin aprobación del cliente', async () => {
    const enTaller = await ordenesService.enTaller(LOCAL)
    const sinAprobar = enTaller.find((o) => o.fase === 'presupuesto' && !o.aprobada && !o.detencion)
    if (!sinAprobar) return

    await expect(ordenesService.avanzar(sinAprobar.id)).rejects.toBeTruthy()
  })
})

describe('detener y reanudar', () => {
  it('detener no cambia la fase: la orden vuelve donde estaba', async () => {
    const enTaller = await ordenesService.enTaller(LOCAL)
    const viva = enTaller.find((o) => !o.detencion)!

    const detenida = await ordenesService.detener(viva.id, 'esperaRepuesto', 'Falta la bomba')
    expect(detenida.fase).toBe(viva.fase)
    expect(detenida.detencion).toBe('esperaRepuesto')
    expect(detenida.detenidaDesde).toBeTruthy()

    const reanudada = await ordenesService.reanudar(viva.id)
    expect(reanudada.fase).toBe(viva.fase)
    expect(reanudada.detencion).toBeUndefined()
  })
})

describe('aprobar', () => {
  it('aprobar levanta la detención que esperaba precisamente esa aprobación', async () => {
    const detenidas = await ordenesService.detenidas(LOCAL)
    const esperando = detenidas.find((o) => o.detencion === 'esperaAprobacion')
    expect(esperando).toBeDefined()

    const aprobada = await ordenesService.aprobar(esperando!.id)
    expect(aprobada.aprobada).toBe(true)
    expect(aprobada.detencion).toBeUndefined()
  })
})

describe('asignar', () => {
  it('no mete dos órdenes en la misma bahía', async () => {
    const tablero = await ordenesService.tablero(LOCAL)
    const ocupada = tablero.find((b) => b.ordenTrabajo)!
    const otra = (await ordenesService.enTaller(LOCAL)).find(
      (o) => o.id !== ocupada.ordenTrabajo!.id,
    )!

    await expect(ordenesService.asignar(otra.id, ocupada.id)).rejects.toBeTruthy()
  })
})

describe('resumen', () => {
  it('cuenta lo detenido aparte de lo que hay en taller', async () => {
    const resumen = await ordenesService.resumen(LOCAL)
    expect(resumen.enTaller).toBeGreaterThan(0)
    expect(resumen.detenidas).toBeGreaterThan(0)
    expect(resumen.detenidas).toBeLessThanOrEqual(resumen.enTaller)
    expect(resumen.ocupacion).toBeGreaterThanOrEqual(0)
  })
})

/**
 * La hoja de ingreso.
 *
 * Es el documento que separa «entró así» de «se lo rayaron aquí», así que lo
 * que se prueba es que no se pueda guardar a medias y que el odómetro que se
 * anota en la vuelta al vehículo sea el que quede en la ficha del coche.
 */
describe('hoja de ingreso', () => {
  const hoja = {
    fecha: new Date().toISOString(),
    usuarioId: 'u2',
    kilometraje: 0,
    combustible: 4,
    marcas: [
      {
        id: 'm1',
        vista: 'izquierda' as const,
        zona: 'izquierda.puerta-delantera',
        x: 38,
        y: 55,
        tipo: 'rayon' as const,
        nota: 'Rayón de 20 cm',
      },
    ],
    puntos: { luces: 'conforme' as const, carroceria: 'observado' as const },
    pertenencias: ['Gata y llave de ruedas'],
    firma: 'data:image/png;base64,iVBORw0KGgo=',
    firmante: {
      nombre: 'Marco Salcedo Pinto',
      tipoDocumento: 'dni' as const,
      documento: '41258963',
    },
  }

  it('el nivel de combustible va en octavos, de 0 a 8', async () => {
    const [orden] = await ordenesService.enTaller(LOCAL)

    await expect(
      ordenesService.guardarInspeccion(orden!.id, { ...hoja, kilometraje: 1000, combustible: 9 }),
    ).rejects.toMatchObject({ campos: { combustible: expect.any(String) } })
  })

  it('el odómetro anotado en la recepción pasa a la ficha del vehículo', async () => {
    const [orden] = await ordenesService.enTaller(LOCAL)
    const antes = (await vehiculosService.obtener(orden!.vehiculoId)).kilometraje

    await ordenesService.guardarInspeccion(orden!.id, { ...hoja, kilometraje: antes + 1200 })

    const despues = await vehiculosService.obtener(orden!.vehiculoId)
    expect(despues.kilometraje).toBe(antes + 1200)
    expect(despues.kilometrajeAl).toBeTruthy()
  })

  it('una orden con la hoja firmada deja de estar pendiente de recibir', async () => {
    const pendientes = await ordenesService.sinInspeccion(LOCAL)
    expect(pendientes.length).toBeGreaterThan(0)

    const primera = pendientes[0]!
    await ordenesService.guardarInspeccion(primera.id, { ...hoja, kilometraje: 90_000 })

    const despues = await ordenesService.sinInspeccion(LOCAL)
    expect(despues.some((o) => o.id === primera.id)).toBe(false)
    expect(despues.length).toBe(pendientes.length - 1)
  })
})

/**
 * La salida del vehículo, que es el espejo de la entrada.
 *
 * En la puerta se comprueba con qué derecho se deja el coche. Aquí, en manos
 * de quién sale, que no tiene por qué ser la misma persona.
 */
describe('entrega', () => {
  const receptor = {
    nombre: 'Lucía Bernales Ayala',
    tipoDocumento: 'dni' as const,
    documento: '09887456',
  }

  async function unaLista() {
    const orden = db.ordenes.find((o) => o.fase === 'lista')
    expect(orden).toBeDefined()
    return orden!
  }

  it('avanzar ya no entrega: hay que decir en manos de quién sale', async () => {
    const orden = await unaLista()
    await expect(ordenesService.avanzar(orden.id)).rejects.toMatchObject({
      mensaje: expect.stringContaining('quién recoge'),
    })
    expect(db.ordenes.find((o) => o.id === orden.id)?.fase).toBe('lista')
  })

  it('guarda a quién se entregó, con qué derecho y quién se lo dio', async () => {
    const orden = await unaLista()
    const entregada = await ordenesService.entregar(orden.id, {
      receptor,
      relacion: 'familiar',
      respaldo: 'DNI del titular',
      entregadoPor: 'u2',
    })

    expect(entregada.fase).toBe('entregada')
    expect(entregada.entregaA?.receptor.documento).toBe('09887456')
    expect(entregada.entregaA?.relacion).toBe('familiar')
    expect(entregada.entregaA?.entregadoPor).toBe('u2')
    // La bahía queda libre para el siguiente.
    expect(entregada.bahiaId).toBeUndefined()
  })

  it('sin documento no consta a quién se entregó', async () => {
    const orden = await unaLista()
    await expect(
      ordenesService.entregar(orden.id, {
        receptor: { ...receptor, documento: '' },
        relacion: 'titular',
        entregadoPor: 'u2',
      }),
    ).rejects.toMatchObject({ campos: { documento: expect.any(String) } })
  })

  it('no se entrega lo que aún no está listo', async () => {
    const enTaller = db.ordenes.find((o) => o.fase === 'reparacion')!
    await expect(
      ordenesService.entregar(enTaller.id, { receptor, relacion: 'titular', entregadoPor: 'u2' }),
    ).rejects.toMatchObject({ mensaje: expect.stringContaining('aún no está listo') })
  })
})

describe('firmante de la hoja', () => {
  it('un trazo sin nombre no cierra la hoja', async () => {
    const [orden] = await ordenesService.enTaller(LOCAL)
    await expect(
      ordenesService.guardarInspeccion(orden!.id, {
        fecha: new Date().toISOString(),
        usuarioId: 'u2',
        kilometraje: 1000,
        combustible: 4,
        marcas: [],
        puntos: {},
        pertenencias: [],
        firma: 'data:image/png;base64,iVBORw0KGgo=',
      }),
    ).rejects.toMatchObject({ campos: { firmante: expect.any(String) } })
  })
})
