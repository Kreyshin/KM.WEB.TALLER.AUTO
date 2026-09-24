# Órdenes de trabajo

El tablero responde _«¿qué hay en cada bahía?»_. Esta pantalla responde
_«¿dónde está la orden de este cliente?»_, que es la pregunta del teléfono.

## La tira de cifras

Lo primero que se ve, porque la primera pregunta de la mañana no es «¿dónde
está esta orden?» sino **«¿cuántas se me están pasando de hora?»**:

| Cifra              | Qué dice                                                          |
| ------------------ | ----------------------------------------------------------------- |
| En el taller       | Órdenes vivas en esta sede. Al pulsarla, quita todos los filtros. |
| ‖ Detenidas        | Las que no avanzan. Al pulsarla, filtra solo esas.                |
| ◷ Se pasan de hora | Las que ya llegaron al margen de aviso, o lo pasaron.             |
| § Esperando un sí  | Dinero parado porque el cliente aún no aprueba.                   |

## Las dos formas de mirarlo

**Tarjetas** —por defecto— y **tabla**, conmutables desde la barra. No es un
capricho: un asesor de pie en el mostrador lee tarjetas de un vistazo, y un
jefe de taller sentado quiere densidad y orden. Cada sede fija la suya en
configuración, y el conmutador permite cambiar de forma puntualmente.

### La tarjeta

Contesta las tres preguntas reales, en este orden:

1. **Por dónde va** — el riel de fases enseña el recorrido entero y dónde está.
   Una orden no es un estado suelto: es un camino con un paso _n_ de _m_.
2. **Si avanza** — la detención, con su antigüedad y, debajo, **qué hay que
   hacer para desatascarla**. El motivo sin la salida no sirve de nada.
3. **Si llega a tiempo** — la cuenta atrás de la entrega, en ámbar cuando se
   acerca y en rojo cuando se pasó.

El filo izquierdo lleva el estado más grave, pero **nunca solo con color**: la
tarjeta repite siempre el glifo y la palabra.

### Cómo se agrupa

Por defecto, **por compromiso**: atrasadas, se entregan hoy, esta semana, sin
fecha. Arriba lo que quema. También se puede agrupar por fase —para ver dónde
se atasca el embudo— o por prioridad, si el taller vende urgencias.

## Buscar y filtrar

- **Búsqueda** por placa, número de orden, cliente o motivo.
- **Filtro por fase**, para ver solo lo que está en un punto concreto.
- **La cifra de detenidas** hace de atajo: un clic y queda a la vista lo que hay
  que desatascar.

## Las acciones rápidas

Desde la propia tarjeta, sin abrir la ficha: **avanzar de fase**, **detener y
reanudar**, **cambiar la prioridad** y **mover la fecha prometida**.

::: warning Un atajo quita también la pausa que hace pensar
Por eso ninguna viene puesta por defecto salvo avanzar y detener, y **todas se
configuran por sede**. Lo que no esté marcado sigue existiendo en la ficha, con
su contexto delante. Un atajo que a un taller le ahorra media hora a otro le
rompe el proceso.
:::

Las reglas del servicio siguen mandando: que la sede permita avanzar desde la
tarjeta **no salta la hoja firmada ni la aprobación del cliente**. El atajo
ahorra clics, no controles, y cuando el servicio se niega dice por qué.

Mover la fecha prometida abre un panel aparte porque es la acción que más
molesta al cliente. Si la cadena lo exige, **sin motivo no se mueve**: queda
escrito qué se aplazó, por qué y cuándo, y al cierre de mes eso dice de qué se
aplaza siempre.

## Qué se configura aquí

Todo lo anterior vive en **Configuración → Órdenes**, y casi todo es de alcance
local:

| Parámetro                             | Alcance | Qué gobierna                          |
| ------------------------------------- | ------- | ------------------------------------- |
| Cómo se listan las órdenes            | Sede    | Tarjetas o tabla                      |
| Por dónde se agrupan                  | Sede    | Compromiso, fase, prioridad o ninguno |
| Qué se puede hacer sin abrir la ficha | Sede    | Las cuatro acciones rápidas           |
| Cuándo una entrega «se acerca»        | Sede    | Horas de margen antes del aviso       |
| Exigir motivo al mover la fecha       | Cadena  | El aplazamiento deja rastro o no      |

## Abrir una orden

La ficha se abre en un panel lateral y reúne, en una sola pantalla, las dos
preguntas del mostrador: _¿cómo va mi coche?_ y _¿cuánto me va a costar?_

### Lo que trae la ficha

1. **Cabecera**: placa, vehículo, cliente, kilometraje al ingreso, tiempo
   dentro, fase y prioridad.
2. **La detención**, si la hay, en un bloque rojo que manda sobre todo lo
   demás: el motivo, **qué hay que hacer para desatascarla** y desde cuándo.
3. **Lo que dijo el cliente** y **lo que encontró el técnico**, en columnas
   distintas y con esas palabras.
4. **Asignación**: bahía, técnico y la entrega prometida, editables ahí mismo.
5. **Presupuesto**: las líneas de obra y de pieza, cada una aprobable o
   rechazable por separado.

### Las acciones del pie

| Botón                  | Cuándo aparece                                     |
| ---------------------- | -------------------------------------------------- |
| **Detener / Reanudar** | Siempre; cambia según el estado                    |
| **El cliente aprueba** | Cuando está en presupuesto y aún no hay aprobación |
| **La siguiente fase**  | El resto del tiempo, con su nombre concreto        |

El botón de avanzar se **desactiva** si la orden está detenida.

## Abrir una orden nueva

El botón **Abrir orden** pide lo mínimo: la placa, con qué viene el cliente, el
kilometraje —que se propone desde el último conocido— y la prioridad.

La orden nace en <span class="estado estado-neutro">recepción</span>, sin
bahía y sin técnico: eso se decide después, mirando la carga.
