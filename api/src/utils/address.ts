export function formatAddress(address: {
  street?: string | null
  number: string
  district?: string | null
  city?: string | null
  state?: string | null
}): string | undefined {
  if (!address.street || !address.city || !address.state) {
    return undefined
  }

  return `${address.street}, ${address.number}${
    address.district ? `, ${address.district}` : ''
  } - ${address.city}/${address.state}`
}
