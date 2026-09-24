import type {
  CategoriaRepuesto,
  Combustible,
  Especialidad,
  TipoBahia,
  TipoDocumento,
  TipoMovimiento,
  Transmision,
} from '@/types'

/** Importe en soles, con separador de miles y dos decimales. */
export function formatearSoles(monto: number) {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 2,
  }).format(monto)
}

/** `78 450 km`: el kilometraje se lee de un vistazo, no se cuenta dígito a dígito. */
export function formatearKm(km: number) {
  return `${new Intl.NumberFormat('es-PE').format(km)} km`
}

/** `12 mar` — formato corto para tablas y tableros. */
export function fechaCorta(iso: string) {
  const f = new Date(iso.length <= 10 ? `${iso}T12:00:00` : iso)
  return f.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })
}

/** `lunes 12 de marzo` — formato largo para cabeceras de día. */
export function fechaLarga(iso: string) {
  const f = new Date(iso.length <= 10 ? `${iso}T12:00:00` : iso)
  return f.toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' })
}

/** `14:35`. En taller el reloj es de 24 horas. */
export function hora(iso: string) {
  return new Date(iso).toLocaleTimeString('es-PE', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

/**
 * Antigüedad legible: «hace 4 min», «hace 3 h».
 *
 * En el tablero es información de primera clase: una orden detenida se mide
 * por cuánto lleva detenida, no por cuándo entró.
 */
export function desdeHace(iso: string, ahora = Date.now()) {
  const minutos = Math.max(0, Math.round((ahora - new Date(iso).getTime()) / 60_000))
  if (minutos < 1) return 'ahora mismo'
  if (minutos < 60) return `hace ${minutos} min`
  const horas = Math.floor(minutos / 60)
  if (horas < 24) return `hace ${horas} h`
  const dias = Math.floor(horas / 24)
  return dias === 1 ? 'hace 1 día' : `hace ${dias} días`
}

/**
 * Cuánto falta para una fecha, o cuánto se pasó: «en 3 h», «2 h tarde».
 * La promesa al cliente se mide en las dos direcciones.
 */
export function faltanPara(iso: string, ahora = Date.now()) {
  const minutos = Math.round((new Date(iso).getTime() - ahora) / 60_000)
  const atrasado = minutos < 0
  const abs = Math.abs(minutos)
  const dias = Math.floor(abs / 1440)
  const texto =
    abs < 60
      ? `${abs} min`
      : abs < 1440
        ? `${Math.floor(abs / 60)} h`
        : `${dias} ${dias === 1 ? 'día' : 'días'}`
  return { atrasado, texto: atrasado ? `${texto} tarde` : `en ${texto}` }
}

/** Horas de taller: `2,5 h`. */
export function formatearHoras(horas: number) {
  return `${new Intl.NumberFormat('es-PE', { maximumFractionDigits: 1 }).format(horas)} h`
}

export const etiquetaDocumento: Record<TipoDocumento, string> = {
  dni: 'DNI',
  ce: 'Carné de extranjería',
  ruc: 'RUC',
}

export const etiquetaCombustible: Record<Combustible, string> = {
  gasolina: 'Gasolina',
  diesel: 'Diésel',
  glp: 'GLP',
  gnv: 'GNV',
  hibrido: 'Híbrido',
  electrico: 'Eléctrico',
}

export const etiquetaTransmision: Record<Transmision, string> = {
  manual: 'Manual',
  automatica: 'Automática',
  cvt: 'CVT',
}

export const etiquetaEspecialidad: Record<Especialidad, string> = {
  mecanica: 'Mecánica',
  electricidad: 'Electricidad',
  electronica: 'Electrónica',
  suspension: 'Suspensión',
  frenos: 'Frenos',
  planchado: 'Planchado',
  pintura: 'Pintura',
  aire: 'Aire acondicionado',
}

export const etiquetaTipoBahia: Record<TipoBahia, string> = {
  elevador: 'Elevador',
  plano: 'Piso',
  alineacion: 'Alineación',
  diagnostico: 'Diagnóstico',
  pintura: 'Cabina de pintura',
}

export const etiquetaCategoriaRepuesto: Record<CategoriaRepuesto, string> = {
  filtros: 'Filtros',
  lubricantes: 'Lubricantes',
  frenos: 'Frenos',
  suspension: 'Suspensión',
  electrico: 'Eléctrico',
  motor: 'Motor',
  carroceria: 'Carrocería',
  consumibles: 'Consumibles',
}

export const etiquetaMovimiento: Record<TipoMovimiento, string> = {
  ingreso: 'Ingreso',
  salida: 'Salida',
  ajuste: 'Ajuste',
  devolucion: 'Devolución',
}

/** `MS` a partir de «Marco Salcedo Pinto». */
export function iniciales(nombre: string) {
  return nombre
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase() ?? '')
    .join('')
}
