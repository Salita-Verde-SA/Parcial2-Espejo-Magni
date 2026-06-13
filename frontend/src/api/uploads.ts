import { apiClient } from './client'

export interface CloudinaryResponse {
  secure_url: string
  public_id: string
  width: number
  height: number
  format: string
  resource_type: string
}

/** Sube una imagen a Cloudinary vía el backend (signed upload). */
export async function uploadImagen(file: File, folder = 'productos'): Promise<CloudinaryResponse> {
  const form = new FormData()
  form.append('file', file)
  form.append('folder', folder)
  const res = await apiClient.post<CloudinaryResponse>('/api/v1/uploads/imagen', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data
}

/** Elimina una imagen de Cloudinary por su public_id. */
export async function deleteImagen(publicId: string): Promise<void> {
  await apiClient.delete(`/api/v1/uploads/imagen/${encodeURIComponent(publicId)}`)
}

/**
 * Aplica transformaciones on-the-fly de Cloudinary (f_auto, q_auto, c_fill…).
 * Si la URL no es de Cloudinary, la devuelve sin tocar.
 */
export function cldThumb(url: string | null | undefined, w = 400, h = 300): string {
  if (!url) return ''
  if (!url.includes('/upload/')) return url
  return url.replace('/upload/', `/upload/f_auto,q_auto,c_fill,w_${w},h_${h}/`)
}
