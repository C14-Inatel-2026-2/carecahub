import { toast } from 'sonner'
import { buildQueryString, mutateFetcher } from '@/api'
import type { WriterMap } from './writer.types'

// ── Type helpers ──────────────────────────────────────────────────────────────

// type ExtractMethod<K extends string> = K extends `${infer M} ${string}` ? M : never;
type ExtractPath<K extends string> = K extends `${string} ${infer P}` ? P : never

/** Extracts named `:param` segments from a path string */
type ExtractParamNames<P extends string> = P extends `${string}:${infer Param}/${infer Rest}`
  ? Param | ExtractParamNames<`/${Rest}`>
  : P extends `${string}:${infer Param}`
    ? Param
    : never

type HasParams<P extends string> = [ExtractParamNames<P>] extends [never] ? false : true

type PathParams<K extends keyof WriterMap> = Record<ExtractParamNames<ExtractPath<K>>, string>

// ── Options / Result ──────────────────────────────────────────────────────────

type BodyOption<K extends keyof WriterMap> = WriterMap[K]['body'] extends void
  ? { body?: undefined }
  : { body: WriterMap[K]['body'] }

type ParamOption<K extends keyof WriterMap> =
  HasParams<ExtractPath<K>> extends true ? { params: PathParams<K> } : { params?: undefined }

type QueryOption = {
  /**
   * Optional query string parameters appended to the URL.
   * e.g. `{ scope: 'single' }` → `?scope=single`
   */
  query?: Record<string, string | number | boolean | null | undefined>
}

type ToastOption = {
  /** If provided, shows a success toast on a successful response */
  onSuccessMessage?: string
  /**
   * If provided, shows this message on error instead of the API's friendlyMessage.
   * If omitted, the API's `friendlyMessage` (or `message`) is used automatically.
   */
  onErrorMessage?: string
  /** When true, skips automatic success/error toasts (callbacks still run). */
  silent?: boolean
}

type CallbackOption<K extends keyof WriterMap> = {
  onSuccess?: (data: WriterMap[K]['response']) => void
  onError?: (error: WriterError) => void
}

export type WriterOptions<K extends keyof WriterMap> = BodyOption<K> &
  ParamOption<K> &
  QueryOption &
  ToastOption &
  CallbackOption<K>

export type WriterError = {
  errKey: string
  message: string
  friendlyMessage?: string
}

export type WriterResult<K extends keyof WriterMap> =
  | { ok: true; data: WriterMap[K]['response'] & { success: true; ok: true } }
  | { ok: false; error: WriterError }

// ── Main function ─────────────────────────────────────────────────────────────

/**
 * Centralized, type-safe wrapper for all POST/PATCH/PUT/DELETE API calls.
 *
 * Features:
 * - Dynamically typed request body and response per endpoint (via `WriterMap`)
 * - Optional centralized toast handling — pass `onSuccessMessage` / `onErrorMessage`
 * - URL param replacement — `params: { id: '123' }` fills `:id` in path
 * - Query string support — `query: { scope: 'single' }` appends `?scope=single`
 * - Never throws — always returns `{ ok: true, data }` or `{ ok: false, error }`
 *
 * Adding a new endpoint: add one entry to `./writer.types.ts`. Done.
 *
 * @example — with toast
 * ```ts
 * const result = await writer('POST /payments', {
 *   body: payload,
 *   onSuccessMessage: 'Pagamento criado!',
 * });
 * if (result.ok) onSuccess();
 * ```
 *
 * @example — without toast (handle manually)
 * ```ts
 * const result = await writer('DELETE /appointments/:id', {
 *   params: { id: appointmentId },
 *   query: { scope: 'single' },
 * });
 * if (!result.ok) form.setError('root', { message: result.error.friendlyMessage });
 * ```
 */
export async function writer<K extends keyof WriterMap>(
  key: K,
  options: WriterOptions<K> = {} as WriterOptions<K>
): Promise<WriterResult<K>> {
  const spaceIndex = (key as string).indexOf(' ')
  const method = (key as string).slice(0, spaceIndex) as 'POST' | 'PATCH' | 'DELETE' | 'PUT'
  let url = (key as string).slice(spaceIndex + 1)

  // Replace :param placeholders with actual values
  if (options.params) {
    for (const [param, value] of Object.entries(options.params as Record<string, string>)) {
      url = url.replace(`:${param}`, encodeURIComponent(value))
    }
  }

  // Append query string
  if (options.query) {
    url += buildQueryString(options.query)
  }

  try {
    const data = await mutateFetcher(url, method, options.body as never)

    if (options.onSuccessMessage && !options.silent) {
      toast.success(options.onSuccessMessage)
    }

    const result = data as WriterMap[K]['response'] & {
      success: true
      ok: true
    }
    options.onSuccess?.(result)

    return { ok: true, data: result }
  } catch (err: unknown) {
    const raw = err as Record<string, unknown> | null
    const apiError: WriterError = {
      errKey: (raw?.errKey as string) ?? 'UNKNOWN_ERROR',
      message: (raw?.message as string) ?? 'Erro desconhecido',
      friendlyMessage: raw?.friendlyMessage as string | undefined,
    }

    const errorMessage =
      options.onErrorMessage ?? apiError.friendlyMessage ?? 'Verifique sua conexão com a internet'

    if (!options.silent) {
      toast.error(errorMessage)
    }

    options.onError?.(apiError)

    return { ok: false, error: apiError }
  }
}
