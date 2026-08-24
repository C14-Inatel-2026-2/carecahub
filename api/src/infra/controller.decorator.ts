import {
  applyDecorators,
  CallHandler,
  Controller,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  UseInterceptors,
} from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { map } from 'rxjs'
import { removeDeepData } from '@/utils/removeDeepData'

@Injectable()
export class SensitiveDataInterceptor implements NestInterceptor {
  sensitiveData: string[]

  constructor(...sensitiveData: string[]) {
    this.sensitiveData = sensitiveData
  }

  intercept(_context: ExecutionContext, next: CallHandler) {
    return next.handle().pipe(
      map((response) => {
        if (response?.data) {
          const data = removeDeepData(response.data, this.sensitiveData)
          return { ...response, data }
        }

        return removeDeepData(response, this.sensitiveData)
      }),
    )
  }
}

/**
 * If don't pass `customTagName` this decorators will assumes to use ApiTag will be same `controllerName`

 * @param controllerName - Controller name
 * @param customTagName - ApiTag name (optional)
 */
export function ApiController(controllerName: string, customTagName?: string): ClassDecorator {
  return applyDecorators(
    Controller(controllerName),
    ApiBearerAuth('Authorization'),
    ApiTags(customTagName ?? controllerName),
    UseInterceptors(new SensitiveDataInterceptor('password', 'securityPaymentKey', 'fcmUserToken')),
  )
}
