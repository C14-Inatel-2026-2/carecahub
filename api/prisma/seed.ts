import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../src/providers/database/generated/prisma/client'
import { prismaTxOptions } from '../src/providers/database/prisma.service'
import { hashPassword } from '../src/utils/password'

const ADMIN_EMAIL = 'admin@example.com'
const USER_EMAIL = 'user@example.com'
const DEFAULT_PASSWORD = 'Strong!1'

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL as string,
})

export const prisma = new PrismaClient({
  adapter,
  errorFormat: process.env.PRETTY_LOG === 'true' ? 'pretty' : 'colorless',
  log: ['info', 'warn', 'error'],
  transactionOptions: prismaTxOptions,
})

async function mainProd() {
  const password = await hashPassword(DEFAULT_PASSWORD)

  console.log('🚀 Starting production seed...')

  await prisma.users.upsert({
    where: { email: ADMIN_EMAIL },
    update: { password, name: 'Admin', role: 'admin' },
    create: { email: ADMIN_EMAIL, password, name: 'Admin', role: 'admin' },
  })

  console.log('✅ Production seed completed successfully')
}

async function mainDev() {
  const password = await hashPassword(DEFAULT_PASSWORD)

  console.log('🚀 Starting development seed...')

  await prisma.users.upsert({
    where: { email: ADMIN_EMAIL },
    update: { password, name: 'Admin', role: 'admin' },
    create: { email: ADMIN_EMAIL, password, name: 'Admin', role: 'admin' },
  })

  await prisma.users.upsert({
    where: { email: USER_EMAIL },
    update: { password, name: 'User', role: 'user' },
    create: { email: USER_EMAIL, password, name: 'User', role: 'user' },
  })

  console.log('✅ Development seed completed successfully')
}

async function main() {
  if (process.env.NODE_ENV === 'production') {
    await mainProd()
  } else {
    await mainDev()
  }
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
