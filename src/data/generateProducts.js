import { CATEGORIES } from '@/config/categories'
import { slugify } from '@/utils/slugify'
import { ARABA_CATALOG } from './catalogAraba'
import { DAMA_CATALOG } from './catalogDama'

// PRNG con semilla fija: los productos deben ser siempre los mismos entre
// recargas de la app (el carrito guarda referencias por id/slug en localStorage).
function mulberry32(seed) {
  return function random() {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// "Caballero" todavía no tiene catálogo real (solo se recibieron los PDF de
// ARABA y DAMA), así que sigue con nombres generados hasta que se agregue uno.
const NAME_PARTS = {
  caballero: {
    prefix: ['Roble', 'Cedro', 'Vetiver', 'Cuero', 'Tabaco', 'Bergamota', 'Sándalo', 'Acero', 'Whisky', 'Ébano'],
    suffix: ['Nórdico', 'Salvaje', 'Intenso', 'de Medianoche', 'Clásico', 'Urbano', 'Reserva', 'Black', 'Elite', 'Extreme'],
  },
}

const CATEGORY_PRICE_RANGE = {
  caballero: [79900, 229900],
}

const SIZES_ML = [30, 50, 75, 100]

const CATALOG_BY_CATEGORY = {
  araba: ARABA_CATALOG,
  mujeres: DAMA_CATALOG,
}

function buildCatalogDescription(name, categoryName, ml, notes) {
  return `${name} es una fragancia de la línea ${categoryName} presentada en frasco de ${ml}ml. ` +
    `Notas destacadas: ${notes.join(', ')}. Alta fijación y larga duración, ideal para uso diario o momentos especiales.`
}

function buildCatalogShortDescription(ml, notes) {
  return `${ml}ml — ${notes.slice(0, 3).join(', ')}.`
}

function buildGenericDescription(name, categoryName, ml) {
  return `${name} es una fragancia de la línea ${categoryName} presentada en frasco de ${ml}ml. ` +
    `Combina notas de salida frescas con un fondo envolvente de larga duración, ideal para uso diario o momentos especiales.`
}

function buildGenericShortDescription(categoryName, ml) {
  return `Loción ${categoryName.toLowerCase()} de ${ml}ml con fijación prolongada.`
}

export function generateProducts() {
  const random = mulberry32(20260809)
  const products = []
  let autoIncrement = 1
  // Global para toda la tienda: dos productos de catálogos distintos pueden
  // compartir nombre+tamaño (p. ej. "Bianco Latte" aparece en ARABA y en DAMA),
  // y el slug es la clave de la ruta /producto/:slug en toda la app.
  const usedSlugs = new Set()

  function nextSlug(base, id) {
    let slug = slugify(base)
    if (usedSlugs.has(slug)) slug = `${slug}-${id}`
    usedSlugs.add(slug)
    return slug
  }

  for (const category of CATEGORIES) {
    const catalog = CATALOG_BY_CATEGORY[category.id]

    if (catalog) {
      for (const entry of catalog) {
        const { name, ml, price, notes } = entry
        const stock = Math.floor(random() * 40)
        const id = autoIncrement
        autoIncrement += 1
        const slug = nextSlug(`${name}-${ml}ml`, id)
        const sku = `${category.id.slice(0, 3).toUpperCase()}-${String(id).padStart(4, '0')}`

        products.push({
          id,
          name: `${name} ${ml}ml`,
          slug,
          categoryId: category.id,
          sku,
          price,
          description: buildCatalogDescription(name, category.name, ml, notes),
          shortDescription: buildCatalogShortDescription(ml, notes),
          image: `/images/products/${category.id}.svg`,
          images: [
            `/images/products/${category.id}.svg`,
            `/images/products/${category.id}.svg`,
          ],
          stock,
          active: true,
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        })
      }
      continue
    }

    // Categorías sin catálogo real todavía (caballero): generación procedural.
    const total = 140
    const { prefix, suffix } = NAME_PARTS[category.id]
    const [minPrice, maxPrice] = CATEGORY_PRICE_RANGE[category.id]

    for (let i = 0; i < total; i += 1) {
      const prefixWord = prefix[i % prefix.length]
      const suffixWord = suffix[Math.floor(i / prefix.length) % suffix.length]
      const variantNumber = Math.floor(i / (prefix.length * suffix.length)) + 1
      const baseName = `${prefixWord} ${suffixWord}`
      const name = variantNumber > 1 ? `${baseName} No. ${variantNumber}` : baseName

      const ml = SIZES_ML[Math.floor(random() * SIZES_ML.length)]
      const priceRaw = minPrice + random() * (maxPrice - minPrice)
      const price = Math.round(priceRaw / 100) * 100
      const stock = Math.floor(random() * 40)
      const id = autoIncrement
      autoIncrement += 1
      const slug = nextSlug(`${name}-${ml}ml`, id)
      const sku = `${category.id.slice(0, 3).toUpperCase()}-${String(id).padStart(4, '0')}`

      products.push({
        id,
        name: `${name} ${ml}ml`,
        slug,
        categoryId: category.id,
        sku,
        price,
        description: buildGenericDescription(name, category.name, ml),
        shortDescription: buildGenericShortDescription(category.name, ml),
        image: `/images/products/${category.id}.svg`,
        images: [
          `/images/products/${category.id}.svg`,
          `/images/products/${category.id}.svg`,
        ],
        stock,
        active: true,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      })
    }
  }

  return products
}

export const MOCK_PRODUCTS = generateProducts()
