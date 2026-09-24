import { createRouter, createWebHashHistory, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import type { Rol } from '@/types'
import { useAuthStore } from '@/stores/auth.store'

declare module 'vue-router' {
  interface RouteMeta {
    /** Título mostrado en la cabecera de trabajo y en document.title. */
    titulo?: string
    /** Ruta pública (no requiere sesión). */
    publica?: boolean
    /** Roles autorizados. Sin definir = cualquier usuario autenticado. */
    roles?: Rol[]
  }
}

const rutas: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/LoginView.vue'),
    meta: { publica: true, titulo: 'Iniciar sesión' },
  },
  {
    path: '/',
    component: () => import('@/layouts/AppLayout.vue'),
    children: [
      { path: '', redirect: { name: 'inicio' } },

      // ── Inicio ──────────────────────────────────────────────────────────
      {
        path: 'inicio',
        name: 'inicio',
        component: () => import('@/views/InicioView.vue'),
        meta: { titulo: 'El taller hoy' },
      },
      {
        path: 'tablero',
        name: 'tablero',
        component: () => import('@/views/tablero/TableroView.vue'),
        meta: { titulo: 'Tablero de bahías' },
      },

      // ── Taller ──────────────────────────────────────────────────────────
      {
        path: 'recepcion/:ordenId?',
        name: 'recepcion',
        component: () => import('@/views/taller/RecepcionView.vue'),
        meta: { titulo: 'Recepción de vehículos' },
      },
      {
        path: 'ordenes',
        name: 'ordenes',
        component: () => import('@/views/taller/OrdenesView.vue'),
        meta: { titulo: 'Órdenes de trabajo' },
      },
      {
        path: 'ordenes/detenidas',
        name: 'detenidas',
        component: () => import('@/views/taller/DetenidasView.vue'),
        meta: { titulo: 'Órdenes detenidas' },
      },
      {
        path: 'tecnicos',
        name: 'tecnicos',
        component: () => import('@/views/taller/TecnicosView.vue'),
        meta: { titulo: 'Carga de técnicos' },
      },
      {
        path: 'bahias',
        name: 'bahias',
        component: () => import('@/views/taller/BahiasView.vue'),
        meta: { titulo: 'Bahías', roles: ['admin'] },
      },

      // ── Clientes ────────────────────────────────────────────────────────
      {
        path: 'vehiculos',
        name: 'vehiculos',
        component: () => import('@/views/clientes/VehiculosView.vue'),
        meta: { titulo: 'Vehículos' },
      },
      {
        path: 'clientes',
        name: 'clientes',
        component: () => import('@/views/clientes/ClientesView.vue'),
        meta: { titulo: 'Clientes' },
      },
      {
        path: 'citas',
        name: 'citas',
        component: () => import('@/views/clientes/CitasView.vue'),
        meta: { titulo: 'Citas' },
      },

      // ── Catálogo ────────────────────────────────────────────────────────
      {
        path: 'servicios',
        name: 'servicios',
        component: () => import('@/views/catalogo/ServiciosView.vue'),
        meta: { titulo: 'Servicios y baremos', roles: ['admin', 'asesor'] },
      },
      {
        path: 'servicios/planes',
        name: 'planes',
        component: () => import('@/views/catalogo/PlanesView.vue'),
        meta: { titulo: 'Planes de mantenimiento', roles: ['admin', 'asesor'] },
      },

      // ── Almacén ─────────────────────────────────────────────────────────
      {
        path: 'repuestos',
        name: 'repuestos',
        component: () => import('@/views/almacen/RepuestosView.vue'),
        meta: { titulo: 'Repuestos', roles: ['admin', 'almacen', 'asesor'] },
      },
      {
        path: 'repuestos/movimientos',
        name: 'movimientos',
        component: () => import('@/views/almacen/MovimientosView.vue'),
        meta: { titulo: 'Movimientos', roles: ['admin', 'almacen'] },
      },

      // ── Administración ──────────────────────────────────────────────────
      {
        path: 'reportes',
        name: 'reportes',
        component: () => import('@/views/EnConstruccionView.vue'),
        meta: { titulo: 'Producción del taller', roles: ['admin'] },
      },
      {
        path: 'facturacion',
        name: 'facturacion',
        component: () => import('@/views/EnConstruccionView.vue'),
        meta: { titulo: 'Facturación SUNAT', roles: ['admin', 'asesor'] },
      },
      {
        path: 'usuarios',
        name: 'usuarios',
        component: () => import('@/views/admin/UsuariosView.vue'),
        meta: { titulo: 'Usuarios y roles', roles: ['admin'] },
      },
      {
        path: 'bitacora',
        name: 'bitacora',
        component: () => import('@/views/EnConstruccionView.vue'),
        meta: { titulo: 'Bitácora', roles: ['admin'] },
      },

      // ── Configuración ───────────────────────────────────────────────────
      {
        path: 'configuracion/taller',
        name: 'config-vertical',
        component: () => import('@/views/configuracion/ConfigVerticalView.vue'),
        meta: { titulo: 'Configuración del taller', roles: ['admin'] },
      },
      {
        path: 'configuracion/sedes',
        name: 'sedes',
        component: () => import('@/views/configuracion/SedesView.vue'),
        meta: { titulo: 'Sedes', roles: ['admin'] },
      },
      {
        path: 'configuracion/motivos',
        name: 'config-motivos',
        component: () => import('@/views/EnConstruccionView.vue'),
        meta: { titulo: 'Motivos', roles: ['admin'] },
      },

      {
        path: 'sin-permiso',
        name: 'sin-permiso',
        component: () => import('@/views/SinPermisoView.vue'),
        meta: { titulo: 'Sin permiso' },
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'no-encontrado',
    component: () => import('@/views/NoEncontradoView.vue'),
    meta: { publica: true, titulo: 'Página no encontrada' },
  },
]

/**
 * La demo pública de GitHub Pages usa rutas con hash: Pages no sabe servir el
 * `index.html` de una SPA en subrutas.
 */
export const router = createRouter({
  history: import.meta.env.MODE === 'demo' ? createWebHashHistory() : createWebHistory(),
  routes: rutas,
  scrollBehavior: () => ({ top: 0 }),
})

router.beforeEach((to) => {
  const auth = useAuthStore()

  if (to.meta.publica) {
    if (to.name === 'login' && auth.autenticado) return { name: 'inicio' }
    return true
  }

  if (!auth.autenticado) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  if (!auth.puede(to.meta.roles)) {
    return { name: 'sin-permiso' }
  }

  return true
})

router.afterEach((to) => {
  document.title = to.meta.titulo ? `${to.meta.titulo} · Torque` : 'Torque · Gestión de taller'
})
