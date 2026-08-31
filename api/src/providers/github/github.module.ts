import { Global, Module } from "@nestjs/common";
import { BucketModule } from "../bucket/bucket.module";
// TODO: Implement SystemParamsModule
// import { SystemParamsModule } from '../system-params/system-params.module';
import { GitHubService } from "./github.service";

@Global()
@Module({
  imports: [
    /* SystemParamsModule */
  ],
  providers: [GitHubService],
  exports: [GitHubService],
})
export class GitHubModule {}
