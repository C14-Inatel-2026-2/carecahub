import { Injectable } from '@nestjs/common'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from './generated/prisma/client'

export const prismaTxOptions = {
  maxWait: 100000,
  timeout: 100000,
}

export const pageOptions = {
  skip: 0,
  take: 10,
}

@Injectable()
export class PrismaService extends PrismaClient {
  constructor() {
    const adapter = new PrismaPg({
      connectionString: process.env.DATABASE_URL as string,
    })
    super({
      adapter,
      errorFormat: process.env.PRETTY_LOG === 'true' ? 'pretty' : 'colorless',
      log: ['info', 'warn', 'error'],
      transactionOptions: prismaTxOptions,
    })
  }
}
