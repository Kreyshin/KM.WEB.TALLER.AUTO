# Un repuesto que no llega

El caso que explica por qué el sistema está hecho así.

## Lo que pasa

Media mañana. Un Hyundai H1 está en el elevador 2, abierto, en
<span class="estado estado-neutro">reparación</span>. El retén de cigüeñal que
hacía falta no está: almacén lo pidió al proveedor y llega mañana.

## Lo que se hace

En la ficha de la orden, **Detener**:

- **Motivo**: espera repuesto.
- **Detalle**: «Retén de cigüeñal pedido al proveedor, llega mañana».

Y ya está. Tres segundos.

## Lo que cambia

| Dónde                 | Qué se ve ahora                                                                                                                                |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| **Tablero**           | La celda de B-02 con borde rojo, latiendo despacio, y «Sin avanzar hace 5 h»                                                                   |
| **Órdenes**           | La columna _¿Avanza?_ pasa de <span class="estado estado-avanza">✓ Avanza</span> a <span class="estado estado-detenida">Espera repuesto</span> |
| **Detenidas**         | Aparece en su grupo, con la salida: _confirmar la llegada de la pieza con almacén_                                                             |
| **Inicio**            | La cifra de detenidas sube y la frase del día cambia                                                                                           |
| **Carga de técnicos** | Sus horas siguen contando, pero marcadas como detenidas                                                                                        |

## Lo que **no** cambia

**La fase.** La orden sigue en <span class="estado estado-neutro">reparación</span>.

Esto es lo importante. Si «esperando repuesto» fuera una fase, mañana nadie
sabría a qué punto volver: ¿a reparación? ¿estaba empezando o terminando? Y el
tiempo parado contaría como tiempo de trabajo.

## Al día siguiente

Llega la pieza. Almacén registra el **ingreso** en
[Movimientos](/modulos/almacen) —el stock queda cuadrado en la misma
operación— y el asesor pulsa **Ya se resolvió** desde Detenidas.

La orden vuelve a <span class="estado estado-avanza">avanzar</span>, en
reparación, justo donde estaba.

## El aprendizaje que queda

Esta orden estuvo parada 19 horas por una pieza de sesenta soles. Si el
**stock mínimo** del retén hubiera estado bien puesto, el almacén habría avisado
una semana antes.

Por eso _Hay que reponer_ está en la portada del sistema y no escondido en un
informe.
