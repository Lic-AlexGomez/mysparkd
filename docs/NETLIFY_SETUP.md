# Configuración de Netlify

## Variables de Entorno en Netlify

Para que Google Sign In funcione en producción, debes agregar las variables de entorno en Netlify:

### Pasos:

1. Ve a tu sitio en Netlify Dashboard
2. Click en **Site settings**
3. Click en **Environment variables** (en el menú lateral)
4. Click en **Add a variable**
5. Agrega las siguientes variables:

```
NEXT_PUBLIC_GOOGLE_CLIENT_ID=59554861054-6oeqn0io93up9aper1uoqpa4hpdo9b1h.apps.googleusercontent.com
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=dvk3yygql
NEXT_PUBLIC_CLOUDINARY_API_KEY=754849179818551
CLOUDINARY_API_SECRET=hkyTSfcdQFZymYKigHj0xlcL4NI
```

### Hacer un nuevo deploy (obligatorio tras fixes de chat):

El código en GitHub **no actualiza** www.mysparkd.com hasta que Netlify termine un build nuevo. Si el chat funciona en `localhost` pero falla en producción, casi siempre es un **bundle viejo en CDN**.

Opción 1 - Desde Git:
```bash
git add .
git commit -m "fix: chat pagination unwrap + redeploy"
git push origin main
```

Opción 2 - Trigger manual (recomendado si ya hiciste push):
1. Ve a **Deploys** en Netlify
2. Click en **Trigger deploy** → **Clear cache and deploy site**
3. Espera estado **Published** (build verde)

### Comprobar que producción tiene el build nuevo

1. Abre **https://www.mysparkd.com/api/build-info**  
   - Debe devolver `"buildId": "<hash del commit de main>"` (no `"unknown"`).
2. En la consola (F12) en un chat:
   ```js
   document.documentElement.dataset.sparkdBuild
   ```
3. En **View Source** de la página del chat, el JS **no** debe ser el chunk viejo `94ace1fb71ed0a03.js`. Tras el fix verás otro hash (p. ej. `772f5b…`).
4. Si `build-info` sigue en un commit antiguo: en Netlify → **Site configuration** → **Build & deploy** → confirma que **Production branch** es `main` y el repo es `Lic-AlexGomez/mysparkd`.

Build local vs producción (chunks distintos = deploy pendiente):
- Local reciente incluye textos como `No se pudo cargar el chat` en el bundle del layout de chat.
- Producción antigua **no** los incluye (chunk `94ace1fb…` vs `7f5998f6…` en build nuevo).

### Verificar en Google Cloud Console

Asegúrate de agregar tu dominio de Netlify a los orígenes autorizados:

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Ve a "APIs & Services" > "Credentials"
3. Click en tu OAuth 2.0 Client ID
4. En **Authorized JavaScript origins**, agrega:
   - `https://tu-sitio.netlify.app`
   - `https://mysparkd.com` (si tienes dominio custom)
5. En **Authorized redirect URIs**, agrega:
   - `https://tu-sitio.netlify.app`
   - `https://mysparkd.com`
6. Click en **Save**

### Limpiar caché del navegador

Después del deploy, limpia el caché:
- Chrome: Ctrl+Shift+Delete > Clear cache
- O abre en modo incógnito para probar

## Verificación

Después del deploy, verifica:
- ✅ No hay errores de Vercel Analytics
- ✅ El botón de Google aparece
- ✅ Al hacer clic, se abre el popup de Google
- ✅ Después de autenticar, redirige correctamente
