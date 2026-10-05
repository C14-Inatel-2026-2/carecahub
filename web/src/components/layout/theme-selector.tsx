import { Monitor, Moon, Palette, Sun } from 'lucide-react'
import { useTheme } from '@/components/theme-provider'
import {
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu'

const themeOptions = [
  { value: 'system', label: 'Tema do sistema', icon: Monitor },
  { value: 'light', label: 'Tema claro', icon: Sun },
  { value: 'dark', label: 'Tema escuro', icon: Moon },
] as const

export function ThemeSelector() {
  const { theme, setTheme } = useTheme()

  return (
    <DropdownMenuGroup className='flex items-center justify-between gap-2 px-2.5 py-2'>
      <DropdownMenuLabel className='flex items-center gap-2.5 p-0 text-sm font-normal text-foreground'>
        <Palette className='size-4 text-muted-foreground' aria-hidden='true' />
        Tema
      </DropdownMenuLabel>
      <DropdownMenuRadioGroup
        aria-label='Tema'
        value={theme}
        onValueChange={setTheme}
        className='flex shrink-0 items-center gap-0.5 rounded-md bg-muted p-0.5'
      >
        {themeOptions.map(({ value, label, icon: Icon }) => (
          <DropdownMenuRadioItem
            key={value}
            value={value}
            aria-label={label}
            title={label}
            closeOnClick={false}
            className='size-7 justify-center rounded-sm p-0 text-muted-foreground data-checked:bg-highlight-soft data-checked:text-highlight-soft-foreground data-checked:shadow-sm focus-visible:ring-2 focus-visible:ring-ring [&_[data-slot=dropdown-menu-radio-item-indicator]]:hidden'
          >
            <Icon className='size-3.5' aria-hidden='true' />
            <span className='sr-only'>{label}</span>
          </DropdownMenuRadioItem>
        ))}
      </DropdownMenuRadioGroup>
    </DropdownMenuGroup>
  )
}
