import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { RegisterPage, registrationConfirmationSchema } from './register-page'

describe('RegisterPage', () => {
  it('shows the data required to create a student account', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>
    )

    expect(html).toContain('id="register-name"')
    expect(html).toContain('id="register-email"')
    expect(html).toContain('id="register-registration"')
    expect(html).toContain('id="register-password"')
    expect(html).toContain('id="register-password-confirmation"')
    expect(html).not.toContain('aria-controls="register-password-confirmation"')
    expect(html).toContain('Criar conta')
    expect(html).toContain('Já possui conta?')
  })

  it('requires a six-digit email confirmation code', () => {
    expect(registrationConfirmationSchema.safeParse({ code: '12345' }).success).toBe(false)
    expect(registrationConfirmationSchema.safeParse({ code: '123456' }).success).toBe(true)
  })
})
