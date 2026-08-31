import { RepositoryResponse } from "./github.types";

export abstract class IGitHubService {
  abstract getRepositoryFromUrl(
    repositoryURL: string,
  ): Promise<RepositoryResponse>;
}
