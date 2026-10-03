import { Monitor, Moon, Sun } from 'lucide-react'
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
    <DropdownMenuGroup className='flex items-center justify-between gap-3 px-1.5 py-1'>
      <DropdownMenuLabel className='p-0 text-sm font-normal text-foreground'>
        Tema
      </DropdownMenuLabel>
      <DropdownMenuRadioGroup
        aria-label='Tema'
        value={theme}
        onValueChange={setTheme}
        className='flex shrink-0 items-center rounded-full border border-border p-0.5'
      >
        {themeOptions.map(({ value, label, icon: Icon }) => (
          <DropdownMenuRadioItem
            key={value}
            value={value}
            aria-label={label}
            title={label}
            closeOnClick={false}
            className='size-8 justify-center rounded-full p-0 text-muted-foreground data-checked:bg-accent data-checked:text-accent-foreground data-checked:ring-1 data-checked:ring-border [&_[data-slot=dropdown-menu-radio-item-indicator]]:hidden'
          >
            <Icon className='size-4' aria-hidden='true' />
            <span className='sr-only'>{label}</span>
          </DropdownMenuRadioItem>
        ))}
      </DropdownMenuRadioGroup>
    </DropdownMenuGroup>
  )
}
