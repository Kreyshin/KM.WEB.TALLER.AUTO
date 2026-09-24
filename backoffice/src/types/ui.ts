/** Tipos compartidos por los componentes de UI. */

/**
 * Tonos de la paleta de Taller.
 *
 * `acero` es el cromo de la vertical y también el color de acción, así que se
 * reserva para lo que avanza con normalidad. `rojo` es el acento de marca y
 * marca lo detenido, `ambar` lo que espera y `verde` lo terminado.
 */
export type TonoTaller = 'neutro' | 'acero' | 'rojo' | 'ambar' | 'verde'

export interface ColumnaTabla {
  /** Clave usada para el slot `col-<clave>` y para leer el valor por defecto de la fila. */
  clave: string
  etiqueta: string
  /** Clases Tailwind extra para la celda (ancho, alineación...). */
  clase?: string
  /** Muestra el control de orden en la cabecera; ordena por `clave`. */
  ordenable?: boolean
}

export interface OpcionSelect {
  valor: string | number
  etiqueta: string
}

export interface Pestana {
  valor: string
  etiqueta: string
  /** Cifra opcional junto a la etiqueta (p. ej. registros pendientes). */
  contador?: number
}

/** Rango de fechas en formato `YYYY-MM-DD`, extremos incluidos. */
export interface RangoFechas {
  desde: string
  hasta: string
}
