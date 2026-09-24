# Clientes y vehículos

Dos ficheros separados a propósito.

## Vehículos

La unidad que atiende el taller. La ficha lleva:

- **Placa** —<span class="placa">ABC-123</span>—, validada con el formato
  peruano. Es la clave de búsqueda de todo el sistema.
- **Propietario**, elegido del fichero de clientes.
- Marca, modelo, año y color.
- **VIN** (17 caracteres) y motor: es lo que identifica el repuesto exacto.
- Combustible y transmisión.
- **Kilometraje**, con la fecha en que se registró.

### El odómetro no retrocede

El kilometraje solo se corrige hacia arriba. Es una regla del sistema, no un
consejo: un valor menor que el último conocido se rechaza. De ese dato cuelga
el plan de mantenimiento, y un plan calculado sobre un kilometraje falso
recomienda mal.

### El historial cuelga de la placa

Todo lo que se le ha hecho a un coche sigue ahí aunque cambie de dueño. Por eso
el vehículo no es un campo dentro del cliente, sino un fichero propio.

## Clientes

Quién paga y quién aprueba el presupuesto.

- Tipo de documento y número, validados (DNI de 8, RUC de 11).
- **Teléfono obligatorio**: sin él no se puede pedir la aprobación del
  presupuesto, que es el paso que desbloquea la reparación.
- **Es empresa con flota**: cambia el trato comercial y obliga a facturar con
  RUC.
- **Notas del asesor**: forma de pago pactada, quién autoriza, preferencias. El
  sitio donde vive lo que hoy está en la cabeza de una persona.

## Buscar

Ambos listados se buscan por cualquier campo visible y se exportan con las
columnas que se están viendo. Desde el buscador global, escribir una placa
lleva directamente a su vehículo.
