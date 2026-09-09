import { ApiController } from '@/infra/controller.decorator'
import { ProjectService } from './project.service'

@ApiController('projects', 'Projects')
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}
}
