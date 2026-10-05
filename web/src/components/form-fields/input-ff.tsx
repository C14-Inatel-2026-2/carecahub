import * as React from 'react'
import { Controller, useFormContext } from 'react-hook-form'

import { Field, FieldDescription, FieldError } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { FormFieldLabel, useRequiredField } from './form-schema'
import { LabeledInput } from './labeled-input'

type InputFFProps = {
  name: string
  label: string
} & React.ComponentProps<'input'>

export function InputFF({ label, name, ...rest }: InputFFProps) {
  const form = useFormContext()
  return (
    <Controller
      name={name}
      control={form.control}
      render={({ field, fieldState }) => (
        <LabeledInput
          {...field}
          {...rest}
          name={name}
          label={label}
          value={field.value ?? ''}
          error={fieldState.error?.message}
        />
      )}
    />
  )
}

type TextAreaFFProps = {
  name: string
  label: string
  maxLength?: number
} & React.ComponentProps<'textarea'>

export function TextAreaFF({ label, name, maxLength, ...rest }: TextAreaFFProps) {
  const form = useFormContext()
  const isRequired = useRequiredField(name, rest.required)
  return (
    <Controller
      name={name}
      control={form.control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FormFieldLabel name={name} htmlFor={rest.id ?? name} required={isRequired}>
            {label}
          </FormFieldLabel>
          <Textarea
            {...field}
            {...rest}
            id={rest.id ?? name}
            required={isRequired}
            aria-describedby={
              fieldState.invalid ? `${rest.id ?? name}-error` : rest['aria-describedby']
            }
            aria-invalid={fieldState.invalid}
            value={field.value ?? ''}
            rows={rest.rows || 3}
            maxLength={maxLength}
          />
          {maxLength && (
            <FieldDescription>
              {field.value?.length || 0}/{maxLength} caracteres
            </FieldDescription>
          )}
          {fieldState.invalid && (
            <FieldError id={`${rest.id ?? name}-error`} errors={[fieldState.error]} />
          )}
        </Field>
      )}
    />
  )
}

type NumberFFProps = {
  name: string
  label: string
} & React.ComponentProps<'input'>

export function NumberFF({ label, name, ...rest }: NumberFFProps) {
  const form = useFormContext()
  const isRequired = useRequiredField(name, rest.required)
  const [inputValue, setInputValue] = React.useState<string | null>(null)

  return (
    <Controller
      name={name}
      control={form.control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FormFieldLabel name={name} htmlFor={rest.id ?? name} required={isRequired}>
            {label}
          </FormFieldLabel>
          <Input
            {...field}
            {...rest}
            id={rest.id ?? name}
            required={isRequired}
            aria-describedby={
              fieldState.invalid ? `${rest.id ?? name}-error` : rest['aria-describedby']
            }
            type='number'
            aria-invalid={fieldState.invalid}
            inputMode='numeric'
            value={inputValue ?? field.value ?? ''}
            onChange={(event) => {
              const raw = event.target.value
              setInputValue(raw)

              if (raw === '') {
                field.onChange(undefined)
                return
              }

              const parsed = Number(raw)
              if (!Number.isNaN(parsed)) {
                const minOrValue = rest.min ? Math.max(Number(rest.min), parsed) : parsed
                const maxOrValue = rest.max ? Math.min(Number(rest.max), minOrValue) : minOrValue
                field.onChange(maxOrValue)
              }
            }}
            onBlur={() => {
              if (inputValue === '') {
                field.onChange(undefined)
              }
              setInputValue(null)
              field.onBlur()
            }}
          />
          {fieldState.invalid && (
            <FieldError id={`${rest.id ?? name}-error`} errors={[fieldState.error]} />
          )}
        </Field>
      )}
    />
  )
}
