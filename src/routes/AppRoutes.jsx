import { Routes, Route } from 'react-router-dom'
import { PublicLayout } from '@/layouts/PublicLayout'
import { AdminLayout } from '@/layouts/AdminLayout'
import { RequireAuth } from '@/components/auth/RequireAuth'
import { RequireAdmin } from '@/components/auth/RequireAdmin'
import { Home } from '@/pages/Home'
import { Catalog } from '@/pages/Catalog'
import { Product } from '@/pages/Product'
import { CartPage } from '@/pages/CartPage'
import { Login } from '@/pages/Login'
import { Register } from '@/pages/Register'
import { References } from '@/pages/References'
import { ComingSoon } from '@/pages/ComingSoon'
import { AdminDashboard } from '@/pages/admin/Dashboard'
import { AdminProducts } from '@/pages/admin/Products'
import { AdminOrders } from '@/pages/admin/Orders'
import { AdminReferences } from '@/pages/admin/References'
import { AdminReports } from '@/pages/admin/Reports'

export function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/admin"
        element={
          <RequireAdmin>
            <AdminLayout />
          </RequireAdmin>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="productos" element={<AdminProducts />} />
        <Route path="pedidos" element={<AdminOrders />} />
        <Route path="referencias" element={<AdminReferences />} />
        <Route path="reportes" element={<AdminReports />} />
      </Route>

      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/catalogo" element={<Catalog />} />
        <Route path="/productos/:categorySlug" element={<Catalog />} />
        <Route path="/producto/:slug" element={<Product />} />
        <Route
          path="/carrito"
          element={
            <RequireAuth>
              <CartPage />
            </RequireAuth>
          }
        />
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Register />} />
        <Route path="/referencias" element={<References />} />
        <Route
          path="/perfil"
          element={
            <RequireAuth>
              <ComingSoon title="Tu perfil" message="El detalle de perfil y pedidos anteriores llega en la próxima fase." />
            </RequireAuth>
          }
        />
        <Route
          path="/seguimiento"
          element={<ComingSoon title="Seguimiento de pedido" message="La consulta de estado de pedidos llega en la próxima fase." />}
        />
        <Route
          path="*"
          element={<ComingSoon title="Página no encontrada" message="El contenido que buscas no existe o fue movido." />}
        />
      </Route>
    </Routes>
  )
}
