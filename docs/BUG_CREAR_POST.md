# 🐛 BUG: No se pueden crear posts

## Error
```
ERROR: null value in column "private_post" of relation "posts" violates not-null constraint
```

## Descripción
Al intentar crear un post, el backend falla porque la columna `private_post` en la base de datos es NOT NULL, pero no se está enviando ningún valor.

## Causa
1. El DTO `PostRequestDTO` acepta estos campos:
   - body
   - locked
   - durationHours
   - file
   - permanent
   - visibility

2. La base de datos tiene una columna `private_post` que es NOT NULL

3. El backend NO está mapeando `visibility` → `private_post`

## Solución (Backend)
El programador del backend necesita:

### Opción 1: Agregar mapeo en el Service
En `PostService.java`, al crear el post:

```java
Posts post = new Posts();
post.setBody(postRequest.getBody());
post.setPermanent(postRequest.getPermanent());
post.setLocked(postRequest.getLocked());
post.setVisibility(postRequest.getVisibility());

// AGREGAR ESTO:
post.setPrivatePost(postRequest.getVisibility() == PostVisibility.PRIVATE);
```

### Opción 2: Hacer la columna nullable
Si `private_post` está deprecated, hacer la columna nullable en la base de datos:

```sql
ALTER TABLE posts ALTER COLUMN private_post DROP NOT NULL;
```

### Opción 3: Agregar valor por defecto
```sql
ALTER TABLE posts ALTER COLUMN private_post SET DEFAULT false;
```

## Workaround Temporal (Frontend)
No hay workaround posible desde el frontend porque:
- El DTO no acepta `privat_e`
- El DTO solo acepta `visibility`
- El backend no está mapeando correctamente

## Request que se está enviando
```json
{
  "body": "texto del post",
  "permanent": true,
  "locked": false,
  "visibility": "PUBLIC"
}
```

## SQL que falla
```sql
INSERT INTO posts (
  body, comment_count, created_at, deleted_at, expires_at, 
  file, file_public_id, fire_count, laugh_count, like_count, 
  locked, love_count, permanent, sad_count, score, share_count, 
  users_id, view_count, visibility, wow_count, post_id
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
```

**Nota:** La columna `private_post` NO está en el INSERT, por eso falla.

## Prioridad
🔴 **CRÍTICA** - No se pueden crear posts

## Contacto
Reportar a: Johan M. Jones Mayblue (Backend Developer)

---

**Fecha:** 10/03/2026
**Reportado por:** Frontend Team
