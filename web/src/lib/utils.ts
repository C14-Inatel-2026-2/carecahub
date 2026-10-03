import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getFriendlyDate(
  inputDate: Date,
  format: 'dd/mm/yyyy' | 'dd/mm/yyyy - hh:mm' = 'dd/mm/yyyy',
  referenceDate: Date = new Date()
): string {
  const date = new Date(inputDate)
  const today = new Date(referenceDate)
  const dateDay = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  const todayDay = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())
  const diffDays = (dateDay - todayDay) / (1000 * 60 * 60 * 24)

  const timePart = new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)

  if (diffDays === 0) return format === 'dd/mm/yyyy - hh:mm' ? `hoje às ${timePart}` : 'Hoje'
  if (diffDays === -1) return format === 'dd/mm/yyyy - hh:mm' ? `ontem às ${timePart}` : 'Ontem'
  if (format === 'dd/mm/yyyy - hh:mm' && diffDays < -1) return `há ${Math.abs(diffDays)} dias`

  const datePart = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)

  return format === 'dd/mm/yyyy' ? datePart : `${datePart} - ${timePart}h`
}
