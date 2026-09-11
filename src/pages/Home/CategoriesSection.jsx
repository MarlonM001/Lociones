import { useEffect, useState } from 'react'
import { CATEGORIES } from '@/config/categories'
import { getProductCountByCategory } from '@/services/products'
import { CategoryCard } from '@/components/product/CategoryCard'

export function CategoriesSection() {
  const [counts, setCounts] = useState({})

  useEffect(() => {
    Promise.all(
      CATEGORIES.map(async (category) => [category.id, await getProductCountByCategory(category.id)]),
    ).then((entries) => setCounts(Object.fromEntries(entries)))
  }, [])

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-10 text-center">
        <span className="text-xs uppercase tracking-widest-plus text-gold">Colecciones</span>
        <h2 className="mt-2 font-display text-3xl text-ivory sm:text-4xl">Explora por categoría</h2>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {CATEGORIES.map((category) => (
          <CategoryCard key={category.id} category={category} productCount={counts[category.id]} />
        ))}
      </div>
    </section>
  )
}
