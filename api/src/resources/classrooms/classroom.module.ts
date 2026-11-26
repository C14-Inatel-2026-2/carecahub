import { Module } from '@nestjs/common'
import { GitHubModule } from '@/providers/github/github.module'
import { ClassroomController } from './classroom.controller'
import { ClassroomService } from './classroom.service'

@Module({ imports: [GitHubModule], controllers: [ClassroomController], providers: [ClassroomService], exports: [ClassroomService] })
export class ClassroomModule {}
