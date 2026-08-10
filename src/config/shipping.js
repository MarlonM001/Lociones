/**
 * Zonas de envío habilitadas. Agregar una ciudad nueva = agregar un objeto aquí;
 * el checkout valida contra esta lista sin necesitar cambios en componentes.
 */
export const SHIPPING_ZONES = [
  { id: 'bogota', name: 'Bogotá', cost: 0, etaDays: '1-2' },
  { id: 'yopal', name: 'Yopal, Casanare', cost: 0, etaDays: '2-4' },
]

export const SHIPPING_CITY_NAMES = SHIPPING_ZONES.map((zone) => zone.name)

export function isCityAvailable(cityName) {
  if (!cityName) return false
  return SHIPPING_ZONES.some(
    (zone) => zone.name.toLowerCase() === cityName.trim().toLowerCase(),
  )
}

export function getShippingZoneByName(cityName) {
  return SHIPPING_ZONES.find(
    (zone) => zone.name.toLowerCase() === cityName?.trim().toLowerCase(),
  )
}
