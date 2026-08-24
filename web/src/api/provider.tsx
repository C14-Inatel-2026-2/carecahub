'use client'

import type { ReactNode } from 'react'
import { SWRConfig } from 'swr'
import { swrConfig } from './config'

interface SWRProviderProps {
  children: ReactNode
}

/**
 * SWR Provider with global configuration
 * Wrap your app with this provider to enable SWR globally
 * @see https://swr.vercel.app/docs/global-configuration
 */
export function SWRProvider({ children }: SWRProviderProps) {
  return <SWRConfig value={swrConfig}>{children}</SWRConfig>
}
