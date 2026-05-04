'use client'

import { useState } from 'react'
import { Copy, Check, Eye, EyeOff, ChevronDown, ChevronUp, Trash2 } from 'lucide-react'
import { Button } from '../ui/button'
import { useToast } from '../ui/use-toast'
import type { HistoryEntry } from '~/lib/use-password-history'

function formatTimestamp(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

function HistoryRow({ entry }: { entry: HistoryEntry }) {
  const [revealed, setRevealed] = useState(false)
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  const masked = entry.text.slice(0, 4) + '•'.repeat(Math.max(0, entry.text.length - 4))

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(entry.text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast({ title: 'Copy failed', description: 'Please copy manually.', variant: 'destructive' })
    }
  }

  return (
    <div className="flex items-center gap-2 py-2 border-b last:border-0">
      <button
        type="button"
        onClick={() => setRevealed(r => !r)}
        className="flex-1 font-mono text-xs text-left break-all text-foreground hover:text-foreground/80 transition-colors"
        aria-label={revealed ? 'Hide password' : 'Reveal password'}
      >
        {revealed ? entry.text : masked}
      </button>
      <span className="text-xs text-muted-foreground shrink-0 tabular-nums">
        {formatTimestamp(entry.timestamp)}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-7 w-7 shrink-0"
        onClick={() => setRevealed(r => !r)}
        aria-label={revealed ? 'Hide' : 'Reveal'}
      >
        {revealed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-7 w-7 shrink-0"
        onClick={handleCopy}
        aria-label="Copy"
      >
        {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
      </Button>
    </div>
  )
}

interface HistoryPanelProps {
  entries: HistoryEntry[]
  onClear: () => void
}

export function HistoryPanel({ entries, onClear }: HistoryPanelProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        type="button"
        className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium hover:bg-accent/50 transition-colors"
        onClick={() => setOpen(o => !o)}
      >
        <span>History ({entries.length})</span>
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>

      {open && (
        <div className="px-4 pb-3">
          {entries.length === 0 ? (
            <p className="text-xs text-muted-foreground py-4 text-center">
              No history yet. Generate a password to start.
            </p>
          ) : (
            <>
              <div>
                {entries.map(entry => (
                  <HistoryRow key={entry.id} entry={entry} />
                ))}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="mt-3 w-full text-destructive hover:text-destructive"
                onClick={onClear}
              >
                <Trash2 className="h-3.5 w-3.5 mr-2" />
                Clear history
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
