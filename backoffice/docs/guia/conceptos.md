# Conceptos base

Cinco piezas. Todo lo demás del sistema cuelga de ellas.

## 1. El vehículo, no el cliente

La unidad que atiende un taller es un coche con una placa, no una persona. Por
eso el sistema guarda cliente y vehículo por separado:

- Un cliente puede tener **muchos vehículos** (una flota es exactamente eso).
- Un vehículo puede **cambiar de dueño** sin perder su historial.
- El kilometraje, el VIN y lo que se le ha hecho son del coche.

La placa —<span class="placa">BQX-417</span>— es la clave de búsqueda del
sistema entero: el buscador global la entiende desde cualquier pantalla.

## 2. La orden de trabajo

Se abre cuando el coche entra y se cierra cuando sale. Dentro lleva:

- **Lo que dijo el cliente**, con sus palabras («hace un ruido al frenar en
  bajada»).
- **Lo que encontró el técnico**, con las suyas («discos delanteros alabeados»).
- El **presupuesto**: líneas de mano de obra y de repuestos.
- La **fase** y, si la hay, la **detención**.
- La **bahía** y el **técnico** asignados.
- La **promesa de entrega**.

Los dos primeros campos son distintos a propósito. Confundirlos es la causa
clásica de las discusiones en el mostrador.

## 3. La bahía

El puesto físico: un elevador, un sitio en el piso, la alineadora, la cabina de
pintura. Importa por dos razones:

1. **Es la capacidad real.** El taller puede tener cien órdenes abiertas, pero
   solo caben tantos coches como bahías operativas.
2. **No todo cabe en cualquier sitio.** Una alineación necesita su plataforma.

Una bahía tiene dos interruptores distintos: **operativa** (hoy admite
trabajo) y **activa** (existe en el plano). Un elevador en mantenimiento sigue
existiendo; simplemente no cuenta como capacidad esta semana.

## 4. El tiempo baremo

El número que sostiene el negocio. Es lo que un trabajo _debería_ costar en
horas.

Con él:

- el **precio** de la mano de obra es `horas × precio de la hora`, no una
  cifra de memoria;
- la **promesa de entrega** tiene fundamento;
- el **rendimiento** del taller es comparable: horas vendidas frente a horas
  reales.

Sin él, todo lo anterior es intuición.

## 5. El repuesto

Con su costo, su precio, su stock y —lo importante— su **mínimo**. El mínimo
existe porque una pieza que falta no cuesta lo que cuesta la pieza: cuesta una
bahía ocupada y un cliente esperando.

---

Con esto ya se puede leer la decisión central del sistema:
[fase y detención](/guia/fase-y-detencion).
