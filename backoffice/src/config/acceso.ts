/**
 * Variantes de la pantalla de acceso.
 *
 * Las tres comparten lógica, tipografía y paleta; cambian la puesta en escena.
 * La elegida se fija aquí y se puede previsualizar con `?acceso=` en la URL,
 * que es como se comparan sin tocar código.
 */
export const variantesAcceso = ['portada', 'nave', 'hoja'] as const

export type VarianteAcceso = (typeof variantesAcceso)[number]

export const etiquetaVariante: Record<VarianteAcceso, string> = {
  portada: 'Portada',
  nave: 'Nave',
  hoja: 'Hoja de ingreso',
}

export const descripcionVariante: Record<VarianteAcceso, string> = {
  portada: 'Manifiesto a la izquierda, formulario a la derecha.',
  nave: 'La nave del taller vista de frente, con una bahía por puesto.',
  hoja: 'El acceso sobre la hoja de ingreso de un vehículo.',
}

/** La que se sirve por defecto. */
export const varianteAccesoPorDefecto: VarianteAcceso = 'nave'

export function esVarianteAcceso(valor: unknown): valor is VarianteAcceso {
  return typeof valor === 'string' && (variantesAcceso as readonly string[]).includes(valor)
}
