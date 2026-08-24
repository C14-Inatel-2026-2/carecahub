import { Param, ParseUUIDPipe } from '@nestjs/common'

export const UUIDParam = (paramName = 'id'): ParameterDecorator =>
  Param(paramName, new ParseUUIDPipe())

// export function MaskData(...sensitiveData: string[]) {
//   return applyDecorators(UseInterceptors(new MaskDataInterceptor(...sensitiveData)));
// }
