// @vitest-environment jsdom

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { CreateProjectPage } from './create-project-page'

describe('CreateProjectPage', () => {
  it('renders the three required project option selects', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <CreateProjectPage />
      </MemoryRouter>
    )

    expect(html.match(/data-slot="select-trigger"/g)).toHaveLength(3)

    for (const [id, label] of [
      ['dependency-manager', 'Gerenciador de dependências'],
      ['version-control', 'Sistema de controle de versão'],
      ['repository-type', 'Tipo de repositório'],
    ]) {
      expect(html).toContain(`id="${id}"`)
      expect(html).toContain(label)
      expect(html).toContain('aria-required="true"')
    }
  })

  it('shows the custom dependency manager field when Other is selected', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <CreateProjectPage />
      </MemoryRouter>
    )

    const otherManagerField = /^Outro gerenciador de dependências/
    expect(screen.queryByLabelText(otherManagerField)).toBeNull()

    await user.click(screen.getByRole('combobox', { name: /^Gerenciador de dependências/ }))
    await user.click(screen.getByRole('option', { name: 'Outro' }))

    expect(screen.getByLabelText(otherManagerField)).toBeTruthy()
  })
})
