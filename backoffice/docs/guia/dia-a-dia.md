# El día del taller

Una jornada completa, en el orden en que ocurre.

## 07:45 · Antes de abrir

El asesor entra a **[Inicio · El taller hoy](/modulos/inicio)**. La pantalla
está ordenada por la pregunta que se hace a esta hora, en este orden:

1. **Lo que no avanza.** Las órdenes detenidas, la más antigua arriba. Si hay
   algo aquí, es lo primero del día: son llamadas que hacer, no trabajo que
   hacer.
2. **Se entrega hoy.** Los vehículos con hora comprometida, con los atrasados
   marcados. Es la promesa al cliente.
3. **Va a entrar hoy.** Las citas. Es la carga que viene.

Debajo, el **trabajo comprometido**: las horas de baremo que ya están vendidas
y la ocupación de bahías. Y, a la derecha, lo que **hay que reponer**.

## 08:00 · Llegan los primeros

Cada vehículo que entra abre una **orden de trabajo**: se elige la placa, se
anota con qué viene —con las palabras del cliente— y el kilometraje, que el
sistema propone a partir del último conocido.

La orden nace en <span class="estado estado-neutro">recepción</span>, sin
bahía y sin técnico.

→ [El proceso completo](/procesos/ingreso)

## 08:30 · Se reparte el trabajo

En **[Carga de técnicos](/modulos/tecnicos)** se ve cuántas horas de baremo
tiene comprometidas cada persona frente a la jornada de referencia. Con eso, y
con las especialidades de cada uno, el reparto deja de ser por turno y pasa a
ser por criterio.

Asignar bahía y técnico se hace desde la ficha de la orden. El sistema impide
dos cosas: meter una orden en una bahía ocupada y usar una bahía que no está
operativa.

## 10:00 · Diagnóstico y presupuesto

El técnico anota **lo que encontró** y el asesor monta el presupuesto: líneas
de mano de obra —cada una con su tiempo baremo, así que el precio se calcula
solo— y líneas de repuesto.

Al pasar a <span class="estado estado-espera">presupuesto</span> hay que
llamar al cliente. Mientras responde, la orden se **detiene** con motivo
_espera aprobación_: sigue en su fase, pero deja de contar como trabajo.

→ [El proceso completo](/procesos/presupuesto)

## 11:00 · El tablero

Durante toda la jornada, el **[tablero de bahías](/modulos/tablero)** es la
pantalla que está abierta en el taller. Una celda por puesto, con el vehículo
que tiene dentro, la fase, la detención si la hay y el tiempo que falta para la
entrega. Se refresca solo.

Desde ahí el técnico hace avanzar su orden sin abrir ninguna ficha.

## 14:00 · Algo se tuerce

Falta una pieza. La orden se detiene con motivo _espera repuesto_ y una nota
con qué falta. Aparece inmediatamente en
**[Detenidas](/modulos/detenidas)** y en el parte de mañana.

Lo importante: **no retrocede de fase**. Cuando la pieza llegue, el trabajo
sigue donde estaba.

→ [El proceso completo](/procesos/repuesto)

## 17:00 · Entregas

Las órdenes en <span class="estado estado-avanza">lista para entrega</span>
esperan al cliente. Al entregar se cierra la orden, se emite el comprobante y
el kilometraje del vehículo queda actualizado para la próxima vez.

→ [El proceso completo](/procesos/entrega)

## 19:00 · Cierre

Lo que queda dentro del taller sigue dentro: la jornada no reinicia nada. Al
día siguiente, el parte vuelve a empezar por lo que no avanza —que ahora lleva
un día más parado, y el sistema lo dice.
