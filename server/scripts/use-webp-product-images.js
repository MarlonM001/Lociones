import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'

/**
 * Corrección puntual: las fotos de producto de public/images/products se
 * pasaron a WebP (scripts/optimize-images.py) y los originales PNG/JPG se
 * borraron. Los productos ya sembrados todavía apuntan a los nombres viejos.
 *
 * Cambia `image` y cada URL de `images` a su versión .webp, pero solo si ese
 * archivo existe en public/ (así se puede correr más de una vez sin riesgo y
 * no toca las fotos que subió el admin a /uploads).
 */

const PUBLIC_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../public')

function toWebp(url) {
  if (typeof url !== 'string' || !url.startsWith('/images/products/')) return url
  const webp = url.replace(/\.(png|jpe?g)$/i, '.webp')
  return webp !== url && fs.existsSync(path.join(PUBLIC_DIR, webp)) ? webp : url
}

const client = new pg.Client({ connectionString: process.env.DATABASE_URL })

async function main() {
  await client.connect()

  const { rows } = await client.query('SELECT id, image, images FROM products')
  let updated = 0

  for (const row of rows) {
    const image = toWebp(row.image)
    const images = Array.isArray(row.images) ? row.images.map(toWebp) : row.images
    if (image === row.image && JSON.stringify(images) === JSON.stringify(row.images)) continue

    await client.query('UPDATE products SET image = $1, images = $2 WHERE id = $3', [
      image,
      images === null ? null : JSON.stringify(images),
      row.id,
    ])
    updated += 1
  }

  console.log(`Productos actualizados a WebP: ${updated} de ${rows.length}.`)
  await client.end()
}

main().catch((error) => {
  console.error('Error:', error)
  process.exit(1)
})
