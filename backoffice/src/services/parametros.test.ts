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

/**
 * Los dos niveles.
 *
 * Lo que se comprueba no es que se guarde en dos sitios: es que la herencia
 * siga viva. Una sede que copia el valor de la cadena deja de heredar sin que
 * nadie se entere, y ese es el fallo que arruina una configuración multisede.
 */
describe('cascada local → cadena → fábrica', () => {
  const LOCAL_B = 'l2'

  it('sin valor propio, la sede hereda lo que diga la cadena', async () => {
    await parametrosService.guardar({ 'ordenes.avisoPromesaHoras': 24 })
    const resuelto = (await parametrosService.listarLocal(LOCAL)).find(
      (p) => p.definicion.clave === 'ordenes.avisoPromesaHoras',
    )
    expect(resuelto?.valor).toBe(24)
    expect(resuelto?.origen).toBe('cadena')
  })

  it('una sede puede apartarse sin arrastrar a las demás', async () => {
    await parametrosService.guardar({ 'ordenes.avisoPromesaHoras': 24 })
    await parametrosService.guardar({ 'ordenes.avisoPromesaHoras': 4 }, LOCAL)

    expect(parametrosService.valor('ordenes.avisoPromesaHoras', LOCAL)).toBe(4)
    expect(parametrosService.valor('ordenes.avisoPromesaHoras', LOCAL_B)).toBe(24)
    expect(parametrosService.valor('ordenes.avisoPromesaHoras')).toBe(24)
  })

  it('volver a lo heredado borra el valor propio en vez de copiarlo', async () => {
    await parametrosService.guardar({ 'ordenes.avisoPromesaHoras': 24 })
    await parametrosService.guardar({ 'ordenes.avisoPromesaHoras': 4 }, LOCAL)
    // Guardar exactamente lo que dice la cadena tiene que devolver la herencia.
    await parametrosService.guardar({ 'ordenes.avisoPromesaHoras': 24 }, LOCAL)

    expect(db.configuracion.locales[LOCAL]?.['ordenes.avisoPromesaHoras']).toBeUndefined()

    // Y la prueba de que hereda de verdad: la cadena cambia y le llega.
    await parametrosService.guardar({ 'ordenes.avisoPromesaHoras': 12 })
    expect(parametrosService.valor('ordenes.avisoPromesaHoras', LOCAL)).toBe(12)
  })

  it('restablecer en la sede la devuelve a la cadena, no a fábrica', async () => {
    await parametrosService.guardar({ 'ordenes.avisoPromesaHoras': 24 })
    await parametrosService.guardar({ 'ordenes.avisoPromesaHoras': 4 }, LOCAL)
    await parametrosService.restablecer('ordenes.avisoPromesaHoras', LOCAL)
    expect(parametrosService.valor('ordenes.avisoPromesaHoras', LOCAL)).toBe(24)
  })

  it('una sede no puede apartarse de lo que decide la cadena', async () => {
    await expect(
      parametrosService.guardar({ 'recepcion.hojaObligatoria': false }, LOCAL),
    ).rejects.toMatchObject({ campos: { 'recepcion.hojaObligatoria': expect.any(String) } })
  })

  it('un parámetro de alcance vertical ignora la capa local aunque la haya', () => {
    db.configuracion.locales[LOCAL] = { 'recepcion.hojaObligatoria': false }
    expect(parametrosService.valor('recepcion.hojaObligatoria', LOCAL)).toBe(true)
  })

  it('listarLocal sólo ofrece lo que una sede puede decidir', async () => {
    const items = await parametrosService.listarLocal(LOCAL)
    expect(items.length).toBeGreaterThan(0)
    for (const p of items) expect(p.definicion.alcance).toBe('local')
  })
})

/** Las acciones rápidas de la pantalla de órdenes son configuración, no código. */
describe('acciones rápidas de órdenes', () => {
  it('cada sede decide qué se puede hacer sin abrir la ficha', async () => {
    await parametrosService.guardar({ 'ordenes.accionesRapidas': ['avanzar'] }, LOCAL)
    expect(parametrosService.valor('ordenes.accionesRapidas', LOCAL)).toEqual(['avanzar'])
    // Otra sede conserva lo que trae de fábrica.
    expect(parametrosService.valor('ordenes.accionesRapidas', 'l2')).toEqual(['avanzar', 'detener'])
  })

  it('mover la fecha prometida exige motivo cuando la cadena lo pide', async () => {
    const orden = db.ordenes.find((o) => o.localId === LOCAL)!
    const manana = new Date(Date.now() + 86_400_000).toISOString()

    await expect(ordenesService.reprogramar(orden.id, manana)).rejects.toMatchObject({
      campos: { motivo: expect.any(String) },
    })

    await parametrosService.guardar({ 'ordenes.motivoAlReprogramar': false })
    await expect(ordenesService.reprogramar(orden.id, manana)).resolves.toBeDefined()
  })

  it('con motivo queda escrito quién y cuándo lo movió', async () => {
    const orden = db.ordenes.find((o) => o.localId === LOCAL)!
    const manana = new Date(Date.now() + 86_400_000).toISOString()
    await ordenesService.reprogramar(orden.id, manana, 'El repuesto llega tarde')

    const guardada = db.ordenes.find((o) => o.id === orden.id)!
    expect(guardada.promesa).toBe(manana)
    expect(guardada.promesaMotivo).toBe('El repuesto llega tarde')
    expect(guardada.promesaCambiadaEl).toBeTruthy()
  })
})
