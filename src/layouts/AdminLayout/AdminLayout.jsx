import { useEffect, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { STORE_CONFIG } from '@/config/store'
import { useAuth } from '@/hooks/useAuth'
import { useTheme } from '@/hooks/useTheme'
import { usePendingOrders } from '@/hooks/usePendingOrders'
import { markAdminLanded } from '@/utils/adminLanding'
import { CountBadge } from '@/components/ui/CountBadge'
import { ToastContainer } from '@/components/ui/Toast'
import { ADMIN_NAV_LINKS } from './adminNavLinks'

function SunIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="12" cy="12" r="4.5" />
      <path strokeLinecap="round" d="M12 2.5v2M12 19.5v2M21.5 12h-2M4.5 12h-2M18.4 5.6l-1.4 1.4M7 17l-1.4 1.4M18.4 18.4L17 17M7 7 5.6 5.6" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.5 14.5A8.5 8.5 0 1 1 9.5 3.5a7 7 0 0 0 11 11Z" />
    </svg>
  )
}

function MenuIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
    </svg>
  )
}

function SpeakerIcon({ muted }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5H4Z" strokeLinejoin="round" />
      {muted ? (
        <path d="M16 9.5l5 5M21 9.5l-5 5" strokeLinecap="round" />
      ) : (
        <path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" strokeLinecap="round" />
      )}
    </svg>
  )
}

function SidebarContent({ onNavigate }) {
  const { pending } = usePendingOrders()
  const badgeCounts = { pendingOrders: pending }
  const linkClasses = ({ isActive }) =>
    `flex items-center justify-between rounded-lg px-4 py-2.5 text-sm transition-colors ${
      isActive ? 'bg-gold/10 text-gold' : 'text-ivory-dim hover:bg-ivory/5 hover:text-ivory'
    }`

  return (
    <nav className="flex flex-col gap-1">
      {ADMIN_NAV_LINKS.map((link) => (
        <NavLink key={link.to} to={link.to} end={link.end} className={linkClasses} onClick={onNavigate}>
          {link.label}
          {link.badge && <CountBadge count={badgeCounts[link.badge]} />}
        </NavLink>
      ))}
    </nav>
  )
}

export function AdminLayout() {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [mobileOpen, setMobileOpen] = useState(false)
  const { soundEnabled, toggleSound, audioReady, enableAudio } = usePendingOrders()
  const navigate = useNavigate()

  // Ya está en el panel: desde aquí "Ver tienda" y el logo llevan a la tienda sin rebotar de vuelta.
  useEffect(() => {
    markAdminLanded()
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <div className="flex min-h-screen bg-ink">
      {/* Sidebar desktop */}
      <aside className="hidden w-64 shrink-0 border-r border-ivory/5 bg-charcoal p-6 lg:block">
        <NavLink to="/" className="font-display text-xl tracking-widest text-ivory">
          {STORE_CONFIG.name}
        </NavLink>
        <p className="mt-1 text-xs uppercase tracking-widest-plus text-ivory-dim">Panel admin</p>

        <div className="mt-8">
          <SidebarContent />
        </div>
      </aside>

      {/* Sidebar mobile (drawer) */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[100] lg:hidden">
          <div className="absolute inset-0 bg-ink/80" onClick={() => setMobileOpen(false)} />
          <aside className="relative h-full w-64 border-r border-ivory/5 bg-charcoal p-6">
            <NavLink to="/" className="font-display text-xl tracking-widest text-ivory">
              {STORE_CONFIG.name}
            </NavLink>
            <p className="mt-1 text-xs uppercase tracking-widest-plus text-ivory-dim">Panel admin</p>
            <div className="mt-8">
              <SidebarContent onNavigate={() => setMobileOpen(false)} />
            </div>
          </aside>
        </div>
      )}

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-ivory/5 bg-charcoal/60 px-4 py-4 sm:px-6">
          <button
            type="button"
            aria-label="Abrir menú"
            className="text-ivory lg:hidden"
            onClick={() => setMobileOpen(true)}
          >
            <MenuIcon />
          </button>

          <span className="hidden text-sm text-ivory-dim lg:inline">
            Hola, <span className="text-ivory">{user?.name}</span>
          </span>

          <div className="flex items-center gap-4">
            <button
              type="button"
              aria-label={theme === 'dark' ? 'Cambiar a modo día' : 'Cambiar a modo noche'}
              onClick={toggleTheme}
              className="text-ivory transition-colors hover:text-gold"
            >
              {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
            </button>
            <button
              type="button"
              onClick={toggleSound}
              aria-pressed={soundEnabled}
              title={soundEnabled ? 'Sonido de pedidos nuevos: activado' : 'Sonido de pedidos nuevos: silenciado'}
              className={`flex items-center gap-1.5 text-sm transition-colors hover:text-gold ${
                soundEnabled ? 'text-ivory' : 'text-ivory-dim'
              }`}
            >
              <SpeakerIcon muted={!soundEnabled} />
              <span className="hidden sm:inline">{soundEnabled ? 'Sonido' : 'Silenciado'}</span>
            </button>
            <NavLink to="/" className="text-sm text-ivory-dim transition-colors hover:text-ivory">
              Ver tienda
            </NavLink>
            <button
              type="button"
              onClick={handleLogout}
              className="text-sm text-ivory-dim transition-colors hover:text-gold"
            >
              Cerrar sesión
            </button>
          </div>
        </header>

        {soundEnabled && !audioReady && (
          <div
            role="status"
            className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-300 sm:px-6"
          >
            <span className="flex-1">
              El navegador tiene el sonido bloqueado: no sonará cuando llegue un pedido hasta que hagas clic en la página.
            </span>
            <button
              type="button"
              onClick={enableAudio}
              className="rounded-full border border-amber-400/60 px-4 py-1.5 font-medium text-amber-200 transition-colors hover:bg-amber-500/20"
            >
              Activar sonido
            </button>
          </div>
        )}

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>

      <ToastContainer />
    </div>
  )
}
