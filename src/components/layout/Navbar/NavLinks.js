import { CATEGORIES } from '@/config/categories'

export const NAV_LINKS = [
  { label: 'Inicio', to: '/' },
  { label: 'Catálogo', to: '/catalogo' },
  ...CATEGORIES.map((category) => ({
    label: category.name,
    to: `/productos/${category.slug}`,
  })),
  { label: 'Referencias', to: '/referencias' },
]
