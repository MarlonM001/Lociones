import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import 'dotenv/config'
import pg from 'pg'

const __dirname = dirname(fileURLToPath(import.meta.url))

async function main() {
  const files = readdirSync(__dirname)
    .filter((file) => file.endsWith('.sql'))
    .sort()

  if (files.length === 0) {
    console.log('No hay archivos .sql en migrations/.')
    return
  }

  const client = new pg.Client({ connectionString: process.env.DATABASE_URL })
  await client.connect()

  try {
    for (const file of files) {
      const sql = readFileSync(join(__dirname, file), 'utf-8')
      console.log(`Ejecutando ${file}...`)
      await client.query(sql)
    }
    console.log('Migraciones aplicadas correctamente.')
  } finally {
    await client.end()
  }
}

main().catch((error) => {
  console.error('Error ejecutando migraciones:', error)
  process.exit(1)
})
