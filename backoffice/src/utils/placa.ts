/**
 * La placa peruana, que no tiene un solo formato.
 *
 * Darla por «tres letras y tres números» deja fuera a media flota de un
 * taller: las motos y mototaxis llevan dos letras y cuatro números, y en un
 * coche los dos caracteres que siguen a la letra de zona registral pueden ser
 * letras o números.
 *
 * | Tipo | Formato | Ejemplos |
 * | --- | --- | --- |
 * | Livianos y pesados | letra + 2 alfanuméricos + 3 números | `ABC-123`, `A12-345` |
 * | Menores (motos, mototaxis) | 2 letras + 4 números | `AB-1234` |
 * | Especiales (oficial, diplomático) | `E` + 2 letras + 3 números | `EUA-123` |
 *
 * Las especiales encajan en el patrón de los livianos, así que con dos
 * expresiones basta. Lo que no encaja en ninguna es lo que se rechaza.
 */

/** Livianos, pesados y especiales: la letra de zona, dos libres y tres cifras. */
const MAYOR = /^[A-Z][A-Z0-9]{2}-[0-9]{3}$/

/** Vehículos menores: dos letras y cuatro cifras. */
const MENOR = /^[A-Z]{2}-[0-9]{4}$/

export function esPlacaValida(placa: string): boolean {
  const p = placa.trim().toUpperCase()
  return MAYOR.test(p) || MENOR.test(p)
}

/** De qué tipo de vehículo habla la placa, si es que es válida. */
export function tipoDePlaca(placa: string): 'mayor' | 'menor' | null {
  const p = placa.trim().toUpperCase()
  if (MENOR.test(p)) return 'menor'
  if (MAYOR.test(p)) return 'mayor'
  return null
}

/**
 * Pone mayúsculas y el guion mientras se teclea, tolerante a que se escriba
 * sin nada.
 *
 * `AB1234` es a la vez una moto (`AB-1234`) y un coche (`AB1-234`): el guion
 * no se puede adivinar. Por eso, si quien escribe lo teclea, **manda él**; y
 * si no lo teclea, se coloca donde va en el caso corriente —tras tres
 * caracteres—, salvo que lo escrito solo pueda ser una moto.
 */
export function normalizarPlaca(texto: string): string {
  const crudo = texto.toUpperCase().replace(/[^A-Z0-9-]/g, '')
  // Los dos formatos tienen seis caracteres útiles: LL+4 cifras, o L+2+3.
  const limpio = crudo.replace(/-/g, '').slice(0, 6)

  // El guion que teclea el usuario es su forma de decir qué placa es.
  const tecleado = crudo.indexOf('-')
  const esMoto = /^[A-Z]{2}[0-9]{1,4}$/.test(limpio) && limpio.length > 3
  const corte = tecleado === 2 || tecleado === 3 ? tecleado : esMoto ? 2 : 3

  return limpio.length > corte ? `${limpio.slice(0, corte)}-${limpio.slice(corte)}` : limpio
}
