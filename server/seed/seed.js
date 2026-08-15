import 'dotenv/config'
import bcrypt from 'bcryptjs'
import pg from 'pg'
import { CATEGORIES } from '../../src/config/categories.js'
import { ARABIA_CATALOG } from '../../src/data/catalogArabia.js'
import { DAMA_CATALOG } from '../../src/data/catalogDama.js'
import { CABALLERO_CATALOG } from '../../src/data/catalogCaballero.js'
import { ARABIA_IMAGES } from '../../src/data/arabiaImages.js'
import { DAMA_IMAGES } from '../../src/data/damaImages.js'
import { CABALLERO_IMAGES } from '../../src/data/caballeroImages.js'

const client = new pg.Client({ connectionString: process.env.DATABASE_URL })

// Mismo PRNG con semilla fija que src/data/generateProducts.js, para que el
// stock inicial sembrado sea reproducible entre corridas.
function mulberry32(seed) {
  return function random() {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function slugify(text) {
  return text
    .toString()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

const CATALOG_BY_CATEGORY = {
  arabia: ARABIA_CATALOG,
  mujeres: DAMA_CATALOG,
  caballero: CABALLERO_CATALOG,
}

const REAL_IMAGES_BY_CATEGORY = {
  arabia: ARABIA_IMAGES,
  mujeres: DAMA_IMAGES,
  caballero: CABALLERO_IMAGES,
}

function resolveProductImage(categoryId, name) {
  const fileName = REAL_IMAGES_BY_CATEGORY[categoryId]?.[name]
  return fileName ? `/images/products/${categoryId}/${fileName}` : `/images/products/${categoryId}.svg`
}

function buildDescription(name, categoryName, ml, notes) {
  return `${name} es una fragancia de la línea ${categoryName} presentada en frasco de ${ml}ml. ` +
    `Notas destacadas: ${notes.join(', ')}. Alta fijación y larga duración, ideal para uso diario o momentos especiales.`
}

function buildShortDescription(ml, notes) {
  return `${ml}ml — ${notes.slice(0, 3).join(', ')}.`
}

function generateSeedProducts() {
  const random = mulberry32(20260809)
  const products = []
  let autoIncrement = 1
  const usedSlugs = new Set()

  function nextSlug(base, id) {
    let slug = slugify(base)
    if (usedSlugs.has(slug)) slug = `${slug}-${id}`
    usedSlugs.add(slug)
    return slug
  }

  for (const category of CATEGORIES) {
    const catalog = CATALOG_BY_CATEGORY[category.id] ?? []
    for (const entry of catalog) {
      const { name, ml, price, notes } = entry
      const stock = Math.floor(random() * 40)
      const id = autoIncrement
      autoIncrement += 1
      const slug = nextSlug(`${name}-${ml}ml`, id)
      const sku = `${category.id.slice(0, 3).toUpperCase()}-${String(id).padStart(4, '0')}`
      const image = resolveProductImage(category.id, name)

      products.push({
        name: `${name} ${ml}ml`,
        slug,
        categoryId: category.id,
        sku,
        price,
        description: buildDescription(name, category.name, ml, notes),
        shortDescription: buildShortDescription(ml, notes),
        image,
        stock,
      })
    }
  }

  return products
}

async function seedAdmin() {
  const name = process.env.ADMIN_SEED_NAME
  const email = process.env.ADMIN_SEED_EMAIL?.trim().toLowerCase()
  const password = process.env.ADMIN_SEED_PASSWORD

  if (!name || !email || !password) {
    console.log('ADMIN_SEED_* no está completo en .env, se omite la siembra del admin.')
    return
  }

  const passwordHash = await bcrypt.hash(password, 10)
  const { rows } = await client.query('SELECT id FROM users WHERE email = $1', [email])

  if (rows.length > 0) {
    await client.query(
      `UPDATE users SET name = $1, password_hash = $2, role = 'admin', updated_at = NOW() WHERE email = $3`,
      [name, passwordHash, email],
    )
    console.log(`Admin actualizado: ${email}`)
  } else {
    await client.query(
      `INSERT INTO users (name, email, phone, password_hash, role, city, address)
       VALUES ($1, $2, '0000000000', $3, 'admin', '', '')`,
      [name, email, passwordHash],
    )
    console.log(`Admin creado: ${email}`)
  }
}

async function seedCategories() {
  for (const category of CATEGORIES) {
    await client.query(
      `INSERT INTO categories (id, name, slug, description, image, active)
       VALUES ($1, $2, $3, $4, $5, TRUE)
       ON CONFLICT (id) DO UPDATE SET name = $2, slug = $3, description = $4, image = $5`,
      [category.id, category.name, category.slug, category.shortDescription ?? '', category.image ?? ''],
    )
  }
  console.log(`Categorías sembradas: ${CATEGORIES.length}`)
}

async function seedProducts() {
  const { rows } = await client.query('SELECT COUNT(*) FROM products')
  if (Number(rows[0].count) > 0) {
    console.log('La tabla products ya tiene datos, se omite la siembra del catálogo.')
    return
  }

  const products = generateSeedProducts()
  for (const product of products) {
    await client.query(
      `INSERT INTO products (name, slug, category_id, sku, price, description, short_description, image, images, stock, active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, TRUE)`,
      [
        product.name,
        product.slug,
        product.categoryId,
        product.sku,
        product.price,
        product.description,
        product.shortDescription,
        product.image,
        JSON.stringify([product.image, product.image]),
        product.stock,
      ],
    )
  }
  console.log(`Productos sembrados: ${products.length}`)
}

async function seedPromoBanner() {
  await client.query('INSERT INTO promo_banner (id) VALUES (1) ON CONFLICT (id) DO NOTHING')
  console.log('Fila de promo_banner asegurada.')
}

async function main() {
  await client.connect()
  try {
    await seedAdmin()
    await seedCategories()
    await seedProducts()
    await seedPromoBanner()
    console.log('Siembra completada.')
  } finally {
    await client.end()
  }
}

main().catch((error) => {
  console.error('Error en la siembra:', error)
  process.exit(1)
})
