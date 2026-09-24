# Recepción · la hoja de ingreso

La vuelta al vehículo, antes de tocarlo. Es el papel que todo taller rellena y
casi ninguno digitaliza, y el que separa **«entró así»** de **«se lo rayaron
aquí»**.

::: warning Por qué existe esta pantalla
Una discusión sobre un rayón que nadie anotó se pierde siempre: el cliente
recuerda que no estaba y el taller recuerda que sí. La hoja firmada al ingreso
es la única prueba, y por eso el sistema no deja cerrar la recepción sin ella.
:::

## El mostrador

La recepción no empieza en el taller: empieza en la puerta, y lo primero que se
sabe de un coche es **su placa**. Por eso la pantalla no da por sabido nada del
vehículo —ni marca, ni modelo, ni cliente—: pregunta la placa y contesta lo que
el taller sabe de ella.

### Entra un vehículo

Se teclea la placa —sin guion y en minúsculas vale, el sistema la ordena— y se
busca:

- **La conoce.** Enseña marca, modelo, año, color, propietario y el último
  odómetro. Sólo falta con qué viene.
- **No la conoce.** No es un error: es un cliente nuevo. Se apuntan ahí mismo
  marca, modelo, año y color, y el cliente con su documento y su teléfono. Lo
  justo para abrir la orden; la ficha completa se afina después.

En ambos casos se anota **con qué viene** —con las palabras del cliente—, el
odómetro y la prioridad, y al abrir la orden se entra directamente en la hoja.

::: info Por qué el alta va aquí
Pedirle a un cliente que vuelva mañana porque su coche no está dado de alta no
pasa en ningún taller. El momento en que el taller se entera de que existe ese
vehículo **es** la recepción, así que es aquí donde se crea.
:::

### Citados para hoy

Los que dijeron que vendrían, por hora, con el retraso marcado cuando pasan más
de quince minutos de la hora prometida. El botón **Recibir** abre la orden con
el motivo de la cita y deja la cita como «llegó», que es lo que hace que
desaparezca de la lista.

Quien ya está dentro no aparece aquí aunque tuviera cita: una cita cumplida
deja de ser una espera.

### Dentro sin hoja firmada

Los vehículos que están en el taller y todavía no tienen su hoja. No es una
lista: es una deuda. Mientras no esté firmada, «entró así» no se puede
demostrar.

## La hoja

### La vuelta al vehículo

El vehículo por sus tres vistas —**costado izquierdo, vista superior y costado
derecho**—, una a la vez y grande, con un contador por vista para que no se
olvide lo marcado en las otras. Se elige qué se va a marcar —como quien cambia
de bolígrafo— y se toca sobre la pieza:

| Marca | Qué es         |
| ----- | -------------- |
| `/`   | Rayón          |
| `○`   | Abolladura     |
| `✕`   | Rotura         |
| `▨`   | Óxido          |
| `—`   | Falta la pieza |

::: tip Cada marca pertenece a una pieza, no a un píxel
Este es el salto respecto de pinchar sobre un dibujo. La marca guarda **la
pieza con su nombre de taller** además del punto exacto, así que un rayón deja
de ser «algo por aquí» y pasa a ser «rayón en la puerta delantera izquierda».
Es como se lo dices al cliente, como se presupuesta y —lo que más cuenta a
final de mes— como se puede contar: cuántos vehículos entran con el paragolpes
delantero tocado.
:::

La nota va **detrás** de la marca, no delante: primero se señala el golpe y
luego se describe, que es el orden en que se mira un coche. Debajo queda la
lista numerada, cada una con su campo de detalle y su botón de quitar.

::: info No hace falta apuntar con el ratón
Las zonas son áreas transparentes bajo el trazo, y son botones: el dibujo
entero se recorre con el tabulador y `Enter` pone la marca en el centro de la
pieza. Cada marca puesta se borra con `Supr`. Una tablet con guantes y un
teclado tienen que poder hacer lo mismo.
:::

::: warning Por qué el dibujo es nuestro
No hay librería mantenida que resuelva esto. Lo que hay son plantillas de pago
de la era jQuery, pruebas de concepto abandonadas y SDK comerciales que atacan
otro problema —detectar daños por IA a partir de fotos—. Dibujarlo aquí permite
dos cosas que una plantilla no daría: que cada zona tenga nombre de taller, y
que el trazo se lea igual en claro que en oscuro, que es donde acaba una tablet
en una bahía. El costado se define una sola vez y se pinta dos, espejado, para
que los dos lados no puedan desalinearse nunca.
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
- El vehículo desaparece de «dentro sin hoja firmada».

A partir de ahí el trabajo sigue su camino normal por
**[Órdenes](/modulos/ordenes)**, con la diferencia de que ahora hay un
documento detrás.
