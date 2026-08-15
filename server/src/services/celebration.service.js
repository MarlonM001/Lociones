import { pool } from '../db/pool.js'

function toPublicConfig(row) {
  return { enabled: row.enabled }
}

async function ensureConfigRow() {
  const { rows } = await pool.query(
    `INSERT INTO celebration_config (id) VALUES (1)
     ON CONFLICT (id) DO NOTHING
     RETURNING *`,
  )
  if (rows[0]) return rows[0]
  const { rows: existing } = await pool.query('SELECT * FROM celebration_config WHERE id = 1')
  return existing[0]
}

export async function getCelebrationConfig() {
  const row = await ensureConfigRow()
  return toPublicConfig(row)
}

export async function saveCelebrationConfig({ enabled }) {
  await ensureConfigRow()
  const { rows } = await pool.query(
    `UPDATE celebration_config SET enabled = $1, updated_at = NOW() WHERE id = 1 RETURNING *`,
    [Boolean(enabled)],
  )
  return toPublicConfig(rows[0])
}
