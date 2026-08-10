import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { STORE_CONFIG } from '@/config/store'
import { useAuth } from '@/hooks/useAuth'
import { useTheme } from '@/hooks/useTheme'
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

function SidebarContent({ onNavigate }) {
  const linkClasses = ({ isActive }) =>
    `block rounded-lg px-4 py-2.5 text-sm transition-colors ${
      isActive ? 'bg-gold/10 text-gold' : 'text-ivory-dim hover:bg-ivory/5 hover:text-ivory'
    }`

  return (
    <nav className="flex flex-col gap-1">
      {ADMIN_NAV_LINKS.map((link) => (
        <NavLink key={link.to} to={link.to} end={link.end} className={linkClasses} onClick={onNavigate}>
          {link.label}
        </NavLink>
      ))}
    </nav>
  )
}

export function AdminLayout() {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [mobileOpen, setMobileOpen] = useState(false)
  const navigate = useNavigate()

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
          <span className="ml-1 text-gold">.</span>
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
              <span className="ml-1 text-gold">.</span>
            </NavLink>
            <p className="mt-1 text-xs uppercase tracking-widest-plus text-ivory-dim">Panel admin</p>
            <div className="mt-8">
              <SidebarContent onNavigate={() => setMobileOpen(false)} />
            </div>
          </aside>
        </div>
      )}

      <div className="flex min-h-screen flex-1 flex-col">
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

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>

      <ToastContainer />
    </div>
  )
}
