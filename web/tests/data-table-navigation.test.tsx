import type { ComponentProps, KeyboardEvent, MouseEvent } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { DataTable } from '../src/components/data-table'

const captured = vi.hoisted(() => ({ row: {} as ComponentProps<'tr'> }))

vi.mock('@/components/ui/table', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  TableRow: (props: ComponentProps<'tr'>) => {
    if (props.onClick) captured.row = props
    return <tr>{props.children}</tr>
  },
}))

afterEach(() => vi.unstubAllGlobals())

const item = { id: 'user-1', name: 'Usuário' }

function renderTable() {
  const navigate = vi.fn()
  renderToStaticMarkup(
    <DataTable
      data={[item]}
      columns={[{ header: 'Nome', accessorKey: 'name' }]}
      onRowClick={navigate}
    />
  )
  return navigate
}

describe('table row navigation', () => {
  it('does not navigate when a click bubbles from a menu rendered in a portal', () => {
    const navigate = renderTable()
    captured.row.onClick!({
      target: new EventTarget(),
      currentTarget: { contains: () => false },
    } as unknown as MouseEvent<HTMLTableRowElement>)
    expect(navigate).not.toHaveBeenCalled()
  })

  it.each(['Enter', ' '])('does not navigate when %s is pressed in a row control', (key) => {
    const navigate = renderTable()
    const preventDefault = vi.fn()
    captured.row.onKeyDown!({
      target: new EventTarget(),
      currentTarget: new EventTarget(),
      key,
      preventDefault,
    } as unknown as KeyboardEvent<HTMLTableRowElement>)
    expect(navigate).not.toHaveBeenCalled()
    expect(preventDefault).not.toHaveBeenCalled()
  })

  it.each(['Enter', ' '])(
    'preserves keyboard navigation when the row itself receives %s',
    (key) => {
      const navigate = renderTable()
      const row = new EventTarget()
      const preventDefault = vi.fn()
      captured.row.onKeyDown!({
        target: row,
        currentTarget: row,
        key,
        preventDefault,
      } as unknown as KeyboardEvent<HTMLTableRowElement>)
      expect(navigate).toHaveBeenCalledWith(item)
      expect(preventDefault).toHaveBeenCalledOnce()
    }
  )

  it('preserves ordinary clicks on the row', () => {
    class Cell extends EventTarget {
      closest() {
        return null
      }
    }
    vi.stubGlobal('Element', Cell)
    const navigate = renderTable()
    captured.row.onClick!({
      target: new Cell(),
      currentTarget: { contains: () => true },
    } as unknown as MouseEvent<HTMLTableRowElement>)
    expect(navigate).toHaveBeenCalledWith(item)
  })
})
