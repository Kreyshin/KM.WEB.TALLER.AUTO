# Configuración del taller

Las reglas con las que trabaja toda la cadena. Es la pantalla que le da
carácter a todo lo demás: de aquí salen las que después impiden diagnosticar
sin hoja firmada, obligan a volver a pedir aprobación cuando el presupuesto
sube, o deciden en qué momento un repuesto deja de estar disponible para otro.

## Tres alcances, no uno

| Alcance            | Dónde se decide                                                            | Ejemplo                                    |
| ------------------ | -------------------------------------------------------------------------- | ------------------------------------------ |
| **Toda la cadena** | Aquí, y vale en todos los talleres                                         | Por qué fases pasa el trabajo              |
| **Cada taller**    | Aquí se fija el punto de partida; cada sede podrá apartarse                | Jornada de referencia, canal de aprobación |
| **Módulo del ERP** | La versión avanzada de un concepto que aquí se resuelve en su forma básica | Custodia documental de las fotos           |

::: tip Lo básico es de la vertical; lo avanzado, del ERP
Torque resuelve lo **transversal** de cada cosa: pedir fotos al recibir, avisar
de que el vehículo está listo, calcular el punto de pedido con un mínimo fijo.
Ese mismo concepto llevado a su versión mayor —custodia con valor probatorio,
campañas automáticas, punto de pedido por consumo con plazos de proveedor— vive
en un módulo del ERP.

Está dicho en cada parámetro, donde se está tomando la decisión, en vez de
escondido: así se ve **qué se puede hacer hoy** y **qué daría ir más lejos**.
:::

## Cómo está organizada

Un carril a la izquierda con los grupos, en el orden en que se recorre el
trabajo —Recepción, Presupuesto, Taller, Almacén, Entrega, Agenda,
Documentos—, no por orden alfabético.

Junto a cada grupo, un **punto ámbar** si tiene cambios sin guardar, o el
número de parámetros que ya están apartados del valor de fábrica.

## Se guarda al final

Configurar es una sesión, no veinte operaciones sueltas. Los cambios se
acumulan y una barra abajo dice cuántos llevas, con **Descartar** y **Guardar
cambios**.

Eso permite dar marcha atrás sin haber roto nada por el camino, y es lo que
hace que nadie tenga miedo de tocar esta pantalla.

## Cada parámetro cuenta su escenario

Debajo de cada uno, en una nota al margen, **qué pasa de verdad en el taller**
si se activa:

> _Con esto activado, un técnico no puede empezar el diagnóstico de un coche
> cuyo dueño no firmó la hoja. Es lo que separa «entró así» de «se lo rayaron
> aquí»._

Quien configura el sistema no es quien lo programó. Sin esa línea, una casilla
es una adivinanza.

## Los controles

| Control                   | Cuándo                                               | Ejemplo                                       |
| ------------------------- | ---------------------------------------------------- | --------------------------------------------- |
| **Interruptor**           | Un sí o un no                                        | Exigir hoja de ingreso firmada                |
| **Opciones a la vista**   | Una política excluyente, con su consecuencia escrita | Cuándo se descuenta el repuesto del stock     |
| **Casillas**              | Varias cosas a la vez                                | Qué se anota al recibir                       |
| **Lista que se arrastra** | Una **secuencia**                                    | Por qué fases pasa el trabajo                 |
| **Número con su unidad**  | Un umbral                                            | Desde qué importe se exige aprobación escrita |

::: info Arrastrar nunca es la única forma
Cada fila de una lista ordenable lleva sus flechas y se recorre con el
tabulador. Un control que solo funciona con el ratón deja fuera a quien no
puede arrastrar, y en un taller también a quien lleva guantes.
:::

## Avisa antes de romper algo

Si desactivas una fase que hoy tiene coches dentro, el sistema lo dice **justo
debajo de la lista**, antes de guardar:

> ⚠ **1 orden** en «Control de calidad». Tendrás que moverlas antes de que la
> fase desaparezca del tablero.

Un aviso que hay que ir a buscar al final de la pantalla no es un aviso.

## Qué cambia de verdad al guardar

No es una pantalla de adorno. Lo que se fija aquí lo obedecen los servicios:

| Parámetro                        | Qué pasa                                                       |
| -------------------------------- | -------------------------------------------------------------- |
| Exigir hoja de ingreso firmada   | El sistema no deja salir de recepción sin la firma             |
| Una sola orden por bahía         | Impide —o permite— meter dos coches en el mismo elevador       |
| Permitir salidas sin stock       | Abre o cierra la entrega de una pieza que no está              |
| Jornada de referencia            | Es la línea que cruza las barras de Carga de técnicos          |
| Motivos de detención             | Cuáles se ofrecen al detener una orden, y en qué orden         |
| Aprobar línea por línea          | Enseña u oculta el botón de aprobar cada línea del presupuesto |
| Duración por defecto de una cita | Lo que la agenda reserva de bahía al agendar                   |

## Configuración por taller

Los parámetros marcados **«cada taller puede cambiarlo»** se fijan aquí como
punto de partida de la cadena. Cada sede tendrá su propia pantalla para
apartarse de ellos cuando su realidad sea distinta —un taller de barrio y uno
de flota no trabajan igual—, y lo que no toque seguirá heredando lo de aquí.
