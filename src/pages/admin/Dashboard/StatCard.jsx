export function StatCard({ label, value, hint }) {
  return (
    <div className="rounded-2xl border border-ivory/5 bg-charcoal p-5">
      <p className="text-xs uppercase tracking-widest-plus text-gold/80">{label}</p>
      <p className="mt-2 font-sans text-3xl font-semibold text-ivory">{value}</p>
      {hint && <p className="mt-1 text-xs text-ivory-dim">{hint}</p>}
    </div>
  )
}
