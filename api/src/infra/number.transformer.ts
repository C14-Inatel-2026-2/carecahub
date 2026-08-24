import { Transform, TransformFnParams } from 'class-transformer'

export function TransformInt(def?: number) {
  return Transform((param: TransformFnParams) => {
    return parseInt(param.value || def, 10) ?? undefined
  })
}
