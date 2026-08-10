import { useEffect, useState } from 'react'
import { getMonthlySummary } from '@/services/reports'
import { generateMonthlyReportPdf } from '@/services/reports/generateMonthlyReportPdf'
import { formatCurrency } from '@/utils/formatCurrency'
import { Loading } from '@/components/ui/Loading'
import { Button } from '@/components/ui/Button'
import { StatCard } from '@/pages/admin/Dashboard/StatCard'

function currentYearMonth() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export function AdminReports() {
  const [selectedMonth, setSelectedMonth] = useState(currentYearMonth)
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const [year, month] = selectedMonth.split('-').map(Number)
    setLoading(true)
    getMonthlySummary(year, month).then((result) => {
      setSummary(result)
      setLoading(false)
    })
  }, [selectedMonth])

  return (
    <div>
      <h1 className="font-display text-3xl text-ivory">Reportes</h1>
      <p className="mt-1 text-sm text-ivory-dim">Resumen de ventas por mes, con descarga en PDF.</p>

      <div className="mt-6 flex flex-wrap items-end gap-4">
        <div>
          <label className="mb-1 block text-sm text-ivory-dim">Mes</label>
          <input
            type="month"
            value={selectedMonth}
            onChange={(event) => setSelectedMonth(event.target.value)}
            className="rounded-lg border border-ivory/10 bg-charcoal px-3 py-2 text-ivory focus:border-gold focus:outline-none"
          />
        </div>
        <Button
          variant="primary"
          disabled={loading || !summary}
          onClick={() => generateMonthlyReportPdf(summary)}
        >
          Descargar reporte PDF
        </Button>
      </div>

      {loading ? (
        <div className="mt-10">
          <Loading label="Calculando reporte..." />
        </div>
      ) : (
        summary && (
          <>
            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <StatCard label="Total ventas" value={formatCurrency(summary.totalSales)} />
              <StatCard label="Pedidos" value={summary.totalOrders} />
              <StatCard label="Unidades vendidas" value={summary.totalUnits} />
            </div>

            <div className="mt-10 grid gap-8 lg:grid-cols-2">
              <div>
                <h2 className="mb-4 font-display text-xl text-ivory">Productos más vendidos</h2>
                {summary.productsRanking.length === 0 ? (
                  <p className="text-sm text-ivory-dim">Sin ventas registradas en este mes.</p>
                ) : (
                  <div className="overflow-hidden rounded-2xl border border-ivory/5 bg-charcoal">
                    <table className="w-full border-collapse text-sm">
                      <thead>
                        <tr className="border-b border-ivory/10 text-left text-xs uppercase text-ivory-dim">
                          <th className="px-4 py-2">Producto</th>
                          <th className="px-4 py-2">Cantidad</th>
                          <th className="px-4 py-2">Ventas</th>
                        </tr>
                      </thead>
                      <tbody>
                        {summary.productsRanking.slice(0, 10).map((product) => (
                          <tr key={product.productId} className="border-b border-ivory/5 last:border-0">
                            <td className="px-4 py-2 text-ivory">{product.name}</td>
                            <td className="px-4 py-2 text-ivory-dim">{product.quantity}</td>
                            <td className="px-4 py-2 text-ivory-dim">{formatCurrency(product.sales)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div>
                <h2 className="mb-4 font-display text-xl text-ivory">Ventas por categoría</h2>
                <div className="overflow-hidden rounded-2xl border border-ivory/5 bg-charcoal">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-ivory/10 text-left text-xs uppercase text-ivory-dim">
                        <th className="px-4 py-2">Categoría</th>
                        <th className="px-4 py-2">Ventas</th>
                      </tr>
                    </thead>
                    <tbody>
                      {summary.categoriesRanking.map((category) => (
                        <tr key={category.id} className="border-b border-ivory/5 last:border-0">
                          <td className="px-4 py-2 text-ivory">{category.name}</td>
                          <td className="px-4 py-2 text-ivory-dim">{formatCurrency(category.sales)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )
      )}
    </div>
  )
}
