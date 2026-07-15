const IMAGE_TYPES = new Map([
  ['image/jpeg', '.jpg'],
  ['image/png', '.png'],
  ['image/webp', '.webp'],
  ['image/gif', '.gif'],
])

export const MAX_IMAGE_UPLOAD_BYTES = 5 * 1024 * 1024

const MAGIC_BYTES: Map<string, Uint8Array[]> = new Map([
  ['image/jpeg', [new Uint8Array([0xFF, 0xD8, 0xFF])]],
  ['image/png', [new Uint8Array([0x89, 0x50, 0x4E, 0x47])]],
  ['image/gif', [new Uint8Array([0x47, 0x49, 0x46])]],
  ['image/webp', [
    new Uint8Array([0x52, 0x49, 0x46, 0x46]),
  ]],
])

async function bufferFromFile(file: File): Promise<ArrayBuffer> {
  return file.slice(0, 12).arrayBuffer()
}

function matchesMagic(buffer: ArrayBuffer, mimeType: string): boolean {
  const signatures = MAGIC_BYTES.get(mimeType)
  if (!signatures) return false
  const view = new Uint8Array(buffer)
  return signatures.some((sig) => {
    if (view.length < sig.length) return false
    return sig.every((byte, i) => view[i] === byte)
  })
}

export async function validateImageUpload(file: File): Promise<{ ok: true; extension: string } | { ok: false; error: string }> {
  if (file.size <= 0) return { ok: false, error: 'File is empty' }
  if (file.size > MAX_IMAGE_UPLOAD_BYTES) return { ok: false, error: 'Image must be 5 MB or smaller' }

  const extension = IMAGE_TYPES.get(file.type)
  if (!extension) return { ok: false, error: 'Only JPG, PNG, WEBP, or GIF images are accepted' }

  const buffer = await bufferFromFile(file)
  if (!matchesMagic(buffer, file.type)) {
    return { ok: false, error: 'File content does not match the declared image type' }
  }

  return { ok: true, extension }
}
