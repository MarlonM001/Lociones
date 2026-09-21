import { apiFetch, buildFormData, resolveMediaUrl } from '../api/client'

function toPublicAuction(auction) {
  return {
    ...auction,
    image: resolveMediaUrl(auction.image),
    items: (auction.items ?? []).map((item) => ({
      ...item,
      product: { ...item.product, image: resolveMediaUrl(item.product.image) },
    })),
  }
}

export async function getAuctionConfig() {
  return apiFetch('/api/auctions/config')
}

export async function setAuctionConfig(enabled) {
  return apiFetch('/api/auctions/config', { method: 'PUT', body: { enabled } })
}

export async function getAuctions({ includeCancelled = false } = {}) {
  const query = includeCancelled ? '?includeCancelled=true' : ''
  const auctions = await apiFetch(`/api/auctions${query}`)
  return auctions.map(toPublicAuction)
}

export async function getAuctionBySlug(slug) {
  try {
    const auction = await apiFetch(`/api/auctions/${slug}`)
    return toPublicAuction(auction)
  } catch (error) {
    if (error.status === 404) return null
    throw error
  }
}

export async function placeBid(auctionId, amount) {
  const auction = await apiFetch(`/api/auctions/${auctionId}/bids`, {
    method: 'POST',
    body: { amount },
  })
  return toPublicAuction(auction)
}

/** Últimas pujas de una subasta, visibles para todos (nombres abreviados, sin datos de contacto). */
export async function getAuctionFeed(auctionId) {
  return apiFetch(`/api/auctions/${auctionId}/feed`)
}

/** Comentarios de la sala, del más reciente al más antiguo (nombres abreviados). */
export async function getAuctionComments(auctionId) {
  return apiFetch(`/api/auctions/${auctionId}/comments`)
}

export async function postAuctionComment(auctionId, body) {
  return apiFetch(`/api/auctions/${auctionId}/comments`, { method: 'POST', body: { body } })
}

/** Vista del admin: con nombre completo y teléfono de quien comentó. */
export async function getAuctionCommentsAdmin(auctionId) {
  return apiFetch(`/api/auctions/${auctionId}/comments/admin`)
}

export async function deleteAuctionComment(auctionId, commentId) {
  await apiFetch(`/api/auctions/${auctionId}/comments/${commentId}`, { method: 'DELETE' })
}

export async function getAuctionBidsAdmin(auctionId) {
  return apiFetch(`/api/auctions/${auctionId}/bids`)
}

function toAuctionFormData({ title, description, kind, startingPrice, startsAt, endsAt, items, imageFile }) {
  return buildFormData({
    title,
    description,
    kind,
    startingPrice,
    startsAt,
    endsAt,
    items: JSON.stringify(items ?? []),
    ...(imageFile && { image: imageFile }),
  })
}

export async function createAuction(fields) {
  const auction = await apiFetch('/api/auctions', {
    method: 'POST',
    isFormData: true,
    body: toAuctionFormData(fields),
  })
  return toPublicAuction(auction)
}

export async function updateAuction(id, fields) {
  const auction = await apiFetch(`/api/auctions/${id}`, {
    method: 'PATCH',
    isFormData: true,
    body: toAuctionFormData(fields),
  })
  return toPublicAuction(auction)
}

export async function cancelAuction(id) {
  await apiFetch(`/api/auctions/${id}/cancel`, { method: 'POST' })
}

export async function deleteAuction(id) {
  await apiFetch(`/api/auctions/${id}`, { method: 'DELETE' })
}
