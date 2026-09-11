/**
 * Carga el SDK de Google Maps bajo demanda (solo cuando se necesita
 * geocodificar, no en cada visita a la tienda). Usa el SDK oficial en vez de
 * llamar la API REST de Geocoding directo por fetch — esa API REST no admite
 * CORS desde el navegador, por eso Google recomienda el SDK para uso en cliente.
 */
let loadPromise = null

export function loadGoogleMaps() {
  if (window.google?.maps) return Promise.resolve(window.google.maps)
  if (loadPromise) return loadPromise

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
  if (!apiKey) {
    return Promise.reject(new Error('VITE_GOOGLE_MAPS_API_KEY no está configurada'))
  }

  loadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&loading=async`
    script.async = true
    script.onload = () => resolve(window.google.maps)
    script.onerror = () => {
      loadPromise = null
      reject(new Error('No se pudo cargar Google Maps'))
    }
    document.head.appendChild(script)
  })

  return loadPromise
}
