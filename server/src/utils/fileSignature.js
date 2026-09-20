import fs from 'node:fs/promises'

/**
 * Reconoce qué es un archivo mirando sus primeros bytes ("firma"), sin fiarse del tipo ni de la
 * extensión que declara quien lo sube (ambos los controla el cliente). Devuelve 'jpeg', 'png',
 * 'webp', 'video' o null si no es nada de eso.
 */
export async function detectFileKind(filePath) {
  const handle = await fs.open(filePath, 'r')
  try {
    const { bytesRead, buffer } = await handle.read(Buffer.alloc(16), 0, 16, 0)
    const bytes = buffer.subarray(0, bytesRead)
    const ascii = (from, to) => bytes.toString('latin1', from, to)

    if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'jpeg'
    if (bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
      return 'png'
    }
    if (bytes.length >= 12 && ascii(0, 4) === 'RIFF') {
      if (ascii(8, 12) === 'WEBP') return 'webp'
      if (ascii(8, 12) === 'AVI ') return 'video'
    }
    // MP4, MOV, M4V y 3GP: caja "ftyp" (o, en QuickTime antiguo, moov/mdat/wide/free) a partir del byte 4.
    if (bytes.length >= 12 && ['ftyp', 'moov', 'mdat', 'wide', 'free', 'skip'].includes(ascii(4, 8))) return 'video'
    // WebM y MKV (Matroska/EBML).
    if (bytes.length >= 4 && bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3) return 'video'
    return null
  } finally {
    await handle.close()
  }
}

export const IMAGE_KINDS = new Set(['jpeg', 'png', 'webp'])
