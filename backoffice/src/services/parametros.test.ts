import { beforeEach, describe, expect, it } from 'vitest'
import { definiciones, parametrosService } from './parametros.service'
import { ordenesService } from './ordenes.service'
import { almacenService } from './almacen.service'
import { db, reiniciarMock } from './mock/db'

/**
 * La configuración de la vertical.
 *
 * Lo que se prueba no es que la pantalla guarde: es que **lo guardado mande**.
 * Un parámetro que nadie lee es decoración, así que cada regla se comprueba
 * contra el servicio que debería obedecerla.
 */

const LOCAL = 'l1'

beforeEach(() => {
  localStorage.clear()
  reiniciarMock()
})

describe('catálogo de parámetros', () => {
  it('toda definición tiene grupo, valor por defecto y una clave única', () => {
    const claves = new Set<string>()
    for (const d of definiciones) {
      expect(d.grupo, d.clave).toBeTruthy()
      expect(d.porDefecto, d.clave).toBeDefined()
      expect(claves.has(d.clave), `clave repetida: ${d.clave}`).toBe(false)
      claves.add(d.clave)
    }
  })

  it('las listas y las opciones declaran opciones válidas', () => {
    for (const d of definiciones.filter((x) => ['opcion', 'multiple', 'orden'].includes(x.tipo))) {
      expect(d.opciones?.length, d.clave).toBeGreaterThan(0)
      const validos = d.opciones!.map((o) => o.valor)
      const porDefecto = Array.isArray(d.porDefecto) ? d.porDefecto : [String(d.porDefecto)]
      for (const v of porDefecto) expect(validos, `${d.clave} → ${v}`).toContain(v)
    }
  })

  it('un parámetro que depende de otro apunta a uno que existe', () => {
    const claves = new Set(definiciones.map((d) => d.clave))
    for (const d of definiciones.filter((x) => x.depende)) {
      expect(claves, d.clave).toContain(d.depende!.clave)
    }
  })
})

describe('guardar', () => {
  it('volver al valor de fábrica se guarda como ausencia, no como copia', async () => {
    await parametrosService.guardar({ 'taller.jornadaHoras': 10 })
    expect(db.configuracion.vertical['taller.jornadaHoras']).toBe(10)

    await parametrosService.guardar({ 'taller.jornadaHoras': 8 })
    expect('taller.jornadaHoras' in db.configuracion.vertical).toBe(false)

    const resuelto = (await parametrosService.listar()).find(
      (p) => p.definicion.clave === 'taller.jornadaHoras',
    )
    expect(resuelto?.valor).toBe(8)
    expect(resuelto?.origen).toBe('defecto')
  })

  it('respeta los topes del parámetro', async () => {
    await expect(parametrosService.guardar({ 'taller.jornadaHoras': 40 })).rejects.toMatchObject({
      campos: { 'taller.jornadaHoras': expect.any(String) },
    })
  })

  it('no deja desactivar una fase fija', async () => {
    await expect(
      parametrosService.guardar({ 'taller.fases': ['diagnostico', 'reparacion'] }),
    ).rejects.toMatchObject({ campos: { 'taller.fases': expect.stringContaining('Recepción') } })
  })

  it('rechaza una opción que no existe', async () => {
    await expect(
      parametrosService.guardar({ 'almacen.descuentaStock': 'cuando-sea' }),
    ).rejects.toBeTruthy()
  })

  it('un cambio no se pisa con otro: se guardan todos de una vez', async () => {
    await parametrosService.guardar({
      'taller.jornadaHoras': 9,
      'agenda.duracionDefecto': 45,
      'almacen.permitirSinStock': true,
    })

    expect(parametrosService.valor('taller.jornadaHoras')).toBe(9)
    expect(parametrosService.valor('agenda.duracionDefecto')).toBe(45)
    expect(parametrosService.valor('almacen.permitirSinStock')).toBe(true)
  })
})

describe('la configuración manda sobre el resto de la vertical', () => {
  it('sin hoja firmada no se sale de recepción, y con el parámetro apagado sí', async () => {
    const enRecepcion = db.ordenes.find((o) => o.fase === 'recepcion' && !o.detencion)
    if (!enRecepcion) return

    await expect(ordenesService.avanzar(enRecepcion.id)).rejects.toMatchObject({
      mensaje: expect.stringContaining('hoja de ingreso'),
    })

    await parametrosService.guardar({ 'recepcion.hojaObligatoria': false })
    const avanzada = await ordenesService.avanzar(enRecepcion.id)
    expect(avanzada.fase).toBe('diagnostico')
  })

  it('«una sola orden por bahía» decide si el sistema deja compartir puesto', async () => {
    const tablero = await ordenesService.tablero(LOCAL)
    const ocupada = tablero.find((b) => b.ordenTrabajo)
    if (!ocupada) return
    const otra = (await ordenesService.enTaller(LOCAL)).find(
      (o) => o.id !== ocupada.ordenTrabajo!.id && !o.detencion,
    )!

    await expect(ordenesService.asignar(otra.id, ocupada.id)).rejects.toBeTruthy()

    await parametrosService.guardar({ 'taller.unaOrdenPorBahia': false })
    const asignada = await ordenesService.asignar(otra.id, ocupada.id)
    expect(asignada.bahiaId).toBe(ocupada.id)
  })

  it('«permitir salidas sin stock» abre la puerta que por defecto está cerrada', async () => {
    const repuesto = db.repuestos.find((r) => r.stock > 0)!
    const exceso = repuesto.stock + 5

    await expect(
      almacenService.registrarMovimiento({
        repuestoId: repuesto.id,
        tipo: 'salida',
        cantidad: exceso,
        usuarioId: 'u6',
      }),
    ).rejects.toBeTruthy()

    await parametrosService.guardar({ 'almacen.permitirSinStock': true })
    const movimiento = await almacenService.registrarMovimiento({
      repuestoId: repuesto.id,
      tipo: 'salida',
      cantidad: exceso,
      usuarioId: 'u6',
    })
    expect(movimiento.cantidad).toBe(exceso)
  })
})

describe('impacto antes de guardar', () => {
  it('avisa de las órdenes que se quedarían en una fase apagada', async () => {
    const sinControl = ['recepcion', 'diagnostico', 'presupuesto', 'reparacion', 'lista']
    const aviso = await parametrosService.impactoFases(sinControl)

    const enControl = db.ordenes.filter((o) => o.fase === 'control').length
    if (enControl > 0) {
      expect(aviso.find((a) => a.fase === 'control')?.ordenes).toBe(enControl)
    }
    // Una fase que sigue encendida nunca aparece en el aviso.
    expect(aviso.some((a) => a.fase === 'reparacion')).toBe(false)
  })
})
