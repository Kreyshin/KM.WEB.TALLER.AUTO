import type { Consulta, NuevoVehiculo, Paginado, Vehiculo, VehiculoResuelto } from '@/types'
import { db, latencia, persistir } from './mock/db'
import { errorCampo, existeOtro } from './mock/reglas'
import { crearRepositorio } from './mock/repositorio'

const repo = crearRepositorio('vehiculos', {
  prefijo: 'v',
  entidad: 'Vehículo',
  camposBusqueda: ['placa', 'marca', 'modelo', 'vin', 'color'],
})

function resolver(v: Vehiculo): VehiculoResuelto {
  return { ...v, cliente: db.clientes.find((c) => c.id === v.clienteId) }
}

/** Placa peruana: tres letras, guion y tres caracteres alfanuméricos. */
const FORMATO_PLACA = /^[A-Z][A-Z0-9]{2}-[0-9][A-Z0-9]{2}$/

function validar(datos: Partial<NuevoVehiculo>, id?: string) {
  if (datos.placa !== undefined) {
    const placa = datos.placa.trim().toUpperCase()
    if (!FORMATO_PLACA.test(placa)) {
      throw errorCampo('placa', 'La placa no tiene el formato esperado.', 'Ej. ABC-123')
    }
    if (existeOtro(db.vehiculos, (v) => v.placa, placa, id)) {
      throw errorCampo('placa', 'Ya hay un vehículo con esa placa.', 'Placa duplicada')
    }
  }
  if (datos.vin !== undefined && datos.vin && datos.vin.trim().length !== 17) {
    throw errorCampo('vin', 'El VIN tiene 17 caracteres.', 'Revisa el número de chasis')
  }
  if (datos.anio !== undefined) {
    const maximo = new Date().getFullYear() + 1
    if (datos.anio < 1950 || datos.anio > maximo) {
      throw errorCampo('anio', `El año debe estar entre 1950 y ${maximo}.`)
    }
  }
  if (datos.kilometraje !== undefined && datos.kilometraje < 0) {
    throw errorCampo('kilometraje', 'El kilometraje no puede ser negativo.')
  }
}

/**
 * El vehículo, no el cliente, es la unidad que atiende el taller: la historia
 * de reparaciones cuelga de la placa aunque el coche cambie de dueño.
 */
export const vehiculosService = {
  ...repo,

  async consultarResueltos(consulta?: Consulta): Promise<Paginado<VehiculoResuelto>> {
    const { items, ...resto } = await repo.consultar(consulta)
    return { ...resto, items: items.map(resolver) }
  },

  async obtenerResuelto(id: string): Promise<VehiculoResuelto> {
    return resolver(await repo.obtener(id))
  },

  /** Vehículos de un cliente, para elegir al abrir una orden. */
  async porCliente(clienteId: string): Promise<Vehiculo[]> {
    return latencia(db.vehiculos.filter((v) => v.clienteId === clienteId && v.activo))
  },

  async crear(datos: NuevoVehiculo): Promise<Vehiculo> {
    validar(datos)
    return repo.crear({ ...datos, placa: datos.placa.trim().toUpperCase() })
  },

  async actualizar(id: string, datos: Partial<NuevoVehiculo>): Promise<Vehiculo> {
    validar(datos, id)
    const cambios = datos.placa ? { ...datos, placa: datos.placa.trim().toUpperCase() } : datos
    return repo.actualizar(id, cambios)
  },

  /**
   * Actualiza el kilometraje solo si el nuevo es mayor. Un odómetro no
   * retrocede: si llega un valor menor, es un error de tecleo y se ignora.
   */
  async registrarKilometraje(id: string, kilometraje: number): Promise<Vehiculo> {
    const vehiculo = db.vehiculos.find((v) => v.id === id)
    if (!vehiculo) throw { mensaje: 'Vehículo no encontrado.' }
    if (kilometraje > vehiculo.kilometraje) {
      vehiculo.kilometraje = kilometraje
      vehiculo.kilometrajeAl = new Date().toISOString()
      persistir()
    }
    return latencia(vehiculo)
  },

  /** Historial de órdenes del vehículo, de la más reciente a la más antigua. */
  async historial(id: string) {
    const items = db.ordenes
      .filter((o) => o.vehiculoId === id)
      .sort((a, b) => b.ingreso.localeCompare(a.ingreso))
    return latencia(items)
  },

  async eliminar(id: string): Promise<void> {
    if (db.ordenes.some((o) => o.vehiculoId === id)) {
      throw { mensaje: 'No se puede eliminar: el vehículo tiene órdenes en el histórico.' }
    }
    return repo.eliminar(id)
  },
}
