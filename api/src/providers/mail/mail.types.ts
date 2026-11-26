import { Attachment } from 'nodemailer/lib/mailer'

export type Template = 'default' | 'registration-verification'

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
    firstName?: string
    code?: string
  }
  attachments?: Attachment[]
}
