# Matrícula

El cliente y su vehículo, en una sola pantalla.

## El problema que resuelve

Un cliente nuevo llama por teléfono. Para agendarle una cita hacía falta un
vehículo; para tener un vehículo, un cliente. Así que el asesor daba el rodeo
—**Clientes → Vehículos → Citas**, tres pantallas y cuatro altas— con el
cliente esperando al teléfono.

Pero el taller no necesita tres altas. Necesita **dos datos** y saber qué pasa
después.

::: warning DNI y placa
Son el piso, no un campo más. Sin ellos el taller no está cubierto
legalmente, por pequeño que sea. Lo demás de la ficha se afina luego.
:::

## Cómo funciona

**Empieza por la placa**, igual que el mostrador: es lo que el taller pregunta
y lo que sabe contestar. Si la conoce, la reconoce. Si no, se apunta ahí mismo
lo justo —documento, nombre, contacto, marca y modelo— sin salir de la página.

Después, [con qué derecho deja el vehículo](/procesos/tenencia) quien lo deja.

### Los formatos de placa que se aceptan

El parque peruano no tiene un solo formato, y darlo por «tres letras y tres
números» deja fuera a las motos, que en muchos talleres son media flota.

| Tipo de vehículo                  | Formato                                               | Ejemplos             |
| --------------------------------- | ----------------------------------------------------- | -------------------- |
| Livianos y pesados                | Letra de zona registral + 2 alfanuméricos + 3 números | `ABC-123`, `A12-345` |
| Menores (motos, mototaxis)        | 2 letras + 4 números                                  | `AB-1234`            |
| Especiales (oficial, diplomático) | `E` + 2 letras + 3 números                            | `EUA-123`            |

El guion y las mayúsculas se ponen solos mientras se teclea. `AB1234` es a la
vez una moto (`AB-1234`) y un coche (`AB1-234`), así que si escribes el guion,
**manda el tuyo**.

## Las tres puertas

La pantalla no acaba en «guardar», sino en la pregunta que de verdad viene
después. Las tres ocurren en un taller, y ninguna debería obligar a cambiar de
pantalla:

| Puerta                 | Cuándo                 | Qué hace                                   |
| ---------------------- | ---------------------- | ------------------------------------------ |
| **El coche está aquí** | Se presentó sin avisar | Abre la orden y sigue a la hoja de ingreso |
| **Vendrá otro día**    | Llamó para reservar    | Crea la cita con su hueco de bahía         |
| **Solo registrar**     | Llamó a preguntar      | Queda en el padrón, sin compromiso         |

Esa tercera importa más de lo que parece: un taller que no usa agenda sigue
necesitando que el cliente exista.

## Para los que no usan citas

En micro y mediana empresa **la cita es opcional; la matrícula no**. A quien
llega se le atiende. Por eso la espina dorsal del sistema es
`matrícula → orden`, y la agenda es un módulo para quien la use, no un paso
obligatorio del camino.
