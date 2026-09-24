import { defineConfig } from 'vitepress'

const REPO = 'KM.WEB.TALLER.AUTO'
const DEMO = `https://kreyshin.github.io/${REPO}/demo/`

/**
 * Documentación FUNCIONAL de la vertical.
 *
 * No documenta arquitectura ni componentes: explica qué hace el sistema, con
 * qué vocabulario y en qué orden se trabaja. El lector es quien opera el
 * taller —asesor, técnico, almacén, administración— o quien necesita entender
 * el alcance antes de decidir.
 */
export default defineConfig({
  lang: 'es-PE',
  title: 'Torque',
  description: 'Cómo funciona el back office de taller mecánico de KM.Taller',
  base: `/${REPO}/`,
  cleanUrls: true,
  lastUpdated: true,
  head: [
    ['link', { rel: 'icon', type: 'image/png', href: `/${REPO}/favicon.png` }],
    ['meta', { name: 'theme-color', content: '#0b1421' }],
  ],

  themeConfig: {
    logo: '/favicon.png',
    siteTitle: 'Torque · Documentación',

    nav: [
      { text: 'Guía', link: '/guia/introduccion', activeMatch: '/guia/' },
      { text: 'Módulos', link: '/modulos/', activeMatch: '/modulos/' },
      { text: 'Procesos', link: '/procesos/ingreso', activeMatch: '/procesos/' },
      { text: 'Glosario', link: '/glosario' },
      { text: 'Ver demo', link: DEMO, target: '_blank' },
    ],

    sidebar: {
      '/guia/': [
        {
          text: 'Entender el sistema',
          items: [
            { text: 'Qué es Torque', link: '/guia/introduccion' },
            { text: 'Conceptos base', link: '/guia/conceptos' },
            { text: 'Fase y detención', link: '/guia/fase-y-detencion' },
            { text: 'El día del taller', link: '/guia/dia-a-dia' },
            { text: 'Quién hace qué', link: '/guia/roles' },
          ],
        },
        {
          text: 'Alcance',
          items: [
            { text: 'Qué está listo', link: '/guia/estado' },
            { text: 'Preguntas frecuentes', link: '/guia/preguntas' },
          ],
        },
      ],
      '/modulos/': [
        {
          text: 'Módulos',
          items: [
            { text: 'Resumen', link: '/modulos/' },
            { text: 'Inicio · El taller hoy', link: '/modulos/inicio' },
            { text: 'Tablero de bahías', link: '/modulos/tablero' },
            { text: 'Órdenes de trabajo', link: '/modulos/ordenes' },
            { text: 'Detenidas', link: '/modulos/detenidas' },
            { text: 'Carga de técnicos', link: '/modulos/tecnicos' },
            { text: 'Clientes y vehículos', link: '/modulos/clientes' },
            { text: 'Citas', link: '/modulos/citas' },
            { text: 'Catálogo y baremos', link: '/modulos/catalogo' },
            { text: 'Almacén', link: '/modulos/almacen' },
            { text: 'Configuración', link: '/modulos/configuracion' },
          ],
        },
      ],
      '/procesos/': [
        {
          text: 'Procesos de principio a fin',
          items: [
            { text: 'Un vehículo que entra', link: '/procesos/ingreso' },
            { text: 'Un presupuesto que se aprueba', link: '/procesos/presupuesto' },
            { text: 'Un repuesto que no llega', link: '/procesos/repuesto' },
            { text: 'Una entrega', link: '/procesos/entrega' },
            { text: 'El precio de un trabajo', link: '/procesos/precio' },
          ],
        },
      ],
    },

    socialLinks: [{ icon: 'github', link: `https://github.com/Kreyshin/${REPO}` }],
    editLink: {
      pattern: `https://github.com/Kreyshin/${REPO}/edit/main/backoffice/docs/:path`,
      text: 'Editar esta página en GitHub',
    },
    outline: { label: 'En esta página', level: [2, 3] },
    docFooter: { prev: 'Anterior', next: 'Siguiente' },
    lastUpdated: { text: 'Actualizado' },
    darkModeSwitchLabel: 'Tema',
    returnToTopLabel: 'Volver arriba',
    sidebarMenuLabel: 'Menú',
    search: { provider: 'local' },
    footer: {
      message: 'Back office Torque · Un sistema Karma Systems',
    },
  },
})
