import { UploadFileDto } from './dtos/upload.dto'
import { UploadResponseDto } from './dtos/uploadResponse.dto'

export abstract class IBucketService {
  abstract buildFileKey(filename: string): string
  abstract getSignedUrl(key: string, filename: string, expiresInSeconds?: number): Promise<string>
  abstract getDownloadUrl(key: string, filename: string, expiresInSeconds?: number): Promise<string>
  abstract batchDeletePrivate(keys: string[]): Promise<void>
  abstract buildPublicS3Url(key: string): string
  abstract upload(input: { file: UploadFileDto; isPublic: boolean }): Promise<UploadResponseDto>
  abstract download(key: string): Promise<Buffer>
  abstract softDelete({ key, isPublic }: { key: string; isPublic: boolean }): Promise<void>
  abstract batchUploadPublic(files: UploadFileDto[]): Promise<UploadResponseDto[]>
  abstract batchDeletePublic(keys: string[]): void
}
