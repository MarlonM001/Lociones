import { spawn } from 'node:child_process'
import { unlink } from 'node:fs/promises'
import path from 'node:path'
import { ApiError } from './ApiError.js'

const FFMPEG_BIN = process.env.FFMPEG_PATH || 'ffmpeg'

/**
 * Los celulares graban en códecs que Chrome/Firefox no siempre pueden
 * reproducir (ej. HEVC/H.265, el default de iPhone) aunque el contenedor sea
 * .mp4 válido — sube bien pero el <video> del navegador no lo muestra. Se
 * normaliza todo a H.264/AAC, que reproduce en cualquier navegador.
 *
 * Reemplaza `inputPath` por un archivo `.mp4` nuevo y devuelve su nombre.
 */
export async function transcodeToH264(inputPath) {
  const dir = path.dirname(inputPath)
  const base = path.basename(inputPath, path.extname(inputPath))
  const outputPath = path.join(dir, `${base}-h264.mp4`)

  await new Promise((resolve, reject) => {
    const ffmpeg = spawn(FFMPEG_BIN, [
      '-y',
      '-i', inputPath,
      '-c:v', 'libx264',
      '-profile:v', 'main',
      '-pix_fmt', 'yuv420p',
      '-preset', 'veryfast',
      '-crf', '23',
      '-c:a', 'aac',
      '-b:a', '128k',
      '-movflags', '+faststart',
      outputPath,
    ])

    let stderr = ''
    ffmpeg.stderr.on('data', (chunk) => { stderr += chunk })
    ffmpeg.on('error', (error) => {
      if (error.code === 'ENOENT') {
        reject(ApiError.badRequest('El servidor no tiene ffmpeg instalado; no se puede procesar el video.'))
      } else {
        reject(error)
      }
    })
    ffmpeg.on('close', (code) => {
      if (code === 0) resolve()
      else reject(ApiError.badRequest(`No se pudo procesar el video (¿archivo corrupto o formato no soportado?): ${stderr.slice(-500)}`))
    })
  })

  await unlink(inputPath)
  return path.basename(outputPath)
}
