import { pool, withTransaction } from '../db/pool.js'
import { ApiError } from '../utils/ApiError.js'
import { slugify } from '../utils/slugify.js'

/**
 * `status` en la tabla solo distingue 'active' de 'cancelled' (decisión del
 * admin). La fase real que ve el cliente se calcula acá a partir de
 * starts_at/ends_at porque no hay tarea programada (cron) en este backend:
 * una subasta "se cierra sola" en el sentido de que, apenas alguien la
 * consulta después de `ends_at`, se le muestra como cerrada.
 */
export function computePhase(row, now = new Date()) {
  if (row.status === 'cancelled') return 'cancelled'
  if (now < row.starts_at) return 'scheduled'
  if (now <= row.ends_at) return 'active'
  return 'closed'
}

async function ensureConfigRow(db = pool) {
  const { rows } = await db.query(
    `INSERT INTO auction_config (id) VALUES (1) ON CONFLICT (id) DO NOTHING RETURNING *`,
  )
  if (rows[0]) return rows[0]
  const { rows: existing } = await db.query('SELECT * FROM auction_config WHERE id = 1')
  return existing[0]
}

export async function getAuctionConfig() {
  const row = await ensureConfigRow()
  return { enabled: row.enabled }
}

export async function setAuctionConfig(enabled) {
  await ensureConfigRow()
  const { rows } = await pool.query(
    `UPDATE auction_config SET enabled = $1, updated_at = NOW() WHERE id = 1 RETURNING *`,
    [Boolean(enabled)],
  )
  return { enabled: rows[0].enabled }
}

async function attachExtras(auctionRows, currentUserId, db = pool) {
  if (auctionRows.length === 0) return []
  const ids = auctionRows.map((row) => row.id)

  const { rows: itemRows } = await db.query(
    `SELECT ai.auction_id, ai.product_id, ai.quantity, p.name, p.slug, p.image, p.price
     FROM auction_items ai
     JOIN products p ON p.id = ai.product_id
     WHERE ai.auction_id = ANY($1)
     ORDER BY ai.id ASC`,
    [ids],
  )
  const itemsByAuction = new Map()
  for (const item of itemRows) {
    if (!itemsByAuction.has(item.auction_id)) itemsByAuction.set(item.auction_id, [])
    itemsByAuction.get(item.auction_id).push({
      productId: item.product_id,
      quantity: item.quantity,
      product: { id: item.product_id, name: item.name, slug: item.slug, image: item.image, price: item.price },
    })
  }

  const { rows: bidStats } = await db.query(
    `SELECT auction_id, COUNT(*)::int AS bid_count, MAX(amount) AS top_amount
     FROM auction_bids WHERE auction_id = ANY($1) GROUP BY auction_id`,
    [ids],
  )
  const statsByAuction = new Map(bidStats.map((row) => [row.auction_id, row]))

  let leadingByAuction = new Map()
  if (currentUserId) {
    const { rows: leaderRows } = await db.query(
      `SELECT DISTINCT ON (auction_id) auction_id, user_id, amount
       FROM auction_bids WHERE auction_id = ANY($1)
       ORDER BY auction_id, amount DESC, created_at ASC`,
      [ids],
    )
    leadingByAuction = new Map(leaderRows.map((row) => [row.auction_id, row]))
  }

  return auctionRows.map((row) => {
    const stats = statsByAuction.get(row.id)
    const bidCount = stats?.bid_count ?? 0
    const currentPrice = stats?.top_amount ?? row.starting_price
    // Sin incremento fijo: cada quien puja lo que quiera mientras supere la puja más alta (pesos enteros).
    const nextMinBid = bidCount > 0 ? currentPrice + 1 : row.starting_price
    const leader = leadingByAuction.get(row.id)

    return {
      id: row.id,
      title: row.title,
      slug: row.slug,
      description: row.description ?? '',
      image: row.image,
      kind: row.kind,
      items: itemsByAuction.get(row.id) ?? [],
      startingPrice: row.starting_price,
      currentPrice,
      nextMinBid,
      bidCount,
      phase: computePhase(row),
      startsAt: row.starts_at,
      endsAt: row.ends_at,
      isUserLeading: Boolean(currentUserId && leader && leader.user_id === currentUserId),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }
  })
}

export async function listAuctions({ includeCancelled = false, currentUserId } = {}) {
  const where = includeCancelled ? '' : `WHERE status != 'cancelled'`
  const { rows } = await pool.query(`SELECT * FROM auctions ${where} ORDER BY starts_at DESC`)
  return attachExtras(rows, currentUserId)
}

export async function getAuctionBySlug(slug, currentUserId) {
  const { rows } = await pool.query('SELECT * FROM auctions WHERE slug = $1', [slug])
  if (!rows[0]) return null
  const [auction] = await attachExtras(rows, currentUserId)
  return auction
}

export async function getAuctionById(id) {
  const { rows } = await pool.query('SELECT * FROM auctions WHERE id = $1', [id])
  if (!rows[0]) return null
  const [auction] = await attachExtras(rows)
  return auction
}

function validateAuctionPayload({ title, startingPrice, startsAt, endsAt, items }) {
  if (!title?.trim()) throw ApiError.badRequest('El título es obligatorio.')
  if (!Number.isFinite(startingPrice) || startingPrice < 0) {
    throw ApiError.badRequest('El precio inicial no es válido.')
  }
  const start = new Date(startsAt)
  const end = new Date(endsAt)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
    throw ApiError.badRequest('La fecha de cierre debe ser posterior a la fecha de inicio.')
  }
  if (!Array.isArray(items) || items.length === 0) {
    throw ApiError.badRequest('Selecciona al menos un producto para la subasta.')
  }
}

export async function createAuction({
  title,
  description,
  imageUrl,
  kind,
  startingPrice,
  startsAt,
  endsAt,
  items,
}) {
  const normalizedItems = (items ?? []).map((item) => ({
    productId: Number(item.productId),
    quantity: Number(item.quantity) || 1,
  }))
  const normalizedStartingPrice = Number(startingPrice)

  validateAuctionPayload({
    title,
    startingPrice: normalizedStartingPrice,
    startsAt,
    endsAt,
    items: normalizedItems,
  })

  return withTransaction(async (client) => {
    const { rows } = await client.query(
      `INSERT INTO auctions (title, slug, description, image, kind, starting_price, starts_at, ends_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        title.trim(),
        `tmp-${Date.now()}`,
        description?.trim() || '',
        imageUrl ?? null,
        kind === 'combo' ? 'combo' : 'product',
        normalizedStartingPrice,
        startsAt,
        endsAt,
      ],
    )
    const auction = rows[0]
    const slug = slugify(`${title}-${auction.id}`)
    await client.query('UPDATE auctions SET slug = $1 WHERE id = $2', [slug, auction.id])

    for (const item of normalizedItems) {
      await client.query(
        `INSERT INTO auction_items (auction_id, product_id, quantity) VALUES ($1, $2, $3)`,
        [auction.id, item.productId, item.quantity],
      )
    }

    const [publicAuction] = await attachExtras([{ ...auction, slug }], null, client)
    return publicAuction
  })
}

export async function updateAuction(id, updates) {
  const existing = await getAuctionById(id)
  if (!existing) throw ApiError.notFound('Subasta no encontrada.')

  const hasBids = existing.bidCount > 0
  const fields = []
  const params = []

  function set(column, value) {
    params.push(value)
    fields.push(`${column} = $${params.length}`)
  }

  if ('title' in updates) set('title', updates.title.trim())
  if ('description' in updates) set('description', updates.description?.trim() || '')
  if ('imageUrl' in updates && updates.imageUrl) set('image', updates.imageUrl)
  if ('startsAt' in updates && !hasBids) set('starts_at', updates.startsAt)
  if ('endsAt' in updates) set('ends_at', updates.endsAt)
  if ('startingPrice' in updates && !hasBids) set('starting_price', Number(updates.startingPrice))

  if (fields.length === 0) return existing

  set('updated_at', new Date().toISOString())
  params.push(id)
  await pool.query(`UPDATE auctions SET ${fields.join(', ')} WHERE id = $${params.length}`, params)

  if ('items' in updates && !hasBids && Array.isArray(updates.items)) {
    await withTransaction(async (client) => {
      await client.query('DELETE FROM auction_items WHERE auction_id = $1', [id])
      for (const item of updates.items) {
        await client.query(
          `INSERT INTO auction_items (auction_id, product_id, quantity) VALUES ($1, $2, $3)`,
          [id, Number(item.productId), Number(item.quantity) || 1],
        )
      }
    })
  }

  return getAuctionById(id)
}

export async function cancelAuction(id) {
  const { rows } = await pool.query(
    `UPDATE auctions SET status = 'cancelled', updated_at = NOW() WHERE id = $1 RETURNING id`,
    [id],
  )
  if (!rows[0]) throw ApiError.notFound('Subasta no encontrada.')
}

/**
 * Borra la subasta y, en cascada (FK ON DELETE CASCADE), sus items y pujas.
 * A diferencia de cancelar (que conserva el historial), esto es permanente —
 * pensado para que el admin limpie subastas de prueba, no para uso normal
 * con pujas reales en curso.
 */
export async function deleteAuction(id) {
  const { rowCount } = await pool.query('DELETE FROM auctions WHERE id = $1', [id])
  if (rowCount === 0) throw ApiError.notFound('Subasta no encontrada.')
}

// Tope de una puja: evita montos absurdos que desbordan la columna o arruinan la subasta por error.
const MAX_BID_AMOUNT = 100_000_000

export async function placeBid({ auctionId, userId, amount }) {
  const normalizedAmount = Number(amount)
  if (!Number.isInteger(normalizedAmount) || normalizedAmount <= 0 || normalizedAmount > MAX_BID_AMOUNT) {
    throw ApiError.badRequest('El monto de la puja no es válido.')
  }

  const config = await getAuctionConfig()
  if (!config.enabled) throw ApiError.forbidden('El módulo de subastas está deshabilitado.')

  return withTransaction(async (client) => {
    const { rows } = await client.query('SELECT * FROM auctions WHERE id = $1 FOR UPDATE', [auctionId])
    const auction = rows[0]
    if (!auction) throw ApiError.notFound('Subasta no encontrada.')
    if (computePhase(auction) !== 'active') {
      throw ApiError.badRequest('Esta subasta no está activa en este momento.')
    }

    const { rows: topRows } = await client.query(
      'SELECT amount FROM auction_bids WHERE auction_id = $1 ORDER BY amount DESC LIMIT 1',
      [auctionId],
    )
    const currentPrice = topRows[0]?.amount ?? auction.starting_price
    // Sin incremento fijo: basta con superar la puja más alta (o igualar el precio inicial si es la primera).
    const minRequired = topRows[0] ? currentPrice + 1 : auction.starting_price

    if (normalizedAmount < minRequired) {
      const cop = (value) => `${value.toLocaleString('es-CO')}`
      throw ApiError.badRequest(
        topRows[0]
          ? `Tu puja debe ser mayor a la puja actual de ${cop(currentPrice)}.`
          : `La puja mínima es ${cop(minRequired)}.`,
      )
    }

    const { rows: inserted } = await client.query(
      'INSERT INTO auction_bids (auction_id, user_id, amount) VALUES ($1, $2, $3) RETURNING id, created_at',
      [auctionId, userId, normalizedAmount],
    )
    const { rows: bidderRows } = await client.query('SELECT name FROM users WHERE id = $1', [userId])

    const [publicAuction] = await attachExtras([auction], userId, client)
    // `lastBid` es lo que se anuncia a los demás participantes: con el nombre abreviado, nunca datos de contacto.
    return {
      ...publicAuction,
      lastBid: {
        id: inserted[0].id,
        bidder: maskBidderName(bidderRows[0]?.name),
        amount: normalizedAmount,
        createdAt: inserted[0].created_at,
      },
    }
  })
}

/**
 * Nombre como lo ven los demás participantes: el nombre y la inicial del apellido ("Ana P."). Así se
 * sabe que las pujas son de personas reales sin exponer su identidad completa ni ningún dato de contacto.
 */
export function maskBidderName(name) {
  const parts = String(name ?? '').trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'Participante'
  const first = parts[0].slice(0, 20)
  const initial = parts[1]?.[0]
  return initial ? `${first} ${initial.toUpperCase()}.` : first
}

const FEED_LIMIT = 30

/** Últimas pujas de una subasta para mostrarlas a todo el público, de la más reciente a la más antigua. */
export async function getPublicBidFeed(auctionId) {
  const { rows } = await pool.query(
    `SELECT ab.id, ab.amount, ab.created_at, u.name
     FROM auction_bids ab
     JOIN users u ON u.id = ab.user_id
     WHERE ab.auction_id = $1
     ORDER BY ab.id DESC
     LIMIT $2`,
    [auctionId, FEED_LIMIT],
  )
  return rows.map((row) => ({
    id: row.id,
    bidder: maskBidderName(row.name),
    amount: row.amount,
    createdAt: row.created_at,
  }))
}

export async function getAuctionBidsAdmin(auctionId) {
  const { rows } = await pool.query(
    `SELECT ab.id, ab.amount, ab.created_at, u.id AS user_id, u.name, u.phone, u.email
     FROM auction_bids ab
     JOIN users u ON u.id = ab.user_id
     WHERE ab.auction_id = $1
     ORDER BY ab.amount DESC, ab.created_at ASC`,
    [auctionId],
  )
  return rows.map((row) => ({
    id: row.id,
    amount: row.amount,
    createdAt: row.created_at,
    bidder: { id: row.user_id, name: row.name, phone: row.phone, email: row.email },
  }))
}
