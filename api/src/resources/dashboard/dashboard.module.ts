import { Module } from '@nestjs/common'
import { GitHubModule } from '@/providers/github/github.module'
import { DashboardController } from './dashboard.controller'
import { DashboardService } from './dashboard.service'

@Module({
  imports: [GitHubModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
