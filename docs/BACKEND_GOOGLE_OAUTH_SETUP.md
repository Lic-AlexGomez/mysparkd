# Configurar Google OAuth en el Backend (Render)

## El problema

El backend está devolviendo error 500 en `/auth/google` porque falta la variable de entorno `GOOGLE_AUTH_CLIENT`.

## Solución

### 1. Agregar variable de entorno en Render

1. Ve a tu dashboard de Render
2. Selecciona tu servicio backend
3. Ve a **Environment** en el menú lateral
4. Click en **Add Environment Variable**
5. Agrega:
   ```
   Key: GOOGLE_AUTH_CLIENT
   Value: 59554861054-6oeqn0io93up9aper1uoqpa4hpdo9b1h.apps.googleusercontent.com
   ```
6. Click en **Save Changes**

### 2. El servicio se reiniciará automáticamente

Render reiniciará el servicio automáticamente con la nueva variable.

### 3. Verificar

Después del reinicio, prueba hacer login con Google nuevamente. Debería funcionar.

## Nota importante

El backend espera el Client ID en formato de lista (puede aceptar múltiples Client IDs). La configuración en `application.properties` es:

```properties
google.oauth.clientIds=${GOOGLE_AUTH_CLIENT}
```

Si necesitas agregar múltiples Client IDs (por ejemplo, uno para web y otro para móvil), usa comas:

```
GOOGLE_AUTH_CLIENT=client-id-1,client-id-2
```

## Verificación rápida

Una vez configurado, el flujo debería ser:
1. Usuario hace clic en "Continuar con Google"
2. Se abre popup de Google
3. Usuario selecciona cuenta
4. Frontend envía token a `/auth/google`
5. Backend verifica el token con Google
6. Backend crea/autentica usuario
7. Backend devuelve JWT
8. Frontend redirige a `/onboarding`

Si sigue fallando, revisa los logs del backend en Render para ver el error específico.
