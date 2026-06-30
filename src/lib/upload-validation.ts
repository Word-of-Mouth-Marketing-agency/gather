const IMAGE_TYPES = new Map([
  ['image/jpeg', '.jpg'],
  ['image/png', '.png'],
  ['image/webp', '.webp'],
  ['image/gif', '.gif'],
])

export const MAX_IMAGE_UPLOAD_BYTES = 5 * 1024 * 1024

export function validateImageUpload(file: File): { ok: true; extension: string } | { ok: false; error: string } {
  if (file.size <= 0) return { ok: false, error: 'File is empty' }
  if (file.size > MAX_IMAGE_UPLOAD_BYTES) return { ok: false, error: 'Image must be 5 MB or smaller' }

  const extension = IMAGE_TYPES.get(file.type)
  if (!extension) return { ok: false, error: 'Only JPG, PNG, WEBP, or GIF images are accepted' }

  return { ok: true, extension }
}
