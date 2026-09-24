/**
 * La carrocería, por piezas.
 *
 * El salto respecto de marcar un punto sobre un dibujo es este: **cada marca
 * pertenece a una pieza con nombre**, no a una coordenada. Un rayón deja de
 * ser «algo por aquí» y pasa a ser «rayón en la puerta delantera izquierda»,
 * que es como lo dice el taller, como se lo explicas al cliente y —lo que más
 * cuenta a final de mes— como se puede contar: cuántos vehículos entran con el
 * paragolpes delantero tocado.
 *
 * Las zonas son polígonos transparentes que viven **debajo** del trazo: se
 * pintan al pasar por encima y aceptan el foco, de modo que el dibujo entero
 * se recorre con el tabulador. El trazo visible no recibe puntero.
 *
 * El lateral se define una sola vez y se pinta dos, espejado. Así los dos
 * costados no pueden desalinearse nunca.
 */

import type { VistaVehiculo } from '@/types'

export type { VistaVehiculo }

export interface ZonaCarroceria {
  /** Identificador estable; con el prefijo del lado forma la zona completa. */
  id: string
  etiqueta: string
  /**
   * Género y número de la pieza, para que el lado concuerde: «puerta
   * delantera izquierda», no «puerta delantera izquierdo». Por defecto,
   * masculino singular.
   */
  genero?: 'f'
  plural?: boolean
  /** Piezas únicas —los paragolpes— que no tienen lado izquierdo ni derecho. */
  sinLado?: boolean
  /** Contorno del área sensible, en unidades del `viewBox` de su vista. */
  d: string
}

export const VIEWBOX_LATERAL = '0 0 300 104'
export const VIEWBOX_PLANTA = '0 0 190 360'

/**
 * Zonas del costado, de delante hacia atrás. El orden importa: la última gana
 * el clic donde dos se solapan, y por eso el estribo va al final.
 */
export const zonasLateral: ZonaCarroceria[] = [
  {
    id: 'paragolpes-delantero',
    etiqueta: 'Paragolpes delantero',
    sinLado: true,
    d: 'M12 80 L12 64 C12 59 15 56 22 55 L34 53 L34 80 Z',
  },
  {
    id: 'aleta-delantera',
    etiqueta: 'Aleta delantera',
    genero: 'f',
    d: 'M34 53 L76 47 L98 50 L98 80 L34 80 Z',
  },
  {
    id: 'puerta-delantera',
    etiqueta: 'Puerta delantera',
    genero: 'f',
    d: 'M98 50 L149 50 L149 80 L98 80 Z',
  },
  {
    id: 'puerta-trasera',
    etiqueta: 'Puerta trasera',
    genero: 'f',
    d: 'M149 50 L216 50 L216 80 L149 80 Z',
  },
  {
    id: 'aleta-trasera',
    etiqueta: 'Aleta trasera',
    genero: 'f',
    d: 'M216 50 L236 52 L286 57 L286 80 L216 80 Z',
  },
  {
    id: 'paragolpes-trasero',
    etiqueta: 'Paragolpes trasero',
    sinLado: true,
    d: 'M286 57 C292 58 294 61 294 67 L294 80 L286 80 Z',
  },
  {
    id: 'cristales',
    etiqueta: 'Cristales laterales',
    plural: true,
    d: 'M98 50 L106 26 L196 26 L216 50 Z',
  },
  { id: 'espejo', etiqueta: 'Espejo', d: 'M84 40 L98 44 L98 50 L84 48 Z' },
  {
    id: 'rueda-delantera',
    etiqueta: 'Rueda delantera',
    genero: 'f',
    d: 'M50 80 A16 16 0 0 1 82 80 A16 16 0 0 1 50 80 Z',
  },
  {
    id: 'rueda-trasera',
    etiqueta: 'Rueda trasera',
    genero: 'f',
    d: 'M216 80 A16 16 0 0 1 248 80 A16 16 0 0 1 216 80 Z',
  },
  // Va el último: es una franja estrecha y debe ganar el clic a las puertas.
  { id: 'estribo', etiqueta: 'Estribo', d: 'M98 72 L216 72 L216 80 L98 80 Z' },
]

/** Zonas vistas desde arriba: lo que no se ve de costado. */
export const zonasPlanta: ZonaCarroceria[] = [
  {
    id: 'paragolpes-delantero',
    etiqueta: 'Paragolpes delantero',
    sinLado: true,
    d: 'M38 30 C38 18 60 10 95 10 C130 10 152 18 152 30 L152 44 L38 44 Z',
  },
  { id: 'capo', etiqueta: 'Capó', d: 'M38 44 L152 44 L152 104 L38 104 Z' },
  { id: 'parabrisas', etiqueta: 'Parabrisas', d: 'M38 104 L152 104 L140 136 L50 136 Z' },
  { id: 'techo', etiqueta: 'Techo', d: 'M50 136 L140 136 L140 232 L50 232 Z' },
  { id: 'luneta', etiqueta: 'Luneta', d: 'M50 232 L140 232 L152 264 L38 264 Z' },
  { id: 'porton', etiqueta: 'Portón / maletero', d: 'M38 264 L152 264 L152 322 L38 322 Z' },
  {
    id: 'paragolpes-trasero',
    etiqueta: 'Paragolpes trasero',
    sinLado: true,
    d: 'M38 322 L152 322 L152 336 C152 348 130 356 95 356 C60 356 38 348 38 336 Z',
  },
]

/** Nombre completo de una zona: `izquierda.puerta-delantera` → su etiqueta. */
export function etiquetaZona(zona: string): string {
  const [vista, id] = zona.split('.')
  const catalogo = vista === 'planta' ? zonasPlanta : zonasLateral
  const pieza = catalogo.find((z) => z.id === id)
  const nombre = pieza?.etiqueta ?? id ?? zona
  if (!pieza || pieza.sinLado || (vista !== 'izquierda' && vista !== 'derecha')) return nombre

  const raiz = vista === 'izquierda' ? 'izquierd' : 'derech'
  const terminacion = `${pieza.genero === 'f' ? 'a' : 'o'}${pieza.plural ? 's' : ''}`
  return `${nombre} ${raiz}${terminacion}`
}

export const etiquetaVista: Record<VistaVehiculo, string> = {
  izquierda: 'Costado izquierdo',
  planta: 'Vista superior',
  derecha: 'Costado derecho',
}
