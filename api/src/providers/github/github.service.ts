import { EitherResponse } from "@/infra/http.types";
import { Injectable } from "@nestjs/common";
import { CustomLogger } from "@/providers/logger/custom-logger.service";
import axios from "axios";
import { RepositoryResponse } from "./github.types";
import { env } from "@/providers/config/env";

@Injectable()
export class GitHubService {
  private axios: axios.AxiosInstance;

  constructor(
    private readonly logger: CustomLogger,
    // TODO: Find out how and if the systemParams will be implemented
    // private readonly systemParamsService: SystemParamsService,
  ) {
    this.axios = axios.create({
      baseURL: env.GITHUB_BASE_URL,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.GITHUB_TOKEN}`,
      },
      timeout: env.GITHUB_TIMEOUT,
    });
    this.axios.interceptors.response.use(
      (response) => response,
      (error) => {
        return Promise.reject(error);
      },
    );
  }

  async getRepositoryFromUrl(
    repositoryOwner: string,
    repositoryUrl: string,
  ): Promise<EitherResponse<RepositoryResponse>> {
    this.logger.info(`GET repository from URL: ${repositoryUrl}`);
    try {
      const response = await this.axios.get(
        `/repos/${repositoryOwner}/${repositoryUrl}`,
      );
      this.logger.info(`Response GET repository by URL, ${response.data}`);

      return {
        success: true,
        ...response.data,
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      this.logger.error("Error get repository: ", err);

      const isNotFound = err.response?.status === 404;

      return {
        success: false,
        errKey:
          err.response?.data?.errKey ||
          (isNotFound ? "repositoryNotFound" : "error"),
        message:
          err.response?.data?.detail || "Something went wrong, try again",
        friendlyMessage:
          err.response?.data?.friendlyMessage ||
          (isNotFound
            ? "Repositorio do GitHub nao encontrado. Verifique o URL vinculado."
            : "Falha ao buscar repositorio no GitHub, tente novamente"),
      };
    }
  }
}
