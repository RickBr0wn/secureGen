import zxcvbn from 'zxcvbn'

export default function generatePassword(
  length: number,
  includeSpecialChars: boolean,
  includeCapitals: boolean,
  includeNumerics: boolean,
  excludeAmbiguous: boolean = false,
): [string, number, string] {
  const specials = '!@#$%^&*()_+-=[]{}|;:,.<>?'
  const capitals = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const numerics = '0123456789'
  const ambiguous = '0O1lI'

  let charset = 'abcdefghijklmnopqrstuvwxyz'

  if (includeSpecialChars) charset += specials
  if (includeCapitals) charset += capitals
  if (includeNumerics) charset += numerics

  if (excludeAmbiguous) {
    charset = charset
      .split('')
      .filter(c => !ambiguous.includes(c))
      .join('')
  }

  const randomBytes = crypto.getRandomValues(new Uint32Array(length))
  let password = ''
  for (let i = 0; i < length; i++) {
    password += charset[randomBytes[i] % charset.length]
  }

  const result = zxcvbn(password)
  const crackTime = String(result.crack_times_display.offline_slow_hashing_1e4_per_second)

  return [password, result.score, crackTime]
}
