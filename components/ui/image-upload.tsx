'use client'

import { useState } from 'react'
import { Camera, Loader2 } from 'lucide-react'
import { uploadToCloudinary } from '@/lib/cloudinary'
import { toast } from 'sonner'

interface ImageUploadProps {
  onUploadComplete: (url: string) => void
  currentImage?: string
  className?: string
  buttonClassName?: string
}

export function ImageUpload({ 
  onUploadComplete, 
  currentImage,
  className = '',
  buttonClassName = ''
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [preview, setPreview] = useState<string | undefined>(currentImage)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor selecciona una imagen válida')
      return
    }

    // Validar tamaño (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('La imagen no debe superar 10MB')
      return
    }

    setIsUploading(true)
    const toastId = toast.loading('Subiendo imagen...')

    try {
      // Mostrar preview local
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(file)

      // Subir a Cloudinary
      const imageUrl = await uploadToCloudinary(file)
      
      toast.dismiss(toastId)
      toast.success('Imagen subida exitosamente')
      
      onUploadComplete(imageUrl)
    } catch (error) {
      toast.dismiss(toastId)
      toast.error('Error al subir la imagen')
      console.error(error)
      setPreview(currentImage)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className={`relative ${className}`}>
      {preview && (
        <img 
          src={preview} 
          alt="Preview" 
          className="w-full h-full object-cover"
        />
      )}
      
      <label className={`cursor-pointer ${buttonClassName}`}>
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
          disabled={isUploading}
        />
        {isUploading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Camera className="h-4 w-4" />
        )}
      </label>
    </div>
  )
}
