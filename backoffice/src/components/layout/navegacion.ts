import type { Rol } from '@/types'

/**
 * Estructura de navegación del shell Karma.
 *
 * La barra principal (92px) lista los MÓDULOS; el menú contextual (300px)
 * muestra únicamente las SECCIONES del módulo activo. La distribución es la
 * misma en todas las verticales; lo que cambia es el dominio que cuelga.
 */

export interface SeccionNav {
  nombreRuta: string
  etiqueta: string
  descripcion?: string
  roles?: Rol[]
}

export interface ModuloNav {
  id: string
  etiqueta: string
  /** Path de un icono SVG de 24×24 (stroke, sin fill). */
  icono: string
  secciones: SeccionNav[]
}

export const modulos: ModuloNav[] = [
  {
    id: 'inicio',
    etiqueta: 'Inicio',
    icono: 'M3 12l9-9 9 9M5 10v10h14V10',
    secciones: [
      {
        nombreRuta: 'inicio',
        etiqueta: 'El taller hoy',
        descripcion: 'Carga, detenidas y entregas del día',
      },
      {
        nombreRuta: 'tablero',
        etiqueta: 'Tablero de bahías',
        descripcion: 'Qué hay en cada puesto, en vivo',
      },
    ],
  },
  {
    id: 'taller',
    etiqueta: 'Taller',
    icono:
      'M14.7 6.3a4 4 0 0 1-5.4 5.4L4 17v3h3l5.3-5.3a4 4 0 0 1 5.4-5.4l-2.8 2.8 2.1 2.1 2.8-2.8a4 4 0 0 1-5.1-5.1z',
    secciones: [
      {
        nombreRuta: 'ordenes',
        etiqueta: 'Órdenes de trabajo',
        descripcion: 'Todo lo que está en el taller y su avance',
      },
      {
        nombreRuta: 'detenidas',
        etiqueta: 'Detenidas',
        descripcion: 'Lo que ocupa sitio y no avanza',
      },
      {
        nombreRuta: 'tecnicos',
        etiqueta: 'Carga de técnicos',
        descripcion: 'Horas comprometidas por persona',
      },
      {
        nombreRuta: 'bahias',
        etiqueta: 'Bahías',
        descripcion: 'Puestos de trabajo del local',
        roles: ['admin'],
      },
    ],
  },
  {
    id: 'clientes',
    etiqueta: 'Clientes',
    icono:
      'M16 19a4 4 0 0 0-8 0M12 12a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM4 21h16a1 1 0 0 0 1-1V6a3 3 0 0 0-3-3H6a3 3 0 0 0-3 3v14a1 1 0 0 0 1 1z',
    secciones: [
      {
        nombreRuta: 'vehiculos',
        etiqueta: 'Vehículos',
        descripcion: 'Ficha por placa, con su historial',
      },
      {
        nombreRuta: 'clientes',
        etiqueta: 'Clientes',
        descripcion: 'Particulares y flotas',
      },
      {
        nombreRuta: 'citas',
        etiqueta: 'Citas',
        descripcion: 'Agenda del día y de la semana',
      },
    ],
  },
  {
    id: 'catalogo',
    etiqueta: 'Catálogo',
    icono: 'M4 4h11a3 3 0 0 1 3 3v13H7a3 3 0 0 1-3-3V4zM8 8h7M8 12h7M8 16h4',
    secciones: [
      {
        nombreRuta: 'servicios',
        etiqueta: 'Servicios y baremos',
        descripcion: 'Mano de obra con su tiempo estándar',
        roles: ['admin', 'asesor'],
      },
      {
        nombreRuta: 'planes',
        etiqueta: 'Planes de mantenimiento',
        descripcion: 'Qué toca a cada kilometraje',
        roles: ['admin', 'asesor'],
      },
    ],
  },
  {
    id: 'almacen',
    etiqueta: 'Almacén',
    icono: 'M3 7l9-4 9 4v10l-9 4-9-4V7zM3 7l9 4 9-4M12 11v10',
    secciones: [
      {
        nombreRuta: 'repuestos',
        etiqueta: 'Repuestos',
        descripcion: 'Stock, mínimos y ubicación',
        roles: ['admin', 'almacen', 'asesor'],
      },
      {
        nombreRuta: 'movimientos',
        etiqueta: 'Movimientos',
        descripcion: 'Consumos, ingresos y devoluciones',
        roles: ['admin', 'almacen'],
      },
    ],
  },
  {
    id: 'administracion',
    etiqueta: 'Admin',
    icono: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
    secciones: [
      {
        nombreRuta: 'reportes',
        etiqueta: 'Producción del taller',
        descripcion: 'Horas vendidas, rendimiento y facturación',
        roles: ['admin'],
      },
      {
        nombreRuta: 'facturacion',
        etiqueta: 'Facturación SUNAT',
        descripcion: 'Comprobantes electrónicos',
        roles: ['admin', 'asesor'],
      },
      {
        nombreRuta: 'usuarios',
        etiqueta: 'Usuarios y roles',
        descripcion: 'Personal del taller y permisos',
        roles: ['admin'],
      },
      {
        nombreRuta: 'bitacora',
        etiqueta: 'Bitácora',
        descripcion: 'Quién hizo cada acción sensible',
        roles: ['admin'],
      },
    ],
  },
  {
    id: 'configuracion',
    etiqueta: 'Config.',
    icono:
      'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z',
    secciones: [
      {
        nombreRuta: 'config-vertical',
        etiqueta: 'Configuración del taller',
        descripcion: 'Parámetros para toda la cadena',
        roles: ['admin'],
      },
      {
        nombreRuta: 'sedes',
        etiqueta: 'Sedes',
        descripcion: 'Talleres de la cadena',
        roles: ['admin'],
      },
      {
        nombreRuta: 'config-motivos',
        etiqueta: 'Motivos',
        descripcion: 'Anulación, detención, descuento y garantía',
        roles: ['admin'],
      },
    ],
  },
]

/** Módulo al que pertenece una ruta, para resaltar la barra principal. */
export function moduloDeRuta(nombreRuta?: string | symbol | null): ModuloNav | undefined {
  if (!nombreRuta) return undefined
  return modulos.find((m) => m.secciones.some((s) => s.nombreRuta === nombreRuta))
}

export const etiquetasRol: Record<Rol, string> = {
  admin: 'Administrador',
  asesor: 'Asesor de servicio',
  tecnico: 'Técnico',
  almacen: 'Almacén',
}
