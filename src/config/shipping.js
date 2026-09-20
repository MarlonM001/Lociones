/**
 * Zonas de envío habilitadas. Agregar una ciudad nueva = agregar un objeto aquí;
 * el checkout valida contra esta lista sin necesitar cambios en componentes.
 *
 * `name` es el valor que se guarda en el pedido (y con el que se valida la
 * dirección); `department` y `cityLabel` son lo que ve el cliente en los
 * selectores Departamento y Ciudad del formulario.
 */
export const SHIPPING_ZONES = [
  { id: 'bogota', name: 'Bogotá', department: 'Bogotá D.C.', cityLabel: 'Bogotá', cost: 0, etaDays: '1-2' },
  { id: 'yopal', name: 'Yopal, Casanare', department: 'Casanare', cityLabel: 'Yopal', cost: 0, etaDays: '2-4' },
]

export const SHIPPING_CITY_NAMES = SHIPPING_ZONES.map((zone) => zone.name)

export const SHIPPING_DEPARTMENTS = [...new Set(SHIPPING_ZONES.map((zone) => zone.department))]

export function getZonesByDepartment(department) {
  return SHIPPING_ZONES.filter((zone) => zone.department === department)
}

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
