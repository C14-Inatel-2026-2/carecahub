import { Readable } from "node:stream";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import {
  DeleteObjectsCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { bucketFiles } from "@db";
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  UnsupportedMediaTypeException,
} from "@nestjs/common";
import { eq, inArray } from "drizzle-orm";
import sharp from "sharp";

import { env } from "@/providers/config/env";
import { exceptionsDictionary, ONE_MINUTE_IN_MS } from "@/types";
import { streamToBuffer } from "@/utils/streamToBuffer";

import { CacheService } from "../cache/cache.service";
import { CacheKey } from "../cache/cache.types";
import { DrizzleService } from "../database/drizzle.service";
import { CustomLogger } from "../logger/custom-logger.service";
import { LoggerFactory } from "../logger/logger-factory.service";

import { IBucketService } from "./bucket.interface";
import { UploadFileDto } from "./dtos/upload.dto";

@Injectable()
export class BucketService implements IBucketService {
  private readonly logger: CustomLogger;

  private readonly PUBLIC_BUCKET: string;
  private readonly PRIVATE_BUCKET: string;
  private readonly REGION: string;

  private readonly s3: S3Client;

  constructor(
    private readonly databaseService: DrizzleService,
    private readonly cache: CacheService,
    loggerFactory: LoggerFactory,
  ) {
    this.logger = loggerFactory.create(BucketService.name);

    this.PUBLIC_BUCKET = env.AWS_PUBLIC_BUCKET;
    this.PRIVATE_BUCKET = env.AWS_PRIVATE_BUCKET;
    this.REGION = env.AWS_REGION;

    this.s3 = new S3Client({
      region: env.AWS_REGION,
      apiVersion: "2006-03-01",
      logger: this.logger,
    });
  }

  private get isLocal() {
    return env.ENV_SCOPE === "local";
  }

  normalizeFileName(filename: string) {
    return filename.replace(/[^a-zA-Z0-9._-]/g, "");
  }

  buildFileKey(filename: string) {
    return `${Date.now()}-${this.normalizeFileName(filename)}`;
  }

  buildPublicS3Url(key: string) {
    return `https://${this.PUBLIC_BUCKET}.s3.${this.REGION}.amazonaws.com/${key}`;
  }

  async getSignedUrl(
    key: string,
    filename: string,
    expiresIn: number = 60 * 60,
    forceDownload: boolean = false,
  ): Promise<string> {
    /*
     * Em ambiente local não existe URL assinada.
     * Retornamos diretamente o path/url registrado no banco.
     */
    if (this.isLocal) {
      const [bucketFile] = await this.databaseService.db
        .select({
          url: bucketFiles.url,
        })
        .from(bucketFiles)
        .where(eq(bucketFiles.key, key))
        .limit(1);

      if (!bucketFile) {
        throw new BadRequestException("File not found");
      }

      return bucketFile.url;
    }

    this.logger.log(
      `Generating signed URL for private file: ${key} (download: ${forceDownload})`,
    );

    const cachedUrl = await this.cache.get({
      key: CacheKey.signedUrl,
      scope: `${key}:${forceDownload}`,
    });

    if (cachedUrl) {
      return cachedUrl;
    }

    try {
      const commandParams: {
        Bucket: string;
        Key: string;
        ResponseContentDisposition?: string;
      } = {
        Bucket: this.PRIVATE_BUCKET,
        Key: key,
      };

      if (forceDownload) {
        commandParams.ResponseContentDisposition = `attachment; filename="${filename}"`;
      }

      const command = new GetObjectCommand(commandParams);

      const url = await getSignedUrl(this.s3, command, {
        expiresIn,
      });

      const cacheTTL = Math.max((expiresIn - 300) * 1000, ONE_MINUTE_IN_MS);

      await this.cache.set({
        key: CacheKey.signedUrl,
        scope: `${key}:${forceDownload}`,
        value: url,
        ttl: cacheTTL,
      });

      return url;
    } catch (error) {
      this.logger.error(
        `Error generating signed URL: ${JSON.stringify(error)}`,
      );

      throw new InternalServerErrorException(
        exceptionsDictionary.internalServerErrorErrKey,
      );
    }
  }

  async getDownloadUrl(
    key: string,
    filename: string,
    expiresIn: number = 60 * 60,
  ): Promise<string> {
    return this.getSignedUrl(key, filename, expiresIn, true);
  }

  async upload({
    file,
    isPublic,
    localPath,
  }: {
    file: UploadFileDto;
    isPublic: boolean;
    localPath?: string;
  }) {
    const allowedMimes = [
      "image/jpeg",
      "image/pjpeg",
      "image/png",
      "image/gif",
      "image/svg+xml",
      "image/webp",
      "application/pdf",
      "image/jpg",
      "image/jpge",
      "image/heic",
      "text/csv",
      "application/csv",
      "application/vnd.ms-excel",
      "application/ofx",
      "application/x-ofx",
      "text/plain",
      "application/octet-stream",
    ];

    if (!file?.mimetype || !allowedMimes.includes(file.mimetype)) {
      this.logger.error(`Invalid file type to upload: ${file?.mimetype}`);

      throw new UnsupportedMediaTypeException();
    }

    if (this.isLocal) {
      const key = this.buildFileKey(file.originalname);
      let url = localPath;
      if (!url) {
        if (!isPublic || !Buffer.isBuffer(file.buffer)) {
          throw new BadRequestException("Local public upload requires a file buffer");
        }
        const directory = resolve(process.cwd(), env.LOCAL_UPLOAD_DIR);
        await mkdir(directory, { recursive: true });
        await writeFile(resolve(directory, key), file.buffer);
        url = `${env.API_URL.replace(/\/$/, "")}/uploads/${encodeURIComponent(key)}`;
      }

      this.logger.log(`Registering local file: ${url}`);

      return this.createBucketFile({
        key,
        filename: this.normalizeFileName(file.originalname),
        size: file.size,
        url,
        isPublic,
      });
    }

    this.logger.log(
      `Upload request - File: ${file.originalname}, Size: ${file.size}, MimeType: ${file.mimetype}, IsPublic: ${isPublic}`,
    );

    if (
      file.mimetype.startsWith("image/") &&
      file.mimetype !== "image/svg+xml"
    ) {
      try {
        this.logger.log(`Optimizing image: ${file.originalname}`);

        const originalSize = file.size;

        const optimizedBuffer = await sharp(file.buffer as Buffer)
          .resize({
            width: 2048,
            height: 2048,
            fit: "inside",
            withoutEnlargement: true,
          })
          .jpeg({
            quality: 80,
            progressive: true,
          })
          .toBuffer();

        file.buffer = optimizedBuffer;
        file.size = optimizedBuffer.length;
        file.mimetype = "image/jpeg";

        if (
          !file.originalname.toLowerCase().endsWith(".jpg") &&
          !file.originalname.toLowerCase().endsWith(".jpeg")
        ) {
          const nameWithoutExtension = file.originalname
            .split(".")
            .slice(0, -1)
            .join(".");

          file.originalname = `${nameWithoutExtension}.jpg`;
        }

        this.logger.log(
          `Image optimized: ${file.originalname} ` +
            `(Size reduced: ${((1 - file.size / originalSize) * 100).toFixed(
              1,
            )}%)`,
        );
      } catch (error) {
        this.logger.error(`Error optimizing image: ${JSON.stringify(error)}`);
      }
    }

    const key = this.buildFileKey(file.originalname);

    const url = isPublic ? this.buildPublicS3Url(key) : "";

    try {
      await this.s3.send(
        new PutObjectCommand({
          Key: key,
          Bucket: isPublic ? this.PUBLIC_BUCKET : this.PRIVATE_BUCKET,
          Body: file.buffer,
          ContentType: file.mimetype,
        }),
      );

      this.logger.log(`File successfully uploaded to S3 - Key: ${key}`);

      return this.createBucketFile({
        key,
        filename: this.normalizeFileName(file.originalname),
        size: file.size,
        url,
        isPublic,
      });
    } catch (error) {
      this.logger.error(
        `S3 Upload error - Key: ${key}, Error: ${JSON.stringify(
          error,
          null,
          2,
        )}`,
      );

      throw new InternalServerErrorException(
        exceptionsDictionary.internalServerErrorErrKey,
      );
    }
  }

  private async createBucketFile({
    key,
    filename,
    size,
    url,
    isPublic,
  }: {
    key: string;
    filename: string;
    size: number;
    url: string;
    isPublic: boolean;
  }) {
    const [bucketFile] = await this.databaseService.db
      .insert(bucketFiles)
      .values({
        key,
        filename,
        size,
        url,
        is_public: isPublic,
      })
      .returning({
        id: bucketFiles.id,
        key: bucketFiles.key,
        url: bucketFiles.url,
        createdAt: bucketFiles.createdAt,
        filename: bucketFiles.filename,
        size: bucketFiles.size,
      });

    return bucketFile;
  }

  async download(key: string) {
    if (this.isLocal) {
      throw new BadRequestException(
        "Local files are referenced by path and are not managed by BucketService",
      );
    }

    this.logger.log(`Downloading file from S3: ${key}`);

    try {
      const downloadCommand = new GetObjectCommand({
        Bucket: this.PRIVATE_BUCKET,
        Key: key,
      });

      const url = await getSignedUrl(this.s3, downloadCommand, {
        expiresIn: 60 * 60 * 24,
      });

      const response = await fetch(url);

      if (!response.ok || !response.body) {
        throw new Error(
          `Failed to download file: ${response.status} ${response.statusText}`,
        );
      }

      // biome-ignore lint/suspicious/noExplicitAny: readable stream type from AWS SDK is not recognized by Node.js typings
      const downloadStream = Readable.fromWeb(response.body as any);

      return await streamToBuffer(downloadStream);
    } catch (error) {
      this.logger.error(JSON.stringify(error));

      throw new InternalServerErrorException(
        exceptionsDictionary.internalServerErrorErrKey,
      );
    }
  }

  async softDelete({ key, isPublic }: { key: string; isPublic: boolean }) {
    this.logger.log(`Removing file: ${key} public=${isPublic}`);

    try {
      await this.databaseService.db
        .update(bucketFiles)
        .set({
          deletedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(bucketFiles.key, key));
    } catch (error) {
      this.logger.error(JSON.stringify(error));

      throw new InternalServerErrorException(
        exceptionsDictionary.internalServerErrorErrKey,
      );
    }
  }

  async batchUploadPublic(files: UploadFileDto[], localPaths?: string[]) {
    const filesUploaded = files.map(async (file, index) =>
      this.upload({
        file,
        isPublic: true,
        localPath: localPaths?.[index],
      }),
    );

    return Promise.all(filesUploaded);
  }

  async batchDeletePublic(keys: string[]) {
    this.logger.log(`Removing files: ${keys}`);

    try {
      if (!this.isLocal) {
        await this.s3.send(
          new DeleteObjectsCommand({
            Bucket: this.PUBLIC_BUCKET,
            Delete: {
              Objects: keys.map((key) => ({
                Key: key,
              })),
            },
          }),
        );
      }

      await this.databaseService.db
        .update(bucketFiles)
        .set({
          deletedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(inArray(bucketFiles.key, keys));
    } catch (error) {
      this.logger.error(JSON.stringify(error));

      throw new InternalServerErrorException(
        exceptionsDictionary.internalServerErrorErrKey,
      );
    }
  }

  async batchDeletePrivate(keys: string[]) {
    if (!keys?.length) return;

    this.logger.log(`Batch removing private files: ${keys}`);

    try {
      await this.databaseService.db
        .update(bucketFiles)
        .set({
          deletedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(inArray(bucketFiles.key, keys));
    } catch (error) {
      this.logger.error(JSON.stringify(error));

      throw new InternalServerErrorException(
        exceptionsDictionary.internalServerErrorErrKey,
      );
    }
  }
}
