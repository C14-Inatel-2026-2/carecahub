import { Get } from '@nestjs/common'
import { ApiController } from './infra/controller.decorator'

@ApiController('/', 'Base')
export class AppController {
  @Get('health')
  getHealth(): string {
    return 'OK'
  }
}
