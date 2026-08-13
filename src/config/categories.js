/**
 * Fuente única de verdad para las categorías de la tienda. Para agregar una
 * categoría nueva en el futuro basta con añadir un objeto a este arreglo —
 * el navbar, el home y el catálogo la recogen automáticamente.
 */
export const CATEGORIES = [
  {
    id: 'arabia',
    slug: 'arabia',
    name: 'ARABIA',
    shortDescription: 'Esencias árabes intensas y duraderas, inspiradas en el oud y el ámbar.',
    image: '/images/categories/arabia.svg',
    accent: 'from-amber-500/20 to-transparent',
  },
  {
    id: 'mujeres',
    slug: 'mujeres',
    name: 'Mujeres',
    shortDescription: 'Fragancias florales y envolventes para cada momento del día.',
    image: '/images/categories/mujeres.svg',
    accent: 'from-rose-400/20 to-transparent',
  },
  {
    id: 'caballero',
    slug: 'caballero',
    name: 'Caballero',
    shortDescription: 'Notas amaderadas y frescas con carácter y sofisticación.',
    image: '/images/categories/caballero.svg',
    accent: 'from-sky-400/15 to-transparent',
  },
]

export function getCategoryBySlug(slug) {
  return CATEGORIES.find((category) => category.slug === slug)
}

export function getCategoryById(id) {
  return CATEGORIES.find((category) => category.id === id)
}
