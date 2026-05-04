import { describe, it, expect } from 'vitest'
import generatePassword from '../generate-password'

describe('generatePassword', () => {
  describe('return shape', () => {
    it('returns a tuple of [string, number, string]', () => {
      const [password, score, feedback] = generatePassword(16, true, true, true)
      expect(typeof password).toBe('string')
      expect(typeof score).toBe('number')
      expect(typeof feedback).toBe('string')
    })

    it('returns a zxcvbn score between 0 and 4', () => {
      for (let i = 0; i < 10; i++) {
        const [, score] = generatePassword(16, true, true, true)
        expect(score).toBeGreaterThanOrEqual(0)
        expect(score).toBeLessThanOrEqual(4)
      }
    })

    it('returns non-empty feedback string', () => {
      const [, , feedback] = generatePassword(16, true, true, true)
      expect(feedback.length).toBeGreaterThan(0)
    })
  })

  describe('password length', () => {
    it('generates password of exact requested length', () => {
      expect(generatePassword(8, false, false, false)[0]).toHaveLength(8)
      expect(generatePassword(16, true, true, true)[0]).toHaveLength(16)
      expect(generatePassword(32, true, true, true)[0]).toHaveLength(32)
    })
  })

  describe('character sets', () => {
    const specials = '!@#$%^&*()_+-=[]{}|;:,.<>?'
    const capitals = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    const numerics = '0123456789'

    const hasCharsFrom = (password: string, charset: string) =>
      password.split('').some(c => charset.includes(c))

    it('includes only lowercase when all options disabled', () => {
      // Run several times to reduce false-negative probability
      for (let i = 0; i < 20; i++) {
        const [pwd] = generatePassword(32, false, false, false)
        expect(hasCharsFrom(pwd, specials)).toBe(false)
        expect(hasCharsFrom(pwd, capitals)).toBe(false)
        expect(hasCharsFrom(pwd, numerics)).toBe(false)
        expect(/^[a-z]+$/.test(pwd)).toBe(true)
      }
    })

    it('can include special characters', () => {
      let found = false
      for (let i = 0; i < 50; i++) {
        const [pwd] = generatePassword(32, true, false, false)
        if (hasCharsFrom(pwd, specials)) { found = true; break }
      }
      expect(found).toBe(true)
    })

    it('can include capital letters', () => {
      let found = false
      for (let i = 0; i < 50; i++) {
        const [pwd] = generatePassword(32, false, true, false)
        if (hasCharsFrom(pwd, capitals)) { found = true; break }
      }
      expect(found).toBe(true)
    })

    it('can include numbers', () => {
      let found = false
      for (let i = 0; i < 50; i++) {
        const [pwd] = generatePassword(32, false, false, true)
        if (hasCharsFrom(pwd, numerics)) { found = true; break }
      }
      expect(found).toBe(true)
    })
  })

  describe('excludeAmbiguous', () => {
    const ambiguous = '0O1lI'

    it('removes ambiguous characters from output', () => {
      for (let i = 0; i < 30; i++) {
        const [pwd] = generatePassword(32, true, true, true, true)
        expect(pwd.split('').some(c => ambiguous.includes(c))).toBe(false)
      }
    })

    it('does not remove ambiguous chars when flag is false', () => {
      let foundAmbiguous = false
      for (let i = 0; i < 100; i++) {
        const [pwd] = generatePassword(32, false, true, true, false)
        if (pwd.split('').some(c => ambiguous.includes(c))) {
          foundAmbiguous = true
          break
        }
      }
      expect(foundAmbiguous).toBe(true)
    })
  })

  describe('randomness', () => {
    it('produces different passwords on successive calls', () => {
      const passwords = new Set(
        Array.from({ length: 10 }, () => generatePassword(16, true, true, true)[0])
      )
      expect(passwords.size).toBeGreaterThan(1)
    })
  })
})
