import { loadGoogleMaps } from './loadGoogleMaps'

/**
 * Geocodifica "dirección, ciudad, Colombia" y confirma que el resultado
 * realmente caiga dentro de la ciudad esperada (Bogotá/Yopal), en vez de
 * confiar solo en que el cliente eligió bien la ciudad en el dropdown.
 *
 * Devuelve un status en vez de lanzar errores, para que el checkout decida
 * qué bloquear y qué dejar pasar:
 *   - 'valid'         -> la dirección existe y está en la ciudad esperada
 *   - 'city_mismatch' -> la dirección existe pero no parece estar ahí
 *   - 'not_found'     -> Google no encontró esa dirección
 *   - 'skipped'       -> no hay API key configurada o el SDK no cargó
 *                        (no bloquea el checkout — evita que la tienda
 *                        dependa por completo de un servicio externo)
 *   - 'error'         -> falla de red o de la API
 */
export async function validateDeliveryAddress(address, cityName) {
  let maps
  try {
    maps = await loadGoogleMaps()
  } catch {
    return { status: 'skipped' }
  }

  const geocoder = new maps.Geocoder()
  const query = `${address}, ${cityName}, Colombia`

  return new Promise((resolve) => {
    geocoder.geocode({ address: query, region: 'co' }, (results, status) => {
      if (status === 'ZERO_RESULTS') {
        resolve({ status: 'not_found' })
        return
      }
      if (status !== 'OK' || !results?.length) {
        resolve({ status: 'error' })
        return
      }

      const result = results[0]
      const normalizedCity = cityName.trim().toLowerCase()
      const matchesCity = result.address_components.some(
        (component) =>
          component.long_name.toLowerCase().includes(normalizedCity) ||
          component.short_name.toLowerCase().includes(normalizedCity),
      )

      resolve({
        status: matchesCity ? 'valid' : 'city_mismatch',
        formattedAddress: result.formatted_address,
      })
    })
  })
}
