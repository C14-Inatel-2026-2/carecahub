import { compare, hash } from 'bcryptjs'

export function hashPassword(password: string) {
  return hash(password, 10)
}

export function comparePassword(password: string, hash: string) {
  return compare(password, hash)
}
