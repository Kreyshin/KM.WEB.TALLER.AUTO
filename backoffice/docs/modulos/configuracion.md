# Configuración

Los maestros de la operación. Los toca el administrador y casi nunca.

## Sedes

Los talleres de la cadena. Cada uno tiene sus bahías, su almacén y su serie de
comprobantes, y el **código de establecimiento** de cuatro dígitos que declara
SUNAT.

El selector de la cabecera decide qué sede se está mirando: todo lo que hay
debajo —tablero, órdenes, citas, carga— pertenece a ella.

## Bahías

Los puestos de trabajo de la sede activa. Cada una con:

- **Código** visible en el piso (`B-01`) y nombre.
- **Tipo**: elevador, piso, alineación, diagnóstico o cabina de pintura.
  Importa porque no todo trabajo cabe en cualquier sitio.
- **Posición en el plano**, que ordena el tablero de izquierda a derecha para
  que la pantalla se parezca al taller.
- **Operativa** y **activa**, que son cosas distintas:

|                      | Sigue en el plano | Admite trabajo | Cuenta como capacidad |
| -------------------- | ----------------- | -------------- | --------------------- |
| **Operativa**        | Sí                | Sí             | Sí                    |
| **En mantenimiento** | Sí                | No             | No                    |
| **Inactiva**         | No                | No             | No                    |

Si una bahía se marca como no operativa, el sistema **exige el motivo**. Sale
escrito en el tablero, para que nadie tenga que preguntar.

## Usuarios y roles

Quién entra y qué parte del taller gestiona. Los permisos finos viven en el
ERP; aquí va el rol: administrador, asesor de servicio, técnico o almacén.

A los técnicos se les asignan **especialidades**, y el sistema no deja guardar
un técnico sin ninguna: un técnico sin especialidad no puede recibir trabajo
con criterio.

Tampoco deja desactivar al último administrador activo.

## Motivos

Los catálogos de motivos que el taller usa al anular, detener, descontar o
cubrir por garantía. Algunos exigen nota obligatoria.

Tenerlos como catálogo, y no como texto libre, es lo que permite después
contar: cuántas órdenes se anularon porque el cliente no aprobó, cuántas se
pararon por falta de stock.
