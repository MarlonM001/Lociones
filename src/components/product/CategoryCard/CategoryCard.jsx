import { Button } from '@/components/ui/Button'

export function CategoryCard({ category, productCount }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-ivory/5 bg-charcoal">
      <div className={`absolute inset-0 bg-gradient-to-br ${category.accent}`} />
      <img
        src={category.image}
        alt={category.name}
        loading="lazy"
        className="h-56 w-full object-cover opacity-90 transition-transform duration-500 group-hover:scale-105"
      />
      <div className="relative flex flex-col gap-2 p-6">
        <h3 className="font-display text-2xl text-ivory">{category.name}</h3>
        <p className="text-xs uppercase tracking-widest-plus text-gold/80">
          {productCount ?? '—'} productos
        </p>
        <p className="text-sm text-ivory-dim">{category.shortDescription}</p>
        <Button to={`/productos/${category.slug}`} variant="secondary" size="sm" className="mt-3 self-start">
          Ver productos
        </Button>
      </div>
    </div>
  )
}
