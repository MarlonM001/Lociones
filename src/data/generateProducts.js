import { CATEGORIES } from '@/config/categories'
import { slugify } from '@/utils/slugify'
import { ARABA_CATALOG } from './catalogAraba'
import { DAMA_CATALOG } from './catalogDama'
import { CABALLERO_CATALOG } from './catalogCaballero'

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

const CATALOG_BY_CATEGORY = {
  araba: ARABA_CATALOG,
  mujeres: DAMA_CATALOG,
  caballero: CABALLERO_CATALOG,
}

function buildCatalogDescription(name, categoryName, ml, notes) {
  return `${name} es una fragancia de la línea ${categoryName} presentada en frasco de ${ml}ml. ` +
    `Notas destacadas: ${notes.join(', ')}. Alta fijación y larga duración, ideal para uso diario o momentos especiales.`
}

function buildCatalogShortDescription(ml, notes) {
  return `${ml}ml — ${notes.slice(0, 3).join(', ')}.`
}

export function generateProducts() {
  const random = mulberry32(20260809)
  const products = []
  let autoIncrement = 1
  // Global para toda la tienda: dos productos de catálogos distintos pueden
  // compartir nombre+tamaño (p. ej. "Starry Night Montale" aparece en DAMA y
  // en CABALLERO), y el slug es la clave de la ruta /producto/:slug en toda la app.
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
  }

  return products
}

export const MOCK_PRODUCTS = generateProducts()
