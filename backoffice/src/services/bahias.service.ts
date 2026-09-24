import type { Bahia, NuevaBahia } from '@/types'
import { db } from './mock/db'
import { errorCampo, existeOtro } from './mock/reglas'
import { crearRepositorio } from './mock/repositorio'

const repo = crearRepositorio('bahias', {
  prefijo: 'b',
  entidad: 'Bahía',
  camposBusqueda: ['codigo', 'nombre', 'nota'],
})

function validar(datos: Partial<NuevaBahia>, id?: string) {
  if (datos.codigo !== undefined) {
    if (!datos.codigo.trim()) throw errorCampo('codigo', 'El código es obligatorio.')
    const local = datos.localId ?? db.bahias.find((b) => b.id === id)?.localId
    const hermanas = db.bahias.filter((b) => b.localId === local)
    if (existeOtro(hermanas, (b) => b.codigo, datos.codigo, id)) {
      throw errorCampo('codigo', 'Ya hay una bahía con ese código en la sede.', 'Código duplicado')
    }
  }
  if (datos.nombre !== undefined && !datos.nombre.trim()) {
    throw errorCampo('nombre', 'El nombre es obligatorio.')
  }
}

/** Puestos de trabajo del taller: el recurso físico que se ocupa. */
export const bahiasService = {
  ...repo,

  async listar(localId?: string): Promise<Bahia[]> {
    const { items } = await repo.consultar({
      filtros: localId ? { localId } : undefined,
      orden: { campo: 'posicion', direccion: 'asc' },
      porPagina: 100,
    })
    return items
  },

  async crear(datos: NuevaBahia): Promise<Bahia> {
    validar(datos)
    return repo.crear({ ...datos, codigo: datos.codigo.trim().toUpperCase() })
  },

  async actualizar(id: string, datos: Partial<NuevaBahia>): Promise<Bahia> {
    validar(datos, id)
    return repo.actualizar(id, datos)
  },

  async eliminar(id: string): Promise<void> {
    if (
      db.ordenes.some((o) => o.bahiaId === id && o.fase !== 'entregada' && o.fase !== 'anulada')
    ) {
      throw { mensaje: 'No se puede eliminar: la bahía tiene una orden dentro.' }
    }
    return repo.eliminar(id)
  },
}
