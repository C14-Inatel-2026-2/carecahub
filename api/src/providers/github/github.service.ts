import { EitherResponse } from "@/infra/http.types";
import { Injectable } from "@nestjs/common";
import { CustomLogger } from "@/providers/logger/custom-logger.service";
import axios from "axios";
import { RepositoryResponse } from "./github.types";

@Injectable()
export class GitHubService {
  private axios: axios.AxiosInstance;

  constructor(
    // TODO: Find out how the service configuration will be structured
    // private readonly configService: ConfigService;
    private readonly logger: CustomLogger,
    // TODO: Find out how the systemParams will be implemented
    // private readonly systemParamsService: SystemParamsService,
  ) {
    // TODO: Find out the necessary variables for the GitHub integration
    // this.axios = axios.create({
    //   baseURL: this.configService.get('github.baseUrl'),
    //   headers: {
    //     'Content-Type': 'application/json',
    //     Authorization: `Bearer ${this.configService.get('github.token')}`,
    //   },
    //   timeout: this.configService.get('github.timeout'),
    // });
    this.axios.interceptors.response.use(
      (response) => response,
      (error) => {
        return Promise.reject(error);
      },
    );
  }

  async getRepositoryFromUrl(
    repositoryUrl: string,
  ): Promise<EitherResponse<RepositoryResponse>> {
    this.logger.info(`GET repository from URL: ${repositoryUrl}`);
    try {
      const repositoryOwner = "TesteOwner"; // TODO: Make search for repository owner dynamic
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
