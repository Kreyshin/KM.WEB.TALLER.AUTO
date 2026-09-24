import type { Movimiento, NuevoRepuesto, Repuesto } from '@/types'
import { db, latencia, nuevoId, persistir } from './mock/db'
import { errorCampo, existeOtro } from './mock/reglas'
import { crearRepositorio } from './mock/repositorio'

const repo = crearRepositorio('repuestos', {
  prefijo: 'r',
  entidad: 'Repuesto',
  camposBusqueda: ['codigo', 'nombre', 'marca', 'numeroParte', 'ubicacion'],
})

function validar(datos: Partial<NuevoRepuesto>, id?: string) {
  if (datos.codigo !== undefined) {
    if (!datos.codigo.trim()) throw errorCampo('codigo', 'El código es obligatorio.')
    if (existeOtro(db.repuestos, (r) => r.codigo, datos.codigo, id)) {
      throw errorCampo('codigo', 'Ya existe un repuesto con ese código.', 'Código duplicado')
    }
  }
  if (datos.nombre !== undefined && !datos.nombre.trim()) {
    throw errorCampo('nombre', 'El nombre es obligatorio.')
  }
  if (datos.precio !== undefined && datos.costo !== undefined && datos.precio < datos.costo) {
    throw errorCampo('precio', 'El precio de venta no puede ser menor que el costo.')
  }
}

/** Repuestos: lo que se monta en el vehículo y hay que tener a mano. */
export const almacenService = {
  ...repo,

  async listar(): Promise<Repuesto[]> {
    const { items } = await repo.consultar({
      orden: { campo: 'nombre', direccion: 'asc' },
      porPagina: 300,
    })
    return items
  },

  /**
   * Lo que hay que reponer hoy. El mínimo es el punto de pedido, así que estar
   * justo en él ya cuenta: esperar a bajar de ahí es llegar tarde.
   */
  async bajoMinimo(): Promise<Repuesto[]> {
    return latencia(db.repuestos.filter((r) => r.activo && r.stock <= r.stockMinimo))
  },

  async movimientos(repuestoId?: string): Promise<Movimiento[]> {
    const items = db.movimientos
      .filter((m) => !repuestoId || m.repuestoId === repuestoId)
      .sort((a, b) => b.fecha.localeCompare(a.fecha))
    return latencia(items)
  },

  /** Registra el movimiento y deja el stock cuadrado en la misma operación. */
  async registrarMovimiento(datos: Omit<Movimiento, 'id' | 'fecha'>): Promise<Movimiento> {
    const repuesto = db.repuestos.find((r) => r.id === datos.repuestoId)
    if (!repuesto) throw { mensaje: 'Repuesto no encontrado.' }
    if (datos.cantidad <= 0) throw errorCampo('cantidad', 'La cantidad debe ser mayor que cero.')

    if (datos.tipo === 'salida' && repuesto.stock < datos.cantidad) {
      throw errorCampo(
        'cantidad',
        `Solo quedan ${repuesto.stock} de ${repuesto.nombre}.`,
        'Sin stock',
      )
    }

    const movimiento: Movimiento = { ...datos, id: nuevoId('m'), fecha: new Date().toISOString() }
    if (datos.tipo === 'ajuste') repuesto.stock = datos.cantidad
    else if (datos.tipo === 'salida') repuesto.stock -= datos.cantidad
    else repuesto.stock += datos.cantidad

    db.movimientos.push(movimiento)
    persistir()
    return latencia(movimiento)
  },

  async crear(datos: NuevoRepuesto): Promise<Repuesto> {
    validar(datos)
    return repo.crear({ ...datos, codigo: datos.codigo.trim().toUpperCase() })
  },

  async actualizar(id: string, datos: Partial<NuevoRepuesto>): Promise<Repuesto> {
    validar(datos, id)
    return repo.actualizar(id, datos)
  },

  async eliminar(id: string): Promise<void> {
    if (db.movimientos.some((m) => m.repuestoId === id)) {
      throw { mensaje: 'No se puede eliminar: el repuesto tiene movimientos. Desactívalo.' }
    }
    return repo.eliminar(id)
  },
}
