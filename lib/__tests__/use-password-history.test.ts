import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { usePasswordHistory } from '../use-password-history'

beforeEach(() => {
  localStorage.clear()
})

describe('usePasswordHistory', () => {
  describe('initial state', () => {
    it('is disabled by default', async () => {
      const { result } = renderHook(() => usePasswordHistory())
      await act(async () => {})
      expect(result.current.enabled).toBe(false)
    })

    it('starts with empty history', async () => {
      const { result } = renderHook(() => usePasswordHistory())
      await act(async () => {})
      expect(result.current.history).toHaveLength(0)
    })

    it('hydrates enabled state from localStorage', async () => {
      localStorage.setItem('securegen-history-enabled', 'true')
      const { result } = renderHook(() => usePasswordHistory())
      await act(async () => {})
      expect(result.current.enabled).toBe(true)
    })

    it('hydrates history from localStorage', async () => {
      const stored = [{ id: '1', text: 'abc123', timestamp: 1000 }]
      localStorage.setItem('securegen-history', JSON.stringify(stored))
      const { result } = renderHook(() => usePasswordHistory())
      await act(async () => {})
      expect(result.current.history).toHaveLength(1)
      expect(result.current.history[0].text).toBe('abc123')
    })
  })

  describe('toggle', () => {
    it('enables history', async () => {
      const { result } = renderHook(() => usePasswordHistory())
      await act(async () => {})
      act(() => result.current.toggle())
      expect(result.current.enabled).toBe(true)
      expect(localStorage.getItem('securegen-history-enabled')).toBe('true')
    })

    it('disables history', async () => {
      localStorage.setItem('securegen-history-enabled', 'true')
      const { result } = renderHook(() => usePasswordHistory())
      await act(async () => {})
      act(() => result.current.toggle())
      expect(result.current.enabled).toBe(false)
      expect(localStorage.getItem('securegen-history-enabled')).toBe('false')
    })
  })

  describe('add', () => {
    it('does nothing when history is disabled', async () => {
      const { result } = renderHook(() => usePasswordHistory())
      await act(async () => {})
      act(() => result.current.add('secret123'))
      expect(result.current.history).toHaveLength(0)
    })

    it('adds an entry when enabled', async () => {
      localStorage.setItem('securegen-history-enabled', 'true')
      const { result } = renderHook(() => usePasswordHistory())
      await act(async () => {})
      act(() => result.current.add('secret123'))
      expect(result.current.history).toHaveLength(1)
      expect(result.current.history[0].text).toBe('secret123')
    })

    it('prepends new entries (most recent first)', async () => {
      localStorage.setItem('securegen-history-enabled', 'true')
      const { result } = renderHook(() => usePasswordHistory())
      await act(async () => {})
      act(() => result.current.add('first'))
      act(() => result.current.add('second'))
      expect(result.current.history[0].text).toBe('second')
      expect(result.current.history[1].text).toBe('first')
    })

    it('caps history at 10 entries', async () => {
      localStorage.setItem('securegen-history-enabled', 'true')
      const { result } = renderHook(() => usePasswordHistory())
      await act(async () => {})
      for (let i = 0; i < 12; i++) {
        act(() => result.current.add(`password-${i}`))
      }
      expect(result.current.history).toHaveLength(10)
    })

    it('persists entry to localStorage', async () => {
      localStorage.setItem('securegen-history-enabled', 'true')
      const { result } = renderHook(() => usePasswordHistory())
      await act(async () => {})
      act(() => result.current.add('secret123'))
      const stored = JSON.parse(localStorage.getItem('securegen-history') ?? '[]')
      expect(stored[0].text).toBe('secret123')
    })

    it('each entry has id and timestamp', async () => {
      localStorage.setItem('securegen-history-enabled', 'true')
      const { result } = renderHook(() => usePasswordHistory())
      await act(async () => {})
      act(() => result.current.add('secret123'))
      const entry = result.current.history[0]
      expect(entry.id).toBeTruthy()
      expect(entry.timestamp).toBeGreaterThan(0)
    })
  })

  describe('clear', () => {
    it('removes all entries', async () => {
      localStorage.setItem('securegen-history-enabled', 'true')
      const { result } = renderHook(() => usePasswordHistory())
      await act(async () => {})
      act(() => result.current.add('a'))
      act(() => result.current.add('b'))
      act(() => result.current.clear())
      expect(result.current.history).toHaveLength(0)
    })

    it('removes history from localStorage', async () => {
      localStorage.setItem('securegen-history-enabled', 'true')
      const { result } = renderHook(() => usePasswordHistory())
      await act(async () => {})
      act(() => result.current.add('a'))
      act(() => result.current.clear())
      expect(localStorage.getItem('securegen-history')).toBeNull()
    })
  })
})
