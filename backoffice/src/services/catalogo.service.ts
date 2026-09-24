import type { NuevoServicio, PlanMantenimiento, Servicio } from '@/types'
import { db, latencia } from './mock/db'
import { errorCampo, existeOtro } from './mock/reglas'
import { crearRepositorio } from './mock/repositorio'

const servicios = crearRepositorio('servicios', {
  prefijo: 's',
  entidad: 'Servicio',
  camposBusqueda: ['codigo', 'nombre', 'descripcion'],
})

const planes = crearRepositorio('planes', {
  prefijo: 'p',
  entidad: 'Plan de mantenimiento',
  camposBusqueda: ['nombre'],
})

function validar(datos: Partial<NuevoServicio>, id?: string) {
  if (datos.codigo !== undefined) {
    if (!datos.codigo.trim()) throw errorCampo('codigo', 'El código es obligatorio.')
    if (existeOtro(db.servicios, (s) => s.codigo, datos.codigo, id)) {
      throw errorCampo('codigo', 'Ya existe un servicio con ese código.', 'Código duplicado')
    }
  }
  if (datos.nombre !== undefined && !datos.nombre.trim()) {
    throw errorCampo('nombre', 'El nombre es obligatorio.')
  }
  if (datos.horas !== undefined && datos.horas <= 0) {
    throw errorCampo('horas', 'El tiempo baremo debe ser mayor que cero.', 'Ej. 1,5')
  }
  if (datos.precioHora !== undefined && datos.precioHora <= 0) {
    throw errorCampo('precioHora', 'El precio por hora debe ser mayor que cero.')
  }
}

/**
 * Catálogo de mano de obra.
 *
 * El **tiempo baremo** es lo que sostiene todo: sin él se cotiza a ojo, no se
 * puede prometer una hora de entrega y no hay forma de saber si el taller
 * rinde. Con él, el precio de un trabajo es una multiplicación.
 */
export const catalogoService = {
  servicios: {
    ...servicios,

    async listar(): Promise<Servicio[]> {
      const { items } = await servicios.consultar({
        orden: { campo: 'codigo', direccion: 'asc' },
        porPagina: 200,
      })
      return items
    },

    async crear(datos: NuevoServicio): Promise<Servicio> {
      validar(datos)
      return servicios.crear({ ...datos, codigo: datos.codigo.trim().toUpperCase() })
    },

    async actualizar(id: string, datos: Partial<NuevoServicio>): Promise<Servicio> {
      validar(datos, id)
      return servicios.actualizar(id, datos)
    },

    async eliminar(id: string): Promise<void> {
      const enUso = db.ordenes.some((o) =>
        o.items.some((i) => i.tipo === 'servicio' && i.referenciaId === id),
      )
      if (enUso) {
        throw { mensaje: 'No se puede eliminar: el servicio está en órdenes del histórico.' }
      }
      return servicios.eliminar(id)
    },
  },

  planes: {
    ...planes,
    async listar(): Promise<PlanMantenimiento[]> {
      const { items } = await planes.consultar({
        orden: { campo: 'cadaKm', direccion: 'asc' },
        porPagina: 100,
      })
      return items
    },
  },

  /** Precio de un servicio: baremo por precio de la hora, sin adivinar. */
  async cotizar(servicioId: string) {
    const servicio = db.servicios.find((s) => s.id === servicioId)
    if (!servicio) throw { mensaje: 'Servicio no encontrado.' }
    return latencia({
      servicio,
      horas: servicio.horas,
      precio: Math.round(servicio.horas * servicio.precioHora * 100) / 100,
    })
  },

  /**
   * Qué mantenimiento le toca a un kilometraje.
   *
   * Se busca el plan de mayor periodicidad que quepa: a los 50 000 toca el
   * servicio mayor, no el de los 10 000, aunque ambos encajen en la división.
   */
  async planPara(kilometraje: number) {
    const candidatos = db.planes
      .filter((p) => p.activo && kilometraje >= p.cadaKm && kilometraje % p.cadaKm === 0)
      .sort((a, b) => b.cadaKm - a.cadaKm)
    return latencia(candidatos[0] ?? null)
  },
}
