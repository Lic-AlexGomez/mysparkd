# Solución: Error "Missing required parameter: client_id"

## Pasos para solucionar:

### 1. Verificar que el archivo `.env.local` tenga el Client ID

Asegúrate de que `.env.local` contenga:
```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID=59554861054-6oeqn0io93up9aper1uoqpa4hpdo9b1h.apps.googleusercontent.com
```

### 2. **IMPORTANTE: Reiniciar el servidor de desarrollo**

Next.js solo lee las variables de entorno al iniciar. Debes:

1. Detener el servidor (Ctrl+C)
2. Reiniciar con: `npm run dev`

### 3. Verificar en el navegador

Abre la consola del navegador y ejecuta:
```javascript
console.log(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID)
```

Debería mostrar tu Client ID. Si muestra `undefined`, el servidor no se reinició correctamente.

### 4. Limpiar caché (si el problema persiste)

```bash
# Detener el servidor
# Luego ejecutar:
rm -rf .next
npm run dev
```

En Windows:
```bash
rmdir /s .next
npm run dev
```

## Verificación rápida

Si todo está bien configurado, deberías ver:
- ✅ El botón "Continuar con Google" habilitado
- ✅ Al hacer clic, se abre el popup de Google
- ✅ No hay errores en la consola del navegador

## Si aún no funciona

Verifica que el Client ID sea válido en [Google Cloud Console](https://console.cloud.google.com/):
1. Ve a "APIs & Services" > "Credentials"
2. Verifica que el Client ID coincida con el de `.env.local`
3. Asegúrate de que `http://localhost:3000` esté en "Authorized JavaScript origins"
