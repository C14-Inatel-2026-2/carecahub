import { describe, expect, it } from 'vitest'
import { getFriendlyDate } from './utils'

const referenceDate = new Date(2026, 8, 29, 18, 0)

describe('getFriendlyDate', () => {
  it('formats a date from today with its time', () => {
    expect(
      getFriendlyDate(new Date(2026, 8, 29, 14, 30), 'dd/mm/yyyy - hh:mm', referenceDate)
    ).toBe('hoje às 14:30')
  })

  it('formats a date from yesterday with its time', () => {
    expect(getFriendlyDate(new Date(2026, 8, 28, 9, 5), 'dd/mm/yyyy - hh:mm', referenceDate)).toBe(
      'ontem às 09:05'
    )
  })

  it('formats an older date as elapsed calendar days', () => {
    expect(
      getFriendlyDate(new Date(2026, 8, 24, 22, 45), 'dd/mm/yyyy - hh:mm', referenceDate)
    ).toBe('há 5 dias')
  })
})
