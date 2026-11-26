import assert from 'node:assert/strict'
import { beforeEach, describe, it, vi } from 'vitest'
import { CacheService } from '@/providers/cache/cache.service'
import { env } from '@/providers/config/env'
import { DrizzleService } from '@/providers/database/drizzle.service'
import { LoggerFactory } from '@/providers/logger/logger-factory.service'
import { MailService } from './mail.service'

describe('MailService', () => {
  let error: ReturnType<typeof vi.fn>

  beforeEach(() => {
    error = vi.fn()
  })

  it('logs SMTP diagnostics without serializing the error object', async () => {
    const previousMailEnabled = env.MAIL_ENABLED
    env.MAIL_ENABLED = true
    const smtpError = Object.assign(new Error('Authentication failed'), {
      code: 'EAUTH',
      response: '535-5.7.8 Username and Password not accepted',
    })
    const service = new MailService(
      { sendMail: vi.fn().mockRejectedValue(smtpError) } as never,
      {
        db: {
          select: () => ({
            from: () => ({ where: async () => [] }),
          }),
        },
      } as unknown as DrizzleService,
      { get: vi.fn(), set: vi.fn() } as unknown as CacheService,
      {
        create: () => ({ log: vi.fn(), warn: vi.fn(), error }),
      } as unknown as LoggerFactory,
    )

    await service.executeProviderService({
      to: 'student@example.com',
      subject: 'Confirme seu e-mail',
      context: {},
    })

    env.MAIL_ENABLED = previousMailEnabled

    assert.match(error.mock.calls[0][0], /Authentication failed/)
    assert.match(error.mock.calls[0][0], /EAUTH/)
    assert.match(error.mock.calls[0][0], /535-5\.7\.8/)
  })

  it('uses the registration template with only the recipient first name', async () => {
    const service = new MailService(
      {} as never,
      {} as DrizzleService,
      {} as CacheService,
      { create: () => ({ log: vi.fn(), warn: vi.fn(), error: vi.fn() }) } as unknown as LoggerFactory,
    )
    const sendMail = vi.spyOn(service, 'sendMail').mockResolvedValue()

    await service.sendRegistrationVerificationCode({
      email: 'ana@example.com',
      username: 'Ana Maria Silva',
      code: '123456',
    })

    assert.deepEqual(sendMail.mock.calls[0][0], {
      to: 'ana@example.com',
      subject: 'Confirme seu e-mail',
      template: 'registration-verification',
      context: { firstName: 'Ana', code: '123456' },
    })
  })
})
