import type {
  BahiaResuelta,
  Consulta,
  FaseOrden,
  Inspeccion,
  ItemOrden,
  MotivoDetencion,
  NuevaOrden,
  OrdenResuelta,
  OrdenTrabajo,
  Paginado,
} from '@/types'
import { fasesActivas, siguienteFase } from '@/utils/ordenes'
import { db, latencia, nuevoId, persistir } from './mock/db'
import { errorCampo } from './mock/reglas'
import { crearRepositorio } from './mock/repositorio'

const repo = crearRepositorio('ordenes', {
  prefijo: 'o',
  entidad: 'Orden de trabajo',
  camposBusqueda: ['codigo', 'motivo', 'diagnostico'],
})

/** Total e horas se calculan solo sobre lo aprobado: lo rechazado no se cobra. */
function totales(items: ItemOrden[]) {
  const aprobados = items.filter((i) => i.aprobado)
  return {
    total: aprobados.reduce((suma, i) => suma + i.precio * i.cantidad, 0),
    horas: aprobados.reduce((suma, i) => suma + (i.horas ?? 0) * i.cantidad, 0),
  }
}

function resolver(o: OrdenTrabajo): OrdenResuelta {
  return {
    ...o,
    vehiculo: db.vehiculos.find((v) => v.id === o.vehiculoId),
    cliente: db.clientes.find((c) => c.id === o.clienteId),
    bahia: db.bahias.find((b) => b.id === o.bahiaId),
    tecnico: db.usuarios.find((u) => u.id === o.tecnicoId),
    ...totales(o.items),
  }
}

function nuevoCodigo() {
  return `OT-${2400 + db.ordenes.length + 1}`
}

/**
 * Órdenes de trabajo.
 *
 * Las dos dimensiones —fase y detención— se mueven con operaciones distintas.
 * `avanzar` empuja el trabajo por su camino; `detener` y `reanudar` dicen si
 * ese trabajo corre o está parado, sin perder en qué punto se quedó.
 */
export const ordenesService = {
  ...repo,

  async consultarResueltas(consulta?: Consulta): Promise<Paginado<OrdenResuelta>> {
    const { items, ...resto } = await repo.consultar(consulta)
    return { ...resto, items: items.map(resolver) }
  },

  async obtenerResuelta(id: string): Promise<OrdenResuelta> {
    return resolver(await repo.obtener(id))
  },

  /** Órdenes vivas de la sede: las que ocupan taller ahora mismo. */
  async enTaller(localId: string): Promise<OrdenResuelta[]> {
    const items = db.ordenes
      .filter((o) => o.localId === localId && fasesActivas.includes(o.fase))
      .sort((a, b) => a.ingreso.localeCompare(b.ingreso))
      .map(resolver)
    return latencia(items)
  },

  /** Solo las detenidas, que es lo que de verdad hay que desatascar. */
  async detenidas(localId: string): Promise<OrdenResuelta[]> {
    const items = await this.enTaller(localId)
    return items.filter((o) => o.detencion)
  },

  /** El plano del taller: cada bahía con la orden que tiene dentro. */
  async tablero(localId: string): Promise<BahiaResuelta[]> {
    const ordenes = await this.enTaller(localId)
    const bahias = db.bahias
      .filter((b) => b.localId === localId && b.activo)
      .sort((a, b) => a.posicion - b.posicion)
      .map((bahia) => ({
        ...bahia,
        ordenTrabajo: ordenes.find((o) => o.bahiaId === bahia.id),
      }))
    return latencia(bahias)
  },

  async crear(datos: NuevaOrden): Promise<OrdenTrabajo> {
    if (!datos.motivo?.trim()) {
      throw errorCampo('motivo', 'Anota con qué viene el cliente.')
    }
    return repo.crear({
      ...datos,
      codigo: nuevoCodigo(),
      ingreso: new Date().toISOString(),
      items: [],
    } as Omit<OrdenTrabajo, 'id'>)
  },

  /**
   * Avanza a la siguiente fase.
   *
   * Dos reglas que el taller impone y el sistema sostiene: no se repara sin
   * aprobación del cliente, y no se entrega una orden detenida.
   */
  async avanzar(id: string): Promise<OrdenTrabajo> {
    const orden = db.ordenes.find((o) => o.id === id)
    if (!orden) throw { mensaje: 'Orden no encontrada.' }

    const destino = siguienteFase[orden.fase]
    if (!destino) throw { mensaje: 'La orden ya está en su fase final.' }

    if (orden.detencion) {
      throw {
        mensaje: 'La orden está detenida. Reanúdala antes de avanzar.',
      }
    }
    if (destino === 'reparacion' && !orden.aprobada) {
      throw {
        mensaje: 'El cliente aún no aprueba el presupuesto. Sin aprobación no se toca el vehículo.',
      }
    }

    const cambios: Partial<OrdenTrabajo> = { fase: destino }
    if (destino === 'entregada') {
      cambios.entrega = new Date().toISOString()
      // Al salir, la bahía queda libre para el siguiente.
      cambios.bahiaId = undefined
    }
    return repo.actualizar(id, cambios)
  },

  /** El cliente aprueba el presupuesto: se guarda quién y cuándo. */
  async aprobar(id: string): Promise<OrdenTrabajo> {
    const orden = db.ordenes.find((o) => o.id === id)
    if (!orden) throw { mensaje: 'Orden no encontrada.' }
    if (!orden.items.some((i) => i.aprobado)) {
      throw { mensaje: 'No hay ninguna línea aprobada en el presupuesto.' }
    }
    const cambios: Partial<OrdenTrabajo> = {
      aprobada: true,
      aprobadaEl: new Date().toISOString(),
    }
    // Aprobar es justo lo que desatasca una orden que esperaba respuesta.
    if (orden.detencion === 'esperaAprobacion') {
      cambios.detencion = undefined
      cambios.detenidaDesde = undefined
      cambios.notaDetencion = undefined
    }
    return repo.actualizar(id, cambios)
  },

  /**
   * Detiene la orden sin cambiarla de fase: cuando se reanude, el trabajo
   * sigue donde estaba. Ese es el motivo de separar las dos dimensiones.
   */
  async detener(id: string, motivo: MotivoDetencion, nota?: string): Promise<OrdenTrabajo> {
    const orden = db.ordenes.find((o) => o.id === id)
    if (!orden) throw { mensaje: 'Orden no encontrada.' }
    if (!fasesActivas.includes(orden.fase)) {
      throw { mensaje: 'Una orden entregada o anulada ya no se detiene.' }
    }
    return repo.actualizar(id, {
      detencion: motivo,
      detenidaDesde: new Date().toISOString(),
      notaDetencion: nota,
    })
  },

  async reanudar(id: string): Promise<OrdenTrabajo> {
    const orden = db.ordenes.find((o) => o.id === id)
    if (!orden) throw { mensaje: 'Orden no encontrada.' }
    if (!orden.detencion) throw { mensaje: 'La orden no está detenida.' }
    return repo.actualizar(id, {
      detencion: undefined,
      detenidaDesde: undefined,
      notaDetencion: undefined,
    })
  },

  /** Asigna bahía y técnico; una bahía no operativa no admite trabajo. */
  async asignar(id: string, bahiaId?: string, tecnicoId?: string): Promise<OrdenTrabajo> {
    if (bahiaId) {
      const bahia = db.bahias.find((b) => b.id === bahiaId)
      if (!bahia) throw { mensaje: 'Bahía no encontrada.' }
      if (!bahia.operativa) {
        throw { mensaje: `La bahía ${bahia.codigo} está fuera de servicio.` }
      }
      const ocupada = db.ordenes.find(
        (o) => o.id !== id && o.bahiaId === bahiaId && fasesActivas.includes(o.fase),
      )
      if (ocupada) {
        throw { mensaje: `La bahía ${bahia.codigo} ya tiene la ${ocupada.codigo} dentro.` }
      }
    }
    return repo.actualizar(id, { bahiaId, tecnicoId })
  },

  /** Añade una línea al presupuesto y descuenta stock si es un repuesto. */
  async agregarItem(id: string, item: Omit<ItemOrden, 'id'>): Promise<OrdenTrabajo> {
    const orden = db.ordenes.find((o) => o.id === id)
    if (!orden) throw { mensaje: 'Orden no encontrada.' }
    if (item.cantidad <= 0) throw errorCampo('cantidad', 'La cantidad debe ser mayor que cero.')

    if (item.tipo === 'repuesto') {
      const repuesto = db.repuestos.find((r) => r.id === item.referenciaId)
      if (!repuesto) throw { mensaje: 'Repuesto no encontrado.' }
      const bloquear = db.configuracion.vertical['almacen.bloquearSinStock'] !== false
      if (bloquear && repuesto.stock < item.cantidad) {
        throw {
          mensaje: `Solo quedan ${repuesto.stock} de ${repuesto.nombre}. Pide reposición antes de comprometerlo.`,
        }
      }
    }

    orden.items.push({ ...item, id: nuevoId('i') })
    persistir()
    return latencia(orden)
  },

  async quitarItem(id: string, itemId: string): Promise<OrdenTrabajo> {
    const orden = db.ordenes.find((o) => o.id === id)
    if (!orden) throw { mensaje: 'Orden no encontrada.' }
    orden.items = orden.items.filter((i) => i.id !== itemId)
    persistir()
    return latencia(orden)
  },

  /** El cliente puede rechazar una línea sin tumbar el resto del presupuesto. */
  async alternarItem(id: string, itemId: string): Promise<OrdenTrabajo> {
    const orden = db.ordenes.find((o) => o.id === id)
    const item = orden?.items.find((i) => i.id === itemId)
    if (!orden || !item) throw { mensaje: 'Línea no encontrada.' }
    item.aprobado = !item.aprobado
    persistir()
    return latencia(orden)
  },

  /**
   * Guarda la hoja de ingreso.
   *
   * Es el documento que separa «se lo rayaron aquí» de «entró así», y por eso
   * solo vale con dos cosas: el kilometraje real de entrada y la firma del
   * cliente. Una hoja sin firmar no protege a nadie, así que el sistema la
   * guarda pero no deja avanzar la orden con ella a medias.
   *
   * Al guardarla se actualiza también el odómetro del vehículo: la vuelta al
   * coche es el único momento en que alguien lo mira de verdad.
   */
  async guardarInspeccion(id: string, inspeccion: Inspeccion): Promise<OrdenTrabajo> {
    const orden = db.ordenes.find((o) => o.id === id)
    if (!orden) throw { mensaje: 'Orden no encontrada.' }

    if (inspeccion.kilometraje < 0) {
      throw errorCampo('kilometraje', 'El kilometraje no puede ser negativo.')
    }
    if (inspeccion.combustible < 0 || inspeccion.combustible > 8) {
      throw errorCampo('combustible', 'El nivel va de 0 a 8 octavos.')
    }

    const vehiculo = db.vehiculos.find((v) => v.id === orden.vehiculoId)
    if (vehiculo && inspeccion.kilometraje > vehiculo.kilometraje) {
      vehiculo.kilometraje = inspeccion.kilometraje
      vehiculo.kilometrajeAl = new Date().toISOString()
    }

    persistir()
    return repo.actualizar(id, { inspeccion, kilometraje: inspeccion.kilometraje })
  },

  /** Las órdenes que todavía no tienen hecha la vuelta al vehículo. */
  async sinInspeccion(localId: string): Promise<OrdenResuelta[]> {
    const items = await this.enTaller(localId)
    return items.filter((o) => !o.inspeccion?.firma)
  },

  /** Resumen del día: lo que gobierna la jornada del taller. */
  async resumen(localId: string) {
    const enTaller = await this.enTaller(localId)
    const bahias = db.bahias.filter((b) => b.localId === localId && b.activo)
    const operativas = bahias.filter((b) => b.operativa)
    const ocupadas = enTaller.filter((o) => o.bahiaId).length
    const hoy = new Date().toISOString().slice(0, 10)

    const porFase = {} as Record<FaseOrden, number>
    for (const o of enTaller) porFase[o.fase] = (porFase[o.fase] ?? 0) + 1

    return latencia({
      enTaller: enTaller.length,
      detenidas: enTaller.filter((o) => o.detencion).length,
      listas: enTaller.filter((o) => o.fase === 'lista').length,
      sinAprobar: enTaller.filter((o) => !o.aprobada && o.fase === 'presupuesto').length,
      entregasHoy: db.ordenes.filter((o) => o.promesa?.slice(0, 10) === hoy).length,
      bahias: bahias.length,
      operativas: operativas.length,
      ocupadas,
      ocupacion: operativas.length ? Math.round((ocupadas / operativas.length) * 100) : 0,
      porFase,
      horasComprometidas: enTaller.reduce((suma, o) => suma + o.horas, 0),
    })
  },

  /** Carga por técnico: horas comprometidas y órdenes a su nombre. */
  async cargaPorTecnico(localId: string) {
    const enTaller = await this.enTaller(localId)
    const tecnicos = db.usuarios.filter((u) => u.rol === 'tecnico' && u.activo)
    return tecnicos.map((u) => {
      const suyas = enTaller.filter((o) => o.tecnicoId === u.id)
      return {
        usuario: u,
        ordenes: suyas.length,
        horas: suyas.reduce((suma, o) => suma + o.horas, 0),
        detenidas: suyas.filter((o) => o.detencion).length,
      }
    })
  },
}
