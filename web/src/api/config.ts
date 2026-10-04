import { toast } from 'sonner'
import type { SWRConfiguration } from 'swr'
import { getApiErrorMessage } from './errors'
import { fetcher } from './fetchers'

/**
 * Global SWR configuration
 * @see https://swr.vercel.app/docs/global-configuration
 */
export const swrConfig: SWRConfiguration = {
  // Use fetcher globally so we don't need to pass it to every useSWR call
  fetcher,

  // Revalidation settings
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  shouldRetryOnError: false,
  dedupingInterval: 3000,
  errorRetryCount: 3,
  errorRetryInterval: 5000,
  focusThrottleInterval: 5000,

  // Global error handler - shows toast for all errors
  onError: (
    error: Error & { statusCode?: number; errKey?: string; friendlyMessage?: string },
    key
  ) => {
    // Show toast with error message
    toast.error('Erro ao carregar dados', {
      description: getApiErrorMessage(
        error instanceof TypeError ? { errKey: 'NETWORK_ERROR' } : error
      ),
    })

    console.error('[SWR Error]', { key, error })
  },
}
