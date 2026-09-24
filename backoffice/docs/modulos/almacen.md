# Almacén

Las piezas. La causa más común de una orden detenida vive aquí.

## Repuestos

La ficha lleva código, nombre, categoría, marca y **número de parte** —lo que
de verdad identifica la pieza—, además de costo, precio, ubicación y stock.

El listado avisa por sí solo:

| Aviso                                                   | Cuándo                         |
| ------------------------------------------------------- | ------------------------------ |
| <span class="estado estado-detenida">✕ Sin stock</span> | El stock llegó a cero          |
| <span class="estado estado-espera">⚠ Reponer</span>     | Está en el mínimo o por debajo |

El **margen** aparece junto al precio, calculado sobre costo y precio de venta.
El sistema tampoco deja fijar un precio de venta por debajo del costo.

### El stock mínimo

No es un adorno. Una pieza que falta no cuesta lo que cuesta la pieza: cuesta
una bahía ocupada y un cliente esperando. El mínimo existe para avisar **antes**
de llegar a cero, que es cuando todavía se puede pedir sin urgencia.

## Movimientos

El kardex: qué entró, qué salió y a qué orden se imputó.

| Tipo       | Efecto sobre el stock               |
| ---------- | ----------------------------------- |
| Ingreso    | Suma                                |
| Salida     | Resta                               |
| Devolución | Suma                                |
| Ajuste     | **Fija** el stock al número contado |

::: warning El stock no se edita a mano
La ficha del repuesto no se toca para cuadrar el almacén. Se registra un
**ajuste**, que deja rastro de quién lo hizo y por qué. Un almacén sin rastro es
un almacén sin responsable.
:::

Una salida que no alcanza se rechaza con el número exacto que queda: _«Solo
quedan 2 de Filtro de aceite.»_ El mismo control se aplica al añadir un repuesto
al presupuesto de una orden.

## Cómo se mira el almacén

La pregunta con la que se entra aquí no es «busca esta pieza», es **«¿qué tengo
que pedir?»**. Por eso la pantalla contesta antes de que nadie lea una fila:

- Arriba, el parte: cuántas referencias están **sin stock**, cuántas **bajo
  mínimo** y **cuánto cuesta** dejar el almacén en su punto de pedido.
- Debajo, una tarjeta por repuesto con una **barra de nivel** en la que el
  mínimo siempre cae a media barra. Así «por debajo de la mitad» significa lo
  mismo en un filtro de 46 unidades que en un compresor del que se tiene uno.

::: tip Solo se marca la excepción
Las piezas con holgura no llevan insignia. En una rejilla de veinte, repetir
veinte veces «con holgura» tapa justo la que hay que ver; lo normal ya lo dicen
la cifra y la barra.
:::

El mínimo es el **punto de pedido**: estar justo en él ya cuenta como «hay que
reponer». Esperar a bajar de ahí es llegar tarde.

La tabla sigue disponible en el interruptor de la derecha, y el sistema
recuerda la elección.
