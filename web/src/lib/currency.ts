export const formatCurrency = (
  valueInCents: number | string,
  options?: {
    removeCents?: boolean
    locale?: string
    currency?: string
  }
): string => {
  const { locale = 'pt-BR', currency = 'BRL', removeCents = false } = options || {}
  const numberValue =
    typeof valueInCents === 'string'
      ? Number.parseFloat(valueInCents.replace(/[^0-9.-]+/g, ''))
      : valueInCents
  if (Number.isNaN(numberValue)) return ''

  const currencyValue = centsToDouble(numberValue)

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: removeCents ? 0 : 2,
  }).format(currencyValue)
}

export function centsToDouble(cents?: number) {
  if (!cents) {
    return 0
  }
  return parseFloat((cents / 100).toFixed(2))
}

export function doubleToCents(double?: number) {
  if (!double) {
    return 0
  }
  return Math.round(double * 100)
}
