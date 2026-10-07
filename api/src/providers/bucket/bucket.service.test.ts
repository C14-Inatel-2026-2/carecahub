import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import sharp from "sharp";
import { beforeEach, describe, it, vi } from "vitest";

import { CacheService } from "../cache/cache.service";
import { DrizzleService } from "../database/drizzle.service";
import { LoggerFactory } from "../logger/logger-factory.service";
import { BucketService } from "./bucket.service";

const mockedEnv = vi.hoisted(() => ({
  ENV_SCOPE: "production",
  API_URL: "http://localhost:3030",
  LOCAL_UPLOAD_DIR: "uploads",
  AWS_PUBLIC_BUCKET: "public-bucket",
  AWS_PRIVATE_BUCKET: "private-bucket",
  AWS_REGION: "us-east-1",
}));

vi.mock("@/providers/config/env", () => ({
  env: mockedEnv,
}));

describe("BucketService", () => {
  let service: BucketService;

  let insertBucketFileValues: ReturnType<typeof vi.fn>;
  let sendToS3: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockedEnv.ENV_SCOPE = "production";

    const returningBucketFile = vi.fn(async () => [
      {
        id: "file-id",
        key: "test-key",
        url: "test-url",
        filename: "test-file",
        size: 100,
        createdAt: new Date(),
      },
    ]);

    insertBucketFileValues = vi.fn(() => ({
      returning: returningBucketFile,
    }));

    const mockDrizzleService = {
      db: {
        insert: vi.fn(() => ({
          values: insertBucketFileValues,
        })),
      },
    };

    const mockCacheService = {
      get: vi.fn(),
      set: vi.fn(),
    };

    const mockLogger = {
      log: vi.fn(),
      error: vi.fn(),
    };

    const mockLoggerFactory = {
      create: vi.fn(() => mockLogger),
    };

    service = new BucketService(
      mockDrizzleService as unknown as DrizzleService,
      mockCacheService as unknown as CacheService,
      mockLoggerFactory as unknown as LoggerFactory,
    );

    sendToS3 = vi.fn(async () => ({}));

    service["s3"].send = sendToS3 as unknown as S3Client["send"];
  });

  describe("S3 upload", () => {
    it("should resize and convert image to jpeg", async () => {
      const pngBuffer = await sharp({
        create: {
          width: 100,
          height: 100,
          channels: 4,
          background: {
            r: 255,
            g: 0,
            b: 0,
            alpha: 0.5,
          },
        },
      })
        .png()
        .toBuffer();

      const file = {
        buffer: pngBuffer,
        originalname: "test-image.png",
        mimetype: "image/png",
        size: pngBuffer.length,
      };

      await service.upload({
        file,
        isPublic: false,
      });

      assert.strictEqual(sendToS3.mock.calls.length, 1);

      const callArgs = sendToS3.mock.calls[0][0];

      assert.ok(callArgs instanceof PutObjectCommand);

      const putCommand = callArgs as PutObjectCommand;

      assert.strictEqual(putCommand.input.ContentType, "image/jpeg");

      assert.strictEqual(file.originalname, "test-image.jpg");

      assert.strictEqual(file.mimetype, "image/jpeg");

      assert.strictEqual(insertBucketFileValues.mock.calls.length, 1);

      const databaseInput = insertBucketFileValues.mock.calls[0][0] as {
        filename: string;
        size: number;
      };

      assert.strictEqual(databaseInput.filename, "test-image.jpg");

      assert.strictEqual(typeof databaseInput.size, "number");
    });

    it("should not resize SVG files", async () => {
      const svgContent = '<svg><rect width="100" height="100"/></svg>';

      const svgBuffer = Buffer.from(svgContent);

      const file = {
        buffer: svgBuffer,
        originalname: "test-icon.svg",
        mimetype: "image/svg+xml",
        size: svgBuffer.length,
      };

      await service.upload({
        file,
        isPublic: false,
      });

      const callArgs = sendToS3.mock.calls[0][0] as PutObjectCommand;

      assert.strictEqual(callArgs.input.ContentType, "image/svg+xml");

      assert.strictEqual(file.buffer, svgBuffer);

      assert.strictEqual(file.originalname, "test-icon.svg");
    });

    it("should not resize PDF files", async () => {
      const pdfBuffer = Buffer.from("%PDF-1.4...");

      const file = {
        buffer: pdfBuffer,
        originalname: "test-doc.pdf",
        mimetype: "application/pdf",
        size: pdfBuffer.length,
      };

      await service.upload({
        file,
        isPublic: false,
      });

      const callArgs = sendToS3.mock.calls[0][0] as PutObjectCommand;

      assert.strictEqual(callArgs.input.ContentType, "application/pdf");

      assert.strictEqual(file.buffer, pdfBuffer);
    });
  });

  describe("local upload", () => {
    beforeEach(() => {
      mockedEnv.ENV_SCOPE = "local";
    });

    it("should store localPath exactly as received", async () => {
      const localPath = "/any/path/in/the/system/image.png";

      const file = {
        buffer: Buffer.from("mock"),
        originalname: "image.png",
        mimetype: "image/png",
        size: 4,
      };

      await service.upload({
        file,
        isPublic: true,
        localPath,
      });

      assert.strictEqual(sendToS3.mock.calls.length, 0);

      assert.strictEqual(insertBucketFileValues.mock.calls.length, 1);

      const databaseInput = insertBucketFileValues.mock.calls[0][0] as {
        url: string;
        filename: string;
        is_public: boolean;
      };

      assert.strictEqual(databaseInput.url, localPath);

      assert.strictEqual(databaseInput.filename, "image.png");

      assert.strictEqual(databaseInput.is_public, true);
    });

    it("should not process the local path", async () => {
      const localPath = "../../../something/weird/my-image.png";

      const file = {
        buffer: Buffer.from("mock"),
        originalname: "image.png",
        mimetype: "image/png",
        size: 4,
      };

      await service.upload({
        file,
        isPublic: true,
        localPath,
      });

      const databaseInput = insertBucketFileValues.mock.calls[0][0] as {
        url: string;
      };

      assert.strictEqual(
        databaseInput.url,
        "../../../something/weird/my-image.png",
      );
    });

    it("should not send local files to S3", async () => {
      const file = {
        buffer: Buffer.from("mock"),
        originalname: "image.png",
        mimetype: "image/png",
        size: 4,
      };

      await service.upload({
        file,
        isPublic: true,
        localPath: "/images/image.png",
      });

      assert.strictEqual(sendToS3.mock.calls.length, 0);
    });

    it("stores a browser upload locally when no localPath is supplied", async () => {
      const directory = await mkdtemp(join(tmpdir(), "carecahub-upload-"));
      mockedEnv.LOCAL_UPLOAD_DIR = directory;
      const file = {
        buffer: Buffer.from("mock"),
        originalname: "image.png",
        mimetype: "image/png",
        size: 4,
      };

      try {
        await service.upload({ file, isPublic: true });
        const values = insertBucketFileValues.mock.calls[0][0] as { key: string; url: string };
        assert.deepEqual(await readFile(join(directory, values.key)), file.buffer);
        assert.equal(values.url, `http://localhost:3030/uploads/${values.key}`);
        assert.equal(sendToS3.mock.calls.length, 0);
      } finally {
        await rm(directory, { recursive: true, force: true });
        mockedEnv.LOCAL_UPLOAD_DIR = "uploads";
      }
    });

    it("should map local paths to files in batch upload", async () => {
      const files = [
        {
          buffer: Buffer.from("file-1"),
          originalname: "one.png",
          mimetype: "image/png",
          size: 6,
        },
        {
          buffer: Buffer.from("file-2"),
          originalname: "two.png",
          mimetype: "image/png",
          size: 6,
        },
      ];

      const localPaths = ["/images/one.png", "/images/two.png"];

      await service.batchUploadPublic(files, localPaths);

      assert.strictEqual(insertBucketFileValues.mock.calls.length, 2);

      const first = insertBucketFileValues.mock.calls[0][0] as {
        url: string;
      };

      const second = insertBucketFileValues.mock.calls[1][0] as {
        url: string;
      };

      assert.strictEqual(first.url, "/images/one.png");

      assert.strictEqual(second.url, "/images/two.png");

      assert.strictEqual(sendToS3.mock.calls.length, 0);
    });
  });
});
