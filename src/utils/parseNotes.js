/**
 * Extrae la lista de notas/acordes de la descripción auto-generada por
 * server/seed/seed.js (formato: "... Notas destacadas: nota1, nota2, ...
 * notaN. Alta fijación..."). No depende de ningún campo nuevo en la base de
 * datos — si la descripción no tiene ese formato (ej. la reescribió un
 * admin a mano), devuelve un arreglo vacío y el llamador debe manejarlo.
 */
export function parseNotes(description) {
  if (!description) return []
  const match = description.match(/Notas destacadas:\s*(.+?)\./)
  if (!match) return []
  return match[1]
    .split(',')
    .map((note) => note.trim())
    .filter(Boolean)
}
