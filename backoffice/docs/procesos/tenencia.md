# Quién trae el vehículo

El taller responde de un bien que no es suyo. Esta es la comprobación que lo
cubre.

## Por qué existe

Un coche entra al taller a nombre de alguien. Lo normal es que ese alguien sea
el titular, pero no siempre: lo trae el hijo, el chofer de la flota, alguien
que lo compró y aún no lo transfirió. Y a veces —pocas, pero son las que
duelen— lo trae quien no debería traerlo.

Si nadie preguntó, el día que aparece el titular reclamando no hay nada que
enseñar. **La diferencia entre haber hecho el control y no haberlo hecho solo
existe si está escrita.**

::: warning El dato mínimo no es negociable
**DNI del cliente y placa del vehículo.** Sin esos dos, el taller no está
cubierto, por pequeño que sea. Mañana podrán contrastarse contra RENIEC y
SUNARP; hoy, al menos, tienen que estar.
:::

## Dos piezas con memorias distintas

Esta es la decisión de diseño que gobierna todo lo demás:

|                  | Qué es                                                | ¿Recuerda?                 |
| ---------------- | ----------------------------------------------------- | -------------------------- |
| **Vínculo**      | La relación declarada entre una persona y un vehículo | **Sí**: se declara una vez |
| **Verificación** | La comprobación de este ingreso concreto              | **No**: se rehace cada vez |

El vínculo ahorra trabajo: al cliente de siempre se le reconoce y confirmarlo
cuesta un clic. La verificación es la que cubre: no basta con que el dato
estuviera en el sistema, hace falta que **alguien lo mirara hoy**, y que conste
quién y cuándo.

Una autorización de hace un año no dice nada de hoy. Por eso el vínculo se
reconoce pero no se da por bueno, y por eso puede llevar fecha de caducidad.

## Las relaciones y lo que hay que preguntar

Las preguntas no son un aviso: **son el control**, y por eso salen en pantalla
en vez de confiarse a la memoria del asesor. Un control que hay que recordar es
un control que un martes con prisa no se hace.

| Relación                     | Qué se pregunta                                                                               |
| ---------------------------- | --------------------------------------------------------------------------------------------- |
| **Titular**                  | Nada: el coche está a su nombre                                                               |
| **Familiar del titular**     | Nombre completo del titular y un contacto suyo, por si hay que aprobar el presupuesto         |
| **Conductor de la empresa**  | La carta o credencial, y **quién autoriza el gasto**: el conductor no suele poder             |
| **Autorizado con documento** | El documento que lo autoriza, anotado, y que siga vigente                                     |
| **Otro**                     | Cómo llegó el vehículo a sus manos. Si la explicación no cuadra, **no se recibe el vehículo** |

## Cómo se configura

En [Configuración del taller](/modulos/configuracion-taller), grupo
**Recepción**. Es alcance de cadena: una sede no puede relajarlo por su cuenta.

| Parámetro                                     | Opciones                                                                  |
| --------------------------------------------- | ------------------------------------------------------------------------- |
| **Comprobar quién trae el vehículo**          | En cada ingreso _(por defecto)_ · Solo si no es el titular · No comprobar |
| **Exigir documento de respaldo a un tercero** | Sin documento anotado, la orden no se abre                                |

El valor por defecto es **en cada ingreso**, también al titular. Cuesta un clic
y es lo que convierte el control en costumbre.

## Dónde se hace

En [Recepción](/modulos/recepcion), al recibir el vehículo — venga citado o se
presente sin avisar. Venir citado no dice con qué derecho se deja el coche, así
que el citado también pasa por la comprobación.

La regla vive en el servicio, no en el formulario: **ninguna pantalla puede
abrir una orden saltándosela.**

## Qué queda guardado

En la orden, para siempre: la relación comprobada, el documento que se vio, la
nota del asesor, **quién lo comprobó y cuándo**.

## La otra puerta: la salida

El mismo control, en la entrega. Una fecha sola no dice en manos de quién
salió el coche, y quien recoge no siempre es quien lo dejó —lo trajo el hijo y
lo recoge la madre, o al revés—.

Al entregar se anota **nombre y documento de quien se lo lleva**, su relación
con el vehículo y, si no es el titular, qué documento lo respalda. Queda
guardado junto a quién del taller hizo la entrega.

Por eso entregar dejó de ser «la fase siguiente»: desde
<span class="estado estado-avanza">lista</span>, el atajo de la tarjeta abre
la ficha, porque saber a quién se entrega no cabe en un clic.

| Parámetro                        | Opciones                                                                     |
| -------------------------------- | ---------------------------------------------------------------------------- |
| **Comprobar a quién se entrega** | En cada entrega _(por defecto)_ · Solo si recoge otra persona · No comprobar |

## Y la firma, con firmante

La hoja de ingreso guardaba el trazo, pero no de quién era. Un garabato
anónimo no protege más que la ausencia de garabato: lo que se firma es el
estado en que entró el coche, y eso solo vale si consta quién lo aceptó.

Ahora la hoja pide **nombre y documento de quien firma**, antes del trazo. Se
propone el cliente de la orden, pero se corrige: firma quien deja el vehículo,
que no tiene por qué ser el titular.
