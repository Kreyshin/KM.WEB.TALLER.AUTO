import type { DefinicionParametro, ParametroResuelto, ValorParametro } from '@/types'
import { db, latencia, persistir } from './mock/db'
import { errorCampo } from './mock/reglas'
import { fasesActivas } from '@/utils/ordenes'

/**
 * Configuración de la vertical.
 *
 * Dos ideas gobiernan esta pantalla.
 *
 * **1. Un parámetro es una decisión del oficio, no un campo.** Cada definición
 * lleva su `escenario`: qué pasa de verdad en el taller cuando se activa. Sin
 * esa línea, una casilla es una adivinanza, y quien configura el sistema no es
 * quien lo programó.
 *
 * **2. La vertical resuelve lo básico y transversal; el ERP, lo avanzado.**
 * Algunos parámetros tienen una versión mayor que vive en un módulo del ERP
 * —custodia documental, campañas, facturación multiserie—. Eso se dice aquí,
 * en el sitio donde se está tomando la decisión, en vez de esconderlo: el
 * usuario ve qué puede hacer hoy y qué le daría ir más lejos.
 *
 * El alcance `vertical` vale igual en toda la cadena. El alcance `local` se
 * fija aquí como valor de la cadena y cada sede podrá apartarse de él en su
 * propia pantalla.
 */

export const definiciones: DefinicionParametro[] = [
  // ── Recepción ──────────────────────────────────────────────────────────────
  {
    clave: 'recepcion.hojaObligatoria',
    etiqueta: 'Exigir hoja de ingreso firmada',
    descripcion: 'Antes de diagnosticar, el vehículo tiene que tener su vuelta hecha y firmada.',
    escenario:
      'Con esto activado, un técnico no puede empezar el diagnóstico de un coche cuyo dueño no firmó la hoja. Es lo que separa «entró así» de «se lo rayaron aquí».',
    alcance: 'vertical',
    grupo: 'Recepción',
    tipo: 'booleano',
    porDefecto: true,
  },
  {
    clave: 'recepcion.exigir',
    etiqueta: 'Qué se anota al recibir',
    descripcion: 'Lo que la hoja de ingreso no deja cerrar si falta.',
    escenario:
      'Marca solo lo que de verdad vas a exigir siempre. Un campo obligatorio que nadie rellena bien acaba rellenándose de cualquier manera.',
    alcance: 'vertical',
    grupo: 'Recepción',
    tipo: 'multiple',
    opciones: [
      {
        valor: 'kilometraje',
        etiqueta: 'Kilometraje',
        descripcion: 'Alimenta el plan de mantenimiento.',
      },
      {
        valor: 'combustible',
        etiqueta: 'Nivel de combustible',
        descripcion: 'En octavos, como marca la aguja.',
      },
      { valor: 'danios', etiqueta: 'Daños marcados en el dibujo' },
      {
        valor: 'pertenencias',
        etiqueta: 'Pertenencias del cliente',
        descripcion: 'Gata, repuesto, herramientas.',
      },
      {
        valor: 'firma',
        etiqueta: 'Firma del cliente',
        descripcion: 'Sin ella la hoja no protege a nadie.',
      },
    ],
    porDefecto: ['kilometraje', 'combustible', 'firma'],
  },
  {
    clave: 'recepcion.fotos',
    etiqueta: 'Fotografías del estado de entrada',
    alcance: 'vertical',
    grupo: 'Recepción',
    tipo: 'opcion',
    opciones: [
      { valor: 'no', etiqueta: 'No se piden' },
      {
        valor: 'sugeridas',
        etiqueta: 'Sugeridas',
        descripcion: 'Se ofrecen, pero no bloquean la recepción.',
      },
      {
        valor: 'obligatorias',
        etiqueta: 'Obligatorias',
        descripcion: 'Sin fotos no se cierra la hoja.',
      },
    ],
    escenario:
      'En taller de flota y en chapa las fotos ahorran discusiones. En mecánica rápida suelen sobrar y retrasan la entrada.',
    erp: {
      modulo: 'Documentos',
      que: 'custodia de las fotos con sellado de tiempo y valor probatorio ante un reclamo.',
    },
    porDefecto: 'sugeridas',
  },
  {
    clave: 'recepcion.fotosMinimas',
    etiqueta: 'Fotografías mínimas',
    unidad: 'fotos',
    minimo: 1,
    maximo: 12,
    alcance: 'vertical',
    grupo: 'Recepción',
    tipo: 'numero',
    depende: { clave: 'recepcion.fotos', igualA: 'obligatorias' },
    porDefecto: 4,
  },

  // ── Presupuesto y aprobación ───────────────────────────────────────────────
  {
    clave: 'presupuesto.canal',
    etiqueta: 'Cómo aprueba el cliente',
    descripcion: 'El canal que queda registrado en la orden.',
    escenario:
      'El canal no es un detalle administrativo: es la prueba de que alguien dijo que sí. Si el taller trabaja con flotas, lo normal es correo; con particulares, WhatsApp.',
    alcance: 'local',
    grupo: 'Presupuesto',
    tipo: 'opcion',
    opciones: [
      {
        valor: 'presencial',
        etiqueta: 'En el mostrador',
        descripcion: 'El cliente está delante y firma.',
      },
      { valor: 'whatsapp', etiqueta: 'WhatsApp', descripcion: 'Se guarda la respuesta como nota.' },
      { valor: 'correo', etiqueta: 'Correo', descripcion: 'Lo habitual con flotas y empresas.' },
      {
        valor: 'llamada',
        etiqueta: 'Llamada registrada',
        descripcion: 'Queda quién llamó y a qué hora.',
      },
    ],
    erp: {
      modulo: 'Documentos',
      que: 'firma electrónica del presupuesto y trazabilidad legal de la aprobación.',
    },
    porDefecto: 'whatsapp',
  },
  {
    clave: 'presupuesto.montoAprobacionEscrita',
    etiqueta: 'Desde este importe, aprobación por escrito',
    descripcion: 'Por debajo basta con la palabra del cliente. 0: siempre por escrito.',
    escenario:
      'Un cambio de aceite no necesita papel; una caja de cambios sí. Este número es donde el taller pone esa frontera.',
    unidad: 'S/',
    minimo: 0,
    maximo: 100000,
    alcance: 'local',
    grupo: 'Presupuesto',
    tipo: 'numero',
    porDefecto: 800,
  },
  {
    clave: 'presupuesto.aprobacionParcial',
    etiqueta: 'Permitir aprobar línea por línea',
    escenario:
      '«Los frenos sí, la suspensión no» es la respuesta más común del mostrador. Sin esto, el asesor tiene que rehacer el presupuesto entero.',
    alcance: 'vertical',
    grupo: 'Presupuesto',
    tipo: 'booleano',
    porDefecto: true,
  },
  {
    clave: 'presupuesto.reaprobarSiSube',
    etiqueta: 'Volver a pedir aprobación si el importe sube',
    descripcion: 'Porcentaje de subida que obliga a llamar otra vez. 0: nunca.',
    escenario:
      'Se abre el motor y aparece trabajo que no estaba. Este porcentaje decide a partir de cuánto hay que volver a preguntar en vez de seguir.',
    unidad: '%',
    minimo: 0,
    maximo: 100,
    alcance: 'vertical',
    grupo: 'Presupuesto',
    tipo: 'numero',
    porDefecto: 15,
  },
  {
    clave: 'presupuesto.vigenciaDias',
    etiqueta: 'Vigencia del presupuesto',
    unidad: 'días',
    minimo: 1,
    maximo: 180,
    escenario: 'Pasado ese plazo el precio deja de sostenerse: los repuestos se mueven.',
    alcance: 'vertical',
    grupo: 'Presupuesto',
    tipo: 'numero',
    porDefecto: 15,
  },

  // ── El flujo del taller ────────────────────────────────────────────────────
  {
    clave: 'taller.fases',
    etiqueta: 'Por qué fases pasa el trabajo',
    descripcion: 'Arrastra para ordenarlas y desmarca las que este taller no usa.',
    escenario:
      'No todos los talleres trabajan igual: uno de mecánica rápida entrega sin control de calidad aparte, y uno de flota no da un paso sin él. Recibir y entregar siempre pasan.',
    alcance: 'vertical',
    grupo: 'Taller',
    tipo: 'orden',
    opciones: [
      {
        valor: 'recepcion',
        etiqueta: 'Recepción',
        descripcion: 'La vuelta al vehículo.',
        fijo: true,
      },
      {
        valor: 'diagnostico',
        etiqueta: 'Diagnóstico',
        descripcion: 'Lo que encuentra el técnico.',
      },
      {
        valor: 'presupuesto',
        etiqueta: 'Presupuesto',
        descripcion: 'Y la aprobación del cliente.',
      },
      { valor: 'reparacion', etiqueta: 'Reparación' },
      {
        valor: 'control',
        etiqueta: 'Control de calidad',
        descripcion: 'Quien revisa no es quien montó.',
      },
      {
        valor: 'lista',
        etiqueta: 'Lista para entrega',
        descripcion: 'Terminada, esperando al cliente.',
        fijo: true,
      },
    ],
    porDefecto: ['recepcion', 'diagnostico', 'presupuesto', 'reparacion', 'control', 'lista'],
  },
  {
    clave: 'taller.motivosDetencion',
    etiqueta: 'Motivos de detención que se ofrecen',
    descripcion: 'Ordénalos como se usan: el primero es el que más se elige.',
    escenario:
      'Tener los motivos como catálogo y no como texto libre es lo que permite contar al cabo del mes cuántas órdenes se pararon por falta de repuesto.',
    alcance: 'vertical',
    grupo: 'Taller',
    tipo: 'orden',
    opciones: [
      { valor: 'esperaRepuesto', etiqueta: 'Espera repuesto' },
      { valor: 'esperaAprobacion', etiqueta: 'Espera aprobación' },
      { valor: 'esperaCliente', etiqueta: 'Espera al cliente' },
      {
        valor: 'esperaTercero',
        etiqueta: 'Espera a un tercero',
        descripcion: 'Taller o proveedor externo.',
      },
    ],
    porDefecto: ['esperaRepuesto', 'esperaAprobacion', 'esperaCliente', 'esperaTercero'],
  },
  {
    clave: 'taller.jornadaHoras',
    etiqueta: 'Jornada de referencia por técnico',
    descripcion: 'Horas de baremo con las que se compara la carga de cada persona.',
    escenario:
      'Es la línea que cruza las barras de Carga de técnicos. Por encima de ella el reparto está desequilibrado.',
    unidad: 'h',
    minimo: 1,
    maximo: 24,
    alcance: 'local',
    grupo: 'Taller',
    tipo: 'numero',
    porDefecto: 8,
  },
  {
    clave: 'taller.unaOrdenPorBahia',
    etiqueta: 'Una sola orden por bahía',
    escenario:
      'Activado, el sistema impide meter dos coches en el mismo elevador. Desactivado, se permite para talleres que aparcan en la bahía mientras esperan repuesto.',
    alcance: 'vertical',
    grupo: 'Taller',
    tipo: 'booleano',
    porDefecto: true,
  },
  {
    clave: 'taller.alertaDetencionHoras',
    etiqueta: 'Avisar cuando algo lleve parado',
    unidad: 'h',
    minimo: 1,
    maximo: 240,
    escenario:
      'Pasadas esas horas, la orden sube al principio del parte de la mañana. Una pieza que no llega se detecta sola.',
    alcance: 'local',
    grupo: 'Taller',
    tipo: 'numero',
    porDefecto: 4,
  },

  // ── Almacén ────────────────────────────────────────────────────────────────
  {
    clave: 'almacen.descuentaStock',
    etiqueta: 'Cuándo se descuenta el repuesto del stock',
    escenario:
      'Descontar al presupuestar reserva la pieza pero falsea el inventario si el cliente no aprueba. Descontar al consumir es fiel, pero deja vender dos veces lo mismo.',
    alcance: 'vertical',
    grupo: 'Almacén',
    tipo: 'opcion',
    opciones: [
      {
        valor: 'presupuesto',
        etiqueta: 'Al añadirlo al presupuesto',
        descripcion: 'Lo reserva desde el primer momento.',
      },
      {
        valor: 'aprobacion',
        etiqueta: 'Al aprobar el cliente',
        descripcion: 'El equilibrio habitual.',
      },
      {
        valor: 'consumo',
        etiqueta: 'Al montarlo en la bahía',
        descripcion: 'El inventario siempre dice la verdad.',
      },
    ],
    porDefecto: 'aprobacion',
  },
  {
    clave: 'almacen.permitirSinStock',
    etiqueta: 'Permitir salidas sin stock',
    escenario:
      'Desactivado, el sistema no deja entregar una pieza que no está. Activado, la deja en negativo y confía en que almacén cuadre después.',
    alcance: 'vertical',
    grupo: 'Almacén',
    tipo: 'booleano',
    porDefecto: false,
  },
  {
    clave: 'almacen.puntoPedido',
    etiqueta: 'Cómo se calcula el punto de pedido',
    alcance: 'vertical',
    grupo: 'Almacén',
    tipo: 'opcion',
    opciones: [
      {
        valor: 'minimoFijo',
        etiqueta: 'Mínimo fijo por repuesto',
        descripcion: 'El que se escribe en su ficha.',
      },
      {
        valor: 'consumo',
        etiqueta: 'Según el consumo medio',
        descripcion: 'Requiere histórico de movimientos.',
      },
    ],
    escenario:
      'El mínimo fijo lo pone una persona y envejece. El consumo medio se ajusta solo, pero necesita meses de histórico para acertar.',
    erp: {
      modulo: 'Abastecimiento',
      que: 'punto de pedido por consumo, plazos de proveedor y sugerencia de compra automática.',
    },
    porDefecto: 'minimoFijo',
  },
  {
    clave: 'almacen.margenMinimo',
    etiqueta: 'Margen mínimo en repuestos',
    unidad: '%',
    minimo: 0,
    maximo: 90,
    escenario: 'Por debajo de este margen el sistema avisa al fijar el precio de venta.',
    alcance: 'local',
    grupo: 'Almacén',
    tipo: 'numero',
    porDefecto: 20,
  },

  // ── Entrega y garantía ─────────────────────────────────────────────────────
  {
    clave: 'entrega.garantiaDias',
    etiqueta: 'Garantía de la mano de obra',
    unidad: 'días',
    minimo: 0,
    maximo: 730,
    escenario:
      'Se imprime en el comprobante y decide si un retrabajo entra como garantía o se cobra.',
    alcance: 'vertical',
    grupo: 'Entrega',
    tipo: 'numero',
    porDefecto: 90,
  },
  {
    clave: 'entrega.garantiaKm',
    etiqueta: 'Garantía por kilometraje',
    descripcion: 'Lo que se cumpla primero, los días o los kilómetros. 0: sin límite de km.',
    unidad: 'km',
    minimo: 0,
    maximo: 100000,
    alcance: 'vertical',
    grupo: 'Entrega',
    tipo: 'numero',
    porDefecto: 5000,
  },
  {
    clave: 'entrega.aviso',
    etiqueta: 'Cómo se avisa de que está listo',
    descripcion: 'Se ofrecen todos los marcados al pasar la orden a lista para entrega.',
    escenario:
      'Un coche terminado que nadie recoge ocupa la misma bahía que uno a medio reparar. Avisar bien es capacidad.',
    alcance: 'local',
    grupo: 'Entrega',
    tipo: 'multiple',
    opciones: [
      { valor: 'llamada', etiqueta: 'Llamada' },
      { valor: 'whatsapp', etiqueta: 'WhatsApp' },
      { valor: 'sms', etiqueta: 'SMS' },
      { valor: 'correo', etiqueta: 'Correo' },
    ],
    erp: {
      modulo: 'CRM',
      que: 'envío automático, plantillas por tipo de trabajo y encuesta de satisfacción al entregar.',
    },
    porDefecto: ['llamada', 'whatsapp'],
  },

  // ── Agenda ─────────────────────────────────────────────────────────────────
  {
    clave: 'agenda.duracionDefecto',
    etiqueta: 'Duración por defecto de una cita',
    unidad: 'min',
    minimo: 15,
    maximo: 480,
    escenario: 'Es lo que el reloj de la agenda reserva de bahía cuando nadie afina la duración.',
    alcance: 'local',
    grupo: 'Agenda',
    tipo: 'numero',
    porDefecto: 60,
  },
  {
    clave: 'agenda.recordatorio',
    etiqueta: 'Recordatorio al cliente',
    alcance: 'local',
    grupo: 'Agenda',
    tipo: 'opcion',
    opciones: [
      { valor: 'no', etiqueta: 'No se envía' },
      { valor: '24h', etiqueta: 'El día antes' },
      { valor: '2h', etiqueta: 'Dos horas antes' },
    ],
    escenario:
      'Cada cita que no viene es una bahía pagada y vacía. El recordatorio del día antes es el que más recupera.',
    erp: {
      modulo: 'CRM',
      que: 'envío automático por WhatsApp y confirmación del cliente en un clic.',
    },
    porDefecto: '24h',
  },
  {
    clave: 'agenda.sobreventa',
    etiqueta: 'Permitir agendar por encima de la capacidad',
    escenario:
      'Activado, recepción puede aceptar una cita aunque no queden bahías libres a esa hora. Se usa cuando se sabe que una parte no viene.',
    alcance: 'local',
    grupo: 'Agenda',
    tipo: 'booleano',
    porDefecto: false,
  },

  // ── Documentos ─────────────────────────────────────────────────────────────
  {
    clave: 'documentos.mostrarBaremo',
    etiqueta: 'Mostrar las horas de baremo al cliente',
    escenario:
      'Enseñar el tiempo estándar explica el precio y reduce el regateo. Ocultarlo evita discusiones sobre si el técnico tardó más o menos.',
    alcance: 'vertical',
    grupo: 'Documentos',
    tipo: 'booleano',
    porDefecto: true,
  },
  {
    clave: 'documentos.igvDesglosado',
    etiqueta: 'Desglosar el IGV en el presupuesto',
    alcance: 'vertical',
    grupo: 'Documentos',
    tipo: 'booleano',
    porDefecto: true,
  },
  {
    clave: 'documentos.serieDefecto',
    etiqueta: 'Serie por defecto al facturar',
    descripcion: 'La que propone el sistema; el asesor puede cambiarla.',
    alcance: 'local',
    grupo: 'Documentos',
    tipo: 'opcion',
    opciones: [
      { valor: 'boleta', etiqueta: 'Boleta', descripcion: 'Particulares.' },
      { valor: 'factura', etiqueta: 'Factura', descripcion: 'Empresas y flotas.' },
      {
        valor: 'segunCliente',
        etiqueta: 'Según el cliente',
        descripcion: 'Factura si tiene RUC, boleta si no.',
      },
    ],
    erp: {
      modulo: 'Facturación',
      que: 'series múltiples por punto de emisión, notas de crédito y envío a SUNAT.',
    },
    porDefecto: 'segunCliente',
  },
]

/** Los grupos en el orden en que se recorre el trabajo, no alfabético. */
export const gruposParametros = [
  'Recepción',
  'Presupuesto',
  'Taller',
  'Almacén',
  'Entrega',
  'Agenda',
  'Documentos',
]

function porClave(clave: string) {
  const definicion = definiciones.find((d) => d.clave === clave)
  if (!definicion) throw { mensaje: `Parámetro desconocido: ${clave}.` }
  return definicion
}

/** Compara valores que pueden ser listas sin tratarlas como objetos distintos. */
function mismoValor(a: ValorParametro | undefined, b: ValorParametro | undefined) {
  if (Array.isArray(a) && Array.isArray(b))
    return a.length === b.length && a.every((x, i) => x === b[i])
  return a === b
}

function validar(definicion: DefinicionParametro, valor: ValorParametro) {
  if (definicion.tipo === 'numero') {
    const n = Number(valor)
    if (Number.isNaN(n)) throw errorCampo(definicion.clave, 'Tiene que ser un número.')
    if (definicion.minimo !== undefined && n < definicion.minimo) {
      throw errorCampo(definicion.clave, `El mínimo es ${definicion.minimo}.`)
    }
    if (definicion.maximo !== undefined && n > definicion.maximo) {
      throw errorCampo(definicion.clave, `El máximo es ${definicion.maximo}.`)
    }
  }

  if (definicion.tipo === 'orden' || definicion.tipo === 'multiple') {
    if (!Array.isArray(valor)) throw errorCampo(definicion.clave, 'Tiene que ser una lista.')
    const validos = new Set((definicion.opciones ?? []).map((o) => o.valor))
    const desconocido = valor.find((v) => !validos.has(v))
    if (desconocido) throw errorCampo(definicion.clave, `«${desconocido}» no es una opción válida.`)

    // Lo fijo no se puede quitar: recibir y entregar pasan siempre.
    const fijos = (definicion.opciones ?? []).filter((o) => o.fijo).map((o) => o.valor)
    const falta = fijos.find((f) => !valor.includes(f))
    if (falta) {
      const etiqueta = definicion.opciones?.find((o) => o.valor === falta)?.etiqueta ?? falta
      throw errorCampo(definicion.clave, `«${etiqueta}» no se puede desactivar.`)
    }
  }

  if (definicion.tipo === 'opcion') {
    const validos = (definicion.opciones ?? []).map((o) => o.valor)
    if (!validos.includes(String(valor))) {
      throw errorCampo(definicion.clave, 'Esa opción no existe.')
    }
  }
}

export const parametrosService = {
  /** Todas las definiciones con su valor resuelto y de dónde sale. */
  async listar(): Promise<ParametroResuelto[]> {
    const propios = db.configuracion.vertical
    return latencia(
      definiciones.map((definicion) => {
        const propio = propios[definicion.clave]
        return {
          definicion,
          valor: propio !== undefined ? propio : definicion.porDefecto,
          origen: propio !== undefined ? ('propio' as const) : ('defecto' as const),
        }
      }),
    )
  },

  /** El valor vigente de un parámetro, para que lo consulte cualquier servicio. */
  valor<T extends ValorParametro>(clave: string): T {
    const definicion = porClave(clave)
    const propio = db.configuracion.vertical[clave]
    return (propio !== undefined ? propio : definicion.porDefecto) as T
  },

  /**
   * Guarda varios cambios de una vez.
   *
   * La pantalla acumula y guarda al final en lugar de escribir en cada clic:
   * configurar es una sesión, no veinte operaciones sueltas, y así se puede
   * descartar todo sin haber roto nada.
   */
  async guardar(cambios: Record<string, ValorParametro>): Promise<ParametroResuelto[]> {
    for (const [clave, valor] of Object.entries(cambios)) {
      validar(porClave(clave), valor)
    }

    for (const [clave, valor] of Object.entries(cambios)) {
      const definicion = porClave(clave)
      // Volver al valor de fábrica se guarda como ausencia, no como copia.
      if (mismoValor(valor, definicion.porDefecto)) delete db.configuracion.vertical[clave]
      else db.configuracion.vertical[clave] = valor
    }

    persistir()
    return this.listar()
  },

  /** Devuelve un parámetro a lo que trae la vertical de fábrica. */
  async restablecer(clave: string): Promise<ParametroResuelto[]> {
    porClave(clave)
    delete db.configuracion.vertical[clave]
    persistir()
    return this.listar()
  },

  /**
   * Qué se rompería hoy si se aplicara este cambio.
   *
   * Apagar una fase con coches dentro los deja huérfanos, así que se avisa
   * antes de guardar y no después. Es el único aviso de este tipo porque es el
   * único cambio de configuración que puede dejar trabajo sin sitio.
   */
  async impactoFases(fases: string[]): Promise<{ fase: string; ordenes: number }[]> {
    const apagadas = fasesActivas.filter((f) => !fases.includes(f))
    return latencia(
      apagadas
        .map((fase) => ({
          fase,
          ordenes: db.ordenes.filter((o) => o.fase === fase).length,
        }))
        .filter((x) => x.ordenes > 0),
    )
  },
}
