# Memoria Sparky en hosting / base de datos

La memoria del companion (bond, traits, companion favorito, etc.) se guarda **en tu PostgreSQL** (~500 GB de hosting) y se sincroniza con cada cuenta.

## 1. Crear la tabla

En tu panel de PostgreSQL (o `psql`), ejecuta:

`docs/sql/sparky_user_memory.sql`

```sql
-- Resumen: una fila por usuario
sparky_user_memory (user_id PK, memory_json JSONB, updated_at)
```

## 2. Variables de entorno (web / Next.js)

En Vercel, VPS o donde despliegues `v0-social`:

```env
DATABASE_URL=postgresql://user:pass@host:5432/sparkd
```

Con `DATABASE_URL`, `GET/PUT/DELETE /api/sparky/memory` lee y escribe en esa tabla.

Sin `DATABASE_URL`, la misma ruta **reenvía** al backend Java (`NEXT_PUBLIC_API_URL`) en `/api/sparky/memory` (implementa el mismo contrato en Render si el móvil llama directo al API).

Dependencia instalada: `pg`.

## 3. Clientes (ya cableados)

| App | Local | Servidor |
|-----|-------|----------|
| Web | `localStorage` `sparkd_sparky_memory` | `/api/sparky/memory` + JWT `sparkd_token` |
| Móvil | AsyncStorage `sparkd_sparky_memory` | `EXPO_PUBLIC_WEB_APP_URL/api/sparky/memory` (preferido) o `API_BASE_URL/api/sparky/memory` |

Al **login** se hace pull y merge (gana el `updatedAt` más reciente; bond = máximo). Al **guardar** Sparky se hace PUT en segundo plano.

Móvil: define en `.env`:

```env
EXPO_PUBLIC_WEB_APP_URL=https://tu-dominio.vercel.app
```

## 4. Backend Java (opcional)

Si el móvil no pasa por la web, implementa en Render el mismo contrato:

- `GET /api/sparky/memory` → JSON del usuario del JWT
- `PUT /api/sparky/memory` → body JSON, upsert por `user_id`
- `DELETE /api/sparky/memory` → borrar fila

Usa la misma tabla `sparky_user_memory` o una equivalente.

## 5. Privacidad

No guardar en `memory_json`: email, teléfono, mensajes, GPS ni texto de chats. El cliente sanitiza antes de enviar.
