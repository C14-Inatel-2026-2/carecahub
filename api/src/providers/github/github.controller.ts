import { Get } from "@nestjs/common";
import { ApiController } from "@/infra/controller.decorator";
import { CustomLogger } from "../logger/custom-logger.service";
import { LoggerFactory } from "../logger/logger-factory.service";
import { GitHubService } from "./github.service";

@ApiController("github", "GitHub")
export class GitHubController {
  private readonly logger: CustomLogger;
  constructor(
    private readonly githubService: GitHubService,
    loggerFactory: LoggerFactory,
  ) {
    this.logger = loggerFactory.create(GitHubController.name);
  }

  @Get("/repository/:repositoryUrl")
  getRepository(repositoryUrl: string) {
    return this.githubService.getRepositoryFromUrl(repositoryUrl);
  }
}
