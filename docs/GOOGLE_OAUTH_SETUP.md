# Configuración de Google Sign In

## Pasos para configurar Google OAuth

### 1. Crear proyecto en Google Cloud Console

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Habilita la API de Google+ (Google+ API)

### 2. Configurar OAuth Consent Screen

1. Ve a "APIs & Services" > "OAuth consent screen"
2. Selecciona "External" como tipo de usuario
3. Completa la información requerida:
   - Nombre de la aplicación: Sparkd
   - Email de soporte
   - Logo (opcional)
   - Dominios autorizados
4. Agrega los scopes necesarios:
   - `email`
   - `profile`
   - `openid`

### 3. Crear credenciales OAuth 2.0

1. Ve a "APIs & Services" > "Credentials"
2. Click en "Create Credentials" > "OAuth client ID"
3. Selecciona "Web application"
4. Configura:
   - **Nombre**: Sparkd Web Client
   - **Authorized JavaScript origins**:
     - `http://localhost:3000` (desarrollo)
     - `https://tu-dominio.com` (producción)
   - **Authorized redirect URIs**:
     - `http://localhost:3000` (desarrollo)
     - `https://tu-dominio.com` (producción)
5. Copia el **Client ID** generado

### 4. Configurar variables de entorno

Agrega el Client ID al archivo `.env.local`:

```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID=tu-client-id-aqui.apps.googleusercontent.com
```

### 5. Backend - Verificar configuración

El backend ya está configurado para manejar Google Sign In:

- Endpoint: `POST /auth/google`
- Body: `{ "idToken": "token-de-google" }`
- Response: `{ "token": "jwt-token" }`

El servicio `GoogleIdTokenVerifierService` verifica el token de Google y:
- Si el usuario existe, inicia sesión
- Si el usuario no existe, lo crea automáticamente con:
  - Email de Google
  - Username basado en el email
  - Foto de perfil de Google (subida a Cloudinary)

### 6. Probar la integración

1. Inicia el servidor de desarrollo: `npm run dev`
2. Ve a `/login` o `/register`
3. Click en "Continuar con Google"
4. Selecciona tu cuenta de Google
5. Autoriza la aplicación
6. Serás redirigido automáticamente

## Notas importantes

- El `NEXT_PUBLIC_GOOGLE_CLIENT_ID` debe ser público (prefijo `NEXT_PUBLIC_`)
- En producción, asegúrate de agregar tu dominio a los orígenes autorizados
- El token de Google expira después de 1 hora
- El backend maneja automáticamente la creación de usuarios nuevos

## Troubleshooting

### Error: "Invalid client ID"
- Verifica que el Client ID en `.env.local` sea correcto
- Asegúrate de que el dominio esté autorizado en Google Cloud Console

### Error: "Popup blocked"
- Permite popups en tu navegador para el dominio

### Error: "Token verification failed"
- Verifica que el backend tenga configurado el mismo Client ID
- Revisa los logs del backend para más detalles
