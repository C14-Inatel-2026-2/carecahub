import { applyDecorators, UseInterceptors } from '@nestjs/common'
import { AnyFilesInterceptor, FileInterceptor } from '@nestjs/platform-express'
import { ApiConsumes, ApiOperation, ApiResponse } from '@nestjs/swagger'
import { UploadResponseDto } from '@/providers/bucket/dtos/uploadResponse.dto'

/**
 * Upload Route Decorator
 */
export function UploadRoute(files: number = 1): MethodDecorator {
  const limits = {
    fileSize: 100_000_000, // Max file size: 100MB per file
    files,
  }

  return applyDecorators(
    ApiConsumes('multipart/form-data'),
    ApiOperation({
      summary:
        'Receive a file, store and return URL to access, if public. Otherwise, return a reference to access it.',
      description: 'Max file size: 100MB',
      requestBody: {
        content: {
          'multipart/form-data': {
            schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } },
          },
        },
      },
    }),
    UseInterceptors(
      files > 1 ? AnyFilesInterceptor({ limits }) : FileInterceptor('file', { limits }),
    ),
    ApiResponse({
      status: 201,
      description: 'File uploaded with success',
      type: UploadResponseDto,
    }),
  )
}
