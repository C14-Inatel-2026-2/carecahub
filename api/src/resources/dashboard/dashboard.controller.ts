import { Get } from '@nestjs/common'
import { ApiController } from '@/infra/controller.decorator'
import { Roles } from '@/infra/roles.guard'
import { DashboardService } from './dashboard.service'

@ApiController('dashboard', 'Dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  @Roles(['admin', 'teacher', 'mentor'])
  getDashboard() {
    return this.dashboardService.getDashboard()
  }
}
