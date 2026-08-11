/** Convierte "marlon gonzales" en "Marlon Gonzales" para mostrar nombres con formato consistente. */
export function toTitleCase(value) {
  return (value ?? '')
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}
