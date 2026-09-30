import type { Cliente, RelacionTenencia, VerificacionTenencia, VinculoTenencia } from '@/types'
import { db, latencia, persistir } from './mock/db'
import { errorCampo } from './mock/reglas'
import { crearRepositorio } from './mock/repositorio'

/**
 * Quién trae el vehículo y con qué derecho.
 *
 * El taller responde de un bien que no es suyo. Si quien lo deja no es el
 * titular, hay que preguntar y dejar constancia: es la diferencia entre haber
 * hecho el control y no haberlo hecho, y esa diferencia solo existe si está
 * escrita.
 *
 * Dos piezas con memorias distintas, a propósito:
 *
 * - El **vínculo** recuerda. Se declara una vez y el taller lo reconoce.
 * - La **verificación** no. Cada ingreso vuelve a mirarlo, porque una
 *   autorización de hace un año no dice nada de hoy.
 */

const repo = crearRepositorio('vinculos', {
  prefijo: 'vt',
  entidad: 'Vínculo',
  camposBusqueda: ['documentoRespaldo', 'notas'],
})

export const etiquetaRelacion: Record<RelacionTenencia, string> = {
  titular: 'Titular',
  familiar: 'Familiar del titular',
  empresa: 'Conductor de la empresa',
  autorizado: 'Autorizado con documento',
  otro: 'Otro',
}

/**
 * Qué preguntar cuando quien trae el coche no es el titular. No son avisos:
 * son las preguntas que cubren al taller, y por eso viajan con el tipo de
 * relación en vez de vivir en la cabeza del asesor.
 */
export const controlesRelacion: Record<RelacionTenencia, string[]> = {
  titular: [],
  familiar: [
    'Confirma el nombre completo del titular.',
    'Pide un contacto del titular por si hay que autorizar el presupuesto.',
  ],
  empresa: [
    'Pide la carta o credencial de la empresa.',
    'Anota quién autoriza el gasto: el conductor no suele poder.',
  ],
  autorizado: [
    'Pide el documento que lo autoriza y anótalo.',
    'Comprueba que el documento sigue vigente.',
  ],
  otro: [
    'Pregunta cómo llegó el vehículo a sus manos.',
    'Si la explicación no cuadra, no recibas el vehículo.',
  ],
}

const hoyISO = () => new Date().toISOString().slice(0, 10)

function vigente(v: VinculoTenencia) {
  return v.activo && (!v.vigenteHasta || v.vigenteHasta >= hoyISO())
}

export const tenenciaService = {
  ...repo,

  /** Los vínculos vivos de un vehículo, con la persona resuelta. */
  async deVehiculo(vehiculoId: string): Promise<(VinculoTenencia & { cliente?: Cliente })[]> {
    const items = db.vinculos
      .filter((v) => v.vehiculoId === vehiculoId && vigente(v))
      .map((v) => ({ ...v, cliente: db.clientes.find((c) => c.id === v.clienteId) }))
    return latencia(items)
  },

  /**
   * Qué sabe el taller de esta pareja persona–vehículo.
   *
   * Contesta también cuando no sabe nada: `null` significa que nunca se
   * declaró, que es justo cuando hay que preguntar.
   */
  async vinculo(clienteId: string, vehiculoId: string): Promise<VinculoTenencia | null> {
    const v = db.vinculos.find(
      (x) => x.clienteId === clienteId && x.vehiculoId === vehiculoId && vigente(x),
    )
    return latencia(v ?? null)
  },

  /**
   * La relación que el taller da por sabida: titular si el vehículo está a su
   * nombre, si no la del vínculo declarado. Sin nada, no se supone: `null`.
   */
  async relacionConocida(clienteId: string, vehiculoId: string): Promise<RelacionTenencia | null> {
    const vehiculo = db.vehiculos.find((v) => v.id === vehiculoId)
    if (vehiculo?.clienteId === clienteId) return latencia('titular')
    const v = await this.vinculo(clienteId, vehiculoId)
    return v?.relacion ?? null
  },

  /** Declara el vínculo para que los ingresos siguientes lo reconozcan. */
  async declarar(
    datos: Omit<VinculoTenencia, 'id' | 'declaradoEl' | 'activo'>,
  ): Promise<VinculoTenencia> {
    if (!db.vehiculos.some((v) => v.id === datos.vehiculoId)) {
      throw errorCampo('vehiculoId', 'Ese vehículo no existe.')
    }
    if (!db.clientes.some((c) => c.id === datos.clienteId)) {
      throw errorCampo('clienteId', 'Esa persona no existe.')
    }
    if (datos.relacion === 'autorizado' && !datos.documentoRespaldo?.trim()) {
      throw errorCampo('documentoRespaldo', 'Un autorizado sin documento no está autorizado.')
    }

    // Redeclarar no duplica: la relación de hoy sustituye a la de antes.
    const previo = db.vinculos.find(
      (v) => v.clienteId === datos.clienteId && v.vehiculoId === datos.vehiculoId && v.activo,
    )
    if (previo) {
      Object.assign(previo, datos, { declaradoEl: new Date().toISOString() })
      persistir()
      return latencia(previo)
    }

    return repo.crear({ ...datos, declaradoEl: new Date().toISOString(), activo: true })
  },

  /**
   * Sella la comprobación de este ingreso.
   *
   * Declara el vínculo por el camino cuando se pide, porque el asesor acaba de
   * hacer las preguntas: obligarle a repetirlas en otra pantalla es la forma
   * más segura de que la segunda vez no se haga.
   */
  async verificar(datos: {
    clienteId: string
    vehiculoId: string
    relacion: RelacionTenencia
    respaldo?: string
    nota?: string
    verificadoPor: string
    recordar?: boolean
  }): Promise<VerificacionTenencia> {
    let vinculoId = (await this.vinculo(datos.clienteId, datos.vehiculoId))?.id

    if (datos.recordar && datos.relacion !== 'titular') {
      const v = await this.declarar({
        clienteId: datos.clienteId,
        vehiculoId: datos.vehiculoId,
        relacion: datos.relacion,
        documentoRespaldo: datos.respaldo?.trim() || undefined,
        notas: datos.nota?.trim() || undefined,
        declaradoPor: datos.verificadoPor,
      })
      vinculoId = v.id
    }

    return {
      relacion: datos.relacion,
      vinculoId,
      respaldo: datos.respaldo?.trim() || undefined,
      nota: datos.nota?.trim() || undefined,
      verificadoPor: datos.verificadoPor,
      verificadoEl: new Date().toISOString(),
    }
  },
}
