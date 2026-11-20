import { Controller, useFormContext } from 'react-hook-form'
import { FormFieldLabel } from '@/components/form-fields/form-schema'
import { Field, FieldError } from '@/components/ui/field'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { ProjectFormInput } from '@/types/project'

type OptionSelectFieldProps = {
  name: 'dependencyManager' | 'versionControl' | 'repositoryType'
  label: string
  options: readonly { value: string; label: string }[]
}

const selectPlaceholders: Record<OptionSelectFieldProps['name'], string> = {
  dependencyManager: 'Selecione um gerenciador',
  versionControl: 'Selecione um sistema',
  repositoryType: 'Selecione um tipo',
}

export function OptionSelectField({ name, label, options }: OptionSelectFieldProps) {
  const { control } = useFormContext<ProjectFormInput>()
  const id = name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)
  const errorId = `${id}-error`

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FormFieldLabel name={name} htmlFor={id}>
            {label}
          </FormFieldLabel>
          <Select value={field.value ?? null} onValueChange={field.onChange}>
            <SelectTrigger
              id={id}
              ref={field.ref}
              onBlur={field.onBlur}
              className='w-full'
              aria-invalid={fieldState.invalid}
              aria-required='true'
              aria-describedby={fieldState.invalid ? errorId : undefined}
            >
              <SelectValue placeholder={selectPlaceholders[name]}>
                {(value) => options.find((option) => option.value === value)?.label}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError id={errorId} errors={[fieldState.error]} />
        </Field>
      )}
    />
  )
}
