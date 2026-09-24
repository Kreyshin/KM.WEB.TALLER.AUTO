/**
 * Identidad del sistema de taller mecánico.
 *
 * Este vertical tiene lenguaje visual propio —azul marino, rojo carmín y
 * acero—, tomado del isotipo y definido en `src/assets/main.css`. La
 * pertenencia a la plataforma se mantiene como atribución explícita («Un
 * sistema Karma Systems», la división de software de Karma Novum) con el
 * isotipo corporativo, que se conserva en `src/components/marca/KarmaLogo.vue`.
 *
 * El tema de plataforma sigue disponible sin cambios en
 * `src/assets/karma/karma-identidad.css` por si el sistema debe reintegrarse.
 */

export interface Marca {
  /** Nombre del producto tal como se muestra en el shell. */
  nombre: string
  /** Descriptor corto bajo el nombre. */
  descriptor: string
  /** Atribución de plataforma. */
  plataforma: string
  /** Frase de portada. */
  lema: string
  /** Lo que resuelve el sistema, para la pantalla de acceso. */
  capacidades: string[]
}

export const marca: Marca = {
  nombre: 'Torque',
  descriptor: 'Gestión de taller',
  plataforma: 'Un sistema Karma Systems',
  lema: 'Ningún vehículo parado sin que sepas por qué.',
  capacidades: [
    'Tablero de bahías en vivo, con el avance de cada orden',
    'Órdenes de trabajo, presupuesto y aprobación del cliente',
    'Repuestos, baremos de mano de obra y facturación SUNAT',
  ],
}
