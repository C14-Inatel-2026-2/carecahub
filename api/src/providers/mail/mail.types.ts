import { Attachment } from 'nodemailer/lib/mailer'

export type Template = 'default'

export type MailProps = {
  to: string
  subject: string
  template?: Template
  context: {
    lang?: string
    title?: string
    webUrl?: string
    logo?: string
    color?: string
    message?: string
    CTA?: string
    ctaUrl?: string
  }
  attachments?: Attachment[]
}
