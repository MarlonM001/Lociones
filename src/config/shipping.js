import { COLOMBIA_DEPARTMENTS } from '@/data/colombia'

/**
 * Lugares a los que se envía: todo el país. Los departamentos y municipios salen de
 * src/data/colombia.js. Solo lo usa el formulario de compra, que se carga aparte para
 * no meter esta lista en el archivo principal. El texto de cobertura ("toda Colombia")
 * está en STORE_CONFIG.shippingCoverage. El costo del envío no se calcula en el sitio:
 * se acuerda con cada cliente por WhatsApp (ver el resumen del pedido).
 */

const BOGOTA_DEPARTMENT = 'Bogotá D.C.'

export const SHIPPING_DEPARTMENTS = COLOMBIA_DEPARTMENTS.map((department) => department.name)

/**
 * Valor que se guarda en el pedido para una ciudad. Lleva el departamento para
 * distinguir municipios con el mismo nombre (hay varios Buenavista o San Pedro),
 * salvo Bogotá, que se guarda sola: "Yopal, Casanare", "Bogotá".
 */
export function toCityValue(department, city) {
  return department === BOGOTA_DEPARTMENT ? city : `${city}, ${department}`
}

/** Ciudades de un departamento listas para el selector: `label` se muestra, `value` se guarda. */
export function getCitiesByDepartment(department) {
  const found = COLOMBIA_DEPARTMENTS.find((item) => item.name === department)
  return (found?.cities ?? []).map((city) => ({ label: city, value: toCityValue(department, city) }))
}

const PLACES_BY_CITY_VALUE = new Map(
  COLOMBIA_DEPARTMENTS.flatMap((department) =>
    department.cities.map((city) => [toCityValue(department.name, city), { department: department.name, city }]),
  ),
)

/** Devuelve `{ department, city }` para un valor guardado ("Yopal, Casanare"), o undefined si no existe. */
export function findPlaceByCityValue(cityValue) {
  return PLACES_BY_CITY_VALUE.get(cityValue?.trim())
}

export function isCityAvailable(cityValue) {
  return PLACES_BY_CITY_VALUE.has(cityValue?.trim())
}
