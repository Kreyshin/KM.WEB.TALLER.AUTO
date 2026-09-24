# Catálogo y baremos

El catálogo de mano de obra. Es la pieza que convierte un taller en un negocio
medible.

## Servicios y baremos

Cada servicio lleva:

- **Código** y nombre.
- **Especialidad**, que decide qué técnico puede tomarlo.
- **Tiempo baremo** en horas: lo que el trabajo _debería_ costar.
- **Precio de la hora** de mano de obra.

El precio del servicio se calcula solo: `horas × precio de la hora`. El
formulario lo muestra mientras se escribe, para que nadie fije un precio a
ciegas.

::: tip Por qué el baremo lo sostiene todo
Sin tiempo baremo se cotiza a ojo, no se puede prometer una hora de entrega y
no hay forma de saber si el taller rinde. Con él, el precio es una
multiplicación, la promesa tiene fundamento y el rendimiento es una
comparación: horas vendidas frente a horas reales.
:::

Un servicio que ya se usó en órdenes **no se puede eliminar**; se desactiva.
El histórico no se toca.

## Planes de mantenimiento

El clásico «servicio de los 10 000». Cada plan agrupa los servicios y los
repuestos que corresponden a un kilometraje.

Su valor está en el mostrador: al recibir un vehículo, el sistema convierte su
kilometraje en una recomendación concreta **con el precio ya calculado**. El
asesor no tiene que acordarse de nada.

### El simulador

Arriba de la pantalla se escribe un kilometraje y el sistema dice qué toca:

> 30 000 km → **Mantenimiento de 30 000** · S/ 640.00 · 3,5 h

La regla cuando encajan varios: **gana el de mayor periodicidad**. A los 50 000
toca el servicio mayor, no el de los 10 000, aunque ambos dividan exacto.

### Qué trae cada tarjeta

La mano de obra con sus horas, los repuestos habituales, el total del paquete y
**cuánto ocupa de taller**. Ese último dato es el que permite decir por teléfono
si hoy cabe.
