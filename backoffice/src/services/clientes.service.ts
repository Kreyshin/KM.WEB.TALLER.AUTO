import type { Cliente, NuevoCliente } from '@/types'
import { db } from './mock/db'
import { errorCampo, existeOtro } from './mock/reglas'
import { crearRepositorio } from './mock/repositorio'

const repo = crearRepositorio('clientes', {
  prefijo: 'c',
  entidad: 'Cliente',
  camposBusqueda: ['nombre', 'documento', 'email', 'telefono'],
})

function validar(datos: Partial<NuevoCliente>, id?: string) {
  if (datos.nombre !== undefined && !datos.nombre.trim()) {
    throw errorCampo('nombre', 'El nombre es obligatorio.')
  }
  if (datos.documento !== undefined) {
    if (!datos.documento.trim()) throw errorCampo('documento', 'El documento es obligatorio.')
    if (datos.tipoDocumento === 'dni' && !/^\d{8}$/.test(datos.documento)) {
      throw errorCampo('documento', 'El DNI tiene 8 dígitos.', 'Usa 8 dígitos')
    }
    if (datos.tipoDocumento === 'ruc' && !/^\d{11}$/.test(datos.documento)) {
      throw errorCampo('documento', 'El RUC tiene 11 dígitos.', 'Usa 11 dígitos')
    }
    if (existeOtro(db.clientes, (c) => c.documento, datos.documento, id)) {
      throw errorCampo('documento', 'Ya hay un cliente con ese documento.', 'Documento duplicado')
    }
  }
}

/** Quién es el dueño del vehículo y quién aprueba el presupuesto. */
export const clientesService = {
  ...repo,

  async crear(datos: NuevoCliente): Promise<Cliente> {
    validar(datos)
    return repo.crear({ ...datos, nombre: datos.nombre.trim() })
  },

  async actualizar(id: string, datos: Partial<NuevoCliente>): Promise<Cliente> {
    validar(datos, id)
    return repo.actualizar(id, datos)
  },

  async eliminar(id: string): Promise<void> {
    if (db.vehiculos.some((v) => v.clienteId === id)) {
      throw { mensaje: 'No se puede eliminar: el cliente tiene vehículos. Desactívalo.' }
    }
    return repo.eliminar(id)
  },
}
