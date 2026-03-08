# Integración OpenAI Moderation API

## Backend (✅ Implementado)

### Servicio: `OpenAIModerationService.java`

**Funcionalidades:**
- Moderación de texto usando modelo `omni-moderation-latest`
- Moderación de imágenes por URL
- Detección automática de contenido inapropiado (sexual, violence)

**Métodos:**
```java
public String moderateText(String text)
public String moderateImageUrl(String imageUrl)
```

### Integración en `PostService.java`

**Flujo de creación de posts:**
1. Usuario envía post con texto/imagen
2. Backend modera el texto con OpenAI
3. Si contiene contenido inapropiado → Error 400
4. Si hay imagen, se sube a Cloudinary
5. Backend modera la imagen por URL
6. Si imagen es inapropiada → Se elimina de Cloudinary + Error 400
7. Si todo OK → Post se crea

**Validaciones adicionales:**
- Usuarios FREE: 1 post cada 48 horas
- Duración máxima: 48 horas

## Frontend (✅ Integrado)

### Componente: `create-post-dialog.tsx`

**Manejo de errores mejorado:**
```typescript
if (errorText.includes('contenido inapropiado') || 
    errorText.includes('sexual') || 
    errorText.includes('violence')) {
  errorMessage = '⚠️ Contenido bloqueado: El texto o imagen contiene contenido inapropiado'
}
```

**Mensajes de error específicos:**
- ⚠️ Contenido bloqueado (moderación OpenAI)
- ⏰ Límite de 48 horas (usuarios free)
- Duración máxima excedida

## Configuración requerida

### Backend (`application.properties`)
```properties
openai.api.key=${OPENAI_API_KEY}
```

### Variables de entorno
```bash
OPENAI_API_KEY=sk-...
```

## Flujo completo

```
Usuario escribe post
    ↓
Frontend valida (min 10 chars)
    ↓
Envía a /api/posts/new
    ↓
Backend modera texto (OpenAI)
    ↓
¿Contenido inapropiado?
    ├─ SÍ → Error 400 + mensaje
    └─ NO → Continúa
        ↓
    ¿Hay imagen?
        ├─ SÍ → Sube a Cloudinary
        │       ↓
        │   Modera imagen (OpenAI)
        │       ↓
        │   ¿Inapropiada?
        │       ├─ SÍ → Elimina de Cloudinary + Error 400
        │       └─ NO → Continúa
        └─ NO → Continúa
            ↓
        Guarda post en DB
            ↓
        Retorna PostResponseDTO
```

## Beneficios

✅ Protección automática contra contenido inapropiado
✅ Moderación de texto e imágenes
✅ Mensajes de error claros para el usuario
✅ Eliminación automática de imágenes rechazadas
✅ Sin intervención manual necesaria
