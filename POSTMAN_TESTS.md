# Tests de Postman - Sparkd API

Base URL: `https://sparkd1-0.onrender.com`

## 1️⃣ Registro y Login

### Registrar Usuario
```
POST https://sparkd1-0.onrender.com/auth/register
Content-Type: application/json

{
  "username": "testuser",
  "email": "test@example.com",
  "password": "123456"
}
```

### Login
```
POST https://sparkd1-0.onrender.com/auth/login
Content-Type: application/json

{
  "username": "testuser",
  "password": "123456"
}
```

**Respuesta:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**⚠️ Guarda el token para los siguientes requests**

---

## 2️⃣ Crear Perfil

```
POST https://sparkd1-0.onrender.com/api/profile
Authorization: Bearer {TU_TOKEN}
Content-Type: application/json

{
  "nombres": "Juan",
  "apellidos": "Pérez",
  "sex": "MALE",
  "telefono": "8095556666"
}
```

---

## 3️⃣ Ver Mi Perfil

```
GET https://sparkd1-0.onrender.com/api/profile/me
Authorization: Bearer {TU_TOKEN}
```

---

## 4️⃣ Crear Post (SIN imagen)

```
POST https://sparkd1-0.onrender.com/api/posts/new
Authorization: Bearer {TU_TOKEN}
Content-Type: multipart/form-data

Form Data:
- post: {"body":"Este es mi primer post de prueba","permanent":true}
```

**En Postman:**
1. Selecciona `Body` → `form-data`
2. Agrega key: `post` (tipo Text)
3. Value: `{"body":"Este es mi primer post de prueba","permanent":true}`

---

## 5️⃣ Crear Post (CON imagen)

```
POST https://sparkd1-0.onrender.com/api/posts/new
Authorization: Bearer {TU_TOKEN}
Content-Type: multipart/form-data

Form Data:
- post: {"body":"Post con imagen","permanent":true}
- file: [Seleccionar archivo de imagen]
```

**En Postman:**
1. Selecciona `Body` → `form-data`
2. Key 1: `post` (tipo Text) → Value: `{"body":"Post con imagen","permanent":true}`
3. Key 2: `file` (tipo File) → Selecciona una imagen

---

## 6️⃣ Crear Post Temporal

```
POST https://sparkd1-0.onrender.com/api/posts/new
Authorization: Bearer {TU_TOKEN}
Content-Type: multipart/form-data

Form Data:
- post: {"body":"Este post expira en 24 horas","permanent":false,"durationHours":24}
```

---

## 7️⃣ Ver Feed Global

```
GET https://sparkd1-0.onrender.com/api/posts/feed
Authorization: Bearer {TU_TOKEN}
```

---

## 8️⃣ Ver Mis Posts

```
GET https://sparkd1-0.onrender.com/api/posts/me
Authorization: Bearer {TU_TOKEN}
```

---

## 9️⃣ Agregar Foto de Perfil

```
POST https://sparkd1-0.onrender.com/api/photos/add
Authorization: Bearer {TU_TOKEN}
Content-Type: application/json

{
  "url": "https://res.cloudinary.com/demo/image/upload/sample.jpg",
  "position": 0,
  "primary": true
}
```

---

## 🔟 Ver Intereses Disponibles

```
GET https://sparkd1-0.onrender.com/api/interests
Authorization: Bearer {TU_TOKEN}
```

---

## 1️⃣1️⃣ Agregar Interés

```
POST https://sparkd1-0.onrender.com/api/interests/add/{interestId}
Authorization: Bearer {TU_TOKEN}
```

Reemplaza `{interestId}` con un ID de la lista de intereses.

---

## 1️⃣2️⃣ Configurar Preferencias

```
POST https://sparkd1-0.onrender.com/api/preferences/set/preferences
Authorization: Bearer {TU_TOKEN}
Content-Type: application/json

{
  "interestedIn": "FEMALE",
  "minAge": 18,
  "maxAge": 35,
  "showMe": true
}
```

---

## 1️⃣3️⃣ Toggle Like en Post

```
POST https://sparkd1-0.onrender.com/api/likes/toggle?targetId={POST_ID}
Authorization: Bearer {TU_TOKEN}
```

Reemplaza `{POST_ID}` con el ID del post.

---

## 1️⃣4️⃣ Crear Comentario

```
POST https://sparkd1-0.onrender.com/api/comments/{POST_ID}
Authorization: Bearer {TU_TOKEN}
Content-Type: application/json

{
  "text": "Excelente post!"
}
```

---

## 1️⃣5️⃣ Ver Comentarios de un Post

```
GET https://sparkd1-0.onrender.com/api/comments/{POST_ID}/comments
Authorization: Bearer {TU_TOKEN}
```

---

## 1️⃣6️⃣ Eliminar Post

```
DELETE https://sparkd1-0.onrender.com/api/posts/delete/{POST_ID}
Authorization: Bearer {TU_TOKEN}
```

---

## 📋 Colección Postman

### Variables de Entorno
Crea un Environment en Postman con:

```
base_url: https://sparkd1-0.onrender.com
token: (se llenará después del login)
```

### Flujo Completo de Prueba

1. **Registro** → Guarda el username
2. **Login** → Guarda el token en variable `{{token}}`
3. **Crear Perfil** → Completa datos básicos
4. **Ver Perfil** → Verifica que se creó
5. **Crear Post** → Prueba con y sin imagen
6. **Ver Feed** → Verifica que aparece el post
7. **Like al Post** → Prueba toggle
8. **Comentar** → Agrega comentario
9. **Ver Comentarios** → Verifica que aparece

---

## 🔧 Tips para Postman

1. **Guardar Token Automáticamente:**
   En el test del endpoint de Login, agrega:
   ```javascript
   pm.environment.set("token", pm.response.json().token);
   ```

2. **Usar Variables:**
   - URL: `{{base_url}}/api/profile/me`
   - Header: `Authorization: Bearer {{token}}`

3. **Verificar Respuestas:**
   ```javascript
   pm.test("Status code is 200", function () {
       pm.response.to.have.status(200);
   });
   ```
