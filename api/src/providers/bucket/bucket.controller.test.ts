import assert from 'node:assert/strict'
import { beforeEach, describe, it, vi } from 'vitest'
import { BucketController } from './bucket.controller'
import { BucketService } from './bucket.service'
import { UploadResponseDto } from './dtos/uploadResponse.dto'

describe('BucketController', () => {
  let controller: BucketController
  let upload: ReturnType<typeof vi.fn>
  let batchUploadPublic: ReturnType<typeof vi.fn>
  const defaultUploadResponse: UploadResponseDto = { key: 'key-mock', url: 'url-mock' }
  const defaultFile = {
    buffer: Buffer.from('buffer-mock'),
    originalname: 'file-mock',
    size: 100,
    bucket: 'bucket-mock',
    key: 'key-mock',
    mimetype: 'image/png',
  }

  beforeEach(() => {
    upload = vi.fn(async () => defaultUploadResponse)
    batchUploadPublic = vi.fn(async () => [defaultUploadResponse, defaultUploadResponse])
    controller = new BucketController(
      { upload, batchUploadPublic } as unknown as BucketService,
      { create: vi.fn(() => ({ log: vi.fn() })) } as never,
    )
  })

  it('defines the controller instance', () => {
    assert.ok(controller)
  })

  it('uploads a public file', async () => {
    const uploadedFile = await controller.uploadFile(defaultFile)

    assert.deepStrictEqual(upload.mock.calls[0], [{ file: defaultFile, isPublic: true }])
    assert.strictEqual(uploadedFile.key, defaultUploadResponse.key)
  })

  it('uploads public files in batch', async () => {
    const uploadedFiles = await controller.batchUpload([defaultFile, defaultFile])

    assert.deepStrictEqual(batchUploadPublic.mock.calls[0], [[defaultFile, defaultFile]])
    assert.strictEqual(uploadedFiles[0].url, defaultUploadResponse.url)
    assert.strictEqual(uploadedFiles[1].url, defaultUploadResponse.url)
  })

  it('uploads a private file', async () => {
    const uploadedFile = await controller.uploadPrivateFile(defaultFile)

    assert.deepStrictEqual(upload.mock.calls[0], [{ file: defaultFile, isPublic: false }])
    assert.strictEqual(uploadedFile.key, defaultUploadResponse.key)
  })
})
