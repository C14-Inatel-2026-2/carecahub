/**
 * Converts local time (HH:mm) to UTC time (HH:mm)
 * @param localTime - Time in HH:mm format (e.g., "23:00")
 * @param referenceDate - Optional reference date (defaults to today)
 * @returns UTC time in HH:mm format
 *
 * Example (Brazil UTC-3):
 * localTimeToUTC("23:00") -> "02:00" (next day in UTC)
 * localTimeToUTC("09:00") -> "12:00" (same day in UTC)
 */
export function localTimeToUTC(localTime: string, referenceDate?: Date): string {
  const date = referenceDate || new Date()
  const [hours, minutes] = localTime.split(':').map(Number)

  // Create a date with the local time
  const localDate = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    hours,
    minutes,
    0,
    0
  )

  // Get UTC hours and minutes
  const utcHours = localDate.getUTCHours().toString().padStart(2, '0')
  const utcMinutes = localDate.getUTCMinutes().toString().padStart(2, '0')

  return `${utcHours}:${utcMinutes}`
}

/**
 * Converts UTC time (HH:mm) to local time (HH:mm)
 * @param utcTime - Time in HH:mm UTC format (e.g., "02:00")
 * @param referenceDate - Optional reference date (defaults to today)
 * @returns Local time in HH:mm format
 *
 * Example (Brazil UTC-3):
 * utcToLocalTime("02:00") -> "23:00" (previous day local)
 * utcToLocalTime("12:00") -> "09:00" (same day local)
 */
export function utcToLocalTime(utcTime: string, referenceDate?: Date): string {
  const date = referenceDate || new Date()
  const [hours, minutes] = utcTime.split(':').map(Number)

  // Create a UTC date
  const utcDate = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), hours, minutes, 0, 0)
  )

  // Get local hours and minutes
  const localHours = utcDate.getHours().toString().padStart(2, '0')
  const localMinutes = utcDate.getMinutes().toString().padStart(2, '0')

  return `${localHours}:${localMinutes}`
}

/**
 * Gets the timezone offset in hours
 * @returns Timezone offset (e.g., -3 for Brazil, 0 for UTC)
 */
export function getTimezoneOffset(): number {
  return -new Date().getTimezoneOffset() / 60
}
