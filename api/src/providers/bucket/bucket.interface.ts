import { UploadFileDto } from "./dtos/upload.dto";
import { UploadResponseDto } from "./dtos/uploadResponse.dto";

export abstract class IBucketService {
  abstract buildFileKey(filename: string): string;

  abstract buildPublicS3Url(key: string): string;

  abstract getSignedUrl(
    key: string,
    filename: string,
    expiresInSeconds?: number,
    forceDownload?: boolean,
  ): Promise<string>;

  abstract getDownloadUrl(
    key: string,
    filename: string,
    expiresInSeconds?: number,
  ): Promise<string>;

  abstract upload(input: {
    file: UploadFileDto;
    isPublic: boolean;
    localPath?: string;
  }): Promise<UploadResponseDto>;

  abstract download(key: string): Promise<Buffer>;

  abstract softDelete(input: { key: string; isPublic: boolean }): Promise<void>;

  abstract batchUploadPublic(
    files: UploadFileDto[],
    localPaths?: string[],
  ): Promise<UploadResponseDto[]>;

  abstract batchDeletePublic(keys: string[]): Promise<void>;

  abstract batchDeletePrivate(keys: string[]): Promise<void>;
}
