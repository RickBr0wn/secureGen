export default function generatePassword(
  length: number,
  includeSpecialChars: boolean,
  includeCapitals: boolean,
  includeNumerics: boolean
): [string, string] {
  const specials = '!@#$%^&*()_+-=[]{}|;:,.<>?'
  const capitals = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const numerics = '0123456789'

  let charset = 'abcdefghijklmnopqrstuvwxyz'
  let password = ''

  if (includeSpecialChars) charset += specials
  if (includeCapitals) charset += capitals
  if (includeNumerics) charset += numerics

  const randomBytes = crypto.getRandomValues(new Uint32Array(length))
  for (let i = 0; i < length; i++) {
    password += charset[randomBytes[i] % charset.length]
  }

  const allOptions = includeSpecialChars && includeCapitals && includeNumerics
  const anyOption = includeSpecialChars || includeCapitals || includeNumerics

  let securityRating = 'very weak'
  if (length >= 8 && anyOption) securityRating = 'weak'
  if (length >= 12 && allOptions) securityRating = 'average'
  if (length >= 16 && allOptions) securityRating = 'good'
  if (length >= 20 && allOptions) securityRating = 'very good'

  return [password, securityRating]
}
