import { CATEGORIES } from '@/config/categories'
import { slugify } from '@/utils/slugify'

// PRNG con semilla fija: los 380 productos deben ser siempre los mismos entre
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

const NAME_PARTS = {
  araba: {
    prefix: ['Oud', 'Bakhoor', 'Ámbar', 'Almizcle', 'Incienso', 'Azaad', 'Sultana', 'Dahn', 'Rasha', 'Zafir'],
    suffix: ['Real', 'Dorado', 'de Oriente', 'Noir', 'Intenso', 'Al Sultan', 'Imperial', 'Místico', 'Royale', 'Bakhoor'],
  },
  mujeres: {
    prefix: ['Jardín de', 'Flor de', 'Esencia de', 'Pétalo de', 'Aroma de', 'Bouquet de', 'Suspiro de', 'Brisa de'],
    suffix: ['Rosas', 'Jazmín', 'Loto Blanco', 'Peonía', 'Vainilla', 'Gardenia', 'Magnolia', 'Cerezo', 'Iris', 'Orquídea'],
  },
  caballero: {
    prefix: ['Roble', 'Cedro', 'Vetiver', 'Cuero', 'Tabaco', 'Bergamota', 'Sándalo', 'Acero', 'Whisky', 'Ébano'],
    suffix: ['Nórdico', 'Salvaje', 'Intenso', 'de Medianoche', 'Clásico', 'Urbano', 'Reserva', 'Black', 'Elite', 'Extreme'],
  },
}

const CATEGORY_PRICE_RANGE = {
  araba: [89900, 259900],
  mujeres: [79900, 219900],
  caballero: [79900, 229900],
}

const SIZES_ML = [30, 50, 75, 100]

function buildDescription(name, categoryName, ml) {
  return `${name} es una fragancia de la línea ${categoryName} presentada en frasco de ${ml}ml. ` +
    `Combina notas de salida frescas con un fondo envolvente de larga duración, ideal para uso diario o momentos especiales.`
}

function buildShortDescription(categoryName, ml) {
  return `Loción ${categoryName.toLowerCase()} de ${ml}ml con fijación prolongada.`
}

export function generateProducts() {
  const random = mulberry32(20260809)
  const products = []
  let autoIncrement = 1

  const counts = { araba: 120, mujeres: 120, caballero: 140 }

  for (const category of CATEGORIES) {
    const total = counts[category.id] ?? 0
    const { prefix, suffix } = NAME_PARTS[category.id]
    const [minPrice, maxPrice] = CATEGORY_PRICE_RANGE[category.id]
    const usedSlugs = new Set()

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

      let slug = slugify(`${name}-${ml}ml`)
      if (usedSlugs.has(slug)) slug = `${slug}-${id}`
      usedSlugs.add(slug)

      const sku = `${category.id.slice(0, 3).toUpperCase()}-${String(id).padStart(4, '0')}`

      products.push({
        id,
        name: `${name} ${ml}ml`,
        slug,
        categoryId: category.id,
        sku,
        price,
        description: buildDescription(name, category.name, ml),
        shortDescription: buildShortDescription(category.name, ml),
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
