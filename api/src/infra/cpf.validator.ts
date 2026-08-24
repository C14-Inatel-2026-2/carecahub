import { buildMessage, ValidateBy, ValidationOptions } from 'class-validator'
import { validateCPF } from '@/utils/cpf'

export function IsValidCpf(validationOptions?: ValidationOptions): PropertyDecorator {
  return ValidateBy(
    {
      name: 'isValidCpf',
      validator: {
        validate: (value): boolean => value === null || validateCPF(value),
        defaultMessage: buildMessage(
          (eachPrefix) => `${eachPrefix} $property must be a valid CPF`,
          validationOptions,
        ),
      },
    },
    validationOptions,
  )
}
