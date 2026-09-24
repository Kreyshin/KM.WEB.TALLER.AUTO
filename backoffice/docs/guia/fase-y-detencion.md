# Fase y detención

Esta página explica la única decisión de diseño que hay que entender para
entender Torque. Si algo del sistema parece raro, casi siempre se explica aquí.

## El error que se evita

La forma intuitiva de modelar un taller es una lista de estados:

> recepción → diagnóstico → **esperando aprobación** → reparación →
> **esperando repuesto** → control → entregada

Parece razonable y está mal. Tres problemas, los tres reales:

1. **No se sabe a dónde volver.** Cuando llega el repuesto, ¿a qué estado pasa
   la orden? ¿A reparación? ¿Estaba en reparación o apenas empezaba?
2. **Los tiempos mienten.** Si «esperando repuesto» es una fase, el tiempo
   parado cuenta como tiempo de taller. El rendimiento sale falso.
3. **No se puede contar.** ¿Cuántas órdenes hay en reparación? Depende de
   cuántas estén esperando algo, que también están en reparación.

## Lo que hace Torque

Dos campos independientes en cada orden.

### La fase: dónde va el trabajo

<span class="estado estado-neutro">Recepción</span> ·
<span class="estado estado-neutro">Diagnóstico</span> ·
<span class="estado estado-espera">Presupuesto</span> ·
<span class="estado estado-neutro">En reparación</span> ·
<span class="estado estado-espera">Control de calidad</span> ·
<span class="estado estado-avanza">Lista para entrega</span> ·
<span class="estado estado-neutro">Entregada</span>

Es una **secuencia**: cada fase tiene una siguiente natural y el sistema la
conoce. Por eso el botón nunca dice «siguiente», dice lo que va a pasar:
_Pasar a diagnóstico_, _Presupuestar_, _Empezar reparación_, _Marcar lista_,
_Entregar_.

### La detención: si avanza o no

| Motivo                                                          | Quién desbloquea | Qué hay que hacer                 |
| --------------------------------------------------------------- | ---------------- | --------------------------------- |
| <span class="estado estado-detenida">Espera aprobación</span>   | El cliente       | Llamarlo y registrar su respuesta |
| <span class="estado estado-detenida">Espera repuesto</span>     | Almacén          | Confirmar la llegada de la pieza  |
| <span class="estado estado-detenida">Espera al cliente</span>   | El cliente       | Tiene que traer algo o decidir    |
| <span class="estado estado-detenida">Espera a un tercero</span> | Un externo       | Seguimiento al taller o proveedor |

Una orden sin detención <span class="estado estado-avanza">avanza</span>. Punto.

::: info Lo importante no es el motivo, es la salida
El sistema no se limita a etiquetar el bloqueo: dice **qué hay que hacer para
desatascarlo**. Un motivo sin salida es una excusa con formato.
:::

## Las dos en la misma pantalla

En el tablero, en el listado de órdenes y en la ficha, fase y detención se
muestran **lado a lado**, nunca fundidas en una sola etiqueta:

> <span class="placa">D2M-771</span> Hyundai H1 ·
> <span class="estado estado-neutro">En reparación</span>
> <span class="estado estado-detenida">Espera repuesto</span> · sin avanzar
> hace 5 h

Se lee de un vistazo: el trabajo está en reparación, lleva cinco horas parado y
lo que falta es una pieza.

## Las reglas que salen de aquí

El sistema las sostiene; no son recordatorios, son impedimentos:

- **Una orden detenida no avanza de fase.** Primero se reanuda.
- **No se repara sin aprobación.** El paso de presupuesto a reparación está
  cerrado hasta que el cliente dice que sí.
- **Detener no retrocede.** La fase no cambia: cuando se reanuda, el trabajo
  sigue donde estaba. Ese es exactamente el motivo de separarlas.
- **Aprobar desatasca.** Si la orden esperaba precisamente esa aprobación, al
  aprobar se levanta la detención sola.

## Qué se gana

- El **tiempo parado** se mide aparte del tiempo de trabajo.
- La pantalla **[Detenidas](/modulos/detenidas)** existe y tiene sentido:
  agrupa por motivo y ordena por antigüedad.
- El parte de la mañana puede decir _«hay 2 órdenes paradas, eso es lo
  primero»_, que es la frase con la que de verdad se abre un taller.
