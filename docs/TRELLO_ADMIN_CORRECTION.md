# 🔧 Corrección: Trello es solo para Admin (test1)

## ❌ Antes (Incorrecto)
Trello estaba en `socialOnlyItems`, lo que significaba:
- ✅ Visible en modo SOCIAL
- ✅ Visible en modo BOTH
- ❌ NO visible en modo DATING

**Problema**: Esto hacía que Trello dependiera del modo de experiencia, cuando en realidad debe depender del ROL del usuario.

---

## ✅ Ahora (Correcto)
Trello está en `adminItems`, lo que significa:
- ✅ Visible SOLO si el usuario es `test1` (admin)
- ✅ Visible en TODOS los modos (SOCIAL, DATING, BOTH)
- ✅ Controlado por feature flag `trelloPage`

---

## 🎯 Lógica Correcta

### Elementos por Modo de Experiencia

#### 🤝 SOCIAL
```typescript
const socialOnlyItems = ['/feed', '/events']
```
- Feed
- Events

#### 💫 DATING
```typescript
const datingOnlyItems = ['/swipes', '/matches', '/premium']
```
- Swipes
- Matches
- Premium

#### 🔒 Elementos Comunes
```typescript
const commonItems = ['/chat', '/profile']
```
- Chat
- Profile

#### 🔑 Elementos Administrativos (NO dependen del modo)
```typescript
const adminItems = ['/dashboard', '/manager', '/trello']
```
- Dashboard (solo test1)
- Manager (solo manager1 o test1)
- Trello (solo test1)

---

## 📊 Tabla de Visibilidad

| Elemento | SOCIAL | DATING | BOTH | Requiere |
|----------|--------|--------|------|----------|
| Feed | ✅ | ❌ | ✅ | Modo SOCIAL/BOTH |
| Events | ✅ | ❌ | ✅ | Modo SOCIAL/BOTH |
| Swipes | ❌ | ✅ | ✅ | Modo DATING/BOTH |
| Matches | ❌ | ✅ | ✅ | Modo DATING/BOTH |
| Premium | ❌ | ✅ | ✅ | Modo DATING/BOTH |
| Chat | ✅ | ✅ | ✅ | Siempre |
| Profile | ✅ | ✅ | ✅ | Siempre |
| **Trello** | ✅ | ✅ | ✅ | **Usuario = test1** |
| Dashboard | ✅ | ✅ | ✅ | Usuario = test1 |
| Manager | ✅ | ✅ | ✅ | Usuario = manager1/test1 |

---

## 🔍 Ejemplos de Casos

### Caso 1: Usuario Normal en modo SOCIAL
```
Usuario: juan@example.com
Modo: SOCIAL
Ve: Feed, Events, Chat, Profile
NO ve: Swipes, Matches, Premium, Trello, Dashboard
```

### Caso 2: Usuario Normal en modo DATING
```
Usuario: maria@example.com
Modo: DATING
Ve: Swipes, Matches, Premium, Chat, Profile
NO ve: Feed, Events, Trello, Dashboard
```

### Caso 3: Admin (test1) en modo SOCIAL
```
Usuario: test1@test.com
Modo: SOCIAL
Ve: Feed, Events, Chat, Profile, Trello, Dashboard
NO ve: Swipes, Matches, Premium (porque está en modo SOCIAL)
```

### Caso 4: Admin (test1) en modo DATING
```
Usuario: test1@test.com
Modo: DATING
Ve: Swipes, Matches, Premium, Chat, Profile, Trello, Dashboard
NO ve: Feed, Events (porque está en modo DATING)
```

### Caso 5: Admin (test1) en modo BOTH
```
Usuario: test1@test.com
Modo: BOTH
Ve: TODO (Feed, Swipes, Events, Matches, Premium, Chat, Profile, Trello, Dashboard)
```

---

## 💡 Lógica de Filtrado

### En `use-experience-mode.ts`:

```typescript
export function shouldShowNavItem(href: string, mode: ExperienceMode): boolean {
  // Elementos exclusivos de SOCIAL
  const socialOnlyItems = ['/feed', '/events']
  
  // Elementos exclusivos de DATING
  const datingOnlyItems = ['/swipes', '/matches', '/premium']
  
  // Elementos comunes a todos los modos
  const commonItems = ['/chat', '/profile']
  
  // Paneles administrativos (controlados por feature flags, NO por modo)
  const adminItems = ['/dashboard', '/manager', '/trello']
  
  // Los items admin siempre se muestran si el feature flag lo permite
  if (adminItems.includes(href)) return true
  if (commonItems.includes(href)) return true
  
  if (mode === 'BOTH') return true
  
  if (mode === 'SOCIAL') {
    return socialOnlyItems.includes(href) || commonItems.includes(href)
  }
  
  if (mode === 'DATING') {
    return datingOnlyItems.includes(href) || commonItems.includes(href)
  }
  
  return true
}
```

### En `sidebar-nav.tsx` y `bottom-nav.tsx`:

```typescript
const filteredNavItems = navItems.filter(item => {
  // Feature flags se verifican PRIMERO
  if (item.href === '/trello' && !features.trelloPage) return false
  if (item.href === '/search' && !features.searchPage) return false
  
  // Luego se verifica el modo de experiencia
  if (!shouldShowNavItem(item.href, experienceMode)) return false
  
  return true
})
```

---

## 🔐 Feature Flags (Recordatorio)

En `lib/utils/feature-flags.ts`:

```typescript
const TEST_USERNAMES = ['test1', 'TEST1', 'test', 'TEST']

export function getFeatureFlags(...): FeatureFlags {
  const isAdmin = canUseNewFeatures(userEmail, username, userId)
  const isTrelloAllowed = normalizedUsername === "test1"
  
  return {
    // ... otras flags
    dashboard: isAdmin,           // 🔒 Solo test1
    managerPanel: isMgr || isAdmin, // 🔒 Manager + admin
    trelloPage: isTrelloAllowed,  // 🔒 Solo test1
  }
}
```

---

## ✅ Resumen de la Corrección

### Antes:
- Trello dependía del modo de experiencia
- Solo visible en SOCIAL y BOTH
- NO visible en DATING

### Ahora:
- Trello depende del ROL del usuario (feature flag)
- Visible en TODOS los modos SI eres test1
- NO visible para usuarios normales en ningún modo

---

## 🧪 Testing

### Test 1: Usuario Normal
1. Login como usuario normal (no test1)
2. Cambiar entre SOCIAL, DATING, BOTH
3. **Resultado esperado**: Trello NO aparece en ningún modo

### Test 2: Admin en SOCIAL
1. Login como test1
2. Seleccionar modo SOCIAL
3. **Resultado esperado**: Ve Feed, Events, Chat, Profile, Trello, Dashboard

### Test 3: Admin en DATING
1. Login como test1
2. Seleccionar modo DATING
3. **Resultado esperado**: Ve Swipes, Matches, Premium, Chat, Profile, Trello, Dashboard

### Test 4: Admin en BOTH
1. Login como test1
2. Seleccionar modo BOTH
3. **Resultado esperado**: Ve TODO incluyendo Trello y Dashboard

---

## 📝 Archivos Modificados

1. ✅ `hooks/use-experience-mode.ts`
   - Movido Trello de `socialOnlyItems` a `adminItems`

2. ✅ `docs/EXPERIENCE_MODE_IMPLEMENTATION.md`
   - Actualizada documentación

3. ✅ `docs/EXPERIENCE_MODE_SUMMARY.md`
   - Actualizado resumen

4. ✅ `docs/TRELLO_ADMIN_CORRECTION.md`
   - Este documento

---

## ✅ Estado: CORREGIDO

Trello ahora funciona correctamente:
- ✅ Solo visible para test1
- ✅ Visible en todos los modos (si eres test1)
- ✅ Controlado por feature flag, NO por modo de experiencia
