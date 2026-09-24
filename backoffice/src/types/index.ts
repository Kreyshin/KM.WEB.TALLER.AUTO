/**
 * Modelo de dominio de KM.Taller (back office).
 *
 * Estas interfaces son el contrato entre las vistas y la capa de servicios.
 * Cuando exista el backend real solo cambia la implementación de `services/`,
 * no las vistas.
 *
 * El ciclo central de la vertical es **vehículo → orden de trabajo → entrega**,
 * y la decisión que gobierna todo el modelo es que una orden tiene **fase** y
 * **detención**, y son cosas distintas. La fase dice en qué punto del trabajo
 * está; la detención dice si avanza o no y por qué. Colapsarlas en un único
 * estado —poner «esperando repuesto» como si fuera una fase— hace imposible
 * saber a qué punto volver cuando el repuesto llega, y falsea todos los
 * tiempos de taller.
 */

// ── Autenticación y roles ────────────────────────────────────────────────────

export type Rol = 'admin' | 'asesor' | 'tecnico' | 'almacen'

export interface Usuario {
  id: string
  nombre: string
  email: string
  rol: Rol
  activo: boolean
  /** Sedes a las que tiene acceso (dato del ERP). Sin valor: todas. */
  localIds?: string[]
  /** Especialidades del técnico, para repartir el trabajo con criterio. */
  especialidades?: Especialidad[]
}

export type Especialidad =
  | 'mecanica'
  | 'electricidad'
  | 'electronica'
  | 'suspension'
  | 'frenos'
  | 'planchado'
  | 'pintura'
  | 'aire'

export interface Sesion {
  token: string
  usuario: Usuario
}

// ── Empresa y sedes ──────────────────────────────────────────────────────────

export interface Empresa {
  /** 11 dígitos con dígito verificador válido. */
  ruc: string
  razonSocial: string
  nombreComercial: string
  direccionFiscal: string
  telefono?: string
  email?: string
  moneda: 'PEN'
  zonaHoraria: string
}

export type DiaSemana = 0 | 1 | 2 | 3 | 4 | 5 | 6

export interface HorarioDia {
  dia: DiaSemana
  abierto: boolean
  /** `HH:mm`. */
  apertura: string
  cierre: string
}

/**
 * Sede del taller. Se llama `Local` porque es el término que usa el ERP para
 * cualquier establecimiento, y así los datos maestros viajan sin traducción
 * entre verticales.
 */
export interface Local {
  id: string
  nombre: string
  direccion: string
  distrito: string
  telefono?: string
  /** Código de establecimiento SUNAT, 4 dígitos. */
  codigoEstablecimiento: string
  horario?: HorarioDia[]
  activo: boolean
}

export type NuevoLocal = Omit<Local, 'id'>

// ── Bahías: el recurso físico ────────────────────────────────────────────────

/**
 * Tipo de puesto de trabajo. Importa porque no todo trabajo cabe en cualquier
 * bahía: una alineación necesita su plataforma y una pintura, su cabina.
 */
export type TipoBahia = 'elevador' | 'plano' | 'alineacion' | 'diagnostico' | 'pintura'

export interface Bahia {
  id: string
  /** Código visible en el piso: `B-01`. */
  codigo: string
  nombre: string
  localId: string
  tipo: TipoBahia
  /** Posición en el plano del taller; ordena el tablero. */
  posicion: number
  /** Motivo si está fuera de servicio. */
  nota?: string
  /** Una bahía en mantenimiento no admite trabajo. */
  operativa: boolean
  activo: boolean
}

export type NuevaBahia = Omit<Bahia, 'id'>

// ── Clientes y vehículos ─────────────────────────────────────────────────────

export type TipoDocumento = 'dni' | 'ce' | 'ruc'

export interface Cliente {
  id: string
  tipoDocumento: TipoDocumento
  documento: string
  nombre: string
  email?: string
  telefono?: string
  /** Empresa con flota: cambia el trato y la facturación. */
  esEmpresa: boolean
  /** Notas del asesor: forma de pago pactada, quién autoriza, preferencias. */
  notas?: string
  activo: boolean
}

export type NuevoCliente = Omit<Cliente, 'id'>

export type Combustible = 'gasolina' | 'diesel' | 'glp' | 'gnv' | 'hibrido' | 'electrico'

export type Transmision = 'manual' | 'automatica' | 'cvt'

export interface Vehiculo {
  id: string
  /** Placa en formato peruano `ABC-123`. Es como habla todo el taller. */
  placa: string
  clienteId: string
  marca: string
  modelo: string
  anio: number
  /** 17 caracteres. Lo pide el fabricante para identificar el repuesto exacto. */
  vin?: string
  motor?: string
  combustible: Combustible
  transmision: Transmision
  color?: string
  /** Último kilometraje conocido. Lo actualiza cada ingreso. */
  kilometraje: number
  /** ISO. Cuándo se registró ese kilometraje. */
  kilometrajeAl?: string
  activo: boolean
}

export type NuevoVehiculo = Omit<Vehiculo, 'id'>

/** Vehículo con su propietario resuelto, para listados y tablero. */
export interface VehiculoResuelto extends Vehiculo {
  cliente?: Cliente
}

// ── Órdenes de trabajo ───────────────────────────────────────────────────────

/**
 * FASE del trabajo: en qué punto está la orden.
 *
 * Es una secuencia, no un conjunto de etiquetas: cada fase tiene una siguiente
 * natural y el sistema conoce el camino.
 */
export type FaseOrden =
  | 'recepcion'
  | 'diagnostico'
  | 'presupuesto'
  | 'reparacion'
  | 'control'
  | 'lista'
  | 'entregada'
  | 'anulada'

/**
 * DETENCIÓN: por qué la orden no avanza, si es que no avanza.
 *
 * Es independiente de la fase. Una orden puede estar en reparación y detenida
 * esperando un repuesto: sigue en reparación —ahí volverá— pero no avanza, y
 * ese tiempo no debe contarse como trabajo.
 */
export type MotivoDetencion =
  'esperaAprobacion' | 'esperaRepuesto' | 'esperaCliente' | 'esperaTercero'

export type PrioridadOrden = 'normal' | 'alta' | 'urgente'

export interface OrdenTrabajo {
  id: string
  /** Correlativo visible para el cliente: `OT-2410`. */
  codigo: string
  localId: string
  vehiculoId: string
  clienteId: string
  /** Lo que dijo el cliente, con sus palabras. */
  motivo: string
  /** Lo que encontró el técnico. */
  diagnostico?: string
  fase: FaseOrden
  /** Sin valor, la orden avanza con normalidad. */
  detencion?: MotivoDetencion
  /** ISO. Desde cuándo está detenida: es lo que mide el tiempo perdido. */
  detenidaDesde?: string
  /** Nota de la detención: qué repuesto falta, a quién se espera. */
  notaDetencion?: string
  prioridad: PrioridadOrden
  bahiaId?: string
  tecnicoId?: string
  /** Kilometraje al ingresar. Alimenta el plan de mantenimiento. */
  kilometraje: number
  /** ISO. */
  ingreso: string
  /** ISO. Fecha prometida al cliente: de ella cuelga la confianza del taller. */
  promesa?: string
  /** ISO. Cuándo se entregó de verdad. */
  entrega?: string
  /** El cliente aprobó el presupuesto. Sin esto no se toca el vehículo. */
  aprobada?: boolean
  /** ISO. */
  aprobadaEl?: string
  /** Hoja de ingreso: la vuelta al vehículo, firmada por el cliente. */
  inspeccion?: Inspeccion
  items: ItemOrden[]
}

export type NuevaOrden = Omit<OrdenTrabajo, 'id' | 'codigo' | 'ingreso' | 'items'>

/** Línea del presupuesto: mano de obra o repuesto. */
export interface ItemOrden {
  id: string
  tipo: 'servicio' | 'repuesto'
  /** Referencia al catálogo correspondiente. */
  referenciaId: string
  descripcion: string
  cantidad: number
  /** Precio unitario en soles. */
  precio: number
  /** Horas de mano de obra, solo en servicios. */
  horas?: number
  /** Una línea puede rechazarse sin tumbar el resto del presupuesto. */
  aprobado: boolean
}

/** Orden con vehículo, cliente, bahía y técnico resueltos. */
export interface OrdenResuelta extends OrdenTrabajo {
  vehiculo?: Vehiculo
  cliente?: Cliente
  bahia?: Bahia
  tecnico?: Usuario
  /** Total del presupuesto aprobado, en soles. */
  total: number
  /** Horas de mano de obra comprometidas. */
  horas: number
}

/** Bahía con la orden que tiene dentro, para el tablero del taller. */
export interface BahiaResuelta extends Bahia {
  ordenTrabajo?: OrdenResuelta
}

// ── La hoja de ingreso ───────────────────────────────────────────────────────

/**
 * La recepción de un vehículo se hace dando una vuelta alrededor de él y
 * anotando lo que ya venía roto. Ese papel —la hoja de ingreso— es lo que
 * separa «se lo rayaron en el taller» de «entró así», y es el documento que
 * todo taller hace a mano y nadie digitaliza.
 */
export type TipoDanio = 'rayon' | 'abolladura' | 'rotura' | 'oxido' | 'faltante'

export interface MarcaInspeccion {
  id: string
  /** Posición sobre el dibujo del vehículo, en % del contenedor (0–100). */
  x: number
  y: number
  tipo: TipoDanio
  nota?: string
}

/** Cada punto de la revisión: o está conforme, o hay algo que decir. */
export type EstadoPunto = 'conforme' | 'observado' | 'noAplica'

export interface Inspeccion {
  /** ISO. Cuándo se hizo la vuelta al vehículo. */
  fecha: string
  usuarioId: string
  kilometraje: number
  /**
   * Nivel de combustible en octavos (0–8). Se anota en octavos y no en
   * porcentaje porque así lo marca la aguja, y porque es lo que el cliente
   * puede comprobar al volver.
   */
  combustible: number
  marcas: MarcaInspeccion[]
  puntos: Record<string, EstadoPunto>
  /** Lo que el cliente deja dentro: gata, llanta de repuesto, herramientas. */
  pertenencias: string[]
  observaciones?: string
  /** Trazo de la firma del cliente. Sin firma, la hoja no protege a nadie. */
  firma?: string
}

// ── Catálogo de trabajo ──────────────────────────────────────────────────────

export interface Servicio {
  id: string
  codigo: string
  nombre: string
  descripcion?: string
  especialidad: Especialidad
  /**
   * Tiempo baremo en horas: lo que el trabajo *debería* costar. Es la vara con
   * la que se mide el rendimiento del taller y se cotiza sin adivinar.
   */
  horas: number
  /** Precio de la hora de mano de obra para este servicio, en soles. */
  precioHora: number
  activo: boolean
}

export type NuevoServicio = Omit<Servicio, 'id'>

/** Paquete de mantenimiento por kilometraje: el clásico «servicio de los 10 000». */
export interface PlanMantenimiento {
  id: string
  nombre: string
  /** Cada cuántos kilómetros toca. */
  cadaKm: number
  /** Servicios que incluye. */
  servicioIds: string[]
  /** Repuestos que suelen consumirse. */
  repuestoIds: string[]
  activo: boolean
}

// ── Almacén de repuestos ─────────────────────────────────────────────────────

export type CategoriaRepuesto =
  | 'filtros'
  | 'lubricantes'
  | 'frenos'
  | 'suspension'
  | 'electrico'
  | 'motor'
  | 'carroceria'
  | 'consumibles'

export interface Repuesto {
  id: string
  /** Código interno del taller. */
  codigo: string
  nombre: string
  categoria: CategoriaRepuesto
  marca?: string
  /** Número de parte del fabricante: lo que de verdad identifica la pieza. */
  numeroParte?: string
  /** Costo y precio de venta, en soles. */
  costo: number
  precio: number
  stock: number
  stockMinimo: number
  /** Ubicación en el almacén: `A-3-2`. */
  ubicacion?: string
  activo: boolean
}

export type NuevoRepuesto = Omit<Repuesto, 'id'>

export type TipoMovimiento = 'ingreso' | 'salida' | 'ajuste' | 'devolucion'

export interface Movimiento {
  id: string
  repuestoId: string
  tipo: TipoMovimiento
  cantidad: number
  /** Orden a la que se imputa el consumo, si aplica. */
  ordenId?: string
  motivo?: string
  usuarioId: string
  /** ISO. */
  fecha: string
}

// ── Agenda ───────────────────────────────────────────────────────────────────

export type EstadoCita = 'pendiente' | 'confirmada' | 'llego' | 'noVino' | 'cancelada'

export interface Cita {
  id: string
  localId: string
  vehiculoId: string
  clienteId: string
  /** `YYYY-MM-DD`. */
  fecha: string
  /** `HH:mm`. */
  hora: string
  motivo: string
  estado: EstadoCita
  /** Minutos estimados de ocupación de bahía. */
  duracion: number
  notas?: string
}

export type NuevaCita = Omit<Cita, 'id'>

/** Cita con vehículo y cliente resueltos. */
export interface CitaResuelta extends Cita {
  vehiculo?: Vehiculo
  cliente?: Cliente
}

// ── Facturación ──────────────────────────────────────────────────────────────

export type TipoComprobante = 'boleta' | 'factura' | 'notaCredito' | 'notaVenta'

export interface SerieComprobante {
  id: string
  localId: string
  tipo: TipoComprobante
  /** Cuatro caracteres: B001, F001, BC01, NV01. */
  serie: string
  correlativo: number
  activo: boolean
}

export interface ConfigImpuestos {
  /** IGV vigente, en %. */
  igv: number
  preciosIncluyenIgv: boolean
}

// ── Operación y auditoría ────────────────────────────────────────────────────

export interface RegistroAuditoria {
  id: string
  usuarioId: string
  accion: string
  entidad: string
  entidadId?: string
  detalle?: string
  /** ISO. */
  fecha: string
}

export interface Motivo {
  id: string
  nombre: string
  ambito: 'anulacion' | 'detencion' | 'descuento' | 'garantia'
  requiereNota: boolean
  activo: boolean
}

// ── Configuración de la vertical ─────────────────────────────────────────────

export type AlcanceParametro = 'vertical' | 'local'

export interface DefinicionParametro {
  clave: string
  etiqueta: string
  descripcion?: string
  alcance: AlcanceParametro
  grupo: string
  tipo: 'booleano' | 'numero' | 'texto' | 'opcion'
  opciones?: { valor: string; etiqueta: string }[]
  porDefecto: string | number | boolean
}

export type ValorParametro = string | number | boolean

export interface ValoresConfiguracion {
  vertical: Record<string, ValorParametro>
  locales: Record<string, Record<string, ValorParametro>>
}

// ── Consulta y transporte ────────────────────────────────────────────────────

export interface Paginado<T> {
  items: T[]
  total: number
  pagina: number
  porPagina: number
}

export type DireccionOrden = 'asc' | 'desc'

export interface Orden {
  campo: string
  direccion: DireccionOrden
}

/**
 * Parámetros de listado que entiende cualquier servicio paginado.
 * Se traducen 1:1 a query string cuando el servicio pase a HTTP:
 * `?buscar=&orden=ingreso:desc&pagina=1&porPagina=20&fase=reparacion`.
 */
export interface Consulta {
  buscar?: string
  orden?: Orden
  pagina?: number
  porPagina?: number
  /** Igualdad exacta por campo; `undefined` o `''` no filtra. */
  filtros?: Record<string, string | number | boolean | undefined>
}

export interface ApiError {
  mensaje: string
  campos?: Record<string, string>
}
