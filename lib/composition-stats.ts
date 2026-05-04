const SPECIALS = /[!@#$%^&*()_+\-=[\]{}|;:,.<>?]/g
const CAPITALS = /[A-Z]/g
const NUMERICS = /[0-9]/g

export function compositionStats(password: string): string {
  if (!password) return ''

  const symbols = (password.match(SPECIALS) ?? []).length
  const caps = (password.match(CAPITALS) ?? []).length
  const nums = (password.match(NUMERICS) ?? []).length

  const parts: string[] = [`${password.length} chars`]
  if (symbols) parts.push(`${symbols} symbol${symbols === 1 ? '' : 's'}`)
  if (caps) parts.push(`${caps} capital${caps === 1 ? '' : 's'}`)
  if (nums) parts.push(`${nums} number${nums === 1 ? '' : 's'}`)

  return parts.join(' · ')
}
