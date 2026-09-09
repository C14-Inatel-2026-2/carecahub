import { Injectable } from '@nestjs/common'
import { IProjectService } from './project.interface'

@Injectable()
export class ProjectService implements IProjectService {}
