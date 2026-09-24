import type { EstadoCita, FaseOrden, MotivoDetencion, PrioridadOrden } from '@/types'
import type { TonoTaller } from '@/types/ui'

/**
 * Las dos dimensiones de una orden viven separadas a propósito: la FASE dice en
 * qué punto del trabajo está y la DETENCIÓN si avanza o no. Aquí solo se
 * traducen a etiqueta, tono y glifo; nadie las combina en un estado único.
 */

export const fasesOrden: FaseOrden[] = [
  'recepcion',
  'diagnostico',
  'presupuesto',
  'reparacion',
  'control',
  'lista',
  'entregada',
  'anulada',
]

/** Las fases que ocupan taller. `entregada` y `anulada` ya salieron del flujo. */
export const fasesActivas: FaseOrden[] = [
  'recepcion',
  'diagnostico',
  'presupuesto',
  'reparacion',
  'control',
  'lista',
]

export const etiquetaFase: Record<FaseOrden, string> = {
  recepcion: 'Recepción',
  diagnostico: 'Diagnóstico',
  presupuesto: 'Presupuesto',
  reparacion: 'En reparación',
  control: 'Control de calidad',
  lista: 'Lista para entrega',
  entregada: 'Entregada',
  anulada: 'Anulada',
}

export const tonoFase: Record<FaseOrden, TonoTaller> = {
  recepcion: 'neutro',
  diagnostico: 'acero',
  presupuesto: 'ambar',
  reparacion: 'acero',
  control: 'ambar',
  lista: 'verde',
  entregada: 'neutro',
  anulada: 'neutro',
}

/**
 * Marca gráfica por fase: el tablero se mira de lejos y por turnos enteros, así
 * que el estado nunca se comunica solo por color.
 */
export const glifoFase: Record<FaseOrden, string> = {
  recepcion: '◷',
  diagnostico: '◑',
  presupuesto: '§',
  reparacion: '⚙',
  control: '✓',
  lista: '▲',
  entregada: '✔',
  anulada: '✕',
}

/** La siguiente fase natural. `undefined` significa que ahí termina el camino. */
export const siguienteFase: Partial<Record<FaseOrden, FaseOrden>> = {
  recepcion: 'diagnostico',
  diagnostico: 'presupuesto',
  presupuesto: 'reparacion',
  reparacion: 'control',
  control: 'lista',
  lista: 'entregada',
}

/** Texto del botón que hace avanzar: dice qué pasa, no «siguiente». */
export const accionSiguienteFase: Partial<Record<FaseOrden, string>> = {
  recepcion: 'Pasar a diagnóstico',
  diagnostico: 'Presupuestar',
  presupuesto: 'Empezar reparación',
  reparacion: 'Pasar a control',
  control: 'Marcar lista',
  lista: 'Entregar',
}

// ── Detención ────────────────────────────────────────────────────────────────

export const motivosDetencion: MotivoDetencion[] = [
  'esperaAprobacion',
  'esperaRepuesto',
  'esperaCliente',
  'esperaTercero',
]

export const etiquetaDetencion: Record<MotivoDetencion, string> = {
  esperaAprobacion: 'Espera aprobación',
  esperaRepuesto: 'Espera repuesto',
  esperaCliente: 'Espera al cliente',
  esperaTercero: 'Espera a un tercero',
}

/** Qué hay que hacer para desatascarla. Lo útil no es el motivo, es la salida. */
export const salidaDetencion: Record<MotivoDetencion, string> = {
  esperaAprobacion: 'Llamar al cliente y registrar su respuesta.',
  esperaRepuesto: 'Confirmar la llegada de la pieza con almacén.',
  esperaCliente: 'El cliente debe traer algo o decidir.',
  esperaTercero: 'Seguimiento al taller o proveedor externo.',
}

// ── Prioridad ────────────────────────────────────────────────────────────────

export const etiquetaPrioridad: Record<PrioridadOrden, string> = {
  normal: 'Normal',
  alta: 'Alta',
  urgente: 'Urgente',
}

export const tonoPrioridad: Record<PrioridadOrden, TonoTaller> = {
  normal: 'neutro',
  alta: 'ambar',
  urgente: 'rojo',
}

// ── Citas ────────────────────────────────────────────────────────────────────

export const etiquetaCita: Record<EstadoCita, string> = {
  pendiente: 'Pendiente',
  confirmada: 'Confirmada',
  llego: 'Llegó',
  noVino: 'No vino',
  cancelada: 'Cancelada',
}

export const tonoCita: Record<EstadoCita, TonoTaller> = {
  pendiente: 'ambar',
  confirmada: 'acero',
  llego: 'verde',
  noVino: 'rojo',
  cancelada: 'neutro',
}
