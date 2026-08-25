import assert from 'node:assert/strict'
import { beforeEach, describe, it, mock } from 'node:test'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import sharp from 'sharp'
import { CacheService } from '../cache/cache.service'
import { DrizzleService } from '../database/drizzle.service'
import { LoggerFactory } from '../logger/logger-factory.service'
import { BucketService } from './bucket.service'

// Mock dependencies
describe('BucketService Image Resizing', () => {
  let service: BucketService
  let createBucketFile: ReturnType<typeof mock.fn>
  let sendToS3: ReturnType<typeof mock.fn>

  beforeEach(async () => {
    const returningBucketFile = mock.fn(async () => [
      {
        key: 'test-key',
        url: 'test-url',
        createdAt: new Date(),
      },
    ])
    const insertBucketFile = mock.fn(() => ({
      returning: returningBucketFile,
    }))
    createBucketFile = insertBucketFile
    const mockDrizzleService = {
      bucketFiles: {
        table: {},
        insert: insertBucketFile,
      },
    }
    const mockCacheService = { get: mock.fn(), set: mock.fn() }
    const mockLogger = { log: mock.fn(), error: mock.fn() }
    const mockLoggerFactory = { create: mock.fn(() => mockLogger) }

    service = new BucketService(
      mockDrizzleService as unknown as DrizzleService,
      mockCacheService as unknown as CacheService,
      mockLoggerFactory as unknown as LoggerFactory,
    )

    // Mock S3 send
    sendToS3 = mock.fn(async () => ({}))
    service.s3.send = sendToS3 as unknown as typeof service.s3.send
  })

  it('should resize and convert image to jpeg', async () => {
    // Create a mock PNG buffer (small transparent pixel)
    const pngBuffer = await sharp({
      create: {
        width: 100,
        height: 100,
        channels: 4,
        background: { r: 255, g: 0, b: 0, alpha: 0.5 },
      },
    })
      .png()
      .toBuffer()

    const file = {
      buffer: pngBuffer,
      originalname: 'test-image.png',
      mimetype: 'image/png',
      size: pngBuffer.length,
    }

    await service.upload({ file, isPublic: false })

    // Verify S3 send was called
    assert.strictEqual(sendToS3.mock.callCount(), 1)
    const callArgs = sendToS3.mock.calls[0].arguments[0]
    assert.ok(callArgs instanceof PutObjectCommand)
    const putCommand = callArgs as PutObjectCommand
    assert.strictEqual(putCommand.input.ContentType, 'image/jpeg')

    // Check if originalname was updated
    assert.strictEqual(file.originalname, 'test-image.jpg')
    assert.strictEqual(file.mimetype, 'image/jpeg')

    // Verify database call
    assert.strictEqual(createBucketFile.mock.callCount(), 1)
    const databaseInput = createBucketFile.mock.calls[0].arguments[0] as {
      filename: string
      size: number
    }
    assert.strictEqual(databaseInput.filename, 'test-image.jpg')
    assert.strictEqual(typeof databaseInput.size, 'number')
  })

  it('should not resize SVG files', async () => {
    const svgContent = '<svg><rect width="100" height="100"/></svg>'
    const svgBuffer = Buffer.from(svgContent)

    const file = {
      buffer: svgBuffer,
      originalname: 'test-icon.svg',
      mimetype: 'image/svg+xml',
      size: svgBuffer.length,
    }

    await service.upload({ file, isPublic: false })

    const callArgs = sendToS3.mock.calls[0].arguments[0] as PutObjectCommand
    assert.strictEqual(callArgs.input.ContentType, 'image/svg+xml')
    assert.strictEqual(file.buffer, svgBuffer)
    assert.strictEqual(file.originalname, 'test-icon.svg')
  })

  it('should not resize PDF files', async () => {
    const pdfBuffer = Buffer.from('%PDF-1.4...')

    const file = {
      buffer: pdfBuffer,
      originalname: 'test-doc.pdf',
      mimetype: 'application/pdf',
      size: pdfBuffer.length,
    }

    await service.upload({ file, isPublic: false })

    const callArgs = sendToS3.mock.calls[0].arguments[0] as PutObjectCommand
    assert.strictEqual(callArgs.input.ContentType, 'application/pdf')
    assert.strictEqual(file.buffer, pdfBuffer)
  })
})
