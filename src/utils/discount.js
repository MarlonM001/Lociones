/**
 * Precio con descuento: el precio normal menos el porcentaje, redondeado a los 100 pesos más cercanos.
 * Debe dar lo mismo que la cuenta del servidor (server/src/services/promotions.service.js), que es la que
 * de verdad fija el precio; aquí solo sirve para la vista previa del panel.
 */
export function discountedPrice(regularPrice, percent) {
  return Math.round((regularPrice * (100 - percent)) / 100 / 100) * 100
}
