import type {
  CitaResuelta,
  OrdenResuelta,
  OrdenTrabajo,
  PrioridadOrden,
  VehiculoResuelto,
} from '@/types'
import { clientesService } from './clientes.service'
import { db, latencia, persistir } from './mock/db'
import { errorCampo } from './mock/reglas'
import { ordenesService } from './ordenes.service'
import { vehiculosService } from './vehiculos.service'

/**
 * La recepción, tal y como ocurre en el mostrador.
 *
 * El orden real es este: **llega una placa**. A veces esa placa estaba citada
 * y a veces no; a veces el taller la conoce y a veces es la primera vez. Sólo
 * después de identificarla se abre la orden y se da la vuelta al vehículo.
 *
 * Por eso aquí no se presupone nada del coche: se pregunta por la placa y el
 * sistema contesta lo que sabe. Si no sabe nada, se anota en el momento —marca,
 * modelo, año, color— porque ese es justo el instante en que el taller se
 * entera.
 */

const hoyISO = () => new Date().toISOString().slice(0, 10)

/** Placa peruana, tolerante a que se teclee sin guion ni mayúsculas. */
export function normalizarPlaca(texto: string): string {
  const limpio = texto
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 6)
  return limpio.length > 3 ? `${limpio.slice(0, 3)}-${limpio.slice(3)}` : limpio
}

export interface DatosRecepcion {
  localId: string
  /** Placa ya normalizada. */
  placa: string
  /** Vehículo conocido; si falta, se crea con los datos de abajo. */
  vehiculoId?: string
  /** Cliente conocido; si falta, se crea con `clienteNuevo`. */
  clienteId?: string
  clienteNuevo?: { nombre: string; documento: string; telefono?: string }
  vehiculoNuevo?: { marca: string; modelo: string; anio: number; color?: string }
  motivo: string
  prioridad?: PrioridadOrden
  kilometraje?: number
  /** Cita de la que viene, si venía citado. */
  citaId?: string
}

export const recepcionService = {
  /**
   * El mostrador de hoy en dos bandas: los que dijeron que venían y los que
   * ya están dentro sin su hoja firmada.
   */
  async mostrador(
    localId: string,
    fecha = hoyISO(),
  ): Promise<{ esperadas: CitaResuelta[]; enPiso: OrdenResuelta[] }> {
    const enPiso = await ordenesService.sinInspeccion(localId)
    const yaDentro = new Set(enPiso.map((o) => o.vehiculoId))

    const esperadas = db.citas
      .filter(
        (c) =>
          c.localId === localId &&
          c.fecha === fecha &&
          (c.estado === 'pendiente' || c.estado === 'confirmada') &&
          !yaDentro.has(c.vehiculoId),
      )
      .sort((a, b) => a.hora.localeCompare(b.hora))
      .map((c) => ({
        ...c,
        vehiculo: db.vehiculos.find((v) => v.id === c.vehiculoId),
        cliente: db.clientes.find((cl) => cl.id === c.clienteId),
      }))

    return latencia({ esperadas, enPiso })
  },

  /**
   * Qué sabe el taller de esa placa. `null` no es un error: es un cliente
   * nuevo, que es una buena noticia.
   */
  async buscarPlaca(placa: string): Promise<VehiculoResuelto | null> {
    const normal = normalizarPlaca(placa)
    const vehiculo = db.vehiculos.find((v) => v.placa === normal && v.activo)
    if (!vehiculo) return latencia(null)
    return latencia({ ...vehiculo, cliente: db.clientes.find((c) => c.id === vehiculo.clienteId) })
  },

  /**
   * Abre la orden y deja el vehículo en recepción, listo para la vuelta.
   *
   * Crea por el camino lo que haga falta —cliente, vehículo— porque en el
   * mostrador no se puede pedir al cliente que vuelva mañana cuando alguien
   * haya dado de alta su coche.
   */
  async recibir(datos: DatosRecepcion): Promise<OrdenTrabajo> {
    if (!datos.motivo?.trim()) {
      throw errorCampo('motivo', 'Anota con qué viene el cliente.')
    }

    let clienteId = datos.clienteId
    if (!clienteId) {
      const nuevo = datos.clienteNuevo
      if (!nuevo?.nombre?.trim()) {
        throw errorCampo('nombre', 'Necesitamos a nombre de quién entra el vehículo.')
      }
      const cliente = await clientesService.crear({
        tipoDocumento: 'dni',
        documento: nuevo.documento.trim(),
        nombre: nuevo.nombre.trim(),
        telefono: nuevo.telefono?.trim() || undefined,
        esEmpresa: false,
        activo: true,
      })
      clienteId = cliente.id
    }

    let vehiculoId = datos.vehiculoId
    if (!vehiculoId) {
      const nuevo = datos.vehiculoNuevo
      if (!nuevo?.marca?.trim() || !nuevo?.modelo?.trim()) {
        throw errorCampo('marca', 'Marca y modelo, aunque sea a ojo: luego se afina.')
      }
      const vehiculo = await vehiculosService.crear({
        placa: datos.placa,
        clienteId,
        marca: nuevo.marca.trim(),
        modelo: nuevo.modelo.trim(),
        anio: nuevo.anio,
        color: nuevo.color?.trim() || undefined,
        combustible: 'gasolina',
        transmision: 'manual',
        kilometraje: datos.kilometraje ?? 0,
        activo: true,
      })
      vehiculoId = vehiculo.id
    } else if (datos.kilometraje) {
      await vehiculosService.registrarKilometraje(vehiculoId, datos.kilometraje)
    }

    const orden = await ordenesService.crear({
      localId: datos.localId,
      vehiculoId,
      clienteId,
      motivo: datos.motivo.trim(),
      fase: 'recepcion',
      prioridad: datos.prioridad ?? 'normal',
      kilometraje: datos.kilometraje ?? 0,
    })

    // La cita deja de esperar: el coche ya está aquí.
    if (datos.citaId) {
      const cita = db.citas.find((c) => c.id === datos.citaId)
      if (cita) {
        cita.estado = 'llego'
        persistir()
      }
    }

    return orden
  },
}
