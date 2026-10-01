import { ref } from 'vue'

/**
 * El registro de fallos de la aplicación, fuera de cualquier componente.
 *
 * `onErrorCaptured` solo ve lo que pasa dentro del árbol de componentes. Un
 * `import()` de una vista que no se descarga, una promesa que nadie atrapa o
 * un error del navegador caen fuera, y antes acababan en una página en blanco
 * sin que nada lo contase. Aquí se recogen todos, de donde vengan.
 */

export interface Fallo {
  mensaje: string
  detalle?: string
  /** De dónde vino: ayuda a saber dónde mirar. */
  origen: 'pintado' | 'promesa' | 'navegador' | 'navegacion'
}

export const fallo = ref<Fallo | null>(null)

export function registrarFallo(f: Fallo) {
  // El primero manda: los siguientes suelen ser consecuencia suya.
  if (!fallo.value) fallo.value = f
  console.error(`[Torque · ${f.origen}]`, f.mensaje, f.detalle ?? '')
}

export function limpiarFallo() {
  fallo.value = null
}

function texto(e: unknown): { mensaje: string; detalle?: string } {
  if (e instanceof Error) return { mensaje: e.message, detalle: e.stack }
  return { mensaje: String(e) }
}

/**
 * Un `import()` que falla casi siempre significa lo mismo: se publicó una
 * versión nueva y el navegador pide trozos de la anterior, que ya no están.
 * Recargar lo resuelve, y solo se intenta una vez para no caer en un bucle.
 */
const CLAVE_RECARGA = 'km.taller.recarga-por-version'

export function esTrozoPerdido(e: unknown): boolean {
  const m = e instanceof Error ? `${e.name} ${e.message}` : String(e)
  return /dynamically imported module|Importing a module script failed|ChunkLoadError|Failed to fetch/i.test(
    m,
  )
}

export function recargarUnaVez(): boolean {
  try {
    if (sessionStorage.getItem(CLAVE_RECARGA)) return false
    sessionStorage.setItem(CLAVE_RECARGA, '1')
  } catch {
    return false
  }
  window.location.reload()
  return true
}

/** Se llama una vez al arrancar. */
export function vigilarFallosGlobales() {
  window.addEventListener('error', (e) => {
    const { mensaje, detalle } = texto(e.error ?? e.message)
    registrarFallo({ mensaje, detalle, origen: 'navegador' })
  })

  window.addEventListener('unhandledrejection', (e) => {
    if (esTrozoPerdido(e.reason) && recargarUnaVez()) return
    const { mensaje, detalle } = texto(e.reason)
    registrarFallo({ mensaje, detalle, origen: 'promesa' })
  })
}
