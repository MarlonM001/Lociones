import { apiFetch, buildFormData, resolveMediaUrl } from '../api/client'

/**
 * Capa de referencias (videos y fotos de entrega). Habla con la API real
 * (`server/`); el archivo se sube como multipart y el backend devuelve la
 * URL pública ya servida desde `/uploads/references`.
 */

function toPublicReference(reference) {
  // `mediaUrl`/`mediaType` reemplazan a `videoUrl` desde que también hay fotos.
  return {
    ...reference,
    mediaType: reference.mediaType ?? 'video',
    mediaUrl: resolveMediaUrl(reference.mediaUrl ?? reference.videoUrl),
  }
}

export const MAX_IMAGES_PER_USER = 2

export async function addReference({ title, description, city, file }) {
  const reference = await apiFetch('/api/references', {
    method: 'POST',
    isFormData: true,
    body: buildFormData({ title, description, city, media: file }),
  })
  return toPublicReference(reference)
}

export async function getReferences() {
  const references = await apiFetch('/api/references')
  return references.map(toPublicReference)
}

export async function getAllReferencesAdmin() {
  const references = await apiFetch('/api/references/admin')
  return references.map(toPublicReference)
}

export async function getReferencesByUser() {
  const references = await apiFetch('/api/references/mine')
  return references.map(toPublicReference)
}

export async function updateReferenceStatus(id, status) {
  const reference = await apiFetch(`/api/references/${id}/status`, {
    method: 'PATCH',
    body: { status },
  })
  return toPublicReference(reference)
}

export async function deleteReference(id) {
  await apiFetch(`/api/references/${id}`, { method: 'DELETE' })
}
