import { endOfDay, startOfDay } from './date'

export function buildStringFieldQuery(value?: string) {
  return value ? { contains: value, mode: 'insensitive' as const } : undefined
}

export function buildDateFieldQuery({ startDate, endDate }: { startDate?: Date; endDate?: Date }) {
  if (!startDate && !endDate) {
    return undefined
  }

  return {
    gte: startDate ? startOfDay(startDate) : undefined,
    lte: endDate ? endOfDay(endDate) : undefined,
  }
}
