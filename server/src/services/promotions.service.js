import { pool } from '../db/pool.js'

function toPublicBanner(row) {
  return {
    enabled: row.enabled,
    message: row.message,
    linkLabel: row.link_label,
    linkTo: row.link_to,
    expiresAt: row.expires_at ? row.expires_at.toISOString().slice(0, 10) : '',
  }
}

async function ensureBannerRow() {
  const { rows } = await pool.query(
    `INSERT INTO promo_banner (id) VALUES (1)
     ON CONFLICT (id) DO NOTHING
     RETURNING *`,
  )
  if (rows[0]) return rows[0]
  const { rows: existing } = await pool.query('SELECT * FROM promo_banner WHERE id = 1')
  return existing[0]
}

export async function getPromoBanner() {
  const row = await ensureBannerRow()
  return toPublicBanner(row)
}

export async function savePromoBanner({ enabled, message, linkLabel, linkTo, expiresAt }) {
  await ensureBannerRow()
  const { rows } = await pool.query(
    `UPDATE promo_banner
     SET enabled = $1, message = $2, link_label = $3, link_to = $4, expires_at = $5, updated_at = NOW()
     WHERE id = 1
     RETURNING *`,
    [Boolean(enabled), message?.trim() || '', linkLabel?.trim() || '', linkTo?.trim() || '', expiresAt || null],
  )
  return toPublicBanner(rows[0])
}
