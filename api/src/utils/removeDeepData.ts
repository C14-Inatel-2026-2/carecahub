export function removeDeepData(data: unknown, fields: string[]): unknown {
  if (typeof data !== 'object' || data === null || data instanceof Date) {
    return data
  }

  if (Array.isArray(data)) {
    return data.map((item) => removeDeepData(item, fields))
  }

  const result: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(data)) {
    if (fields.includes(key)) continue
    result[key] = removeDeepData(value, fields)
  }

  return result
}
