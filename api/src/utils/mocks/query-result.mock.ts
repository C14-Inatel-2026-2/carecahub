/**
 * Dublê do query builder do Drizzle para testes unitários.
 * Todo método encadeável devolve a própria instância, e o `await`
 * resolve com o resultado fornecido (ou rejeita, se for um Error).
 */
export class QueryResult<T> implements PromiseLike<T> {
  constructor(private readonly result: T) {}

  from() {
    return this
  }
  where() {
    return this
  }
  innerJoin() {
    return this
  }
  leftJoin() {
    return this
  }
  groupBy() {
    return this
  }
  orderBy() {
    return this
  }
  offset() {
    return this
  }
  limit() {
    return this
  }
  values() {
    return this
  }
  set() {
    return this
  }
  returning() {
    return this
  }
  for() {
    return this
  }

  // biome-ignore lint/suspicious/noThenProperty: query builders are intentionally awaitable
  then<TResult1 = T, TResult2 = never>(
    onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2> {
    if (this.result instanceof Error) {
      return Promise.reject(this.result).then(onfulfilled, onrejected)
    }
    return Promise.resolve(this.result).then(onfulfilled, onrejected)
  }
}
