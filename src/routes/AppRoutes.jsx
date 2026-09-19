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
import { Profile } from '@/pages/Profile'
import { Terms } from '@/pages/Terms'
import { Privacy } from '@/pages/Privacy'
import { ComingSoon } from '@/pages/ComingSoon'
import { AdminDashboard } from '@/pages/admin/Dashboard'
import { AdminProducts } from '@/pages/admin/Products'
import { AdminBestsellers } from '@/pages/admin/Bestsellers'
import { AdminAuctions } from '@/pages/admin/Auctions'
import { AdminChat } from '@/pages/admin/Chat'
import { Auctions, AuctionDetail } from '@/pages/Auctions'
import { AdminOrders } from '@/pages/admin/Orders'
import { AdminReferences } from '@/pages/admin/References'
import { AdminPromotions } from '@/pages/admin/Promotions'
import { AdminCelebration } from '@/pages/admin/Celebration'
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
        <Route path="chat" element={<AdminChat />} />
        <Route path="productos" element={<AdminProducts />} />
        <Route path="top-ventas" element={<AdminBestsellers />} />
        <Route path="subastas" element={<AdminAuctions />} />
        <Route path="pedidos" element={<AdminOrders />} />
        <Route path="referencias" element={<AdminReferences />} />
        <Route path="promociones" element={<AdminPromotions />} />
        <Route path="celebracion" element={<AdminCelebration />} />
        <Route path="reportes" element={<AdminReports />} />
      </Route>

      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/catalogo" element={<Catalog />} />
        <Route path="/top-ventas" element={<Catalog topSellers />} />
        <Route path="/productos/:categorySlug" element={<Catalog />} />
        <Route path="/producto/:slug" element={<Product />} />
        <Route path="/subastas" element={<Auctions />} />
        <Route path="/subastas/:slug" element={<AuctionDetail />} />
        <Route path="/carrito" element={<CartPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Register />} />
        <Route path="/referencias" element={<References />} />
        <Route path="/terminos" element={<Terms />} />
        <Route path="/privacidad" element={<Privacy />} />
        <Route
          path="/perfil"
          element={
            <RequireAuth>
              <Profile />
            </RequireAuth>
          }
        />
        <Route
          path="*"
          element={<ComingSoon title="Página no encontrada" message="El contenido que buscas no existe o fue movido." />}
        />
      </Route>
    </Routes>
  )
}
