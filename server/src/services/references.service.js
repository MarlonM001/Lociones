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
    videoUrl: row.video_url,
  }
}

export async function addReference({ title, description, city, videoUrl, createdBy }) {
  if (!title?.trim()) throw ApiError.badRequest('El título es obligatorio.')
  if (!videoUrl) throw ApiError.badRequest('Selecciona un video para subir.')

  const { rows } = await pool.query(
    `INSERT INTO delivery_references (title, description, city, video_url, status, created_by)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [title.trim(), description?.trim() || '', city?.trim() || '', videoUrl, REFERENCE_STATUSES.PENDING, createdBy ?? null],
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

export async function deleteReference(id) {
  const { rowCount } = await pool.query('DELETE FROM delivery_references WHERE id = $1', [id])
  if (rowCount === 0) throw ApiError.notFound('Referencia no encontrada.')
}
