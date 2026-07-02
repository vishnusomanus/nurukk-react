export function formatCurrency(amount?: number | null, currency = 'INR') {
  if (amount == null || Number.isNaN(amount)) return '—'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount)
}
