'use client'

import type React from 'react'
import { useEffect, useState } from 'react'
import { Controller, useFormContext } from 'react-hook-form'

import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { doubleToCents, formatCurrency } from '@/lib/currency'
import { cn } from '@/lib/utils'

interface CurrencyFFProps {
  name: string
  label: string
  placeholder?: string
  description?: string
  disabled?: boolean
  readOnly?: boolean
  className?: string
}

export function CurrencyFF({
  name,
  label,
  placeholder = 'R$ 0,00',
  description,
  disabled = false,
  readOnly = false,
  className,
}: CurrencyFFProps) {
  const form = useFormContext()

  return (
    <Controller
      name={name}
      control={form.control}
      render={({ field, fieldState }) => (
        <CurrencyFieldContent
          name={name}
          field={field}
          fieldState={fieldState}
          label={label}
          placeholder={placeholder}
          description={description}
          disabled={disabled}
          readOnly={readOnly}
          className={className}
        />
      )}
    />
  )
}

function formatToCurrency(valueInCents: number | undefined): string {
  if (valueInCents === undefined || valueInCents === null || Number.isNaN(valueInCents)) {
    return ''
  }

  return formatCurrency(valueInCents)
}

function parseCurrencyToNumber(currencyString: string): number | undefined {
  if (!currencyString || currencyString.trim() === '') {
    return undefined
  }

  const cleaned = currencyString.replace(/[^\d,]/g, '')

  if (!cleaned) {
    return undefined
  }

  const normalized = cleaned.replace(',', '.')
  const parsed = Number.parseFloat(normalized)

  if (Number.isNaN(parsed)) {
    return undefined
  }

  return doubleToCents(parsed)
}

function maskCurrencyInput(input: string): string {
  const digits = input.replace(/\D/g, '')

  if (!digits) {
    return ''
  }

  const numberValue = Number.parseInt(digits, 10)

  return formatCurrency(numberValue)
}

type CurrencyFieldContentProps = {
  name: string
  field: {
    value: number | undefined
    onChange: (value: number | undefined) => void
    onBlur: () => void
  }
  fieldState: { invalid: boolean; error?: { message?: string } }
  label: string
  placeholder: string
  description?: string
  disabled: boolean
  readOnly: boolean
  className?: string
}

function CurrencyFieldContent({
  name,
  field,
  fieldState,
  label,
  placeholder,
  description,
  disabled,
  readOnly,
  className,
}: CurrencyFieldContentProps) {
  const [displayValue, setDisplayValue] = useState('')

  useEffect(() => {
    if (field.value !== undefined && field.value !== null) {
      setDisplayValue(formatToCurrency(field.value))
    } else {
      setDisplayValue('')
    }
  }, [field.value])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value
    const maskedValue = maskCurrencyInput(inputValue)
    setDisplayValue(maskedValue)
    field.onChange(parseCurrencyToNumber(maskedValue))
  }

  const handleBlur = () => {
    if (field.value !== undefined && field.value !== null) {
      setDisplayValue(formatToCurrency(field.value))
    }
    field.onBlur()
  }

  return (
    <Field data-invalid={fieldState.invalid} className={className}>
      <FieldLabel htmlFor={name}>{label}</FieldLabel>
      <Input
        id={name}
        placeholder={placeholder}
        value={displayValue}
        onChange={handleInputChange}
        onBlur={handleBlur}
        disabled={disabled}
        readOnly={readOnly}
        aria-invalid={fieldState.invalid}
        className={cn(
          'text-left',
          field.value && 'font-medium',
          readOnly && 'cursor-not-allowed bg-muted'
        )}
        autoComplete='off'
      />
      {description && <FieldDescription>{description}</FieldDescription>}
      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
    </Field>
  )
}
