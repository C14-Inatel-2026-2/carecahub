import { Body, Post, UploadedFile, UploadedFiles } from "@nestjs/common";

import { ApiController } from "@/infra/controller.decorator";
import { UploadRoute } from "@/infra/upload-route.decorator";
import { CustomLogger } from "../logger/custom-logger.service";
import { LoggerFactory } from "../logger/logger-factory.service";
import { BucketService } from "./bucket.service";
import { UploadFileDto } from "./dtos/upload.dto";

@ApiController("files", "Files")
export class BucketController {
  private readonly logger: CustomLogger;

  constructor(
    private readonly bucketService: BucketService,
    loggerFactory: LoggerFactory,
  ) {
    this.logger = loggerFactory.create(BucketController.name);
  }

  @Post("/public")
  @UploadRoute()
  uploadFile(
    @UploadedFile() file: UploadFileDto,
    @Body("localPath") localPath?: string,
  ) {
    return this.bucketService.upload({
      file,
      isPublic: true,
      localPath,
    });
  }

  @Post("/public/batch")
  @UploadRoute(10)
  batchUpload(
    @UploadedFiles() files: UploadFileDto[],
    @Body("localPaths") localPaths?: string[],
  ) {
    return this.bucketService.batchUploadPublic(files, localPaths);
  }

  @Post("/private")
  @UploadRoute()
  async uploadPrivateFile(
    @UploadedFile() file: UploadFileDto,
    @Body("localPath") localPath?: string,
  ) {
    this.logger.log("Uploading private file");

    return this.bucketService.upload({
      file,
      isPublic: false,
      localPath,
    });
  }

  // TODO: validate ownership
  // @Get('/private/:key')
  // async downloadPrivate(@Res() res: Response, @Param('key') key: string) {
  //   if (!key) {
  //     throw new BadRequestException(
  //       exceptionsDictionary.keyNotProvidedErrKey,
  //     )
  //   }
  //
  //   const buffer = await this.bucketService.download(key)
  //
  //   res.setHeader('Content-Type', 'application/octet-stream')
  //   res.setHeader('Content-Disposition', `attachment; filename=${key}`)
  //   res.send(buffer)
  // }
}
