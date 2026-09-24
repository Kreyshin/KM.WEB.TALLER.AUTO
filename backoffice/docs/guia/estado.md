# Qué está listo

El sistema se construye **front primero**: las pantallas funcionan completas
sobre datos de ejemplo antes de que exista el backend. Eso permite probar el
flujo de trabajo real —y discutirlo— antes de escribir una sola tabla.

## Completo y navegable

| Módulo                       | Qué puedes hacer                                                  |
| ---------------------------- | ----------------------------------------------------------------- |
| **Inicio · El taller hoy**   | El parte completo: detenidas, entregas, citas, carga y reposición |
| **Tablero de bahías**        | Ver el taller en vivo y hacer avanzar órdenes desde la celda      |
| **Órdenes de trabajo**       | Abrir, buscar, filtrar por fase, ver la ficha completa            |
| **Ficha de orden**           | Presupuestar, aprobar línea a línea, asignar, detener y reanudar  |
| **Detenidas**                | Agrupadas por motivo, ordenadas por tiempo parado                 |
| **Carga de técnicos**        | Horas comprometidas frente a la jornada                           |
| **Clientes y vehículos**     | Alta, edición, búsqueda por placa                                 |
| **Citas**                    | Agenda del día y de la semana, con cambio de estado               |
| **Catálogo y baremos**       | Servicios con tiempo estándar y planes de mantenimiento           |
| **Almacén**                  | Repuestos, mínimos y kardex de movimientos                        |
| **Bahías, sedes y usuarios** | Los maestros de la operación                                      |

## Con ruta y permisos, pendiente de pantalla

| Módulo                                 | Estado |
| -------------------------------------- | ------ |
| Producción del taller (reportes)       | 🚧     |
| Facturación SUNAT                      | 🚧     |
| Bitácora                               | 🚧     |
| Motivos y configuración de la vertical | 🚧     |

Estos módulos ya tienen su sitio en el menú y su regla de acceso por rol; lo
que falta es la pantalla.

## Sobre la demo

La demo pública guarda los datos **en tu navegador**. Puedes romper lo que
quieras: desde _Perfil → Datos de ejemplo_ se reinicia todo a la semilla
original. Ahí mismo se puede subir la latencia simulada o forzar errores, para
ver cómo se comporta el sistema cuando la red va mal.

El acceso viene precargado y acepta cualquier contraseña.
