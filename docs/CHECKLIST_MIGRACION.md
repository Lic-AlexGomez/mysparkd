# ✅ CHECKLIST DE MIGRACIÓN - BACKEND MARZO 2026

## 🎯 Tareas Críticas (Hacer YA)

### 1. Sistema de Reacciones
- [ ] **PostCard Component** (`components/feed/post-card.tsx`)
  - [ ] Reemplazar llamadas a `/api/likes` por `reactionService.toggleReaction()`
  - [ ] Actualizar estado de reacciones del usuario
  - [ ] Mostrar resumen de reacciones (contador por tipo)
  - [ ] Agregar ReactionPicker al botón de like

- [ ] **CommentsSheet Component** (`components/feed/comments-sheet.tsx`)
  - [ ] Migrar likes de comentarios a reacciones
  - [ ] Agregar ReactionPicker a cada comentario
  - [ ] Actualizar contadores de reacciones

- [ ] **Comment Reply Component**
  - [ ] Migrar likes de respuestas a reacciones
  - [ ] Agregar ReactionPicker a respuestas

### 2. Feed Local
- [ ] **Feed Page** (`app/(app)/feed/page.tsx`)
  - [ ] Integrar `useLocalFeed` hook
  - [ ] Implementar lógica de cambio entre tabs (Global/Local/Following)
  - [ ] Manejar estados de carga para cada tab
  - [ ] Mostrar mensaje cuando no hay permisos de ubicación

- [ ] **Permisos de Ubicación**
  - [ ] Agregar solicitud de permisos en onboarding
  - [ ] Crear componente de solicitud de permisos
  - [ ] Guardar preferencia del usuario (aceptó/rechazó)
  - [ ] Mostrar banner informativo sobre feed local

### 3. Visibilidad de Posts
- [ ] **CreatePostDialog** (`components/feed/create-post-dialog.tsx`)
  - [ ] Agregar selector de visibilidad (PUBLIC/FOLLOWERS/PRIVATE)
  - [ ] Agregar toggle para "locked" (post borroso)
  - [ ] Actualizar request body con nuevos campos

- [ ] **PostCard Display**
  - [ ] Mostrar icono de visibilidad en posts
  - [ ] Aplicar efecto blur a posts locked
  - [ ] Mostrar botón de desbloqueo en posts locked

---

## 📊 Tareas de UI/UX

### Contadores Nuevos
- [ ] **ViewCount** - Mostrar vistas del post
- [ ] **ShareCount** - Mostrar compartidos del post
- [ ] Agregar iconos y animaciones para estos contadores

### Posts Locked
- [ ] Diseñar UI para posts bloqueados (blur effect)
- [ ] Crear modal de desbloqueo
- [ ] Implementar lógica de desbloqueo (probablemente requiere premium)

### Reacciones
- [ ] Animar transición de reacciones
- [ ] Mostrar lista de usuarios que reaccionaron (modal)
- [ ] Agregar tooltips con nombres de reacciones

---

## 🔧 Tareas Técnicas

### API Calls
- [ ] Buscar y reemplazar TODAS las llamadas a `/api/likes/*`
- [ ] Actualizar tipos de respuesta de API
- [ ] Agregar manejo de errores para nuevos endpoints

### Estado Global
- [ ] Actualizar contexto de auth si es necesario
- [ ] Agregar estado de ubicación del usuario
- [ ] Caché de posts locales

### Testing
- [ ] Probar reacciones en posts
- [ ] Probar reacciones en comentarios
- [ ] Probar feed local con diferentes radios
- [ ] Probar creación de posts con visibilidad
- [ ] Probar límite de swipes (usuario free)

---

## 🚨 Archivos que DEBEN Modificarse

### Prioridad 1 (Crítico):
1. `components/feed/post-card.tsx` - Migrar likes a reacciones
2. `components/feed/comments-sheet.tsx` - Migrar likes a reacciones
3. `app/(app)/feed/page.tsx` - Implementar feed local
4. `components/feed/create-post-dialog.tsx` - Agregar visibilidad

### Prioridad 2 (Importante):
5. `app/(app)/swipes/page.tsx` - Mostrar límite de swipes
6. `components/feed/unlock-post-modal.tsx` - Actualizar para posts locked
7. `app/(app)/onboarding/*` - Agregar solicitud de ubicación

### Prioridad 3 (Mejoras):
8. `components/feed/engagement-stats.tsx` - Agregar viewCount y shareCount
9. `components/feed/share-modal.tsx` - Implementar compartir
10. `lib/services/feed.ts` - Actualizar con nuevos endpoints

---

## 📱 Componentes Nuevos a Crear

- [ ] `components/feed/visibility-selector.tsx` - Selector de visibilidad de posts
- [ ] `components/feed/reaction-summary.tsx` - Resumen visual de reacciones
- [ ] `components/feed/location-permission-banner.tsx` - Banner de permisos
- [ ] `components/feed/swipe-limit-indicator.tsx` - Indicador de límite de swipes
- [ ] `components/feed/locked-post-overlay.tsx` - Overlay para posts bloqueados

---

## 🔍 Búsqueda y Reemplazo

### Buscar en todo el proyecto:
```bash
# Buscar referencias a likes antiguos
/api/likes
LikeController
likeCount (verificar si usa el endpoint viejo)

# Buscar uso de campo deprecated
privat_e

# Buscar componentes que necesitan actualización
ReactionType
```

---

## ⚡ Quick Wins (Fácil y Rápido)

1. ✅ Actualizar tipos en `types.ts` - HECHO
2. ✅ Crear servicio de reacciones - HECHO
3. ✅ Crear servicio de ubicación - HECHO
4. ✅ Actualizar ReactionPicker - HECHO
5. [ ] Agregar tabs de feed (Global/Local/Following)
6. [ ] Actualizar CreatePostDialog con selector de visibilidad

---

## 📅 Plan de Implementación Sugerido

### Día 1: Sistema de Reacciones
- Migrar PostCard
- Migrar CommentsSheet
- Testing básico

### Día 2: Feed Local
- Implementar tabs en feed
- Integrar geolocalización
- Solicitar permisos

### Día 3: Visibilidad y Polish
- Actualizar CreatePostDialog
- Implementar posts locked
- Agregar contadores nuevos

### Día 4: Testing y Fixes
- Testing completo
- Corregir bugs
- Optimizaciones

---

## 🐛 Posibles Problemas

1. **Permisos de Ubicación**
   - Usuario puede rechazar permisos
   - Solución: Mostrar feed global por defecto

2. **Migración de Datos**
   - Posts antiguos pueden no tener campo `visibility`
   - Solución: Backend debe manejar default (PUBLIC)

3. **Performance**
   - Cálculo de distancia puede ser lento
   - Solución: Backend debe cachear ubicaciones

4. **Reacciones**
   - Animaciones pueden causar lag
   - Solución: Optimizar re-renders con React.memo

---

## 📞 Preguntas para el Backend

- [ ] ¿Cómo se manejan posts antiguos sin campo `visibility`?
- [ ] ¿El límite de swipes se resetea a medianoche?
- [ ] ¿Qué pasa si un usuario no tiene ubicación guardada?
- [ ] ¿Los posts locked requieren premium para desbloquear?
- [ ] ¿Hay endpoint para obtener historial de reacciones del usuario?

---

## ✨ Mejoras Futuras (Post-Migración)

- [ ] Notificaciones push para reacciones
- [ ] Filtros avanzados de feed local (por intereses)
- [ ] Mapa de posts cercanos
- [ ] Estadísticas de reacciones en perfil
- [ ] Exportar posts con más reacciones
