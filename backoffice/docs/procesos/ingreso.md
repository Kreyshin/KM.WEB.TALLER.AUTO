# Un vehículo que entra

De la puerta a la bahía, paso a paso.

## 1. Llega

Puede venir con cita o sin ella. Si tenía cita, se marca **Llegó** desde
[Citas](/modulos/citas); el hueco queda justificado.

## 2. Se abre la orden

Desde [Órdenes](/modulos/ordenes) → **Abrir orden**:

| Campo         | Qué se pone                                                           |
| ------------- | --------------------------------------------------------------------- |
| Vehículo      | Se busca por placa. Si es la primera vez, se da de alta primero       |
| Con qué viene | **Las palabras del cliente**: «hace un ruido al frenar en bajada»     |
| Kilometraje   | El sistema propone el último conocido; se corrige con el del odómetro |
| Prioridad     | Normal, salvo que haya un motivo                                      |

::: tip No traduzcas al cliente todavía
«Ruido al frenar en bajada» y «discos alabeados» son dos cosas distintas y van
en campos distintos. La primera es lo que el cliente notó; la segunda es lo que
el técnico encontrará. Mezclarlas es lo que después provoca el _«yo no dije
eso»_.
:::

La orden nace en <span class="estado estado-neutro">recepción</span>, sin
bahía y sin técnico.

## 3. Se comprueba qué le toca

Con el kilometraje recién anotado, [Catálogo → Planes](/modulos/catalogo) dice
si al vehículo le corresponde un mantenimiento, con el precio ya calculado. Es
el momento de ofrecerlo: después el coche ya está abierto y el cliente ya se
fue.

## 4. Se asigna

En [Carga de técnicos](/modulos/tecnicos) se mira quién tiene margen **y la
especialidad** del trabajo. Desde la ficha de la orden se elige bahía y
técnico.

El sistema impide dos cosas:

- asignar una bahía que ya tiene otra orden dentro;
- asignar una bahía que no está operativa.

## 5. Aparece en el tablero

En cuanto tiene bahía, el vehículo ocupa su celda en el
[tablero](/modulos/tablero) y el taller entero lo ve. A partir de aquí el
trabajo se mueve desde ahí.

## Qué ha cambiado en el sistema

- Hay una orden viva más y una bahía menos libre.
- Las horas comprometidas del técnico han subido.
- La portada cuenta un vehículo más _en el taller_.
