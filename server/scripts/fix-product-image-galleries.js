import 'dotenv/config'
import pg from 'pg'

/**
 * Corrección puntual (no repetible) de datos sembrados antes de que
 * seed.js supiera armar bien el arreglo `images`:
 *
 * 1. Cada producto tenía `images = [foto, foto]` (la misma foto dos
 *    veces), lo que mostraba un selector de "2 fotos" falso en la ficha
 *    de producto. Se deja `images = [foto]`.
 * 2. "Amber Oud Gold Edition" y "Xerjoff Erba Pura" existían DOS VECES en
 *    el catálogo (una con foto de botella, otra con " Caja" en el nombre
 *    y foto de la caja) — la misma loción vendida como si fueran dos
 *    productos distintos. Se fusionan en un solo producto con las dos
 *    fotos reales (botella + caja) como ángulos, y se borra el duplicado.
 */

const MERGES = [
  { keepName: 'Amber Oud Gold Edition', dropName: 'Amber Oud Gold Edition Caja' },
  { keepName: 'Xerjoff Erba Pura', dropName: 'Xerjoff Erba Pura Caja' },
]

const client = new pg.Client({ connectionString: process.env.DATABASE_URL })

async function findByPrefix(name) {
  const { rows } = await client.query('SELECT id, name, image FROM products WHERE name ILIKE $1', [`${name} %`])
  return rows
}

async function main() {
  await client.connect()

  const mergedIds = new Set()

  for (const { keepName, dropName } of MERGES) {
    const [keepRows, dropRows] = await Promise.all([findByPrefix(keepName), findByPrefix(dropName)])

    if (keepRows.length === 0 || dropRows.length === 0) {
      console.log(`Omitido (no encontrado): "${keepName}" / "${dropName}"`)
      continue
    }

    for (const keep of keepRows) {
      const drop = dropRows.find((row) => row.name.replace(' Caja', '') === keep.name)
      if (!drop) continue

      const { rows: refs } = await client.query('SELECT COUNT(*) FROM order_items WHERE product_id = $1', [drop.id])
      if (Number(refs[0].count) > 0) {
        console.log(`No se puede fusionar "${drop.name}" (id ${drop.id}): tiene pedidos asociados.`)
        continue
      }

      await client.query('UPDATE products SET images = $1 WHERE id = $2', [
        JSON.stringify([keep.image, drop.image]),
        keep.id,
      ])
      await client.query('DELETE FROM products WHERE id = $1', [drop.id])
      mergedIds.add(keep.id)
      console.log(`Fusionado: "${drop.name}" (id ${drop.id}) -> "${keep.name}" (id ${keep.id}), 2 ángulos.`)
    }
  }

  const keepIds = [...mergedIds]
  const { rowCount } = await client.query(
    `UPDATE products SET images = jsonb_build_array(image) WHERE NOT (id = ANY($1::int[]))`,
    [keepIds],
  )
  console.log(`Normalizados a 1 foto: ${rowCount} productos.`)

  await client.end()
}

main().catch((error) => {
  console.error('Error:', error)
  process.exit(1)
})
