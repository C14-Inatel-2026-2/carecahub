import { useId } from 'react'
import { Field, FieldError } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { FormFieldLabel, useRequiredField } from './form-schema'
import { PasswordInput } from './password-input'

export function LabeledInput({
  label,
  name,
  error,
  required,
  showRequiredIndicator = true,
  id,
  ...props
}: {
  label: string
  name: string
  error?: string
  showRequiredIndicator?: boolean
} & React.ComponentProps<typeof Input>) {
  const InputComponent = props.type === 'password' ? PasswordInput : Input
  const generatedId = useId()
  const isRequired = useRequiredField(name, required)
  const inputId = id ?? generatedId
  const errorId = `${inputId}-error`
  return (
    <Field data-invalid={!!error}>
      <FormFieldLabel
        name={name}
        htmlFor={inputId}
        required={isRequired}
        showRequiredIndicator={showRequiredIndicator}
      >
        {label}
      </FormFieldLabel>
      <InputComponent
        {...props}
        name={name}
        id={inputId}
        required={isRequired}
        aria-invalid={!!error}
        aria-describedby={
          [props['aria-describedby'], error && errorId].filter(Boolean).join(' ') || undefined
        }
      />
      <FieldError id={errorId} errors={[{ message: error }]} />
    </Field>
  )
}
