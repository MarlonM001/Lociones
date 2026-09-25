export const CHIP_COLORS = [
  '#c8a45c', // gold
  '#c88a8a', // rosa
  '#8fa6b3', // azul grisáceo
  '#7d9e7a', // verde salvia
  '#b98c5e', // ámbar
  '#a08fc0', // lavanda
  '#c2765a', // terracota
  '#7fa6a0', // verde azulado
]

/**
 * Segunda "vista" del producto: la MISMA foto grande (igual que la vista
 * normal), con las notas/acordes de la descripción superpuestas abajo — no
 * reemplaza la foto por una miniatura, solo le agrega el texto encima.
 */
export function ProductNotesCard({ image, name, notes }) {
  return (
    <div className="relative h-full w-full bg-white">
      <img src={image} alt={name} className="h-full w-full object-contain object-center p-8" />

      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink via-ink/85 to-transparent px-4 pb-4 pt-12 sm:px-6 sm:pb-6">
        <p className="mb-2 text-center text-xs uppercase tracking-widest-plus text-gold">
          Acordes principales
        </p>
        <div className="flex flex-wrap justify-center gap-1.5">
          {notes.map((note, index) => (
            <span
              key={note}
              className="rounded-full px-2.5 py-1 text-xs font-medium capitalize text-ink shadow-sm sm:text-xs"
              style={{ backgroundColor: CHIP_COLORS[index % CHIP_COLORS.length] }}
            >
              {note}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
