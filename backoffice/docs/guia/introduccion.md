# Qué es Torque

Torque es el back office de un taller mecánico: la pantalla desde la que el
asesor recibe un vehículo, el técnico mueve su trabajo, almacén entrega las
piezas y administración cobra.

No es una agenda ni una hoja de cálculo con más botones. Es un sistema que
conoce el oficio y por eso **impide cosas**: no deja empezar una reparación que
el cliente no aprobó, no mete dos coches en el mismo elevador y no entrega una
orden que está esperando una pieza.

## El problema que resuelve

Un taller pierde dinero por tres sitios, y los tres son de información:

| Fuga                   | Qué pasa de verdad                                                      | Qué hace Torque                                                                      |
| ---------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| **Coches parados**     | Ocupan bahía días enteros y nadie sabe por qué                          | Separa _en qué fase está_ de _por qué no avanza_, y pone lo segundo en primera plana |
| **Presupuestos a ojo** | Se cotiza de memoria, se cobra de menos y se promete una hora imposible | Cada trabajo tiene un tiempo baremo; el precio es una multiplicación                 |
| **Piezas que faltan**  | Se descubre el día que hacen falta, con el coche abierto                | El almacén avisa por debajo del mínimo, no cuando llega a cero                       |

## El ciclo

Donde Restaurante tiene _mesa → comanda → cocina_ y Hospedaje tiene
_habitación → reserva → estancia_, un taller tiene:

```
vehículo → orden de trabajo → entrega
```

Con una vuelta que lo hace distinto de sus hermanas: entre el presupuesto y la
reparación hay **una persona que tiene que decir que sí**. Esa espera no es un
estado del trabajo, es una interrupción del trabajo, y de ahí sale la decisión
central del sistema.

::: tip La idea que hay que llevarse
Una orden tiene **fase** —dónde va— y **detención** —si avanza—. Son dos cosas
distintas y el sistema nunca las junta. [Está explicado
aquí](/guia/fase-y-detencion).
:::

## Qué encontrarás en esta documentación

- **[Conceptos base](/guia/conceptos)** — las cinco piezas del modelo.
- **[Fase y detención](/guia/fase-y-detencion)** — la decisión que gobierna todo.
- **[El día del taller](/guia/dia-a-dia)** — la jornada completa.
- **[Quién hace qué](/guia/roles)** — qué ve cada rol.
- **[Módulos](/modulos/)** — pantalla por pantalla.
- **[Procesos](/procesos/ingreso)** — casos completos de principio a fin.

Esta documentación es **funcional**: no explica cómo está hecho el sistema,
sino qué hace y por qué. Para el detalle técnico, el código manda.
