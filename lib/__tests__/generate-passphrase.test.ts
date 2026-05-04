import { describe, it, expect } from 'vitest'
import generatePassphrase from '../generate-passphrase'

describe('generatePassphrase', () => {
  describe('return shape', () => {
    it('returns a tuple of [string, number, string]', () => {
      const [passphrase, score, feedback] = generatePassphrase(4, '-', false, false)
      expect(typeof passphrase).toBe('string')
      expect(typeof score).toBe('number')
      expect(typeof feedback).toBe('string')
    })

    it('returns a zxcvbn score between 0 and 4', () => {
      for (let i = 0; i < 10; i++) {
        const [, score] = generatePassphrase(4, '-', false, false)
        expect(score).toBeGreaterThanOrEqual(0)
        expect(score).toBeLessThanOrEqual(4)
      }
    })
  })

  describe('word count', () => {
    it('generates the requested number of words with hyphen separator', () => {
      for (let count = 3; count <= 6; count++) {
        const [passphrase] = generatePassphrase(count, '-', false, false)
        expect(passphrase.split('-')).toHaveLength(count)
      }
    })

    it('generates correct word count with dot separator', () => {
      const [passphrase] = generatePassphrase(4, '.', false, false)
      expect(passphrase.split('.')).toHaveLength(4)
    })

    it('generates correct word count with space separator', () => {
      const [passphrase] = generatePassphrase(3, ' ', false, false)
      expect(passphrase.split(' ')).toHaveLength(3)
    })
  })

  describe('separator', () => {
    it('joins words with hyphen', () => {
      const [passphrase] = generatePassphrase(3, '-', false, false)
      expect(passphrase).toContain('-')
    })

    it('joins words with underscore', () => {
      const [passphrase] = generatePassphrase(3, '_', false, false)
      expect(passphrase).toContain('_')
    })

    it('joins words with no separator (empty string)', () => {
      const [passphrase] = generatePassphrase(3, '', false, false)
      expect(passphrase).not.toContain('-')
      expect(passphrase).not.toContain('_')
      expect(passphrase).not.toContain('.')
      expect(passphrase).not.toContain(' ')
    })
  })

  describe('capitalization', () => {
    it('capitalizes first letter of each word when enabled', () => {
      for (let i = 0; i < 10; i++) {
        const [passphrase] = generatePassphrase(4, '-', true, false)
        const words = passphrase.split('-')
        words.forEach(word => {
          expect(word[0]).toBe(word[0].toUpperCase())
        })
      }
    })

    it('does not capitalize words when disabled', () => {
      for (let i = 0; i < 10; i++) {
        const [passphrase] = generatePassphrase(4, '-', false, false)
        const words = passphrase.split('-')
        words.forEach(word => {
          expect(word).toBe(word.toLowerCase())
        })
      }
    })
  })

  describe('addNumbers', () => {
    it('appends a number when addNumbers is true', () => {
      for (let i = 0; i < 10; i++) {
        const [passphrase] = generatePassphrase(4, '-', false, true)
        const parts = passphrase.split('-')
        const lastPart = parts[parts.length - 1]
        expect(/^\d+$/.test(lastPart)).toBe(true)
      }
    })

    it('does not append a number when addNumbers is false', () => {
      for (let i = 0; i < 10; i++) {
        const [passphrase] = generatePassphrase(4, '-', false, false)
        const parts = passphrase.split('-')
        parts.forEach(part => {
          expect(/^\d+$/.test(part)).toBe(false)
        })
      }
    })

    it('appended number is between 0 and 99', () => {
      for (let i = 0; i < 20; i++) {
        const [passphrase] = generatePassphrase(4, '-', false, true)
        const parts = passphrase.split('-')
        const num = parseInt(parts[parts.length - 1], 10)
        expect(num).toBeGreaterThanOrEqual(0)
        expect(num).toBeLessThanOrEqual(99)
      }
    })
  })

  describe('words source', () => {
    it('only uses words from words.json (no extra characters)', () => {
      for (let i = 0; i < 10; i++) {
        const [passphrase] = generatePassphrase(4, '-', false, false)
        const words = passphrase.split('-')
        words.forEach(word => {
          expect(/^[a-z]+$/.test(word)).toBe(true)
        })
      }
    })

    it('words come from all letters of the alphabet over many generations', () => {
      const firstLetters = new Set<string>()
      for (let i = 0; i < 200; i++) {
        const [passphrase] = generatePassphrase(4, '-', false, false)
        passphrase.split('-').forEach(word => firstLetters.add(word[0]))
      }
      // With 599 words spread across 25 letters and 200*4=800 samples, expect >15 unique letters
      expect(firstLetters.size).toBeGreaterThan(15)
    })
  })

  describe('randomness', () => {
    it('produces different passphrases on successive calls', () => {
      const passphrases = new Set(
        Array.from({ length: 10 }, () => generatePassphrase(4, '-', false, false)[0])
      )
      expect(passphrases.size).toBeGreaterThan(1)
    })
  })
})
