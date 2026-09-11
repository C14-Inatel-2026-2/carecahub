import { Module } from '@nestjs/common'
import { GitHubModule } from '@/providers/github/github.module'
import { UsersController } from './user.controller'
import { UsersService } from './user.service'

@Module({
  imports: [GitHubModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
