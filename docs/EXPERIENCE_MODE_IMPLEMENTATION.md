# Sistema de Experiencia - Implementación Completa

## Resumen
Se ha implementado un sistema completo para filtrar la navegación según el modo de experiencia del usuario (Social Media, Dating, o Both).

## Archivos Creados

### 1. `hooks/use-experience-mode.ts`
Hook personalizado que:
- Lee el `accountType` del usuario desde el contexto de autenticación
- Retorna el modo de experiencia actual: `SOCIAL`, `DATING`, o `BOTH`
- Proporciona la función `shouldShowNavItem()` para determinar qué elementos mostrar

**Lógica de filtrado:**

#### SOCIAL (🤝 Social - Solo red social)
- ✅ `/feed` - Feed de noticias
- ✅ `/events` - Eventos
- ✅ `/chat` - Chat
- ✅ `/profile` - Perfil
- ❌ `/swipes` - Swipes
- ❌ `/matches` - Matches
- ❌ `/premium` - Premium

#### DATING (💫 Conexión - Solo dating/matching)
- ✅ `/swipes` - Swipes/Deslizar
- ✅ `/matches` - Matches/Coincidencias
- ✅ `/premium` - Premium
- ✅ `/chat` - Chat
- ✅ `/profile` - Perfil
- ❌ `/feed` - Feed
- ❌ `/events` - Eventos

#### BOTH (⚡ Ambos - Experiencia completa)
- ✅ Todos los elementos disponibles

#### Elementos comunes (siempre visibles)
- `/chat` - Comunicación
- `/profile` - Perfil

#### Elementos administrativos (controlados por feature flags, NO por modo)
- `/dashboard` - Panel admin (solo test1)
- `/manager` - Panel manager (solo manager1)
- `/trello` - Trello (solo test1)

### 2. `components/ui/experience-selector.tsx`
Componente reutilizable para seleccionar el modo de experiencia:
- Interfaz visual con 3 opciones (Social, Conexión, Ambos)
- Indicador visual de selección
- Botón opcional para guardar
- Totalmente tipado con TypeScript

## Archivos Modificados

### 1. `components/layout/sidebar-nav.tsx`
- Importa `useExperienceMode` y `shouldShowNavItem`
- Filtra elementos de navegación según el modo de experiencia
- Mantiene compatibilidad con feature flags existentes

### 2. `components/layout/bottom-nav.tsx`
- Importa `useExperienceMode` y `shouldShowNavItem`
- Filtra elementos de navegación móvil según el modo de experiencia
- Mantiene compatibilidad con feature flags existentes

### 3. `app/(app)/settings/page.tsx`
- Ya incluye el selector de experiencia integrado
- Guarda el `accountType` en el perfil del usuario
- Sincroniza con el backend mediante `UpdateProfileRequest`

### 4. `app/(app)/profile/page.tsx` (Perfil propio)
- Importa y usa `useExperienceMode`
- **Accesos rápidos**: Filtra Matches y Likes (solo DATING y BOTH)
- **Sección Eventos**: Solo visible en SOCIAL y BOTH
- **Sección Posts**: Solo visible en SOCIAL y BOTH
- Guardados siempre visible (común a todos los modos)

### 5. `app/(app)/profile/[userId]/page.tsx` (Perfil de otros usuarios)
- Detecta el `accountType` del perfil visitado
- **Sección Posts**: Solo muestra si el usuario tiene modo SOCIAL o BOTH
- Respeta la privacidad del perfil visitado

## Flujo de Funcionamiento

1. **Usuario selecciona experiencia** en Settings
2. **Se guarda en el backend** como `accountType` (SOCIAL, DATING, BOTH)
3. **El hook `useExperienceMode`** lee el valor del contexto de autenticación
4. **Los componentes de navegación** filtran automáticamente los elementos
5. **La UI se actualiza** mostrando solo las opciones relevantes

## Integración con Backend

El sistema utiliza el campo `accountType` del perfil de usuario:
- Tipo: `AccountType = "DATING" | "SOCIAL" | "BOTH"`
- Se envía en `UpdateProfileRequest`
- Se recibe en `UserProfile` desde `/api/profile/me`
- Se sincroniza automáticamente con el contexto de autenticación

## Elementos Visibles por Modo en el Perfil

### Perfil Propio (`/profile`)

#### SOCIAL
- ✅ Guardados
- ✅ Eventos (Creados y Participando)
- ✅ Posts
- ❌ Matches
- ❌ Likes

#### DATING
- ✅ Guardados
- ✅ Matches
- ✅ Likes
- ❌ Eventos
- ❌ Posts

#### BOTH
- ✅ Todos los elementos

### Perfil de Otros Usuarios (`/profile/[userId]`)

El contenido mostrado depende del `accountType` del usuario visitado:

- **Posts**: Solo si el usuario tiene modo SOCIAL o BOTH
- **Fotos**: Siempre visibles (si el perfil no es privado)
- **Intereses**: Siempre visibles
- **Stats**: Siempre visibles

## Ventajas del Sistema

1. **Centralizado**: Un solo hook controla toda la lógica
2. **Reutilizable**: Funciona en sidebar, bottom nav y cualquier componente
3. **Tipado**: TypeScript garantiza seguridad de tipos
4. **Escalable**: Fácil agregar nuevos elementos o modos
5. **Performante**: No requiere llamadas adicionales al backend
6. **Consistente**: Misma lógica en desktop y móvil

## Uso en Nuevos Componentes

```tsx
import { useExperienceMode, shouldShowNavItem } from '@/hooks/use-experience-mode'

function MyComponent() {
  const mode = useExperienceMode()
  
  // Verificar si mostrar un elemento específico
  if (shouldShowNavItem('/feed', mode)) {
    return <FeedLink />
  }
  
  return null
}
```

## Testing

Para probar el sistema:
1. Ir a Settings
2. Cambiar entre Social, Conexión y Ambos
3. Guardar experiencia
4. Verificar que el sidebar y bottom nav se actualizan
5. Confirmar que solo aparecen los elementos correspondientes

## Notas Técnicas

- El valor por defecto es `BOTH` si no hay usuario o `accountType`
- Los paneles administrativos siempre son visibles independientemente del modo
- El sistema respeta los feature flags existentes (trelloPage, searchPage, etc.)
- Compatible con el sistema de i18n existente
