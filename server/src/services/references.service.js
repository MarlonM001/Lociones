import { pool } from '../db/pool.js'
import { ApiError } from '../utils/ApiError.js'
import { REFERENCE_STATUSES, REFERENCE_STATUS_VALUES } from '../utils/referenceStatuses.js'

function toPublicReference(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? '',
    city: row.city ?? '',
    status: row.status,
    createdBy: row.created_by,
    createdAt: row.created_at,
    mediaType: row.media_type,
    mediaUrl: row.video_url,
    // Igual que mediaUrl; se conserva para el frontend anterior a las fotos.
    videoUrl: row.video_url,
  }
}

export const MAX_IMAGES_PER_USER = 2
const TEXT_LIMITS = { title: 120, description: 600, city: 100 }

export async function countImagesByUser(userId) {
  const { rows } = await pool.query(
    `SELECT COUNT(*)::int AS total FROM delivery_references WHERE created_by = $1 AND media_type = 'image'`,
    [userId],
  )
  return rows[0].total
}

/**
 * Cuántas fotos puede subir cada cuenta (el admin no tiene tope). Para liberar cupo basta con eliminar
 * una referencia propia.
 */
export async function assertCanUpload({ userId, isAdmin }) {
  if (isAdmin) return
  if ((await countImagesByUser(userId)) >= MAX_IMAGES_PER_USER) {
    throw ApiError.conflict(
      `Ya subiste ${MAX_IMAGES_PER_USER} fotos, que es el máximo por cuenta. Elimina una para subir otra.`,
    )
  }
}

export async function addReference({ title, description, city, mediaUrl, createdBy, isAdmin = false }) {
  if (!title?.trim()) throw ApiError.badRequest('El título es obligatorio.')
  for (const [value, label, max] of [
    [title, 'El título', TEXT_LIMITS.title],
    [description, 'La descripción', TEXT_LIMITS.description],
    [city, 'La ciudad', TEXT_LIMITS.city],
  ]) {
    if (typeof value === 'string' && value.trim().length > max) {
      throw ApiError.badRequest(`${label} es demasiado largo (máximo ${max} caracteres).`)
    }
  }
  if (!mediaUrl) throw ApiError.badRequest('Selecciona una foto para subir.')

  if (!isAdmin && (await countImagesByUser(createdBy)) >= MAX_IMAGES_PER_USER) {
    throw ApiError.conflict(
      `Ya subiste ${MAX_IMAGES_PER_USER} fotos, que es el máximo por cuenta. Elimina una para subir otra.`,
    )
  }

  const { rows } = await pool.query(
    `INSERT INTO delivery_references (title, description, city, video_url, media_type, status, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [title.trim(), description?.trim() || '', city?.trim() || '', mediaUrl, 'image', REFERENCE_STATUSES.PENDING, createdBy ?? null],
  )
  return toPublicReference(rows[0])
}

export async function getApprovedReferences() {
  const { rows } = await pool.query(
    'SELECT * FROM delivery_references WHERE status = $1 ORDER BY created_at DESC',
    [REFERENCE_STATUSES.APPROVED],
  )
  return rows.map(toPublicReference)
}

export async function getAllReferencesAdmin() {
  const { rows } = await pool.query('SELECT * FROM delivery_references ORDER BY created_at DESC')
  return rows.map(toPublicReference)
}

export async function getReferencesByUser(userId) {
  const { rows } = await pool.query(
    'SELECT * FROM delivery_references WHERE created_by = $1 ORDER BY created_at DESC',
    [userId],
  )
  return rows.map(toPublicReference)
}

export async function updateReferenceStatus(id, status) {
  if (!REFERENCE_STATUS_VALUES.includes(status)) {
    throw ApiError.badRequest('Estado de referencia inválido.')
  }
  const { rows } = await pool.query(
    'UPDATE delivery_references SET status = $1 WHERE id = $2 RETURNING *',
    [status, id],
  )
  if (!rows[0]) throw ApiError.notFound('Referencia no encontrada.')
  return toPublicReference(rows[0])
}

/** El dueño puede borrar su propia referencia; el admin, cualquiera. Devuelve la URL del archivo borrado. */
export async function deleteReference(id, { userId, isAdmin }) {
  const { rows } = await pool.query('SELECT created_by, video_url FROM delivery_references WHERE id = $1', [id])
  if (!rows[0]) throw ApiError.notFound('Referencia no encontrada.')
  if (!isAdmin && rows[0].created_by !== userId) throw ApiError.forbidden()
  await pool.query('DELETE FROM delivery_references WHERE id = $1', [id])
  return rows[0].video_url
}
