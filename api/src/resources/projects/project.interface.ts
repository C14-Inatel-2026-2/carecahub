import { ServiceOutput, UserMetadata } from '@/types'
import { List } from '@/utils/dtos/base.dto'
import { QueryDto } from '@/utils/dtos/query.dto'
import { GetProjectDto } from './dto/get-project.dto'
import { UpsertProjectDto } from './dto/upsert-project.dto'

export type UpsertProjectOutput = ServiceOutput<GetProjectDto>
export type GetProjectOutput = ServiceOutput<GetProjectDto>
export type ListProjectOutput = ServiceOutput<List<GetProjectDto>>
export type RemoveProjectOutput = ServiceOutput<object>

export abstract class IProjectService {
  abstract upsert(input: UpsertProjectDto, requester: UserMetadata): Promise<UpsertProjectOutput>
  abstract findAll(query: QueryDto, requester?: UserMetadata): Promise<ListProjectOutput>
  abstract findOne(id: string, requester?: UserMetadata): Promise<GetProjectOutput>
  abstract remove(id: string, requester: UserMetadata): Promise<RemoveProjectOutput>
}
