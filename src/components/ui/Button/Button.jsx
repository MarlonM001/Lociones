import { Link } from 'react-router-dom'

const VARIANT_CLASSES = {
  primary: 'bg-gold text-on-gold hover:bg-gold-light shadow-lg shadow-gold-dark/20',
  secondary: 'border border-gold/60 text-ivory hover:border-gold hover:bg-gold/10',
  ghost: 'text-ivory hover:text-gold',
  whatsapp: 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-lg shadow-emerald-900/30',
}

const SIZE_CLASSES = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3 text-sm',
  lg: 'px-8 py-4 text-base',
}

export function Button({
  as,
  to,
  href,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  children,
  ...rest
}) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-full font-medium tracking-wide transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed'
  const classes = [
    base,
    VARIANT_CLASSES[variant],
    SIZE_CLASSES[size],
    fullWidth ? 'w-full' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  if (to) {
    return (
      <Link to={to} className={classes} {...rest}>
        {children}
      </Link>
    )
  }

  if (href) {
    return (
      <a href={href} className={classes} {...rest}>
        {children}
      </a>
    )
  }

  const Component = as || 'button'
  return (
    <Component className={classes} {...rest}>
      {children}
    </Component>
  )
}
