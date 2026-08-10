import { getOrders } from '@/services/orders'
import { getProductCategoryMap } from '@/services/products'
import { CATEGORIES } from '@/config/categories'

/**
 * Resumen de ventas de un mes calendario, cruzando pedidos con el catálogo
 * de productos para poder rankear por producto y por categoría. Usa el mapa
 * de categorías del catálogo real (editable desde el admin), no un set fijo,
 * para que productos nuevos/editados también se contabilicen bien.
 * @param {number} year
 * @param {number} month 1-12
 */
export async function getMonthlySummary(year, month) {
  const [orders, categoryByProductId] = await Promise.all([getOrders(), getProductCategoryMap()])
  const monthOrders = orders.filter((order) => {
    const date = new Date(order.createdAt)
    return date.getFullYear() === year && date.getMonth() + 1 === month
  })

  const totalSales = monthOrders.reduce((sum, order) => sum + order.total, 0)
  const totalOrders = monthOrders.length

  const productTotals = new Map()
  const categoryTotals = new Map()
  let totalUnits = 0

  for (const order of monthOrders) {
    for (const item of order.items) {
      totalUnits += item.quantity

      const productEntry = productTotals.get(item.productId) ?? {
        productId: item.productId,
        name: item.name,
        quantity: 0,
        sales: 0,
      }
      productEntry.quantity += item.quantity
      productEntry.sales += item.subtotal
      productTotals.set(item.productId, productEntry)

      const categoryId = categoryByProductId.get(item.productId) ?? 'otros'
      categoryTotals.set(categoryId, (categoryTotals.get(categoryId) ?? 0) + item.subtotal)
    }
  }

  const productsRanking = [...productTotals.values()].sort((a, b) => b.quantity - a.quantity)
  const categoriesRanking = CATEGORIES
    .map((category) => ({
      id: category.id,
      name: category.name,
      sales: categoryTotals.get(category.id) ?? 0,
    }))
    .sort((a, b) => b.sales - a.sales)

  return {
    year,
    month,
    totalSales,
    totalOrders,
    totalUnits,
    topProduct: productsRanking[0] ?? null,
    topCategory: categoriesRanking.find((category) => category.sales > 0) ?? null,
    productsRanking,
    categoriesRanking,
  }
}
