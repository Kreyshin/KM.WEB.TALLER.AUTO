import type { Cita, CitaResuelta, NuevaCita } from '@/types'
import { db, latencia } from './mock/db'
import { errorCampo } from './mock/reglas'
import { crearRepositorio } from './mock/repositorio'

const repo = crearRepositorio('citas', {
  prefijo: 'ct',
  entidad: 'Cita',
  camposBusqueda: ['motivo', 'notas'],
})

function resolver(c: Cita): CitaResuelta {
  return {
    ...c,
    vehiculo: db.vehiculos.find((v) => v.id === c.vehiculoId),
    cliente: db.clientes.find((cl) => cl.id === c.clienteId),
  }
}

/** La agenda: lo que el taller se comprometió a recibir. */
export const citasService = {
  ...repo,

  async delDia(localId: string, fecha: string): Promise<CitaResuelta[]> {
    const items = db.citas
      .filter((c) => c.localId === localId && c.fecha === fecha)
      .sort((a, b) => a.hora.localeCompare(b.hora))
      .map(resolver)
    return latencia(items)
  },

  async proximas(localId: string, desde: string, dias = 7): Promise<CitaResuelta[]> {
    const hasta = new Date(`${desde}T12:00:00`)
    hasta.setDate(hasta.getDate() + dias)
    const limite = hasta.toISOString().slice(0, 10)
    const items = db.citas
      .filter((c) => c.localId === localId && c.fecha >= desde && c.fecha <= limite)
      .sort((a, b) => `${a.fecha}${a.hora}`.localeCompare(`${b.fecha}${b.hora}`))
      .map(resolver)
    return latencia(items)
  },

  async crear(datos: NuevaCita): Promise<Cita> {
    if (!/^\d{2}:\d{2}$/.test(datos.hora)) {
      throw errorCampo('hora', 'La hora va en formato HH:mm.')
    }
    if (datos.duracion <= 0) {
      throw errorCampo('duracion', 'La duración debe ser mayor que cero.')
    }
    return repo.crear(datos)
  },
}
