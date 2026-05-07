# 🔧 Corrección: Discover = Swipes en Dating

## ❌ Problema Identificado

**Discover** y **Swipes** son básicamente la misma funcionalidad en el contexto de dating:
- Ambos muestran perfiles para deslizar
- Ambos permiten dar like/pass
- Ambos son para descubrir personas

**Resultado**: Tener ambos en DATING es redundante y confuso.

---

## ✅ Solución Aplicada

**Discover** ahora es EXCLUSIVO de SOCIAL:
- En SOCIAL: Descubrir contenido, posts, grupos, personas
- En DATING: Se usa **Swipes** (que ya cumple esa función)

---

## 📊 División Actualizada

### 🤝 SOCIAL (9 elementos)
```
1. Feed
2. Stories
3. Groups
4. Events
5. Discover ✅ (Descubrir contenido)
6. Activity
7. Chat
8. Profile
```

### 💫 DATING (9 elementos)
```
1. Swipes ✅ (Descubrir personas = Discover)
2. Matches
3. Likes
4. Fast Date
5. Date Cards
6. Premium
7. Chat
8. Profile
```

**Nota**: Discover NO aparece en DATING porque Swipes ya cumple esa función.

---

## 🎯 Diferencias de Propósito

### Discover en SOCIAL:
- **Objetivo**: Descubrir contenido interesante
- **Muestra**: Posts, grupos, eventos, personas con intereses similares
- **Acción**: Seguir, unirse a grupos, ver posts
- **Enfoque**: Contenido y comunidad

### Swipes en DATING:
- **Objetivo**: Descubrir personas compatibles
- **Muestra**: Perfiles de personas para dating
- **Acción**: Like/Pass, match
- **Enfoque**: Conexiones románticas

---

## 💡 Lógica

En modo DATING:
- **Swipes** = Descubrir personas (función principal)
- **Matches** = Personas con las que hiciste match
- **Likes** = Personas que te dieron like
- **Fast Date** = Citas rápidas
- **Date Cards** = Propuestas de citas

No necesitas un "Discover" adicional porque **Swipes YA ES tu herramienta de descubrimiento**.

---

## 📁 Archivos Modificados

### 1. `components/layout/sidebar-nav.tsx`
```typescript
// ANTES
{ href: "/discover", modes: ['SOCIAL', 'DATING', 'BOTH'] }

// AHORA
{ href: "/discover", modes: ['SOCIAL', 'BOTH'] }
```

### 2. `components/layout/bottom-nav.tsx`
```typescript
// ANTES
{ href: "/discover", modes: ['SOCIAL', 'DATING', 'BOTH'] }

// AHORA
{ href: "/discover", modes: ['SOCIAL', 'BOTH'] }
```

### 3. `hooks/use-experience-mode.ts`
```typescript
// ANTES
const commonItems = ['/chat', '/profile', '/discover']

// AHORA
const socialOnlyItems = [..., '/discover']
```

---

## 🧪 Testing

### Test 1: Usuario SOCIAL
1. Login y seleccionar modo SOCIAL
2. **Verificar**: Discover aparece en navegación
3. **Propósito**: Descubrir contenido, grupos, posts

### Test 2: Usuario DATING
1. Login y seleccionar modo DATING
2. **Verificar**: Discover NO aparece
3. **Verificar**: Swipes aparece (cumple la función de descubrir)
4. **Propósito**: Swipes es tu herramienta de descubrimiento

### Test 3: Usuario BOTH
1. Login y seleccionar modo BOTH
2. **Verificar**: Ambos aparecen (Discover y Swipes)
3. **Discover**: Para contenido social
4. **Swipes**: Para personas en dating

---

## 📊 Comparación Final

| Modo | Elementos | Incluye Discover | Incluye Swipes |
|------|-----------|------------------|----------------|
| 🤝 SOCIAL | 9 | ✅ SÍ | ❌ NO |
| 💫 DATING | 9 | ❌ NO | ✅ SÍ |
| ⚡ BOTH | 15 | ✅ SÍ | ✅ SÍ |

---

## 💭 Razonamiento

### ¿Por qué no tener ambos en DATING?

1. **Redundancia**: Ambos hacen lo mismo (mostrar perfiles)
2. **Confusión**: El usuario no sabría cuál usar
3. **UX**: Menos es más, una sola herramienta clara
4. **Estándar**: Apps como Tinder, Bumble solo tienen "Swipes"

### ¿Por qué Discover en SOCIAL?

1. **Propósito diferente**: Descubrir contenido, no personas
2. **Exploración**: Ver posts trending, grupos populares
3. **Comunidad**: Encontrar comunidades con intereses similares
4. **Valor agregado**: Complementa el Feed con descubrimiento activo

---

## ✅ Resumen

### Antes (Incorrecto):
- SOCIAL: Feed, Stories, Groups, Events, **Discover**, Activity
- DATING: **Swipes**, Matches, Likes, Fast Date, Date Cards, **Discover** ❌ (redundante)

### Ahora (Correcto):
- SOCIAL: Feed, Stories, Groups, Events, **Discover** ✅, Activity
- DATING: **Swipes** ✅, Matches, Likes, Fast Date, Date Cards

**Swipes = Discover en el contexto de dating**

---

## 🎯 Conclusión

La corrección mejora la UX al:
- ✅ Eliminar redundancia
- ✅ Clarificar propósitos
- ✅ Simplificar navegación
- ✅ Seguir estándares de la industria

**Estado**: CORREGIDO ✅
