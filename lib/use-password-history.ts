'use client'

import { useState, useEffect } from 'react'

const STORAGE_KEY = 'securegen-history'
const ENABLED_KEY = 'securegen-history-enabled'
const MAX_ENTRIES = 10

export interface HistoryEntry {
  id: string
  text: string
  timestamp: number
}

export function usePasswordHistory() {
  const [enabled, setEnabled] = useState(false)
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    try {
      setEnabled(localStorage.getItem(ENABLED_KEY) === 'true')
      setHistory(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]'))
    } catch {
      // localStorage unavailable (e.g. private browsing restrictions)
    }
    setHydrated(true)
  }, [])

  const toggle = () => {
    const next = !enabled
    setEnabled(next)
    try {
      localStorage.setItem(ENABLED_KEY, String(next))
    } catch {
      // ignore
    }
  }

  const add = (text: string) => {
    if (!enabled) return
    const entry: HistoryEntry = { id: String(Date.now()), text, timestamp: Date.now() }
    const next = [entry, ...history].slice(0, MAX_ENTRIES)
    setHistory(next)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch {
      // ignore
    }
  }

  const clear = () => {
    setHistory([])
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      // ignore
    }
  }

  return { enabled, toggle, history, add, clear, hydrated }
}
