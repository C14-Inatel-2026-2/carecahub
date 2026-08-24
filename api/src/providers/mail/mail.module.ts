import { join } from 'node:path'
import { Module } from '@nestjs/common'
import { MailerModule } from '@nestjs-modules/mailer'
import { HandlebarsAdapter } from '@nestjs-modules/mailer/adapters/handlebars.adapter'
import { env } from '@/providers/config/env'
import { MailService } from './mail.service'

@Module({
  imports: [
    MailerModule.forRoot({
      transport: {
        host: env.MAIL_HOST,
        port: env.MAIL_PORT,
        secure: false,
        auth: {
          user: env.MAIL_USER,
          pass: env.MAIL_PASS,
        },
      },
      defaults: {
        from: 'Admin <contato@example.com.br>',
      },
      template: {
        dir: join(__dirname, 'templates'),
        adapter: new HandlebarsAdapter(),
        options: { strict: false },
      },
    }),
  ],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
