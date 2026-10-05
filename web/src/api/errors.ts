export const apiErrorMessages: Record<string, string> = {
  invalidIdErrKey: 'O registro informado é inválido.',
  invalidPayloadErrKey: 'Confira os dados informados e tente novamente.',
  limitReachedErrKey: 'O limite permitido foi atingido.',
  badRequestErrKey: 'Não foi possível concluir a ação. Confira os dados informados.',
  notFoundErrKey: 'O registro não foi encontrado. Atualize a página e tente novamente.',
  alreadyExistsErrKey: 'Já existe um registro com esses dados.',
  unauthorizedErrKey: 'Sua sessão expirou. Entre novamente para continuar.',
  forbiddenErrKey: 'Você não tem permissão para realizar esta ação.',
  invalidCredentialsErrKey: 'E-mail ou senha incorretos.',
  internalServerErrorErrKey: 'Não foi possível concluir a ação. Tente novamente mais tarde.',
  resourceInUseErrKey: 'Este registro está em uso e não pode ser alterado ou excluído.',
  noAccessToFeatureErrKey: 'Você não tem acesso a esta funcionalidade.',
  repositoryNotFound: 'O repositório não foi encontrado no GitHub.',
  NETWORK_ERROR: 'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.',
}

export function getApiErrorMessage(error: { errKey?: string; statusCode?: number }): string {
  if (error.errKey && Object.hasOwn(apiErrorMessages, error.errKey)) {
    return apiErrorMessages[error.errKey]
  }
  if (error.statusCode === 401) return apiErrorMessages.unauthorizedErrKey
  if (error.statusCode === 403) return apiErrorMessages.forbiddenErrKey
  return 'Não foi possível concluir a ação. Tente novamente.'
}
