// @vitest-environment jsdom

import { cleanup, render, waitFor } from '@testing-library/react'
import { useEffect } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Sidebar, SidebarProvider, useSidebar } from './sidebar'

vi.mock('@/lib/use-mobile', () => ({ useIsMobile: () => true }))

function OpenMobileSidebar() {
  const { setOpenMobile } = useSidebar()

  useEffect(() => setOpenMobile(true), [setOpenMobile])

  return <Sidebar mobileSide='right'>Navegação</Sidebar>
}

describe('Sidebar', () => {
  afterEach(cleanup)

  it('keeps the close button visible in the mobile panel', async () => {
    render(
      <SidebarProvider>
        <OpenMobileSidebar />
      </SidebarProvider>
    )

    await waitFor(() => {
      const panel = document.querySelector('[data-slot="sidebar"][data-mobile="true"]')
      expect(panel).not.toBeNull()
      expect(panel?.className).not.toContain('[&>button]:hidden')
      expect(panel?.className).toContain('[&>button[data-slot=sheet-close]]:size-9')
      expect(panel?.className).toContain('[&>button[data-slot=sheet-close]_svg]:size-5')
    })
  })
})
