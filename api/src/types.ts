export const headersDictionary = {
  accessToken: 'ignite_access_token_v1',
  refreshToken: 'ignite_refresh_token_v1',
}

export const ONE_MINUTE_IN_MS = 60 * 1000
export const ONE_DAY_IN_MS = 60 * 60 * 24 * 1000
export const ONE_HOUR_IN_MS = 60 * 60 * 1000
export const ONE_MINUTE_IN_SECONDS = 60
export const ONE_DAY_IN_SECONDS = 60 * 60 * 24

export enum SystemParams {
  PLATFORM_COLOR = 'PLATFORM_COLOR',
  PLATFORM_LOGO = 'PLATFORM_LOGO',
  PLATFORM_NAME = 'PLATFORM_NAME',
  PLATFORM_URL = 'PLATFORM_URL',
}

export type UserMetadata = {
  userId: string
  role: string
  name: string

  iat?: number
  exp?: number
}

export type ServiceOutput<T> = Promise<(T & { ok: true }) | { ok: false; errKey: ErrKeys }>

export enum ErrKeys {
  invalidId = 'invalidIdErrKey',
  invalidPayload = 'invalidPayloadErrKey',
  limitReached = 'limitReachedErrKey',

  badRequest = 'badRequestErrKey',
  notFound = 'notFoundErrKey',
  alreadyExists = 'alreadyExistsErrKey',
  unauthorized = 'unauthorizedErrKey',
  invalidCredentials = 'invalidCredentialsErrKey',
  internalServerError = 'internalServerErrorErrKey',
  resourceInUse = 'resourceInUseErrKey',
  noAccessToFeature = 'noAccessToFeatureErrKey',
}

export const exceptionsDictionary: Record<
  ErrKeys,
  {
    message: string
    friendlyMessage: string
    type: 'bad_request' | 'unauthorized' | 'not_found' | 'conflict' | 'internal_server_error'
    errKey: ErrKeys
  }
> = {
  invalidIdErrKey: {
    message: 'Invalid ID',
    friendlyMessage: 'Id inválido',
    type: 'bad_request',
    errKey: ErrKeys.invalidId,
  },
  invalidPayloadErrKey: {
    message: 'Invalid payload',
    friendlyMessage: 'Payload inválido',
    type: 'bad_request',
    errKey: ErrKeys.invalidPayload,
  },
  limitReachedErrKey: {
    message: 'Limit reached',
    friendlyMessage: 'Limite atingido',
    type: 'bad_request',
    errKey: ErrKeys.limitReached,
  },
  badRequestErrKey: {
    message: 'Bad request',
    friendlyMessage: 'Requisição inválida',
    type: 'bad_request',
    errKey: ErrKeys.badRequest,
  },
  notFoundErrKey: {
    message: 'Not found',
    friendlyMessage: 'Não encontrado',
    type: 'not_found',
    errKey: ErrKeys.notFound,
  },
  alreadyExistsErrKey: {
    message: 'Already exists',
    friendlyMessage: 'Já existe',
    type: 'conflict',
    errKey: ErrKeys.alreadyExists,
  },
  unauthorizedErrKey: {
    message: 'Unauthorized',
    friendlyMessage: 'Não autorizado',
    type: 'unauthorized',
    errKey: ErrKeys.unauthorized,
  },
  invalidCredentialsErrKey: {
    message: 'Invalid credentials',
    friendlyMessage: 'Credenciais inválidas',
    type: 'unauthorized',
    errKey: ErrKeys.invalidCredentials,
  },
  internalServerErrorErrKey: {
    message: 'Internal server error',
    friendlyMessage: 'Erro interno',
    type: 'internal_server_error',
    errKey: ErrKeys.internalServerError,
  },
  resourceInUseErrKey: {
    message: 'Resource in use',
    friendlyMessage: 'Recurso em uso',
    type: 'bad_request',
    errKey: ErrKeys.resourceInUse,
  },
  noAccessToFeatureErrKey: {
    message: 'No access to feature',
    friendlyMessage: 'Acesso negado',
    type: 'bad_request',
    errKey: ErrKeys.noAccessToFeature,
  },
}
