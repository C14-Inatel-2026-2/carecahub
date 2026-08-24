type DateInput = Date | string | number

function toDate(value: DateInput): Date {
  return value instanceof Date ? new Date(value.getTime()) : new Date(value)
}

/** Returns the local start of the supplied calendar day. */
export function startOfDay(date: DateInput): Date {
  const result = toDate(date)
  result.setHours(0, 0, 0, 0)
  return result
}

/** Returns the local end of the supplied calendar day. */
export function endOfDay(date: DateInput): Date {
  const result = toDate(date)
  result.setHours(23, 59, 59, 999)
  return result
}

/** Returns a new date shifted backwards by the supplied number of hours. */
export function subHours(date: DateInput, hours: number): Date {
  const result = toDate(date)
  result.setHours(result.getHours() - hours)
  return result
}

export function isBefore(first: DateInput, second: DateInput): boolean {
  return toDate(first).getTime() < toDate(second).getTime()
}

export function isAfter(first: DateInput, second: DateInput): boolean {
  return toDate(first).getTime() > toDate(second).getTime()
}
