# Un presupuesto que se aprueba

El paso más delicado del taller: el momento en que alguien tiene que decir que
sí.

## 1. El técnico diagnostica

Anota **lo que encontró**, con sus palabras, en el campo que le corresponde. La
orden avanza a <span class="estado estado-espera">presupuesto</span>.

## 2. Se monta el presupuesto

En la ficha de la orden se añaden líneas:

| Tipo             | De dónde sale el precio                           |
| ---------------- | ------------------------------------------------- |
| **Mano de obra** | Del catálogo: `tiempo baremo × precio de la hora` |
| **Repuesto**     | Del almacén, con su precio de venta               |

Al añadir un repuesto el sistema comprueba el stock. Si no alcanza, lo dice con
el número exacto que queda.

El pie muestra las **horas comprometidas** y el **total aprobado**, que al
principio es cero: las líneas nacen sin aprobar.

## 3. Se llama al cliente

Y mientras responde, la orden se **detiene** con motivo _espera aprobación_.

::: info Por qué detener y no dejarla en presupuesto a secas
Porque el tiempo que el cliente tarda en contestar no es tiempo de taller. Si
no se marca, el rendimiento sale falso y la orden desaparece del radar: nadie
vuelve a mirarla hasta que el cliente llama enfadado.

Detenida, aparece en [Detenidas](/modulos/detenidas) con el tiempo parado y la
salida escrita: _llamar al cliente y registrar su respuesta_.
:::

## 4. El cliente responde

### Dice que sí a todo

Se pulsa **El cliente aprueba**. Pasan dos cosas a la vez:

1. Queda registrado **quién y cuándo** aprobó.
2. La detención por _espera aprobación_ se **levanta sola**, porque aprobar es
   exactamente lo que se estaba esperando.

### Dice que sí a una parte

Cada línea se aprueba o se rechaza por separado. El total refleja solo lo
aprobado. El cliente que dice _«los frenos sí, la suspensión no»_ es la norma,
no la excepción, y no debería obligar a rehacer el presupuesto.

### Dice que no

La orden se anula con su motivo. El vehículo sale sin tocar.

## 5. Empieza la reparación

Solo ahora. El paso de presupuesto a reparación **está cerrado** mientras no
haya aprobación: no es un aviso que se pueda ignorar.

Es la regla más incómoda del sistema y la que más discusiones evita.
