/**
 * Familias olfativas para clasificar las lociones por el aroma que buscan los
 * clientes (cítricos, dulces, florales...). No existen como campo en la base
 * de datos: se reconocen por las "notas destacadas" que ya trae cada producto
 * en su descripción, así que agregar una familia nueva es solo añadir un
 * objeto con las palabras que la identifican.
 *
 * `keywords` se comparan sin tildes y contra el inicio de cada palabra de las
 * notas ("afrutad" reconoce "afrutados"), por eso van en raíz. `ignore` son
 * frases que se quitan antes de comparar.
 */
export const FRAGRANCE_FAMILIES = [
  { id: 'citricos', name: 'Cítricos', keywords: ['citric'] },
  { id: 'dulces', name: 'Dulces', keywords: ['dulce', 'avainill', 'caramelo', 'vainilla', 'gourmand'] },
  // "fresco especiado" es una nota especiada que trae casi todo el catálogo: no cuenta como fresco.
  { id: 'frescos', name: 'Frescos', keywords: ['fresc', 'acuatic', 'marino'], ignore: ['fresco especiado'] },
  { id: 'florales', name: 'Florales', keywords: ['floral', 'jazmin'] },
  { id: 'frutales', name: 'Frutales', keywords: ['fruta', 'frutal', 'afrutad'] },
  { id: 'amaderados', name: 'Amaderados', keywords: ['amader'] },
]

export function getFragranceFamily(id) {
  return FRAGRANCE_FAMILIES.find((family) => family.id === id) ?? null
}

function normalize(text) {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

/** Texto de las notas del producto: la lista tras "Notas destacadas:" o, si no la hay, la descripción corta. */
function notesOf(product) {
  const match = /notas destacadas:\s*([^.]*)/i.exec(product.description ?? '')
  return match ? match[1] : (product.shortDescription ?? '')
}

export function matchesFragranceFamily(product, family) {
  let notes = normalize(notesOf(product))
  for (const phrase of family.ignore ?? []) notes = notes.split(phrase).join(' ')
  const words = notes.split(/[^a-z]+/).filter(Boolean)
  return family.keywords.some((keyword) => words.some((word) => word.startsWith(keyword)))
}
