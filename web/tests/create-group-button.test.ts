import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { CreateGroupDialog } from '../src/modules/groups/dialogs/create-group-dialog'

describe('CreateGroupDialog', () => {
  it('renders the entry point for the real group creation form', () => {
    const html = renderToStaticMarkup(createElement(CreateGroupDialog))

    expect(html).toContain('Novo grupo')
  })
})
