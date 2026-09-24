import { beforeEach, describe, expect, it } from 'vitest'
import { ordenesService } from './ordenes.service'
import { reiniciarMock } from './mock/db'

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
