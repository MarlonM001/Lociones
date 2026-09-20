import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from '@/context/ThemeContext'
import { AuthProvider } from '@/context/AuthContext'
import { CartProvider } from '@/context/CartContext'
import { PendingOrdersProvider } from '@/context/PendingOrdersContext'
import { ToastProvider } from '@/context/ToastContext'
import { AppRoutes } from '@/routes/AppRoutes'
import { ScrollToTop } from '@/components/layout/ScrollToTop'

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <PendingOrdersProvider>
              <CartProvider>
                <ScrollToTop />
                <AppRoutes />
              </CartProvider>
            </PendingOrdersProvider>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}

export default App
