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

export async function countImagesByUser(userId) {
  const { rows } = await pool.query(
    `SELECT COUNT(*)::int AS total FROM delivery_references WHERE created_by = $1 AND media_type = 'image'`,
    [userId],
  )
  return rows[0].total
}

export async function addReference({ title, description, city, mediaUrl, mediaType = 'video', createdBy, isAdmin = false }) {
  if (!title?.trim()) throw ApiError.badRequest('El título es obligatorio.')
  if (!mediaUrl) throw ApiError.badRequest('Selecciona un video o una foto para subir.')
  if (!['video', 'image'].includes(mediaType)) throw ApiError.badRequest('Tipo de archivo inválido.')

  if (mediaType === 'image' && !isAdmin && (await countImagesByUser(createdBy)) >= MAX_IMAGES_PER_USER) {
    throw ApiError.conflict(
      `Ya subiste ${MAX_IMAGES_PER_USER} fotos, que es el máximo por cuenta. Elimina una para subir otra.`,
    )
  }

  const { rows } = await pool.query(
    `INSERT INTO delivery_references (title, description, city, video_url, media_type, status, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [title.trim(), description?.trim() || '', city?.trim() || '', mediaUrl, mediaType, REFERENCE_STATUSES.PENDING, createdBy ?? null],
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
