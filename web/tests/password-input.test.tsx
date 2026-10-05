import { renderToStaticMarkup } from 'react-dom/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PasswordInput } from '../src/components/form-fields/password-input'

const state = vi.hoisted(() => ({
  visible: false,
  toggle: undefined as undefined | (() => void),
}))

vi.mock('react', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react')>()),
  useState: () => [
    state.visible,
    (update: (value: boolean) => boolean) => {
      state.visible = update(state.visible)
    },
  ],
}))
vi.mock('@/components/ui/input', () => ({
  Input: (props: React.ComponentProps<'input'>) => <input {...props} />,
}))
vi.mock('@/components/ui/button', () => ({
  Button: ({
    onClick,
    variant: _variant,
    size: _size,
    ...props
  }: React.ComponentProps<'button'> & { variant: string; size: string }) => {
    state.toggle = () => onClick?.({} as React.MouseEvent<HTMLButtonElement>)
    return <button {...props} />
  },
}))

beforeEach(() => {
  state.visible = false
})

describe('PasswordInput', () => {
  it('shows and hides the same password without becoming a submit button', () => {
    const render = () =>
      renderToStaticMarkup(
        <PasswordInput id='password' name='password' value='Senha123!' readOnly />
      )
    expect(render()).toContain('type="password"')
    state.toggle!()
    const visible = render()
    expect(visible).toContain('type="text"')
    expect(visible).toContain('value="Senha123!"')
    expect(visible).toContain('aria-label="Ocultar senha"')
    expect(visible).toContain('aria-pressed="true"')
    expect(visible).toContain('type="button"')
    state.toggle!()
    expect(render()).toContain('type="password"')
  })

  it('preserves error associations, autocomplete and disabled state', () => {
    const html = renderToStaticMarkup(
      <PasswordInput
        id='password'
        name='password'
        aria-invalid
        aria-describedby='password-error'
        autoComplete='current-password'
        disabled
      />
    )
    expect(html).toContain('aria-invalid="true"')
    expect(html).toContain('aria-describedby="password-error"')
    expect(html).toMatch(/autocomplete="current-password"/i)
    expect(html).toContain('aria-controls="password"')
    expect(html.match(/disabled=""/g)).toHaveLength(2)
  })
})
