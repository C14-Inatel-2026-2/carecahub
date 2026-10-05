import { renderToStaticMarkup } from 'react-dom/server'
import { FormProvider, useForm } from 'react-hook-form'
import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import {
  FormSchemaProvider,
  isSchemaFieldRequired,
} from '../src/components/form-fields/form-schema'
import { InputFF, NumberFF, TextAreaFF } from '../src/components/form-fields/input-ff'
import { LabeledInput } from '../src/components/form-fields/labeled-input'
import { getProjectRequiredFields, projectFormSchema } from '../src/types/project'
import { createUserSchema, isRegistrationRequired, updateUserSchema } from '../src/types/user'

describe('schema required fields', () => {
  it('derives required and optional fields through transformed schemas', () => {
    expect(isSchemaFieldRequired(createUserSchema, 'name')).toBe(true)
    expect(isSchemaFieldRequired(createUserSchema, 'password')).toBe(true)
    expect(isSchemaFieldRequired(updateUserSchema, 'password')).toBe(false)
    expect(isSchemaFieldRequired(createUserSchema, 'githubName')).toBe(false)
    expect(isSchemaFieldRequired(z.object({ value: z.string().default('default') }), 'value')).toBe(
      false
    )
  })

  it('uses the same conditional requirements as domain validation', () => {
    expect(isRegistrationRequired('mentor')).toBe(true)
    expect(isRegistrationRequired('student')).toBe(true)
    expect(isRegistrationRequired('admin')).toBe(false)
    expect(
      getProjectRequiredFields({
        usesOtherTechnology: true,
        dependencyManager: 'other',
        versionControl: 'git',
      })
    ).toEqual({
      technologies: false,
      otherTechnology: true,
      otherDependencyManager: true,
      otherVersionControl: false,
    })
    expect(isSchemaFieldRequired(projectFormSchema, 'dependencyManager')).toBe(true)
  })

  it('renders required labels and associates errors with the input', () => {
    const html = renderToStaticMarkup(
      <FormSchemaProvider schema={z.object({ email: z.email() })}>
        <LabeledInput name='email' label='E-mail' id='email' error='Informe um e-mail válido.' />
      </FormSchemaProvider>
    )
    expect(html).toContain('text-destructive')
    expect(html).toContain('(obrigatório)')
    expect(html).toContain('for="email"')
    expect(html).toContain('required=""')
    expect(html).toContain('aria-invalid="true"')
    expect(html).toContain('aria-describedby="email-error"')
    expect(html).toContain('id="email-error"')
    expect(html).toContain('role="alert"')
  })

  it('keeps optional fields free of required markers and error state', () => {
    const html = renderToStaticMarkup(
      <FormSchemaProvider schema={z.object({ nickname: z.string().optional() })}>
        <LabeledInput name='nickname' label='Apelido' value='Isa' readOnly />
      </FormSchemaProvider>
    )
    expect(html).not.toContain('(obrigatório)')
    expect(html).not.toContain('required=""')
    expect(html).not.toContain('role="alert"')
    expect(html).toContain('value="Isa"')
  })

  it('hides the required marker on login fields while retaining required semantics', () => {
    const html = renderToStaticMarkup(
      <FormSchemaProvider schema={z.object({ email: z.email() })}>
        <LabeledInput name='email' label='E-mail' showRequiredIndicator={false} />
      </FormSchemaProvider>
    )
    expect(html).not.toContain('(obrigatório)')
    expect(html).not.toContain('aria-hidden="true"')
    expect(html).toContain('required=""')
  })

  it('renders existing text, number and textarea fields with their values', () => {
    function Example() {
      const form = useForm({ defaultValues: { name: 'Isa', count: 2, description: 'Projeto' } })
      return (
        <FormSchemaProvider
          schema={z.object({ name: z.string(), count: z.number(), description: z.string() })}
        >
          <FormProvider {...form}>
            <InputFF name='name' label='Nome' />
            <NumberFF name='count' label='Quantidade' />
            <TextAreaFF name='description' label='Descrição' />
          </FormProvider>
        </FormSchemaProvider>
      )
    }
    const html = renderToStaticMarkup(<Example />)
    expect(html).toContain('value="Isa"')
    expect(html).toContain('value="2"')
    expect(html).toContain('Projeto</textarea>')
    expect(html.match(/\(obrigatório\)/g)).toHaveLength(3)
  })
})
