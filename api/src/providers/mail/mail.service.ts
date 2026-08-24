import { Injectable } from '@nestjs/common'
import { MailerService } from '@nestjs-modules/mailer'
import { env } from '@/providers/config/env'
import { CustomLogger } from '@/providers/logger/custom-logger.service'
import { LoggerFactory } from '@/providers/logger/logger-factory.service'
import { ONE_DAY_IN_MS, SysParams } from '@/types'
import { isAfter, subHours } from '@/utils/date'
import { CacheService } from '../cache/cache.service'
import { CacheKey } from '../cache/cache.types'
import { PrismaService } from '../database/prisma.service'
import { MailProps } from './mail.types'

@Injectable()
export class MailService {
  private readonly logger: CustomLogger
  readonly MAX_EMAILS_PER_HOUR = 5
  readonly CACHE_TTL = ONE_DAY_IN_MS
  private systemParameterCache: {
    platformName: string
    platformUrl: string
    platformLogo: string
    platformColor: string
  } | null = null
  constructor(
    private readonly mailerService: MailerService,
    private readonly database: PrismaService,
    private readonly cache: CacheService,
    loggerFactory: LoggerFactory,
  ) {
    this.logger = loggerFactory.create(MailService.name)
  }

  private async canSendEmail(email: string): Promise<boolean> {
    const mailbox = email.toLowerCase().trim()

    const cachedMailboxCount = await this.cache.get({
      key: CacheKey.mailMessagesCount,
      scope: mailbox,
    })

    const emailsSentInLastHour =
      cachedMailboxCount?.lastMessages?.filter((msg) =>
        isAfter(msg.date, subHours(new Date(), 1)),
      ) || []

    if (emailsSentInLastHour.length >= this.MAX_EMAILS_PER_HOUR) {
      this.logger.warn(
        `Mailbox ${mailbox} has reached the hourly limit of ${this.MAX_EMAILS_PER_HOUR} emails.`,
      )
      return false
    }

    this.logger.log(`Caching email count for ${mailbox}`)

    await this.cache.set({
      key: CacheKey.mailMessagesCount,
      scope: mailbox,
      value: {
        count: (cachedMailboxCount?.count || 0) + 1,
        lastMessages: [...emailsSentInLastHour, { date: new Date() }],
        lastMessageDate: new Date(),
      },
      ttl: this.CACHE_TTL,
    })

    return true
  }

  async getEmailDefaultContext(): Promise<Partial<MailProps['context']>> {
    const parameterMap = this.systemParameterCache

    if (!parameterMap) {
      const sysParams = await this.database.sys_params.findMany({
        where: {
          key: {
            in: [
              SysParams.PLATFORM_COLOR,
              SysParams.PLATFORM_LOGO,
              SysParams.PLATFORM_NAME,
              SysParams.PLATFORM_URL,
            ],
          },
        },
      })

      this.systemParameterCache = {
        platformColor:
          sysParams.find((p) => p.key === SysParams.PLATFORM_COLOR)?.value ?? '#178D5D',
        platformLogo: sysParams.find((p) => p.key === SysParams.PLATFORM_LOGO)?.value ?? '',
        platformName: sysParams.find((p) => p.key === SysParams.PLATFORM_NAME)?.value ?? 'Ignite',
        platformUrl: sysParams.find((p) => p.key === SysParams.PLATFORM_URL)?.value ?? '',
      }
    }

    return {
      lang: 'pt-br',
      title: parameterMap?.platformName || 'Ignite',
      webUrl: parameterMap?.platformUrl,
      logo: parameterMap?.platformLogo,
      color: parameterMap?.platformColor || '#178D5D',
      ctaUrl: parameterMap?.platformUrl,
      CTA: 'Conferir',
    }
  }

  /**
   * 👇 Will be called by consumer in secondary process to send email
   * @summary Do not call this method directly, use `sendMail` instead
   */
  async executeProviderService({ to, subject, template, context, attachments }: MailProps) {
    if (!env.MAIL_ENABLED) {
      this.logger.log(`Email sending is disabled, skipping email to ${to} with subject ${subject}`)
      return
    }

    if (!(await this.canSendEmail(to))) {
      return
    }

    try {
      this.logger.log(`Sending email to ${to} with subject ${subject}`)

      const defaultContext = await this.getEmailDefaultContext()

      await this.mailerService.sendMail({
        to,
        subject,
        template: template || 'default',
        context: {
          ...defaultContext,
          ...context,
        },
        attachments,
      })
    } catch (error) {
      this.logger.error(
        `Error sending email to ${to} with subject ${subject} error: ${JSON.stringify(error)}`,
      )
    }
  }

  /**
   * 👇 Schedule mail sending in a broker topic to be consumed by a secondary process
   */
  async sendMail(props: MailProps) {
    if (!env.MAIL_ENABLED) {
      this.logger.log(
        `Email sending is disabled, skipping email to ${props.to} with subject ${props.subject}`,
      )
      return
    }

    this.logger.log(`Scheduling email to ${props.to} with subject ${props.subject}`)
    await this.executeProviderService(props)
  }

  async sendTwoFactorAuthCode(user: { email: string; username: string; code: string }) {
    await this.sendMail({
      to: user.email,
      subject: `Código de autenticação`,
      template: 'default',
      context: {
        title: `Código de autenticação`,
        message: `Seu código de autenticação é: ${user.code}`,
      },
    })
  }

  async sendRecoverPasswordMail(user: { email: string; username: string; token: string }) {
    await this.sendMail({
      to: user.email,
      subject: `Recuperação de senha`,
      context: {
        title: `Recuperação de senha`,
        message: `Olá ${user.username}, clique no botão abaixo para recuperar sua senha. Se você não solicitou a recuperação de senha, por favor, ignore este e-mail.`,
        CTA: 'Recuperar senha',
        ctaUrl: `${env.WEB_URL}/reset?token=${user.token}`,
      },
    })
  }
}
