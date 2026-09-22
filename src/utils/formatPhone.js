/** "573227034187" → "+57 322 703 4187" (número colombiano en formato internacional, para mostrar). */
export function formatWhatsAppNumber(number) {
  const digits = String(number ?? '').replace(/\D/g, '')
  if (digits.length === 12 && digits.startsWith('57')) {
    return `+57 ${digits.slice(2, 5)} ${digits.slice(5, 8)} ${digits.slice(8)}`
  }
  return digits ? `+${digits}` : ''
}
