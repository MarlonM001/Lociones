import { STORE_CONFIG } from '@/config/store'
import { formatCurrency } from '@/utils/formatCurrency'

const MONTH_NAMES_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

const MARGIN_X = 48
const RIGHT_EDGE = 548

// jsPDF (con sus dependencias opcionales de renderizado de HTML) pesa varios
// cientos de KB — se carga bajo demanda solo cuando el admin descarga un PDF,
// no en el bundle principal que ve cualquier visitante de la tienda.
export async function generateMonthlyReportPdf(summary) {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  let y = 56

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.text(STORE_CONFIG.name, MARGIN_X, y)

  y += 22
  doc.setFontSize(14)
  doc.text('Reporte mensual de ventas', MARGIN_X, y)

  y += 26
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.text(`Mes: ${MONTH_NAMES_ES[summary.month - 1]} ${summary.year}`, MARGIN_X, y)

  y += 26
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.text(`Total ventas: ${formatCurrency(summary.totalSales)}`, MARGIN_X, y)
  y += 18
  doc.text(`Pedidos: ${summary.totalOrders}`, MARGIN_X, y)
  y += 18
  doc.text(`Productos vendidos: ${summary.totalUnits}`, MARGIN_X, y)

  y += 18
  doc.setDrawColor(200)
  doc.line(MARGIN_X, y, RIGHT_EDGE, y)
  y += 26

  doc.setFontSize(13)
  doc.text('Productos más vendidos', MARGIN_X, y)
  y += 20

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.text('Producto', MARGIN_X, y)
  doc.text('Cantidad', 340, y)
  doc.text('Ventas', 460, y)
  y += 6
  doc.line(MARGIN_X, y, RIGHT_EDGE, y)
  y += 16

  doc.setFont('helvetica', 'normal')
  const topProducts = summary.productsRanking.slice(0, 10)
  if (topProducts.length === 0) {
    doc.text('Sin ventas registradas en este mes.', MARGIN_X, y)
    y += 18
  } else {
    for (const product of topProducts) {
      const label = product.name.length > 45 ? `${product.name.slice(0, 45)}...` : product.name
      doc.text(label, MARGIN_X, y)
      doc.text(String(product.quantity), 340, y)
      doc.text(formatCurrency(product.sales), 460, y)
      y += 16
      if (y > 760) {
        doc.addPage()
        y = 56
      }
    }
  }

  y += 14
  doc.line(MARGIN_X, y, RIGHT_EDGE, y)
  y += 26

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.text('Ventas por categoría', MARGIN_X, y)
  y += 20

  doc.setFontSize(10)
  for (const category of summary.categoriesRanking) {
    doc.setFont('helvetica', 'normal')
    doc.text(category.name, MARGIN_X, y)
    doc.text(formatCurrency(category.sales), 460, y)
    y += 16
  }

  y += 24
  doc.setFontSize(9)
  doc.setTextColor(120)
  doc.text(`Generado el ${new Date().toLocaleString('es-CO')}`, MARGIN_X, y)

  const fileName = `reporte-ventas-${summary.year}-${String(summary.month).padStart(2, '0')}.pdf`
  doc.save(fileName)
}
