import { useEffect, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { STORE_CONFIG } from '@/config/store'
import { useCart } from '@/hooks/useCart'
import { useAuth } from '@/hooks/useAuth'
import { useTheme } from '@/hooks/useTheme'
import { NAV_LINKS } from './NavLinks'

function CartIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="9" cy="21" r="1" />
      <circle cx="19" cy="21" r="1" />
      <path d="M2.5 3h2l2.6 12.4a2 2 0 0 0 2 1.6h8.4a2 2 0 0 0 2-1.6L21 7H6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function SunIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="12" cy="12" r="4.5" />
      <path
        strokeLinecap="round"
        d="M12 2.5v2M12 19.5v2M21.5 12h-2M4.5 12h-2M18.4 5.6l-1.4 1.4M7 17l-1.4 1.4M18.4 18.4L17 17M7 7 5.6 5.6"
      />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M20.5 14.5A8.5 8.5 0 1 1 9.5 3.5a7 7 0 0 0 11 11Z"
      />
    </svg>
  )
}

function MenuIcon({ open }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      {open ? (
        <path d="M5 5l14 14M19 5L5 19" strokeLinecap="round" />
      ) : (
        <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
      )}
    </svg>
  )
}

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { totalItems } = useCart()
  const { user, isAuthenticated, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    setMobileOpen(false)
    navigate('/')
  }

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 12)
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const linkClasses = ({ isActive }) =>
    `text-sm tracking-wide transition-colors duration-200 ${
      isActive ? 'text-gold' : 'text-ivory-dim hover:text-ivory'
    }`

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-ink/90 backdrop-blur-md shadow-lg shadow-black/30 border-b border-gold/10'
          : 'bg-ink/60 backdrop-blur-sm border-b border-transparent'
      }`}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <NavLink to="/" className="font-display text-2xl tracking-widest text-ivory">
          {STORE_CONFIG.name}
          <span className="ml-1 text-gold">.</span>
        </NavLink>

        <div className="hidden items-center gap-7 lg:flex">
          {NAV_LINKS.map((link) => (
            <NavLink key={link.to} to={link.to} className={linkClasses} end={link.to === '/'}>
              {link.label}
            </NavLink>
          ))}
        </div>

        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <div className="hidden items-center gap-3 sm:flex">
              <NavLink to="/perfil" className="text-sm text-ivory-dim hover:text-ivory">
                Hola, <span className="text-ivory">{user.name.split(' ')[0]}</span>
              </NavLink>
              <button
                type="button"
                onClick={handleLogout}
                className="text-sm text-ivory-dim transition-colors hover:text-gold"
              >
                Cerrar sesión
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="hidden text-sm text-ivory-dim transition-colors hover:text-ivory sm:inline-block"
            >
              Iniciar sesión
            </button>
          )}

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
            aria-label="Ver carrito"
            onClick={() => navigate('/carrito')}
            className="relative text-ivory transition-colors hover:text-gold"
          >
            <CartIcon />
            {totalItems > 0 && (
              <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-gold text-[10px] font-semibold text-on-gold">
                {totalItems > 9 ? '9+' : totalItems}
              </span>
            )}
          </button>

          <button
            type="button"
            aria-label="Abrir menú"
            className="text-ivory lg:hidden"
            onClick={() => setMobileOpen((open) => !open)}
          >
            <MenuIcon open={mobileOpen} />
          </button>
        </div>
      </nav>

      {mobileOpen && (
        <div className="border-t border-gold/10 bg-ink/95 px-4 pb-6 pt-2 lg:hidden">
          <div className="flex flex-col gap-4 pt-4">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                className={linkClasses}
                end={link.to === '/'}
              >
                {link.label}
              </NavLink>
            ))}
            {isAuthenticated ? (
              <>
                <NavLink to="/perfil" onClick={() => setMobileOpen(false)} className="text-sm text-ivory-dim hover:text-ivory">
                  Hola, <span className="text-ivory">{user.name.split(' ')[0]}</span>
                </NavLink>
                <button type="button" onClick={handleLogout} className="text-left text-sm text-ivory-dim hover:text-gold">
                  Cerrar sesión
                </button>
              </>
            ) : (
              <>
                <NavLink to="/login" onClick={() => setMobileOpen(false)} className={linkClasses}>
                  Iniciar sesión
                </NavLink>
                <NavLink to="/registro" onClick={() => setMobileOpen(false)} className={linkClasses}>
                  Crear cuenta
                </NavLink>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
