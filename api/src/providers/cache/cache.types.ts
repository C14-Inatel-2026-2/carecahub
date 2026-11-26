import { AuthTokens } from '@/resources/auth/dtos/tokens.dto'

export const CACHE_INSTANCE = 'CACHE_INSTANCE'

export enum CacheKey {
  healthCheck = 'healthCheck',
  // Auth
  userTokens = 'userTokens',
  twoFactorAuth = 'twoFactorAuth',
  registrationVerification = 'registrationVerification',
  recoverPasswordToken = 'recoverPasswordToken',

  // Mail
  mailMessagesCount = 'mailMessagesCount',

  // Bucket
  signedUrl = 'signedUrl',
}

export type CachePayloads = {
  [CacheKey.healthCheck]: string
  [CacheKey.userTokens]: AuthTokens[]
  [CacheKey.twoFactorAuth]: AuthTokens & { email: string; code: string }
  [CacheKey.registrationVerification]: {
    name: string
    email: string
    registration: number
    passwordHash: string
    codeHash: string
    attempts: number
  }
  [CacheKey.recoverPasswordToken]: string
  [CacheKey.mailMessagesCount]: {
    count: number
    lastMessages: { date: Date }[]
    lastMessageDate: Date
  }
  [CacheKey.signedUrl]: string
}
