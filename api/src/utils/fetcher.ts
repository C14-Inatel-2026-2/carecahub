import { CustomLogger } from '@/providers/logger/custom-logger.service'
import { ErrKeys, ServiceOutput } from '@/types'

export function fetcherFactory({
  baseUrl,
  headers,
  enabled = true,
  logger,
}: {
  baseUrl: string
  headers?: RequestInit['headers']
  enabled?: boolean
  logger: CustomLogger
}) {
  if (!enabled) {
    return async <T>(): Promise<ServiceOutput<T>> => {
      logger.warn('Fetcher is disabled. No requests will be made.')
      return {
        ok: false,
        errKey: ErrKeys.internalServerError,
      }
    }
  }

  return async <T>(url: string, options?: RequestInit): ServiceOutput<T> => {
    const fullUrl = `${baseUrl}${url}`
    try {
      const response = await fetch(fullUrl, {
        ...options,
        headers: {
          ...headers,
          ...options?.headers,
        },
      })

      if (!response.ok) {
        logger.error(
          `Error fetching ${fullUrl}: ${response.status} ${response.statusText}: ${await response.text()}`,
        )
        return {
          ok: false,
          errKey: ErrKeys.internalServerError,
        }
      }

      const responseText = await response.text()
      const data = responseText ? JSON.parse(responseText) : {}

      return {
        ...(data as T),
        ok: true,
      }
    } catch (error) {
      logger.error(`Error fetching ${fullUrl}: ${error}`)
      return {
        ok: false,
        errKey: ErrKeys.internalServerError,
      }
    }
  }
}
