export const formatPhone = (
  value: string = '',
  options?: {
    removeCountryCode?: boolean
  },
): string => {
  if (!value) return ''
  const removeCountryCode = options?.removeCountryCode ?? true
  const trimmed = value.trim()

  // Keep explicit international numbers untouched when not BR country code
  if (trimmed.startsWith('+') && !trimmed.startsWith('+55')) {
    return value
  }

  // Remove all non-digit characters
  const digits = value.replace(/\D/g, '')

  // Progressive BR formatting while typing (DDD + 8/9-digit local number)
  if (digits.length <= 2) {
    return `(${digits}`
  }
  if (digits.length <= 6) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  }
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6, 10)}`
  }
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`
  }

  // BR with country code (55 + DDD + 8/9-digit local number)
  if ((digits.length === 12 || digits.length === 13) && digits.startsWith('55')) {
    const countryCode = digits.slice(0, 2)
    const areaCode = digits.slice(2, 4)
    const local = digits.slice(4)

    if (local.length === 8) {
      const formattedLocal = `${local.slice(0, 4)}-${local.slice(4)}`
      if (removeCountryCode) return `(${areaCode}) ${formattedLocal}`
      return `+${countryCode} (${areaCode}) ${formattedLocal}`
    }

    if (local.length === 9) {
      const formattedLocal = `${local.slice(0, 5)}-${local.slice(5)}`
      if (removeCountryCode) return `(${areaCode}) ${formattedLocal}`
      return `+${countryCode} (${areaCode}) ${formattedLocal}`
    }
  }

  // Safer default for non-BR or unexpected lengths
  return value
}

export const formatPostalCode = (value: string) => {
  const digits = value.replace(/\D/g, '')
  if (digits.length <= 5) return digits
  return `${digits.slice(0, 5)}-${digits.slice(5, 8)}`
}

export const formatCPF = (value: string): string => {
  if (!value) return ''

  // Remove all non-digit characters
  const digits = value.replace(/\D/g, '')

  // Format as XXX.XXX.XXX-XX
  if (digits.length <= 3) {
    return digits
  }
  if (digits.length <= 6) {
    return `${digits.slice(0, 3)}.${digits.slice(3)}`
  }
  if (digits.length <= 9) {
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`
  }
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`
}

export const formatRG = (value: string): string => {
  if (!value) return ''

  // Remove all non-alphanumeric characters
  const cleaned = value.replace(/[^a-zA-Z0-9]/g, '')

  // Format as XX.XXX.XXX-X (standard RG format)
  if (cleaned.length <= 2) {
    return cleaned
  }
  if (cleaned.length <= 5) {
    return `${cleaned.slice(0, 2)}.${cleaned.slice(2)}`
  }
  if (cleaned.length <= 8) {
    return `${cleaned.slice(0, 2)}.${cleaned.slice(2, 5)}.${cleaned.slice(5)}`
  }
  return `${cleaned.slice(0, 2)}.${cleaned.slice(2, 5)}.${cleaned.slice(5, 8)}-${cleaned.slice(8, 9)}`
}
