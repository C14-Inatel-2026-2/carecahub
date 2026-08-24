import { Readable } from 'node:stream'
import {
  DeleteObjectsCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import {
  Injectable,
  InternalServerErrorException,
  UnsupportedMediaTypeException,
} from '@nestjs/common'
import sharp from 'sharp'
import { env } from '@/providers/config/env'
import { exceptionsDictionary, ONE_MINUTE_IN_MS } from '@/types'
import { streamToBuffer } from '@/utils/streamToBuffer'
import { CacheService } from '../cache/cache.service'
import { CacheKey } from '../cache/cache.types'
import { PrismaService } from '../database/prisma.service'
import { CustomLogger } from '../logger/custom-logger.service'
import { LoggerFactory } from '../logger/logger-factory.service'
import { IBucketService } from './bucket.interface'
import { UploadFileDto } from './dtos/upload.dto'

@Injectable()
export class BucketService implements IBucketService {
  private readonly logger: CustomLogger
  PUBLIC_BUCKET: string
  PRIVATE_BUCKET: string
  REGION: string
  s3: S3Client

  constructor(
    private readonly databaseService: PrismaService,
    private readonly cache: CacheService,
    loggerFactory: LoggerFactory,
  ) {
    this.logger = loggerFactory.create(BucketService.name)

    this.PUBLIC_BUCKET = env.AWS_PUBLIC_BUCKET
    this.PRIVATE_BUCKET = env.AWS_PRIVATE_BUCKET
    this.REGION = env.AWS_REGION
    this.s3 = new S3Client({
      region: env.AWS_REGION,
      apiVersion: '2006-03-01',
      logger: this.logger,
    })
  }

  normalizeFileName(filename: string) {
    return filename.replace(/[^a-zA-Z0-9._-]/g, '')
  }

  buildFileKey(filename: string) {
    return `${Date.now()}-${this.normalizeFileName(filename)}`
  }

  buildPublicS3Url(key: string) {
    return `https://${this.PUBLIC_BUCKET}.s3.${this.REGION}.amazonaws.com/${key}`
  }

  async getSignedUrl(
    key: string,
    filename: string,
    expiresIn: number = 60 * 60,
    forceDownload: boolean = false,
  ): Promise<string> {
    this.logger.log(`Generating signed URL for private file: ${key} (download: ${forceDownload})`)

    // Check cache first
    const cachedUrl = await this.cache.get({
      key: CacheKey.signedUrl,
      scope: `${key}:${forceDownload}`,
    })

    if (cachedUrl) {
      this.logger.log(`Returning cached signed URL for: ${key}`)
      return cachedUrl
    }

    try {
      const commandParams: {
        Bucket: string
        Key: string
        ResponseContentDisposition?: string
      } = {
        Bucket: this.PRIVATE_BUCKET,
        Key: key,
      }

      // If forceDownload is true, add header to force download
      if (forceDownload) {
        commandParams.ResponseContentDisposition = `attachment; filename="${filename}"`
      }

      const command = new GetObjectCommand(commandParams)
      const url = await getSignedUrl(this.s3, command, { expiresIn })

      // Cache the URL with TTL slightly less than expiresIn (subtract 5 minutes for safety)
      const cacheTTL = Math.max((expiresIn - 300) * 1000, ONE_MINUTE_IN_MS) // Minimum 1 minute
      await this.cache.set({
        key: CacheKey.signedUrl,
        scope: `${key}:${forceDownload}`,
        value: url,
        ttl: cacheTTL,
      })

      return url
    } catch (error) {
      this.logger.error(`Error generating signed URL: ${JSON.stringify(error)}`)
      throw new InternalServerErrorException(exceptionsDictionary.internalServerErrorErrKey)
    }
  }

  async getDownloadUrl(
    key: string,
    filename: string,
    expiresIn: number = 60 * 60,
  ): Promise<string> {
    return this.getSignedUrl(key, filename, expiresIn, true)
  }

  async upload({ file, isPublic }: { file: UploadFileDto; isPublic: boolean }) {
    const allowedMimes = [
      'image/jpeg',
      'image/pjpeg',
      'image/png',
      'image/gif',
      'image/svg+xml',
      'image/webp',
      'application/pdf',
      'image/jpg',
      'image/jpge',
      'image/heic',
      'text/csv',
      'application/csv',
      'application/vnd.ms-excel',
      'application/ofx',
      'application/x-ofx',
      'text/plain',
      'application/octet-stream',
    ]

    this.logger.log(
      `Upload request - File: ${file.originalname}, Size: ${file.size}, MimeType: ${file.mimetype}, IsPublic: ${isPublic}`,
    )

    if (!file?.mimetype || !allowedMimes.includes(file.mimetype)) {
      this.logger.error(`Invalid file type to upload: ${file.mimetype}`)
      throw new UnsupportedMediaTypeException()
    }

    const key = this.buildFileKey(file.originalname)
    this.logger.log(`Uploading file public=${isPublic} to S3: ${key} - size:${file.size} bytes`)

    // Optimize image: Max 2048px, quality 80, convert to JPEG if it's an image (excluding svg)
    if (file.mimetype?.startsWith('image/') && file.mimetype !== 'image/svg+xml') {
      try {
        this.logger.log(`Optimizing image: ${file.originalname}`)
        const originalSize = file.size

        const optimizedBuffer = await sharp(file.buffer as Buffer)
          .resize({ width: 2048, height: 2048, fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality: 80, progressive: true })
          .toBuffer()

        file.buffer = optimizedBuffer
        file.size = optimizedBuffer.length
        file.mimetype = 'image/jpeg'

        // Update originalname extension if it's not already .jpg or .jpeg
        if (
          !file.originalname.toLowerCase().endsWith('.jpg') &&
          !file.originalname.toLowerCase().endsWith('.jpeg')
        ) {
          file.originalname = `${file.originalname.split('.').slice(0, -1).join('.')}.jpg`
        }

        this.logger.log(
          `Image optimized: ${file.originalname} (Size reduced: ${((1 - file.size / originalSize) * 100).toFixed(1)}%) New size: ${(file.size / 1024 / 1024).toFixed(3)} MB`,
        )
      } catch (error) {
        this.logger.error(`Error optimizing image: ${JSON.stringify(error)}`)
        // We continue with the original file if optimization fails
      }
    }

    const url = isPublic ? this.buildPublicS3Url(key) : ''

    try {
      const uploadCommand = new PutObjectCommand({
        Key: key,
        Bucket: isPublic ? this.PUBLIC_BUCKET : this.PRIVATE_BUCKET,
        Body: file.buffer,
        ContentType: file.mimetype,
      })
      await this.s3.send(uploadCommand)

      this.logger.log(`File successfully uploaded to S3 - Key: ${key}`)

      return this.databaseService.bucketFile.create({
        data: {
          key,
          filename: this.normalizeFileName(file.originalname),
          size: file.size,
          url,
          isPublic,
        },
        select: { id: true, key: true, url: true, createdAt: true, filename: true, size: true },
      })
    } catch (error) {
      this.logger.error(`S3 Upload error - Key: ${key}, Error: ${JSON.stringify(error, null, 2)}`)
      throw new InternalServerErrorException(exceptionsDictionary.internalServerErrorErrKey)
    }
  }

  async download(key: string) {
    this.logger.log(`Downloading file from S3: ${key}`)

    try {
      const downloadCommand = new GetObjectCommand({
        Bucket: this.PRIVATE_BUCKET,
        Key: key,
      })

      const url = await getSignedUrl(this.s3, downloadCommand, {
        expiresIn: 60 * 60 * 24, // 24 hours
      })

      const response = await fetch(url)

      if (!response.ok || !response.body) {
        throw new Error(`Failed to download file: ${response.status} ${response.statusText}`)
      }

      // biome-ignore lint/suspicious/noExplicitAny: readable stream type from AWS SDK is not recognized by Node.js typings
      const downloadStream = Readable.fromWeb(response.body as any)
      return await streamToBuffer(downloadStream)
    } catch (error) {
      this.logger.error(JSON.stringify(error))
      throw new InternalServerErrorException(exceptionsDictionary.internalServerErrorErrKey)
    }
  }

  async softDelete({ key, isPublic }: { key: string; isPublic: boolean }) {
    this.logger.log(`Removing file from S3: ${key} public=${isPublic}`)

    try {
      // await this.s3.send(
      //   new DeleteObjectCommand({
      //     Bucket: isPublic ? this.PUBLIC_BUCKET : this.PRIVATE_BUCKET,
      //     Key: key,
      //   }),
      // );

      await this.databaseService.bucketFile.update({
        where: { key },
        data: { deletedAt: new Date() },
      })
    } catch (error) {
      this.logger.error(JSON.stringify(error))
      throw new InternalServerErrorException(exceptionsDictionary.internalServerErrorErrKey)
    }
  }

  async batchUploadPublic(files: UploadFileDto[]) {
    const filesUploaded = files.map(async (file) => {
      return await this.upload({ file, isPublic: true })
    })

    return Promise.all(filesUploaded)
  }

  async batchDeletePublic(keys: string[]) {
    this.logger.log(`Removing files from S3: ${keys}`)

    try {
      await this.s3.send(
        new DeleteObjectsCommand({
          Bucket: this.PUBLIC_BUCKET,
          Delete: { Objects: keys.map((key) => ({ Key: key })) },
        }),
      )

      await this.databaseService.bucketFile.updateMany({
        where: { key: { in: keys } },
        data: { deletedAt: new Date() },
      })
    } catch (error) {
      this.logger.error(JSON.stringify(error))
      throw new InternalServerErrorException(exceptionsDictionary.internalServerErrorErrKey)
    }
  }

  async batchDeletePrivate(keys: string[]) {
    if (!keys || keys.length === 0) return

    this.logger.log(`Batch removing private files from S3: ${keys}`)

    try {
      // await this.s3.send(
      //   new DeleteObjectsCommand({
      //     Bucket: this.PRIVATE_BUCKET,
      //     Delete: { Objects: keys.map((key) => ({ Key: key })) },
      //   }),
      // );

      await this.databaseService.bucketFile.updateMany({
        where: { key: { in: keys } },
        data: { deletedAt: new Date() },
      })
    } catch (error) {
      this.logger.error(JSON.stringify(error))
      throw new InternalServerErrorException(exceptionsDictionary.internalServerErrorErrKey)
    }
  }
}
