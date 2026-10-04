import { createContext, useContext } from 'react'
import { z } from 'zod'
import { FieldLabel } from '@/components/ui/field'

const FormSchemaContext = createContext<z.ZodType | null>(null)
const RequiredFieldsContext = createContext<Record<string, boolean>>({})

export function FormSchemaProvider({
  schema,
  children,
  requiredFields = {},
}: {
  schema: z.ZodType
  children: React.ReactNode
  requiredFields?: Record<string, boolean>
}) {
  return (
    <FormSchemaContext.Provider value={schema}>
      <RequiredFieldsContext.Provider value={requiredFields}>
        {children}
      </RequiredFieldsContext.Provider>
    </FormSchemaContext.Provider>
  )
}

export function isSchemaFieldRequired(schema: z.ZodType | null, name: string): boolean {
  if (schema instanceof z.ZodPipe) return isSchemaFieldRequired(schema.in as z.ZodType, name)
  if (!(schema instanceof z.ZodObject)) return false
  const field = schema.shape[name] as z.ZodType | undefined
  return field ? !field.safeParse(undefined).success : false
}

export function useRequiredField(name: string, required?: boolean) {
  const schema = useContext(FormSchemaContext)
  const requiredFields = useContext(RequiredFieldsContext)
  return required ?? requiredFields[name] ?? isSchemaFieldRequired(schema, name)
}

export function FormFieldLabel({
  name,
  required,
  showRequiredIndicator = true,
  children,
  ...props
}: {
  name: string
  required?: boolean
  showRequiredIndicator?: boolean
} & React.ComponentProps<typeof FieldLabel>) {
  const isRequired = useRequiredField(name, required)
  return (
    <FieldLabel {...props}>
      {children}
      {isRequired && showRequiredIndicator && (
        <>
          <span aria-hidden='true' className='text-destructive'>
            *
          </span>
          <span className='sr-only'> (obrigatório)</span>
        </>
      )}
    </FieldLabel>
  )
}
