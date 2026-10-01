import type { ServiceOutput } from '@/types'
import type { GetDashboardDto } from './dto/get-dashboard.dto'

export type GetDashboardOutput = ServiceOutput<GetDashboardDto>

export abstract class IDashboardService {
  abstract getDashboard(): GetDashboardOutput
}
