import type {
  CitaResuelta,
  OrdenResuelta,
  Combustible,
  OrdenTrabajo,
  PrioridadOrden,
  RelacionTenencia,
  TipoDocumento,
  Transmision,
  VehiculoResuelto,
} from '@/types'
import { clientesService } from './clientes.service'
import { db, latencia, persistir } from './mock/db'
import { errorCampo } from './mock/reglas'
import { ordenesService } from './ordenes.service'
import { parametrosService } from './parametros.service'
import { tenenciaService } from './tenencia.service'
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

/** Lo mínimo para que un cliente y su vehículo existan en el sistema. */
export interface DatosMatricula {
  /** Placa ya normalizada. */
  placa: string
  /** Vehículo conocido; si falta, se crea con los datos de abajo. */
  vehiculoId?: string
  /** Cliente conocido; si falta, se crea con `clienteNuevo`. */
  clienteId?: string
  clienteNuevo?: {
    nombre: string
    documento: string
    tipoDocumento?: TipoDocumento
    telefono?: string
    email?: string
  }
  vehiculoNuevo?: {
    marca: string
    modelo: string
    anio: number
    color?: string
    combustible?: Combustible
    transmision?: Transmision
  }
  kilometraje?: number
}

export interface DatosRecepcion extends DatosMatricula {
  localId: string
  motivo: string
  prioridad?: PrioridadOrden
  /** Cita de la que viene, si venía citado. */
  citaId?: string
  /** Quién atiende el mostrador: firma la comprobación de tenencia. */
  usuarioId?: string
  /**
   * Con qué derecho deja el vehículo quien lo deja. Lo exige
   * `recepcion.verificarTenencia`; sin él la orden no se abre.
   */
  tenencia?: {
    relacion: RelacionTenencia
    respaldo?: string
    nota?: string
    /** Declararlo para que los ingresos siguientes lo reconozcan. */
    recordar?: boolean
  }
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
   * Da de alta lo que falte —cliente, vehículo— y devuelve a quién apuntar el
   * trabajo. **No abre ninguna orden.**
   *
   * Existe aparte porque matricular y recibir son dos cosas distintas que el
   * sistema confundía: quien llama por teléfono el martes para venir el jueves
   * ya es cliente del taller, aunque su coche no esté aquí todavía.
   */
  async matricular(datos: DatosMatricula): Promise<{ clienteId: string; vehiculoId: string }> {
    let clienteId = datos.clienteId
    if (!clienteId) {
      const nuevo = datos.clienteNuevo
      if (!nuevo?.nombre?.trim()) {
        throw errorCampo('nombre', 'Necesitamos a nombre de quién entra el vehículo.')
      }
      const cliente = await clientesService.crear({
        tipoDocumento: nuevo.tipoDocumento ?? 'dni',
        documento: nuevo.documento.trim(),
        nombre: nuevo.nombre.trim(),
        telefono: nuevo.telefono?.trim() || undefined,
        email: nuevo.email?.trim() || undefined,
        esEmpresa: (nuevo.tipoDocumento ?? 'dni') === 'ruc',
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
        combustible: nuevo.combustible ?? 'gasolina',
        transmision: nuevo.transmision ?? 'manual',
        kilometraje: datos.kilometraje ?? 0,
        activo: true,
      })
      vehiculoId = vehiculo.id
    } else if (datos.kilometraje) {
      await vehiculosService.registrarKilometraje(vehiculoId, datos.kilometraje)
    }

    return { clienteId, vehiculoId }
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

    const { clienteId, vehiculoId } = await this.matricular(datos)

    /*
     * La comprobación de tenencia, según mande la cadena. Se hace aquí y no en
     * la pantalla porque una regla que solo vive en un formulario se la salta
     * la siguiente pantalla que abra una orden.
     */
    const politica = parametrosService.valor<string>('recepcion.verificarTenencia')
    let tenencia
    if (politica !== 'no') {
      const conocida = await tenenciaService.relacionConocida(clienteId, vehiculoId)
      const relacion = datos.tenencia?.relacion ?? conocida ?? undefined

      if (!relacion) {
        throw errorCampo('relacion', 'Falta comprobar con qué derecho trae el vehículo.')
      }
      if (politica === 'siempre' && !datos.tenencia) {
        throw errorCampo('relacion', 'Confirma quién trae el vehículo antes de abrir la orden.')
      }
      if (
        relacion !== 'titular' &&
        parametrosService.valor<boolean>('recepcion.respaldoTerceros')
      ) {
        if (!datos.tenencia?.respaldo?.trim()) {
          throw errorCampo('respaldo', 'Anota qué documento respalda que puede dejarlo.')
        }
      }

      tenencia = await tenenciaService.verificar({
        clienteId,
        vehiculoId,
        relacion,
        respaldo: datos.tenencia?.respaldo,
        nota: datos.tenencia?.nota,
        verificadoPor: datos.usuarioId ?? '',
        recordar: datos.tenencia?.recordar,
      })
    }

    const orden = await ordenesService.crear({
      localId: datos.localId,
      vehiculoId,
      clienteId,
      motivo: datos.motivo.trim(),
      fase: 'recepcion',
      prioridad: datos.prioridad ?? 'normal',
      kilometraje: datos.kilometraje ?? 0,
      tenencia,
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
