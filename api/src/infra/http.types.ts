export interface IResponseError {
  success: false;
  errKey: string;
  message: string;
  friendlyMessage?: string;
}

export type EitherResponse<T, E = IResponseError> = (T & { success: true }) | E;
