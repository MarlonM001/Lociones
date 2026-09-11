import { STORE_CONFIG } from '@/config/store'

const formatter = new Intl.NumberFormat(STORE_CONFIG.locale, {
  style: 'currency',
  currency: STORE_CONFIG.currency,
  maximumFractionDigits: 0,
})

export function formatCurrency(amount) {
  return formatter.format(amount ?? 0)
}
