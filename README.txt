Todo debe estar bien dividido, sin redundancia y sin dañar su funcionalidad actual.

En la página principal, al aplastar en descargar la app, debe descargarse el PWA.
En la parte de comunidades se desborda los botones del "+" además de tener botones muy grandes para versión movil y al entrar en las comunidades y ver las publicaciones al aplastar el boton "guardar" no tiene funcionalidad, haz que al aplastar guardar se pueda observar en el perfil.
En el Feed, el boton de reportar está grande, hazle del mismo tamaño de "Comentarios".
Igual, el texto de "Escribe un comentario" y el boton de "Comentar" a lado se ven demasiado grandes igual.
La forma del chat mejoralo, se ve muy pequeña y en vez del boton "Enviar" que tenga un ícono.

La forma en cómo se ve actualizar-info mejoralo, su diseño no me gusta mucho y los botones de "Cancelar" y "guardar cambios" están muy grandes.
En la solicitud de eliminación de cuentas debe tener un cuadrito como casillero a su derecha donde pueden seleccionarlo para habilitarlo y luego poder escribir la razón de la eliminacion además el texto no se ve en modo claro. Y este texto "Solicitud enviada al equipo administrador para revisión." no se aprecia muy bien en modo claro ni oscuro.

Corrige todo lo que se desborde o tenga un tamaño de letras o forma más grande lo habitual en versión móvil.

El cuadro de intereses la de "Recomendado según tus intereses" hazlo más compacto que no ocupe espacio innecesario y que no sea unicamente con conexión de palabras sino tambien como una IA integrada que relaciona las publicaciones o comentarios de las personas y pueda aparecer la sugerencia y el motivo de ella.


Al suspender una cuenta o convertirla en admin me salio esto. Si es por la validación de correo, entonces debe permitirme suspender la cuenta y además tener una confirmación antes de eliminar o suspender. De iigual forma debe notificarse la razón de por qué no se pudo realizar esas acciones. como por ejemplo "Cambio rechazado por falta del correo institucional" o algo por el estilo:
Error al cambiar la suspension del usuario: Error: Usuario validation failed: correoInstitucional: Path `correoInstitucional` is invalid (yexoge5437@bitmah.com).
    at ValidationError.inspect (C:\Users\HP\Desktop\app\backend\node_modules\mongoose\lib\error\validation.js:52:26)
    at formatValue (node:internal/util/inspect:877:19)
    at inspect (node:internal/util/inspect:404:10)
    at formatWithOptionsInternal (node:internal/util/inspect:2402:40)
    at formatWithOptions (node:internal/util/inspect:2264:10)
    at console.value (node:internal/console/constructor:345:14)
    at console.error (node:internal/console/constructor:412:61)
    at cambiarSuspensionUsuario (file:///C:/Users/HP/Desktop/app/backend/src/controllers/admin_audit_controller.js:113:13)
    at process.processTicksAndRejections (node:internal/process/task_queues:105:5) {
  errors: {
    correoInstitucional: ValidatorError: Path `correoInstitucional` is invalid (yexoge5437@bitmah.com).
        at validate (C:\Users\HP\Desktop\app\backend\node_modules\mongoose\lib\schemaType.js:1417:13)
        at SchemaType.doValidate (C:\Users\HP\Desktop\app\backend\node_modules\mongoose\lib\schemaType.js:1401:7)
        at C:\Users\HP\Desktop\app\backend\node_modules\mongoose\lib\document.js:3115:18
        at process.processTicksAndRejections (node:internal/process/task_queues:85:11) {
      properties: [Object],
      kind: 'regexp',
      path: 'correoInstitucional',
      value: 'yexoge5437@bitmah.com',
      reason: undefined,
      [Symbol(mongoose#validatorError)]: true
    }
  },
  _message: 'Usuario validation failed'
}
Error al actualizar usuario: Error: Usuario validation failed: correoInstitucional: Path `correoInstitucional` is invalid (yexoge5437@bitmah.com).
    at ValidationError.inspect (C:\Users\HP\Desktop\app\backend\node_modules\mongoose\lib\error\validation.js:52:26)
    at formatValue (node:internal/util/inspect:877:19)
    at inspect (node:internal/util/inspect:404:10)
    at formatWithOptionsInternal (node:internal/util/inspect:2402:40)
    at formatWithOptions (node:internal/util/inspect:2264:10)
    at console.value (node:internal/console/constructor:345:14)
    at console.error (node:internal/console/constructor:412:61)
    at actualizarUsuario (file:///C:/Users/HP/Desktop/app/backend/src/controllers/usuario_controller.js:232:17)
    at process.processTicksAndRejections (node:internal/process/task_queues:105:5) {
  errors: {
    correoInstitucional: ValidatorError: Path `correoInstitucional` is invalid (yexoge5437@bitmah.com).
        at validate (C:\Users\HP\Desktop\app\backend\node_modules\mongoose\lib\schemaType.js:1417:13)
        at SchemaType.doValidate (C:\Users\HP\Desktop\app\backend\node_modules\mongoose\lib\schemaType.js:1401:7)
        at C:\Users\HP\Desktop\app\backend\node_modules\mongoose\lib\document.js:3115:18
        at process.processTicksAndRejections (node:internal/process/task_queues:85:11) {
      properties: [Object],
      kind: 'regexp',
      path: 'correoInstitucional',
      value: 'yexoge5437@bitmah.com',
      reason: undefined,
      [Symbol(mongoose#validatorError)]: true
    }
  },
  _message: 'Usuario validation failed'
}


El administrador no debe tener la opción de suspender su cuenta, eso es exclusivo del rol de estudiante e igual la busqueda en donde dice "Buscar personas, grupos o eventos" no debería tener la vista de administrador, solo el rol de estudiante debe contar con eso 
y por ultimo, en version computadora la parte de "👤 Gestión de Usuarios"se desborda el filo de la izquierda, no permite verlo completo 

Debe notiicar si existe algun inconveniente en las acciones de los usuarios tanto administrador como estudiante para que sepan el error. Por ejemplo, si el correo no es el correo institucional con el "@epn.edu.ec" no se les permite el registro de usuario y debe tener una notificación de "Correo invalido, debe usar un correo institucional" y así, en todos los errores debe especificar qué pasó, ya sea error en las credenciales o algo 
Y por ultimo, al registrarse debe poder ver su contraseña con el ojo como en actualizar contraseña.
