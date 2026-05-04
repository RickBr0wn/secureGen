import { describe, it, expect } from 'vitest'
import { compositionStats } from '../composition-stats'

describe('compositionStats', () => {
  it('returns empty string for empty input', () => {
    expect(compositionStats('')).toBe('')
  })

  it('shows only char count for lowercase-only password', () => {
    expect(compositionStats('abcdefgh')).toBe('8 chars')
  })

  it('counts symbols correctly', () => {
    expect(compositionStats('abc!@#')).toBe('6 chars · 3 symbols')
  })

  it('uses singular for one symbol', () => {
    expect(compositionStats('abc!')).toBe('4 chars · 1 symbol')
  })

  it('counts capitals correctly', () => {
    expect(compositionStats('abcABC')).toBe('6 chars · 3 capitals')
  })

  it('uses singular for one capital', () => {
    expect(compositionStats('abcA')).toBe('4 chars · 1 capital')
  })

  it('counts numbers correctly', () => {
    expect(compositionStats('abc123')).toBe('6 chars · 3 numbers')
  })

  it('uses singular for one number', () => {
    expect(compositionStats('abc1')).toBe('4 chars · 1 number')
  })

  it('shows all categories when all are present', () => {
    expect(compositionStats('aB1!')).toBe('4 chars · 1 symbol · 1 capital · 1 number')
  })

  it('orders parts as: chars · symbols · capitals · numbers', () => {
    const result = compositionStats('aaBB22!!')
    const parts = result.split(' · ')
    expect(parts[0]).toMatch(/chars/)
    expect(parts[1]).toMatch(/symbol/)
    expect(parts[2]).toMatch(/capital/)
    expect(parts[3]).toMatch(/number/)
  })

  it('handles a realistic password', () => {
    const result = compositionStats('Tr0ub4dor&3')
    expect(result).toMatch(/11 chars/)
    expect(result).toMatch(/symbol/)
    expect(result).toMatch(/capital/)
    expect(result).toMatch(/number/)
  })

  it('counts hyphen separators as symbols in passphrase', () => {
    expect(compositionStats('correct-horse-battery')).toBe('21 chars · 2 symbols')
  })

  it('counts capital letters in capitalized passphrase', () => {
    const result = compositionStats('Correct-Horse-Battery')
    expect(result).toMatch(/3 capitals/)
  })
})
