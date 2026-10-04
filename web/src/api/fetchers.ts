import { getApiErrorMessage } from './errors'

/**
 * Base API URL from environment
 */
const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3030'

/**
 * Extended Error type with API error properties
 */
export interface APIError extends Error {
  errKey?: string
  statusCode?: number
  friendlyMessage?: string
}

export interface FetcherParams {
  url: string
  userId?: string
  clinicId?: string
}

export function buildQueryString(
  params?: Record<string, string | number | boolean | Date | undefined | null>
): string {
  if (!params) return ''

  return (
    '?' +
    new URLSearchParams(
      Object.entries(params)
        .filter(([_, value]) => value !== undefined && value !== null)
        .map(([key, value]) => [key, value instanceof Date ? value.toISOString() : String(value)])
    ).toString()
  )
}

async function validateResponse<T>(response: Response): Promise<T> {
  let data: Record<string, unknown>
  try {
    data = await response.json()
  } catch (cause) {
    const error: APIError = new Error(getApiErrorMessage({ statusCode: response.status }), {
      cause,
    })
    error.statusCode = response.status
    error.friendlyMessage = error.message
    throw error
  }
  if (!response.ok || data.errKey) {
    const errKey = typeof data.errKey === 'string' ? data.errKey : undefined
    const message = getApiErrorMessage({ errKey, statusCode: response.status })
    const error: APIError = new Error(message)
    error.errKey = errKey
    error.statusCode = response.status
    error.friendlyMessage = message
    throw error
  }

  return data as T
}

/**
 * Generic fetcher for SWR that handles API responses with errKey validation
 * Throws error if response has errKey (which triggers toast in hooks)
 *
 * Authentication is handled via HttpOnly cookies sent automatically by the browser
 *
 * @example
 * const { data } = useSWR('/appointments', fetcher);
 */
export async function fetcher<T = unknown>({ url }: FetcherParams): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${url}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // Include cookies in the request
    cache: 'no-store',
  })

  const data = await validateResponse<T>(response)

  return data
}

/**
 * Mutate fetcher for POST/PATCH/DELETE operations
 * Returns { success: boolean } or throws error
 *
 * Authentication is handled via HttpOnly cookies sent automatically by the browser
 *
 * @example
 * await mutateFetcher('/appointments', 'POST', { data });
 */
export async function mutateFetcher<BODY = Record<string, unknown>, RESPONSE = unknown>(
  url: string,
  method: 'POST' | 'PATCH' | 'DELETE' | 'PUT',
  body?: BODY
): Promise<RESPONSE & { success: true; ok: true }> {
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData
  const response = await fetch(`${API_BASE_URL}${url}`, {
    method,
    headers: isFormData
      ? undefined
      : {
          'Content-Type': 'application/json',
        },
    credentials: 'include', // Include cookies in the request
    ...(body && { body: isFormData ? body : JSON.stringify(body) }),
    cache: 'no-store',
  })

  const data = await validateResponse<RESPONSE>(response)

  return {
    ...(data as RESPONSE),
    success: true,
    ok: true,
  }
}
