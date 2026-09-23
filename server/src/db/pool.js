import pg from 'pg'

// max bajo a propósito: en Vercel Functions cada instancia mantiene su propio pool, y el
// pooler de Supabase (Supavisor) ya multiplexa las conexiones reales por debajo.
export const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 3 })

export async function withTransaction(fn) {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const result = await fn(client)
    await client.query('COMMIT')
    return result
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}
