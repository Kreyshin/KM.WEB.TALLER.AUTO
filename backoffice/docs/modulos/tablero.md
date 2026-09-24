# Tablero de bahías

El taller visto desde la puerta. Es la pantalla que se queda abierta.

Es el espejo del KDS de cocina de la vertical de Restaurante: una celda por
recurso físico, estado en vivo, pensada para mirarse de lejos. Lo que cambia es
la unidad: donde allí hay comandas, aquí hay vehículos ocupando un puesto.

## Qué hay en cada celda

| Bahía                | Qué se ve                                                                                       |
| -------------------- | ----------------------------------------------------------------------------------------------- |
| **Con trabajo**      | Placa, vehículo, técnico, horas, fase, detención si la hay y cuánto falta para la entrega       |
| **Libre**            | <span class="estado estado-neutro">○ Bahía libre</span> y el nombre del puesto                  |
| **En mantenimiento** | <span class="estado estado-espera">⚠ En mantenimiento</span> y el motivo, con el borde punteado |

Las bahías salen en el **orden del plano**, no por nombre: la pantalla se
parece al taller.

## Lo detenido se distingue antes que nada

Una celda con una orden detenida tiene el borde rojo y **late muy despacio**.
Es la única animación de la pantalla y existe para eso: para que la mirada
vuelva a ella desde el otro lado de la nave.

Debajo de las etiquetas aparece el tiempo parado: _«Sin avanzar hace 5 h»_.

::: info Quien no quiera movimiento no lo tendrá
Si el sistema operativo pide reducir animaciones, el latido se sustituye por un
borde fijo. La información no depende del movimiento.
:::

## Avanzar sin abrir nada

Cada celda con trabajo lleva el botón de la siguiente fase, con el nombre de lo
que va a pasar: _Pasar a control_, _Marcar lista_, _Entregar_. El técnico no
debería tener que abrir una ficha para mover su trabajo.

El botón **no aparece** si la orden está detenida. Primero se reanuda.

## Esperando bahía

Debajo del tablero, las órdenes vivas que todavía no tienen puesto asignado: la
cola de entrada del taller, con el tiempo que llevan dentro.

## Se actualiza solo

Cada 30 segundos, sin recargar y sin parpadeo. También hay un botón para
forzarlo.
