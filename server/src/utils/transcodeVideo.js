import { spawn } from 'node:child_process'
import { unlink } from 'node:fs/promises'
import path from 'node:path'
import { ApiError } from './ApiError.js'

const FFMPEG_BIN = process.env.FFMPEG_PATH || 'ffmpeg'

// Límites para que un solo usuario no pueda agotar el procesador del servidor.
const MAX_VIDEO_SECONDS = 180
const TRANSCODE_TIMEOUT_MS = 4 * 60 * 1000
const MAX_CONCURRENT = 1
const MAX_WAITING = 4

let running = 0
const waiting = []

/** Deja pasar de a MAX_CONCURRENT videos; los demás esperan turno y, si la fila se llena, se avisa. */
async function acquireSlot() {
  if (running < MAX_CONCURRENT) {
    running += 1
    return
  }
  if (waiting.length >= MAX_WAITING) {
    throw ApiError.tooManyRequests('Estamos procesando otros videos. Intenta de nuevo en unos minutos.')
  }
  await new Promise((resolve) => waiting.push(resolve))
}

function releaseSlot() {
  const next = waiting.shift()
  if (next) next()
  else running -= 1
}

/**
 * Los celulares graban en códecs que Chrome/Firefox no siempre pueden
 * reproducir (ej. HEVC/H.265, el default de iPhone) aunque el contenedor sea
 * .mp4 válido — sube bien pero el <video> del navegador no lo muestra. Se
 * normaliza todo a H.264/AAC, que reproduce en cualquier navegador.
 *
 * Seguridad: ffmpeg puede abrir direcciones de red o archivos ajenos si el "video" es en realidad
 * una lista de reproducción manipulada. `-protocol_whitelist file,pipe` le prohíbe todo salvo leer
 * el archivo recibido. Además hay tope de duración y de tiempo.
 *
 * Reemplaza `inputPath` por un archivo `.mp4` nuevo y devuelve su nombre.
 */
export async function transcodeToH264(inputPath) {
  const dir = path.dirname(inputPath)
  const base = path.basename(inputPath, path.extname(inputPath))
  const outputPath = path.join(dir, `${base}-h264.mp4`)

  await acquireSlot()
  try {
    await new Promise((resolve, reject) => {
      const ffmpeg = spawn(FFMPEG_BIN, [
        '-nostdin',
        '-y',
        '-protocol_whitelist', 'file,pipe',
        '-i', inputPath,
        '-t', String(MAX_VIDEO_SECONDS),
        '-threads', '2',
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
      let timedOut = false
      const timer = setTimeout(() => {
        timedOut = true
        ffmpeg.kill('SIGKILL')
      }, TRANSCODE_TIMEOUT_MS)

      ffmpeg.stderr.on('data', (chunk) => {
        stderr = (stderr + chunk).slice(-2000)
      })
      ffmpeg.on('error', (error) => {
        clearTimeout(timer)
        if (error.code === 'ENOENT') {
          reject(ApiError.badRequest('El servidor no tiene ffmpeg instalado; no se puede procesar el video.'))
        } else {
          reject(error)
        }
      })
      ffmpeg.on('close', (code) => {
        clearTimeout(timer)
        if (code === 0) return resolve()
        if (timedOut) return reject(ApiError.badRequest('El video tardó demasiado en procesarse. Prueba con uno más corto.'))
        // El detalle técnico va al registro del servidor; al usuario no se le muestra.
        console.error('ffmpeg falló:', stderr)
        reject(ApiError.badRequest('No se pudo procesar el video (¿archivo corrupto o formato no soportado?).'))
      })
    })
  } finally {
    releaseSlot()
  }

  await unlink(inputPath)
  return path.basename(outputPath)
}
