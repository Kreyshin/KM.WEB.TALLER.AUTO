# Glosario

Las palabras que usa el sistema, con el significado exacto que tienen dentro de
él. Cuando una palabra del taller y una del sistema no coinciden, aquí se dice.

## Del trabajo

**Orden de trabajo (OT)**
: El documento que abre un vehículo al entrar y se cierra al entregarlo. Todo
lo que pasa en el taller cuelga de una orden: las horas, los repuestos, el
presupuesto y la factura.

**Fase**
: En qué punto del trabajo está la orden: recepción, diagnóstico, presupuesto,
reparación, control de calidad, lista para entrega, entregada. Es una
secuencia; el sistema conoce cuál es la siguiente.

**Detención**
: Por qué una orden no avanza. Es independiente de la fase: una orden puede
estar _en reparación_ y detenida esperando un repuesto. Cuando el motivo se
resuelve, el trabajo sigue justo donde estaba.

**Motivo de detención**
: Espera aprobación, espera repuesto, espera al cliente o espera a un tercero.
Cada uno tiene una salida distinta, y esa salida es lo que el sistema muestra.

**Prioridad**
: Normal, alta o urgente. No cambia la fase; cambia el orden en que se mira.

## Del taller

**Bahía**
: Un puesto de trabajo físico: un elevador, un sitio en el piso, la plataforma
de alineación, la cabina de pintura. El número de bahías es la capacidad real
del taller.

**Bahía operativa**
: La que hoy admite trabajo. Una bahía puede existir en el plano y no estar
operativa —el elevador en mantenimiento—: sigue ocupando sitio, no capacidad.

**Tiempo baremo**
: Lo que un trabajo _debería_ costar en horas, según el fabricante o la
experiencia del taller. Es la vara de todo: con él se cotiza sin adivinar, se
promete una hora de entrega y se mide el rendimiento.

**Horas comprometidas**
: La suma de los baremos de lo que hay dentro del taller. Es trabajo ya vendido
que todavía no salió por la puerta.

## Del cliente

**Cliente**
: Quien paga y quien aprueba el presupuesto. Puede ser un particular o una
empresa con flota.

**Vehículo**
: Lo que se repara. Se guarda aparte del cliente a propósito: el historial
cuelga de la placa, de modo que un coche que cambia de dueño no pierde su
pasado.

**Placa**
: El identificador con el que habla todo el taller. Es la clave de búsqueda del
sistema entero.

**Aprobación**
: El permiso del cliente para trabajar. Sin ella no se toca el vehículo, y el
sistema lo impide, no lo sugiere.

## Del almacén

**Repuesto**
: La pieza que se monta. Tiene costo, precio, stock y un mínimo.

**Stock mínimo**
: La cantidad por debajo de la cual el almacén avisa. Existe porque la causa
más común de una orden detenida es una pieza que se sabía que iba a faltar.

**Movimiento**
: Ingreso, salida, devolución o ajuste. Es el único sitio donde cambia el
stock: la ficha del repuesto no se edita para cuadrar el almacén.

## De la facturación

**Serie y correlativo**
: La numeración de los comprobantes electrónicos, por sede y por tipo. Lo exige
SUNAT y lo lleva el sistema.

**Establecimiento**
: El código de cuatro dígitos con el que SUNAT identifica cada sede.
