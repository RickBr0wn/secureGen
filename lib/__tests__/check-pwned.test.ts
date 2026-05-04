import { describe, it, expect, vi, beforeEach } from 'vitest'
import { checkPwned } from '../check-pwned'

// SHA-1('password') = 5BAA61E4C9B93F3F0682250B6CF8331B7EE68FD8
const SHA1_OF_PASSWORD = '5BAA61E4C9B93F3F0682250B6CF8331B7EE68FD8'
const PREFIX = SHA1_OF_PASSWORD.slice(0, 5)   // '5BAA6'
const SUFFIX = SHA1_OF_PASSWORD.slice(5)       // '1E4C9B93F3F0682250B6CF8331B7EE68FD8'

function mockDigest(hexResult: string) {
  const bytes = hexResult.match(/.{2}/g)!.map(h => parseInt(h, 16))
  vi.spyOn(crypto.subtle, 'digest').mockResolvedValue(new Uint8Array(bytes).buffer)
}

beforeEach(() => {
  vi.restoreAllMocks()
})

describe('checkPwned', () => {
  it('returns breach count when suffix is found in response', async () => {
    mockDigest(SHA1_OF_PASSWORD)
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      text: async () => `${SUFFIX}:3730471\r\nDEADBEEFDEADBEEFDEADBEEFDEADBEEFDEADBEEF:1`,
    }))

    const count = await checkPwned('password')
    expect(count).toBe(3730471)
  })

  it('returns 0 when suffix is not found', async () => {
    mockDigest(SHA1_OF_PASSWORD)
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      text: async () => `DEADBEEFDEADBEEFDEADBEEFDEADBEEFDEADBEEF:1\r\nAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA:2`,
    }))

    const count = await checkPwned('password')
    expect(count).toBe(0)
  })

  it('throws when the API returns a non-OK response', async () => {
    mockDigest(SHA1_OF_PASSWORD)
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
    }))

    await expect(checkPwned('password')).rejects.toThrow('HIBP API unavailable')
  })

  it('sends only the first 5 chars of the hash as the range prefix', async () => {
    mockDigest(SHA1_OF_PASSWORD)
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, text: async () => '' })
    vi.stubGlobal('fetch', fetchMock)

    await checkPwned('password')

    const url: string = fetchMock.mock.calls[0][0]
    expect(url).toContain(PREFIX)
    expect(url).not.toContain(SUFFIX)
  })
})
