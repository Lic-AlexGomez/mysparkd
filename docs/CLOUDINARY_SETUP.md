# Configuración de Cloudinary

## Pasos para configurar la subida de imágenes

### 1. Crear Upload Preset en Cloudinary

1. Ve a tu dashboard: https://console.cloudinary.com/
2. Click en **Settings** (⚙️) → **Upload** → **Upload presets**
3. Click en **Add upload preset**
4. Configura:
   - **Preset name**: `v0_social_uploads`
   - **Signing Mode**: **Unsigned** ⚠️ (IMPORTANTE)
   - **Folder**: `v0-social` (opcional)
   - **Allowed formats**: `jpg, png, webp, gif`
   - **Max file size**: `10 MB`
5. Click en **Save**

### 2. Actualizar el código

Si usaste un nombre diferente para el preset, actualiza el archivo `lib/cloudinary.ts`:

```typescript
formData.append('upload_preset', 'TU_PRESET_AQUI')
```

### 3. Variables de entorno

El archivo `.env.local` ya está configurado con tus credenciales:

```env
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=dvcp9kzsn
NEXT_PUBLIC_CLOUDINARY_API_KEY=766767398247773
CLOUDINARY_API_SECRET=XklMSwTs_O_647hpc3UxC0MnSUI
```

⚠️ **IMPORTANTE**: Nunca subas el archivo `.env.local` a Git. Ya está en `.gitignore`.

### 4. Uso en componentes

#### Opción 1: Usar la función directamente

```typescript
import { uploadToCloudinary } from '@/lib/cloudinary'

const handleUpload = async (file: File) => {
  const imageUrl = await uploadToCloudinary(file)
  // Hacer algo con la URL
}
```

#### Opción 2: Usar el componente ImageUpload

```typescript
import { ImageUpload } from '@/components/ui/image-upload'

<ImageUpload 
  onUploadComplete={(url) => console.log('URL:', url)}
  currentImage="/placeholder.jpg"
/>
```

### 5. Endpoint del backend

Tu backend debe tener este endpoint:

```
POST https://sparkd1-0.onrender.com/api/photos
Authorization: Bearer {token}
Content-Type: application/json

{
  "url": "https://res.cloudinary.com/dvcp9kzsn/image/upload/v123/photo.jpg",
  "isPrimary": true
}
```

**Respuesta esperada:**
```json
{
  "photoId": "123",
  "url": "https://res.cloudinary.com/...",
  "isPrimary": true
}
```

**Nota:** Si el endpoint no existe, la app guardará la foto localmente como fallback.

## Características

✅ Subida directa desde el frontend (sin pasar por tu servidor)
✅ Validación de tipo de archivo (solo imágenes)
✅ Validación de tamaño (máx 10MB)
✅ Preview local antes de subir
✅ Feedback visual con toasts
✅ Manejo de errores

## Seguridad

- Las subidas son **unsigned** (sin firma) pero limitadas por el preset
- Configura las restricciones en el dashboard de Cloudinary
- El preset controla: formatos permitidos, tamaño máximo, carpeta destino
- Las credenciales sensibles están en `.env.local` (no se suben a Git)

## Optimización

Cloudinary automáticamente:
- Optimiza el tamaño de las imágenes
- Convierte a formatos modernos (WebP)
- Genera thumbnails
- Aplica compresión inteligente

## Troubleshooting

### Error: "Upload preset not found"
- Verifica que el preset existe en tu dashboard
- Asegúrate que el nombre coincide exactamente
- Confirma que el preset es **Unsigned**

### Error: "Invalid signature"
- Cambia el preset a modo **Unsigned**

### Error: "File too large"
- Reduce el tamaño de la imagen
- Ajusta el límite en el preset de Cloudinary
