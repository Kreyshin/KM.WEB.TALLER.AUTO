# Órdenes de trabajo

El tablero responde _«¿qué hay en cada bahía?»_. Esta pantalla responde
_«¿dónde está la orden de este cliente?»_, que es la pregunta del teléfono.

## El listado

Una fila por orden viva, con **fase y detención en columnas separadas**:

| Columna         | Qué dice                                                                                         |
| --------------- | ------------------------------------------------------------------------------------------------ |
| Orden           | El correlativo y cuánto lleva dentro                                                             |
| Vehículo        | Placa, modelo y cliente                                                                          |
| Fase            | Dónde va el trabajo, con su símbolo                                                              |
| ¿Avanza?        | <span class="estado estado-avanza">✓ Avanza</span> o el motivo de la detención con su antigüedad |
| Técnico / bahía | A quién y a dónde está asignada                                                                  |
| Entrega         | Cuánto falta, o cuánto se pasó                                                                   |
| Aprobado        | El total del presupuesto ya aprobado                                                             |

## Buscar y filtrar

- **Búsqueda** por placa, número de orden, cliente o motivo.
- **Filtro por fase**, para ver solo lo que está en un punto concreto.
- **Atajo «Detenidas»**, con el contador al lado: un clic y queda a la vista lo
  que hay que desatascar.

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
