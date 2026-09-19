/**
 * Muestra el archivo de una referencia de entrega: el video con controles o la
 * foto (que abre completa en otra pestaña). Con `thumb` se ve como miniatura
 * sin controles, para listas compactas.
 */
export function ReferenceMedia({ reference, thumb = false, className = '' }) {
  const isImage = reference.mediaType === 'image'

  if (isImage) {
    const image = (
      <img
        src={reference.mediaUrl}
        alt={reference.title}
        loading="lazy"
        className={`h-full w-full bg-ink object-cover ${thumb ? '' : 'aspect-video'} ${className}`}
      />
    )
    if (thumb) return image
    return (
      <a href={reference.mediaUrl} target="_blank" rel="noreferrer" className="block" aria-label={`Ver foto completa: ${reference.title}`}>
        {image}
      </a>
    )
  }

  if (thumb) {
    return <video src={reference.mediaUrl} className={`h-full w-full bg-ink object-cover ${className}`} muted preload="metadata" />
  }

  return (
    <video controls preload="metadata" className={`aspect-video w-full bg-ink ${className}`}>
      <source src={reference.mediaUrl} />
      Tu navegador no soporta la reproducción de este video.
    </video>
  )
}
