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
