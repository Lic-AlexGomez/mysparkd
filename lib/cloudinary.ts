import { Cloudinary } from '@cloudinary/url-gen'

export const cld = new Cloudinary({
  cloud: {
    cloudName: 'dvk3yygql'
  }
})

export type CloudinaryUploadResult = {
  url: string
  publicId?: string
  isVideo: boolean
}

export async function uploadMediaToCloudinary(file: File): Promise<CloudinaryUploadResult> {
  const isVideo = file.type.startsWith('video/')
  const resourceType = isVideo ? 'video' : 'image'
  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', 'ml_default')

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/dvk3yygql/${resourceType}/upload`,
    { method: 'POST', body: formData }
  )

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(
      (error as { error?: { message?: string } }).error?.message ||
        `Error al subir ${isVideo ? 'video' : 'imagen'} a Cloudinary`
    )
  }

  const data = (await response.json()) as { secure_url: string; public_id?: string }
  return { url: data.secure_url, publicId: data.public_id, isVideo }
}

/** Subida de imagen (compatibilidad con código existente). */
export async function uploadToCloudinary(file: File): Promise<string> {
  const result = await uploadMediaToCloudinary(file)
  return result.url
}
