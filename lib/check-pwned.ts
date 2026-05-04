export async function checkPwned(password: string): Promise<number> {
  const encoder = new TextEncoder()
  const hashBuffer = await crypto.subtle.digest('SHA-1', encoder.encode(password))
  const hashHex = Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase()

  const prefix = hashHex.slice(0, 5)
  const suffix = hashHex.slice(5)

  const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
    headers: { 'Add-Padding': 'true' },
  })
  if (!res.ok) throw new Error('HIBP API unavailable')

  const text = await res.text()
  const match = text.split('\n').find(line => line.startsWith(suffix))
  return match ? parseInt(match.split(':')[1].trim(), 10) : 0
}
