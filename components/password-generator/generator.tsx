'use client'

import { useState, useEffect } from 'react'
import { Control, SubmitHandler, useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Copy, Check, Lock, LockOpen, Shield, ShieldCheck, ShieldAlert, Loader2 } from 'lucide-react'
import { Button } from '../ui/button'
import { Checkbox } from '../ui/checkbox'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '../ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select'
import { Slider } from '../ui/slider'
import { useToast } from '../ui/use-toast'
import generatePassword from '~/lib/generate-password'
import generatePassphrase from '~/lib/generate-passphrase'
import { compositionStats } from '~/lib/composition-stats'
import { checkPwned } from '~/lib/check-pwned'
import { usePasswordHistory } from '~/lib/use-password-history'
import { HistoryPanel } from './history-panel'

const BATCH_SIZE = 5
const STRENGTH_LABELS = ['Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong']
const STRENGTH_COLORS = [
  'bg-red-500',
  'bg-red-400',
  'bg-yellow-500',
  'bg-blue-500',
  'bg-green-500',
]

const PasswordOptionsSchema = z.object({
  mode: z.enum(['password', 'passphrase']).default('password'),
  length: z.array(z.number()),
  specials: z.boolean(),
  capitals: z.boolean(),
  numbers: z.boolean(),
  excludeAmbiguous: z.boolean(),
  wordCount: z.array(z.number()),
  separator: z.string(),
  capitalize: z.boolean(),
  addNumbers: z.boolean(),
})

type PasswordOptions = z.infer<typeof PasswordOptionsSchema>
type GenerateResult = [string, number, string]

type BatchEntry = { result: GenerateResult; pinned: boolean }

type BooleanFieldName = {
  [K in keyof PasswordOptions]: PasswordOptions[K] extends boolean ? K : never
}[keyof PasswordOptions]

const PRESETS = {
  password: [
    { label: 'Simple', values: { length: [12], specials: false, capitals: true, numbers: true, excludeAmbiguous: true } },
    { label: 'Strong', values: { length: [20], specials: true, capitals: true, numbers: true, excludeAmbiguous: false } },
    { label: 'Max', values: { length: [32], specials: true, capitals: true, numbers: true, excludeAmbiguous: false } },
  ],
  passphrase: [
    { label: '4 words', values: { wordCount: [4], separator: '-', capitalize: true, addNumbers: false } },
    { label: '6 words', values: { wordCount: [6], separator: '-', capitalize: true, addNumbers: false } },
    { label: 'With number', values: { wordCount: [4], separator: '-', capitalize: true, addNumbers: true } },
  ],
}

const DEFAULT_OPTIONS: PasswordOptions = {
  mode: 'password',
  length: [16],
  specials: true,
  capitals: true,
  numbers: true,
  excludeAmbiguous: false,
  wordCount: [4],
  separator: '-',
  capitalize: true,
  addNumbers: false,
}

function generateOne(data: PasswordOptions): GenerateResult {
  return data.mode === 'password'
    ? generatePassword(data.length[0], data.specials, data.capitals, data.numbers, data.excludeAmbiguous)
    : generatePassphrase(data.wordCount[0], data.separator === 'none' ? '' : data.separator, data.capitalize, data.addNumbers)
}

function regenerateBatch(data: PasswordOptions, current: BatchEntry[]): BatchEntry[] {
  return current.map(entry =>
    entry.pinned ? entry : { result: generateOne(data), pinned: false }
  )
}

function StrengthBar({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-2 mt-2">
      <div className="flex gap-0.5 flex-1">
        {Array.from({ length: 5 }, (_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors duration-300 ${i <= score ? STRENGTH_COLORS[score] : 'bg-muted'}`}
          />
        ))}
      </div>
      <span className="text-xs text-muted-foreground w-20 text-right shrink-0 tabular-nums">
        {STRENGTH_LABELS[score]}
      </span>
    </div>
  )
}

type PwnedState = 'idle' | 'checking' | { count: number } | 'error'

function BatchRow({ entry, index, onPin, onCopy }: {
  entry: BatchEntry
  index: number
  onPin: (i: number) => void
  onCopy: (text: string) => void
}) {
  const [text, score, crackTime] = entry.result
  const [copied, setCopied] = useState(false)
  const [pwnedState, setPwnedState] = useState<PwnedState>('idle')
  const { toast } = useToast()

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      onCopy(text)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast({
        title: 'Copy failed',
        description: 'Could not access clipboard. Please copy manually.',
        variant: 'destructive',
      })
    }
  }

  const handlePwnedCheck = async () => {
    if (pwnedState === 'checking') return
    setPwnedState('checking')
    try {
      const count = await checkPwned(text)
      setPwnedState({ count })
    } catch {
      setPwnedState('error')
    }
  }

  const pwnedIcon = () => {
    if (pwnedState === 'checking') return <Loader2 className="h-3.5 w-3.5 animate-spin" />
    if (pwnedState === 'error') return <ShieldAlert className="h-3.5 w-3.5 text-yellow-500" />
    if (typeof pwnedState === 'object') {
      return pwnedState.count > 0
        ? <ShieldAlert className="h-3.5 w-3.5 text-red-500" />
        : <ShieldCheck className="h-3.5 w-3.5 text-green-500" />
    }
    return <Shield className="h-3.5 w-3.5 text-muted-foreground" />
  }

  const pwnedLabel = () => {
    if (typeof pwnedState === 'object') {
      return pwnedState.count > 0
        ? `Found in ${pwnedState.count.toLocaleString()} breaches`
        : 'Not found in breaches'
    }
    return 'Check for breaches'
  }

  return (
    <div className={`rounded-lg border px-4 py-3 transition-all ${
      entry.pinned
        ? 'ring-1 ring-primary/50 bg-primary/5 border-primary/30'
        : 'bg-card hover:bg-accent/30'
    }`}>
      <div className="flex items-start gap-2">
        <span className="flex-1 font-mono text-sm break-all leading-relaxed pt-0.5">
          {text}
        </span>
        <div className="flex items-center gap-0.5 shrink-0">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onPin(index)}
            aria-label={entry.pinned ? 'Unpin' : 'Pin this password'}
            title={entry.pinned ? 'Unpin' : 'Pin'}
          >
            {entry.pinned
              ? <Lock className="h-3.5 w-3.5 text-primary" />
              : <LockOpen className="h-3.5 w-3.5 text-muted-foreground" />
            }
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={handlePwnedCheck}
            aria-label={pwnedLabel()}
            title={pwnedLabel()}
          >
            {pwnedIcon()}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={handleCopy}
            aria-label="Copy to clipboard"
          >
            {copied
              ? <Check className="h-3.5 w-3.5 text-green-500" />
              : <Copy className="h-3.5 w-3.5 text-muted-foreground" />
            }
          </Button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground mt-1 tabular-nums">
        {compositionStats(text)}
        {crackTime && (
          <span className="text-slate-400 dark:text-slate-500"> · {crackTime} to crack</span>
        )}
        {typeof pwnedState === 'object' && (
          <span className={pwnedState.count > 0 ? ' · text-red-500' : ' · text-green-600'}>
            {pwnedState.count > 0
              ? ` · ⚠ ${pwnedState.count.toLocaleString()} breaches`
              : ' · ✓ not breached'
            }
          </span>
        )}
      </p>

      <StrengthBar score={score} />
    </div>
  )
}

function CheckboxField({
  control,
  name,
  label,
}: {
  control: Control<PasswordOptions>
  name: BooleanFieldName
  label: string
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormControl>
            <Checkbox
              checked={field.value as boolean}
              onCheckedChange={field.onChange}
            />
          </FormControl>
          <FormLabel className="ml-2">{label}</FormLabel>
        </FormItem>
      )}
    />
  )
}

export default function PasswordGenerator() {
  const [batch, setBatch] = useState<BatchEntry[]>([])
  const [mounted, setMounted] = useState(false)
  const history = usePasswordHistory()

  const form = useForm<PasswordOptions>({
    resolver: zodResolver(PasswordOptionsSchema),
    defaultValues: DEFAULT_OPTIONS,
  })

  const mode = form.watch('mode')

  useEffect(() => {
    setBatch(Array.from({ length: BATCH_SIZE }, () => ({
      result: generateOne(DEFAULT_OPTIONS),
      pinned: false,
    })))
    setMounted(true)
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'g') {
        e.preventDefault()
        form.handleSubmit(onSubmit)()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onSubmit: SubmitHandler<PasswordOptions> = data => {
    setBatch(prev => regenerateBatch(data, prev))
  }

  const applyPreset = (values: Partial<PasswordOptions>) => {
    form.reset({ ...form.getValues(), ...values })
    form.handleSubmit(onSubmit)()
  }

  const togglePin = (index: number) => {
    setBatch(prev => prev.map((e, i) => i === index ? { ...e, pinned: !e.pinned } : e))
  }

  return (
    <div className="w-full max-w-lg">
      <div className="text-center mb-8">
        <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">
          SecureGen
        </h1>
        <p className="text-muted-foreground mt-2">
          Cryptographically secure passwords and passphrases
        </p>
      </div>

      <div className="flex justify-center gap-2 mb-4">
        <Button
          type="button"
          variant={mode === 'password' ? 'default' : 'outline'}
          size="sm"
          onClick={() => {
            form.setValue('mode', 'password')
            form.handleSubmit(onSubmit)()
          }}
        >
          Password
        </Button>
        <Button
          type="button"
          variant={mode === 'passphrase' ? 'default' : 'outline'}
          size="sm"
          onClick={() => {
            form.setValue('mode', 'passphrase')
            form.handleSubmit(onSubmit)()
          }}
        >
          Passphrase
        </Button>
      </div>

      <div className="flex justify-center gap-1.5 mb-6 flex-wrap">
        {PRESETS[mode].map(preset => (
          <Button
            key={preset.label}
            type="button"
            variant="outline"
            size="sm"
            className="h-7 px-3 text-xs rounded-full"
            onClick={() => applyPreset({ ...preset.values })}
          >
            {preset.label}
          </Button>
        ))}
      </div>

      {mounted && (
        <div className="space-y-2 mb-6" aria-live="polite" aria-label="Generated passwords">
          {batch.map((entry, i) => (
            <BatchRow
              key={i}
              entry={entry}
              index={i}
              onPin={togglePin}
              onCopy={history.add}
            />
          ))}
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {mode === 'password' && (
            <>
              <FormField
                control={form.control}
                name="length"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-left block">
                      Length: {field.value?.[0] || 16}
                    </FormLabel>
                    <FormControl>
                      <Slider
                        max={32}
                        min={8}
                        step={1}
                        defaultValue={field.value ?? [16]}
                        onValueChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="flex gap-6 items-center justify-center">
                <CheckboxField control={form.control} name="specials" label="Specials" />
                <CheckboxField control={form.control} name="capitals" label="Capitals" />
                <CheckboxField control={form.control} name="numbers" label="Numbers" />
              </div>

              <FormField
                control={form.control}
                name="excludeAmbiguous"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-center gap-2">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="m-0">
                      Exclude ambiguous (0/O, 1/l/I)
                    </FormLabel>
                  </FormItem>
                )}
              />
            </>
          )}

          {mode === 'passphrase' && (
            <>
              <FormField
                control={form.control}
                name="wordCount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-left block">
                      Words: {field.value?.[0] || 4}
                    </FormLabel>
                    <FormControl>
                      <Slider
                        max={10}
                        min={3}
                        step={1}
                        defaultValue={field.value ?? [4]}
                        onValueChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="separator"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Separator</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="-">Hyphen (-)</SelectItem>
                        <SelectItem value=".">Dot (.)</SelectItem>
                        <SelectItem value="_">Underscore (_)</SelectItem>
                        <SelectItem value=" ">Space ( )</SelectItem>
                        <SelectItem value="none">None</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <div className="flex gap-6 items-center justify-center">
                <CheckboxField control={form.control} name="capitalize" label="Capitalize" />
                <CheckboxField control={form.control} name="addNumbers" label="Add numbers" />
              </div>
            </>
          )}

          <Button type="submit" className="w-full">
            REGENERATE ALL
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            Press Ctrl+G (or Cmd+G) to regenerate · pin rows to keep them
          </p>
        </form>
      </Form>

      {history.hydrated && (
        <div className="mt-6 space-y-3">
          <label className="flex items-center gap-2 text-sm cursor-pointer w-fit mx-auto">
            <input
              type="checkbox"
              checked={history.enabled}
              onChange={history.toggle}
              className="rounded"
            />
            Save to history
          </label>
          {history.enabled && (
            <HistoryPanel entries={history.history} onClear={history.clear} />
          )}
        </div>
      )}
    </div>
  )
}
