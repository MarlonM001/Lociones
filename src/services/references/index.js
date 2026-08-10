import { putReferenceRecord, getAllReferenceRecords, deleteReferenceRecord } from './db'
import { REFERENCE_STATUSES } from './statuses'

const MAX_FILE_SIZE_MB = 100

function toPublicReference(record) {
  return {
    id: record.id,
    title: record.title,
    description: record.description,
    city: record.city,
    status: record.status ?? REFERENCE_STATUSES.PENDING,
    createdBy: record.createdBy,
    createdAt: record.createdAt,
    // URL temporal solo válida en esta pestaña/sesión del navegador — cuando
    // exista backend, este campo pasa a ser la URL real del archivo subido.
    videoUrl: URL.createObjectURL(record.videoBlob),
  }
}

export async function addReference({ title, description, city, file, createdBy }) {
  if (!file) {
    throw new Error('Selecciona un video para subir.')
  }
  if (!file.type.startsWith('video/')) {
    throw new Error('El archivo debe ser un video.')
  }
  if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
    throw new Error(`El video no debe superar ${MAX_FILE_SIZE_MB}MB.`)
  }

  const existing = await getAllReferenceRecords()
  const record = {
    id: existing.reduce((max, item) => Math.max(max, item.id), 0) + 1,
    title: title.trim(),
    description: description?.trim() || '',
    city: city?.trim() || '',
    videoBlob: file,
    status: REFERENCE_STATUSES.PENDING,
    createdBy: createdBy ?? null,
    createdAt: new Date().toISOString(),
  }

  await putReferenceRecord(record)
  return toPublicReference(record)
}

/** Galería pública: solo videos ya aprobados por el admin. */
export async function getReferences() {
  const records = await getAllReferenceRecords()
  return records
    .filter((record) => record.status === REFERENCE_STATUSES.APPROVED)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map(toPublicReference)
}

/** Cola de moderación del admin: todos los estados. */
export async function getAllReferencesAdmin() {
  const records = await getAllReferenceRecords()
  return records
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map(toPublicReference)
}

/** Videos subidos por un cliente en particular, en cualquier estado — para que pueda ver qué pasó con lo que subió. */
export async function getReferencesByUser(userId) {
  const records = await getAllReferenceRecords()
  return records
    .filter((record) => record.createdBy === userId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map(toPublicReference)
}

export async function updateReferenceStatus(id, status) {
  const records = await getAllReferenceRecords()
  const record = records.find((item) => item.id === Number(id))
  if (!record) throw new Error('Referencia no encontrada.')

  const updated = { ...record, status }
  await putReferenceRecord(updated)
  return toPublicReference(updated)
}

export async function deleteReference(id) {
  await deleteReferenceRecord(id)
}
