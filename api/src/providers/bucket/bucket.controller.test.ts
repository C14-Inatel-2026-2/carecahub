import assert from 'node:assert/strict'
import { beforeEach, describe, it, vi } from 'vitest'

import { BucketController } from './bucket.controller'
import { BucketService } from './bucket.service'
import { UploadResponseDto } from './dtos/uploadResponse.dto'

describe('BucketController', () => {
  let controller: BucketController
  let upload: ReturnType<typeof vi.fn>
  let batchUploadPublic: ReturnType<typeof vi.fn>

  const defaultUploadResponse: UploadResponseDto = {
    id: 'file-id',
    key: 'key-mock',
    url: 'url-mock',
    filename: 'file-mock.png',
    size: 100,
    mimeType: 'image/png',
    isPublic: false,
  }

  const requester = {
    userId: 'student-id',
    name: 'Student',
    role: 'student' as const,
  }

  const defaultFile = {
    buffer: Buffer.from('buffer-mock'),
    originalname: 'file-mock.png',
    size: 100,
    bucket: 'bucket-mock',
    key: 'key-mock',
    mimetype: 'image/png',
  }

  beforeEach(() => {
    upload = vi.fn(async () => defaultUploadResponse)

    batchUploadPublic = vi.fn(async () => [defaultUploadResponse, defaultUploadResponse])

    controller = new BucketController(
      {
        upload,
        batchUploadPublic,
      } as unknown as BucketService,
      {
        create: vi.fn(() => ({
          log: vi.fn(),
        })),
      } as never,
    )
  })

  it('defines the controller instance', () => {
    assert.ok(controller)
  })

  it('uploads a public file', async () => {
    const uploadedFile = await controller.uploadFile(defaultFile)

    assert.deepStrictEqual(upload.mock.calls[0], [
      {
        file: defaultFile,
        isPublic: true,
        localPath: undefined,
      },
    ])

    assert.strictEqual(uploadedFile.key, defaultUploadResponse.key)
  })

  it('forwards local path when uploading a public file', async () => {
    const localPath = '/images/projects/project.png'

    await controller.uploadFile(defaultFile, localPath)

    assert.deepStrictEqual(upload.mock.calls[0], [
      {
        file: defaultFile,
        isPublic: true,
        localPath,
      },
    ])
  })

  it('uploads public files in batch', async () => {
    const files = [defaultFile, defaultFile]

    const uploadedFiles = await controller.batchUpload(files)

    assert.deepStrictEqual(batchUploadPublic.mock.calls[0], [files, undefined])

    assert.strictEqual(uploadedFiles[0].url, defaultUploadResponse.url)

    assert.strictEqual(uploadedFiles[1].url, defaultUploadResponse.url)
  })

  it('forwards local paths when uploading files in batch', async () => {
    const files = [defaultFile, defaultFile]

    const localPaths = ['/images/project-1.png', '/images/project-2.png']

    await controller.batchUpload(files, localPaths)

    assert.deepStrictEqual(batchUploadPublic.mock.calls[0], [files, localPaths])
  })

  it('uploads a private file', async () => {
    const uploadedFile = await controller.uploadPrivateFile(defaultFile, undefined, requester)

    assert.deepStrictEqual(upload.mock.calls[0], [
      {
        file: defaultFile,
        isPublic: false,
        localPath: undefined,
        uploadedById: requester.userId,
      },
    ])

    assert.strictEqual(uploadedFile.id, defaultUploadResponse.id)
    assert.strictEqual(uploadedFile.key, defaultUploadResponse.key)
    assert.strictEqual(uploadedFile.mimeType, defaultUploadResponse.mimeType)
  })

  it('forwards local path when uploading a private file', async () => {
    const localPath = '/fixtures/private/image.png'

    await controller.uploadPrivateFile(defaultFile, localPath, requester)

    assert.deepStrictEqual(upload.mock.calls[0], [
      {
        file: defaultFile,
        isPublic: false,
        localPath,
        uploadedById: requester.userId,
      },
    ])
  })
})
