import { Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import { Input } from '@/components/ui/input'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group'

export function PasswordInput({
  className,
  type: _type,
  disabled,
  showToggle = true,
  ...props
}: React.ComponentProps<typeof Input> & { showToggle?: boolean }) {
  const [visible, setVisible] = useState(false)

  if (!showToggle) {
    return <Input {...props} className={className} disabled={disabled} type='password' />
  }

  return (
    <InputGroup className={className}>
      <InputGroupInput {...props} disabled={disabled} type={visible ? 'text' : 'password'} />
      <InputGroupAddon align='inline-end'>
        <InputGroupButton
          type='button'
          variant='ghost'
          size='icon-sm'
          className='text-muted-foreground'
          aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
          aria-pressed={visible}
          aria-controls={props.id}
          disabled={disabled}
          onClick={() => setVisible((value) => !value)}
        >
          {visible ? <EyeOff aria-hidden='true' /> : <Eye aria-hidden='true' />}
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  )
}
