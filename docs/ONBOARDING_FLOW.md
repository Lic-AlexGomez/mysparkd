# Flujo de Onboarding - Sparkd

## 🎯 Resumen

Se implementó un flujo completo de onboarding que guía a los nuevos usuarios a completar su perfil después del registro.

## 📋 Flujo Implementado

```
1. Usuario se registra (email + password + username)
   ↓
2. Login automático después del registro
   ↓
3. Redirección al onboarding (/onboarding)
   ↓
4. Paso 1: Información básica (nombres, apellidos, género, teléfono)
   ↓
5. Paso 2: Selección de intereses (opcional)
   ↓
6. Paso 3: Preferencias de búsqueda (género de interés, rango de edad)
   ↓
7. Redirección al feed principal
```

## 🔧 Cambios Realizados

### 1. **Registro (`app/(auth)/register/page.tsx`)**
- Después de crear la cuenta, hace login automático
- Redirige al onboarding en lugar del login
- Muestra mensaje "Cuenta creada!" en lugar de "Inicia sesión"

### 2. **Login (`app/(auth)/login/page.tsx`)**
- Verifica si el perfil está completo después del login
- Si `profileCompleted === false`, redirige al onboarding
- Si el perfil no existe, redirige al onboarding
- Si el perfil está completo, redirige al feed

### 3. **Layout de la App (`app/(app)/layout.tsx`)**
- Verifica el estado del perfil en cada carga
- Redirige automáticamente al onboarding si el perfil no está completo
- Permite acceso al onboarding sin el AppShell (sin navegación)
- Previene acceso a otras rutas hasta completar el onboarding

### 4. **Onboarding (`app/(app)/onboarding/page.tsx`)**
- **Paso 1**: Información básica
  - Nombres (obligatorio)
  - Apellidos (obligatorio)
  - Género (obligatorio)
  - Teléfono (opcional)
  - Crea el perfil con `POST /api/profile`

- **Paso 2**: Intereses (opcional)
  - Muestra todos los intereses disponibles agrupados por categoría
  - Permite seleccionar múltiples intereses
  - Guarda con `POST /api/interests/add/{interestId}`

- **Paso 3**: Preferencias
  - Género de interés (Hombres/Mujeres)
  - Rango de edad (18-60)
  - Mostrarme en búsquedas (switch)
  - Guarda con `POST /api/preferences/set/preferences`

## 🎨 Mejoras de UX

1. **Header visual** con logo de Sparkd y mensaje de bienvenida
2. **Barra de progreso** que muestra 3 pasos
3. **Descripciones** en cada tarjeta para guiar al usuario
4. **Campos marcados** con asterisco (*) para indicar obligatorios
5. **Botones de navegación** (Atrás/Siguiente) en cada paso
6. **Validaciones** antes de avanzar al siguiente paso
7. **Mensajes de error** claros con toast notifications
8. **Estados de carga** con spinners en los botones

## 📝 Campos del Perfil

### Obligatorios
- ✅ Nombres
- ✅ Apellidos
- ✅ Género (MALE/FEMALE)

### Opcionales
- ⚪ Teléfono

## 🔐 Protección de Rutas

El sistema ahora protege todas las rutas de la app:
- Si no está autenticado → redirige a `/login`
- Si está autenticado pero perfil incompleto → redirige a `/onboarding`
- Si está autenticado y perfil completo → acceso normal a la app

## 🚀 Próximos Pasos Sugeridos

1. **Agregar paso de fotos** en el onboarding
   - Subir foto de perfil principal
   - Subir fotos adicionales (hasta 6)
   - Usar Cloudinary para el upload

2. **Validación de edad**
   - Agregar campo de fecha de nacimiento
   - Validar edad mínima (18+)

3. **Verificación de email**
   - Enviar código de verificación al email
   - Validar antes de completar el registro

4. **Onboarding progresivo**
   - Permitir "Saltar" algunos pasos
   - Recordar completar perfil más tarde

## 📱 Endpoints Utilizados

```
POST /auth/register          - Crear cuenta
POST /auth/login             - Iniciar sesión
POST /api/profile            - Crear perfil
GET  /api/profile/me         - Obtener mi perfil
GET  /api/interests          - Obtener intereses
POST /api/interests/add/{id} - Agregar interés
POST /api/preferences/set/preferences - Guardar preferencias
```

## ✅ Testing

Para probar el flujo:
1. Ir a `/register`
2. Crear una cuenta nueva
3. Automáticamente se redirige al onboarding
4. Completar los 3 pasos
5. Verificar redirección al feed

Para probar con cuenta existente sin perfil:
1. Ir a `/login`
2. Iniciar sesión
3. Si no tiene perfil, redirige al onboarding
