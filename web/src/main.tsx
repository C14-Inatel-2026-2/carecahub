import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'sonner'

import './index.css'
import { RouterProvider } from 'react-router-dom'
import { ThemeProvider } from '@/components/theme-provider.tsx'
import { SWRProvider } from './api/index.ts'
import { router } from './router/index.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <SWRProvider>
        <RouterProvider router={router} />
        <Toaster richColors />
      </SWRProvider>
    </ThemeProvider>
  </StrictMode>
)
