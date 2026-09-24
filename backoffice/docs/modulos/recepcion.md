# Recepción · la hoja de ingreso

La vuelta al vehículo, antes de tocarlo. Es el papel que todo taller rellena y
casi ninguno digitaliza, y el que separa **«entró así»** de **«se lo rayaron
aquí»**.

::: warning Por qué existe esta pantalla
Una discusión sobre un rayón que nadie anotó se pierde siempre: el cliente
recuerda que no estaba y el taller recuerda que sí. La hoja firmada al ingreso
es la única prueba, y por eso el sistema no deja cerrar la recepción sin ella.
:::

## Lo que falta por recibir

Al entrar, la sección enseña los vehículos que están en el taller **sin hoja
firmada**, con el tiempo que llevan dentro. Es la pregunta con la que un asesor
abre esta pantalla, y cuando no queda ninguno lo dice en una línea.

## La hoja

### La vuelta al vehículo

Un dibujo del coche visto desde arriba. Se elige qué se va a marcar —como quien
cambia de bolígrafo— y se toca sobre el dibujo:

| Marca | Qué es         |
| ----- | -------------- |
| `/`   | Rayón          |
| `○`   | Abolladura     |
| `✕`   | Rotura         |
| `▨`   | Óxido          |
| `—`   | Falta la pieza |

Cada daño puede llevar una nota («rayón profundo, 20 cm») y se quita tocándolo
otra vez. Debajo queda la lista numerada de todo lo anotado.

::: info No hace falta apuntar con el ratón
Bajo el dibujo hay un botón por zona —capó, techo, maletero, laterales, frontal
y trasera— que pone la marca en el centro de esa zona. Y cada marca puesta es
un botón que se recorre con el tabulador y se borra con `Supr`. Una tablet con
guantes y un teclado tienen que poder hacer lo mismo.
:::

### Lo que se mide

- **Kilometraje de entrada.** Es el único momento en que alguien mira el
  odómetro de verdad, así que lo que se anote aquí pasa a la ficha del
  vehículo. Nunca retrocede.
- **Combustible**, en **octavos**. Se anota como lo marca la aguja, no en
  porcentaje, porque es lo que el cliente puede comprobar al volver.

### La revisión

Doce puntos, agrupados en el orden en que se recorre el coche: primero lo que
se ve desde fuera, después lo que hay que abrir, y al final lo de debajo del
capó.

Cada punto tiene **tres estados explícitos** —conforme, con observación, no
aplica— y ninguno viene marcado por defecto: _sin revisar_ no es lo mismo que
_conforme_, y una hoja que los confunde no vale nada.

### Lo que se queda dentro

Gata, llanta de repuesto, triángulos, extintor, botiquín, herramientas,
documentos, cargadores. Marcarlo evita la mitad de los líos de la entrega.

### La conformidad

La firma del cliente, trazada con el dedo sobre la tablet. **Sin firma no se
puede cerrar la recepción**: una hoja sin firmar no protege a nadie.

## Qué pasa al cerrar

- La orden guarda su hoja completa, con quién la hizo y cuándo.
- El vehículo actualiza su kilometraje.
- El vehículo desaparece de la lista de pendientes por recibir.

A partir de ahí el trabajo sigue su camino normal por
**[Órdenes](/modulos/ordenes)**, con la diferencia de que ahora hay un
documento detrás.
