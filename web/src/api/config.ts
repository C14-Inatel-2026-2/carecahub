import { toast } from 'sonner'
import type { SWRConfiguration } from 'swr'
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
  onError: (error: Error & { statusCode?: number; friendlyMessage?: string }, key) => {
    // Don't show toast for 403 (already redirecting)
    if (error.statusCode === 403) return

    // Show toast with error message
    toast.error('Erro ao carregar dados', {
      description: error.friendlyMessage || 'Verifique sua conexão com a internet',
    })

    console.error('[SWR Error]', { key, error })
  },
}
