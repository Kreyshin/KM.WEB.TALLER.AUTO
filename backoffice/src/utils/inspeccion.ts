import type { EstadoPunto, TipoDanio } from '@/types'
import type { TonoTaller } from '@/types/ui'

/**
 * La hoja de ingreso.
 *
 * Los puntos y los tipos de daño son un catálogo cerrado a propósito: una hoja
 * con texto libre no se puede contar ni comparar, y lo que interesa al cabo del
 * año es saber cuántos vehículos entraron con el mismo problema.
 */

export const tiposDanio: TipoDanio[] = ['rayon', 'abolladura', 'rotura', 'oxido', 'faltante']

export const etiquetaDanio: Record<TipoDanio, string> = {
  rayon: 'Rayón',
  abolladura: 'Abolladura',
  rotura: 'Rotura',
  oxido: 'Óxido',
  faltante: 'Falta la pieza',
}

/**
 * Marca gráfica por tipo de daño, en la convención del papel: cada taller usa
 * sus símbolos, pero todos usan símbolos. Nunca solo color.
 */
export const glifoDanio: Record<TipoDanio, string> = {
  rayon: '/',
  abolladura: '○',
  rotura: '✕',
  oxido: '▨',
  faltante: '—',
}

export const tonoDanio: Record<TipoDanio, TonoTaller> = {
  rayon: 'ambar',
  abolladura: 'ambar',
  rotura: 'rojo',
  oxido: 'neutro',
  faltante: 'rojo',
}

/**
 * Los puntos de la revisión de recepción, en el orden en que se dan la vuelta
 * al coche: primero lo que se ve desde fuera, luego lo que hay que abrir.
 */
export const puntosRevision: { clave: string; etiqueta: string; grupo: string }[] = [
  { clave: 'carroceria', etiqueta: 'Carrocería y pintura', grupo: 'Exterior' },
  { clave: 'cristales', etiqueta: 'Cristales y espejos', grupo: 'Exterior' },
  { clave: 'luces', etiqueta: 'Luces y señalización', grupo: 'Exterior' },
  { clave: 'neumaticos', etiqueta: 'Neumáticos', grupo: 'Exterior' },
  { clave: 'repuesto', etiqueta: 'Llanta de repuesto', grupo: 'Exterior' },
  { clave: 'tapiceria', etiqueta: 'Tapicería y alfombras', grupo: 'Interior' },
  { clave: 'tablero', etiqueta: 'Tablero y testigos', grupo: 'Interior' },
  { clave: 'radio', etiqueta: 'Radio y multimedia', grupo: 'Interior' },
  { clave: 'aire', etiqueta: 'Aire acondicionado', grupo: 'Interior' },
  { clave: 'fluidos', etiqueta: 'Niveles de fluidos', grupo: 'Mecánica' },
  { clave: 'bateria', etiqueta: 'Batería y bornes', grupo: 'Mecánica' },
  { clave: 'fugas', etiqueta: 'Fugas visibles', grupo: 'Mecánica' },
]

export const etiquetaPunto: Record<EstadoPunto, string> = {
  conforme: 'Conforme',
  observado: 'Con observación',
  noAplica: 'No aplica',
}

export const glifoPunto: Record<EstadoPunto, string> = {
  conforme: '✓',
  observado: '⚠',
  noAplica: '—',
}

export const tonoPunto: Record<EstadoPunto, TonoTaller> = {
  conforme: 'verde',
  observado: 'ambar',
  noAplica: 'neutro',
}

/** Lo que el cliente suele dejar dentro. Marcarlo evita la mitad de los líos. */
export const pertenenciasHabituales = [
  'Gata y llave de ruedas',
  'Llanta de repuesto',
  'Triángulos',
  'Extintor',
  'Botiquín',
  'Herramientas',
  'Documentos en la guantera',
  'Cargador / accesorios',
]

/** `3/8` — el depósito se anota como lo marca la aguja. */
export function octavos(valor: number) {
  if (valor <= 0) return 'Vacío'
  if (valor >= 8) return 'Lleno'
  return `${valor}/8`
}
