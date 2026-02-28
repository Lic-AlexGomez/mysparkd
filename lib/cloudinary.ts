import { Cloudinary } from '@cloudinary/url-gen'

export const cld = new Cloudinary({
  cloud: {
    cloudName: 'dvcp9kzsn'
  }
})

export async function uploadToCloudinary(file: File): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', 'ml_default')

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/dvcp9kzsn/image/upload`,
    {
      method: 'POST',
      body: formData
    }
  )

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error?.message || 'Error al subir imagen a Cloudinary')
  }

  const data = await response.json()
  return data.secure_url
}
