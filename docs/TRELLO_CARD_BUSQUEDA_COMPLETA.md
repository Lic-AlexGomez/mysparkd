# 🔎 CARD TRELLO: Sistema de Búsqueda Completo

## 📋 Título
**Backend - Sistema de búsqueda de usuarios, posts y hashtags**

---

## 📝 Descripción
Implementar un sistema de búsqueda unificado en backend para soportar la experiencia de búsqueda del frontend: usuarios, posts por texto, hashtags, posts por hashtag y hashtags en tendencia.

---

## 🎯 Objetivo
- Permitir búsquedas rápidas y relevantes.
- Soportar paginación y filtros básicos.
- Dejar estructura lista para mejoras futuras (ranking/relevancia).

---

## ✅ Endpoints requeridos

### 1) Buscar usuarios
`GET /api/search/users?query={query}&page={page}&size={size}`

**Response (ejemplo):**
```json
{
  "content": [
    {
      "userId": "uuid",
      "username": "test1",
      "nombres": "Test",
      "apellidos": "Uno",
      "profilePictureUrl": "https://..."
    }
  ],
  "totalPages": 4,
  "number": 0
}
```

### 2) Buscar posts por texto
`GET /api/search/posts?query={query}&page={page}&size={size}`

### 3) Buscar hashtags
`GET /api/search/hashtags?query={query}`

### 4) Obtener posts por hashtag
`GET /api/hashtags/{tag}/posts?page={page}&size={size}`

### 5) Hashtags trending
`GET /api/hashtags/trending?limit={limit}`

---

## 🧩 Reglas técnicas mínimas
- Búsqueda **case-insensitive** (`ILIKE` o equivalente).
- Paginación estándar para endpoints de listas grandes.
- Orden por defecto:
  - Usuarios: relevancia + coincidencia exacta de username primero.
  - Posts: recencia + relevancia básica de texto.
  - Trending: uso reciente y frecuencia.
- Sanitizar `query` y validar longitudes mínimas (ej. 2 caracteres).

---

## 🗄️ Modelo de datos (si no existe)

### Tabla `hashtags`
- `id` (UUID)
- `tag` (VARCHAR, UNIQUE, indexado)
- `usage_count` (INT)
- `last_used_at` (TIMESTAMP)

### Tabla `post_hashtags`
- `post_id` (FK)
- `hashtag_id` (FK)
- índice compuesto (`post_id`, `hashtag_id`)

---

## ⚙️ Cambios backend esperados
- Controller de búsqueda (`SearchController` o equivalente).
- Service con lógica por tipo de búsqueda.
- Repository queries optimizadas e indexadas.
- Extracción/actualización de hashtags al crear/editar post.
- DTOs consistentes con frontend (`userId`, `username`, `profilePictureUrl`, etc.).

---

## 🧪 Criterios de aceptación
- [ ] `GET /api/search/users` devuelve resultados paginados por `query`.
- [ ] `GET /api/search/posts` devuelve resultados paginados por `query`.
- [ ] `GET /api/search/hashtags` sugiere hashtags por prefijo.
- [ ] `GET /api/hashtags/{tag}/posts` funciona con paginación.
- [ ] `GET /api/hashtags/trending` devuelve hashtags ordenados.
- [ ] Búsquedas no distinguen mayúsculas/minúsculas.
- [ ] Respuestas tienen estructura estable para frontend.
- [ ] Performance aceptable en dataset real (sin timeouts).

---

## 🚧 Impacto actual sin este backend
- El frontend no puede ofrecer búsqueda real y consistente.
- Autocomplete y descubrimiento quedan limitados o con fallbacks.
- Menor engagement por dificultad para encontrar usuarios/contenido.
