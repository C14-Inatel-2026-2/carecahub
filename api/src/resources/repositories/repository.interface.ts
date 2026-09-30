import { ServiceOutput, UserMetadata } from '@/types'
import { List } from '@/utils/dtos/base.dto'
import { QueryDto } from '@/utils/dtos/query.dto'
import { GetRepositoryDto } from './dto/get-repository.dto'
import { UpsertRepositoryDto } from './dto/upsert-repository.dto'

export type UpsertRepositoryOutput = ServiceOutput<GetRepositoryDto>

export type GetRepositoryOutput = ServiceOutput<GetRepositoryDto>
export type ListRepositoryOutput = ServiceOutput<List<GetRepositoryDto>>

export abstract class IRepositoryService {
  abstract upsert(
    input: UpsertRepositoryDto,
    requester: UserMetadata,
  ): Promise<UpsertRepositoryOutput>
  abstract findAll(query: QueryDto, requester?: UserMetadata): Promise<ListRepositoryOutput>
  abstract findOne(id: string, requester?: UserMetadata): Promise<GetRepositoryOutput>
  abstract remove(id: string, requester: UserMetadata): Promise<ServiceOutput<object>>
}
