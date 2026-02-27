// Ejemplo de endpoint del backend para guardar fotos
// Este archivo es solo de referencia - implementa según tu backend

/**
 * POST /api/photos/upload
 * 
 * Body:
 * {
 *   "url": "https://res.cloudinary.com/dvcp9kzsn/image/upload/v1234567890/v0-social/abc123.jpg",
 *   "isPrimary": true
 * }
 * 
 * Response:
 * {
 *   "photoId": "123",
 *   "url": "https://res.cloudinary.com/...",
 *   "isPrimary": true,
 *   "createdAt": "2024-01-01T00:00:00Z"
 * }
 */

// Ejemplo con Express.js
/*
app.post('/api/photos/upload', authenticateUser, async (req, res) => {
  try {
    const { url, isPrimary } = req.body
    const userId = req.user.id

    // Validar URL de Cloudinary
    if (!url || !url.startsWith('https://res.cloudinary.com/')) {
      return res.status(400).json({ error: 'URL inválida' })
    }

    // Si es foto primaria, desmarcar las demás
    if (isPrimary) {
      await db.photos.updateMany(
        { userId, isPrimary: true },
        { isPrimary: false }
      )
    }

    // Guardar en base de datos
    const photo = await db.photos.create({
      userId,
      url,
      isPrimary: isPrimary || false,
      createdAt: new Date()
    })

    res.json(photo)
  } catch (error) {
    console.error('Error al guardar foto:', error)
    res.status(500).json({ error: 'Error al guardar foto' })
  }
})
*/

// Ejemplo con Next.js API Routes
/*
export async function POST(request: Request) {
  try {
    const { url, isPrimary } = await request.json()
    const session = await getSession()
    
    if (!session?.user?.id) {
      return Response.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Validar URL
    if (!url || !url.startsWith('https://res.cloudinary.com/')) {
      return Response.json({ error: 'URL inválida' }, { status: 400 })
    }

    // Guardar en DB
    const photo = await prisma.photo.create({
      data: {
        userId: session.user.id,
        url,
        isPrimary: isPrimary || false
      }
    })

    return Response.json(photo)
  } catch (error) {
    return Response.json({ error: 'Error al guardar foto' }, { status: 500 })
  }
}
*/

export {}
