import { format, subHours } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function formatBrDate(date: Date, mask: string = 'dd/MM/yyyy') {
  if (!date) {
    return ''
  }
  return format(date, mask, { locale: ptBR })
}

/**
 * Formats a date to ISO string with Brazilian timezone offset (UTC-3)
 * This ensures that the frontend sends the correct timezone information
 * @param date - The date to format
 * @returns ISO string with Brazilian timezone offset
 */
export function formatDateTimeWithBrTimezone(date: Date): string {
  if (!date) {
    return ''
  }

  // Use date-fns to add the timezone offset
  // Since we want to represent the local time in Brazil timezone,
  // we need to subtract the offset from UTC
  const dateInBrazilTimezone = subHours(date, 3)

  // Get the ISO string and replace the 'Z' with the correct timezone offset
  const isoString = dateInBrazilTimezone.toISOString()

  // Replace 'Z' with '-03:00' to indicate Brazilian timezone
  return isoString.replace('Z', '-03:00')
}
