export type IResponseError = {
  /** @deprecated use `ok` */
  success: false
  ok: false
  errKey: string
  message: string
  friendlyMessage?: string
}

export type PaginateResponse<T> = {
  totalCount: number
  unreadCount?: number
  data: T[]
}

export type EitherResponse<T, E = IResponseError> = (T & { ok: true; success: true }) | E

// TODO: type errKey
export type ServiceOutput<T> = Promise<(T & { ok: true }) | { ok: false; errKey: string }>

export type PaginateParams = {
  skip?: number
  take?: number
  orderBy?: string
  orderType?: 'asc' | 'desc'
  search?: string
  startDate?: Date
  endDate?: Date
}
