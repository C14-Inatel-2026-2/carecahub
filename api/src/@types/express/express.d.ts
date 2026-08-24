import { UserMetadata } from '@/config/types'
import 'express'

declare module 'express' {
  interface Request {
    user: UserMetadata
    cookies: Record<string, string>
  }
}
