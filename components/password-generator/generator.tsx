'use client'

import { useState, useEffect } from 'react'
import { Control, SubmitHandler, useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Copy, Check } from 'lucide-react'
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

type BooleanFieldName = {
  [K in keyof PasswordOptions]: PasswordOptions[K] extends boolean ? K : never
}[keyof PasswordOptions]

function generateBatch(data: PasswordOptions): GenerateResult[] {
  return Array.from({ length: BATCH_SIZE }, () =>
    data.mode === 'password'
      ? generatePassword(data.length[0], data.specials, data.capitals, data.numbers, data.excludeAmbiguous)
      : generatePassphrase(data.wordCount[0], data.separator === 'none' ? '' : data.separator, data.capitalize, data.addNumbers)
  )
}

function StrengthDot({ score }: { score: number }) {
  return (
    <span
      className={`h-2 w-2 rounded-full shrink-0 ${STRENGTH_COLORS[score]}`}
      title={STRENGTH_LABELS[score]}
      aria-label={`Strength: ${STRENGTH_LABELS[score]}`}
    />
  )
}

function BatchRow({ text, score, onCopy }: { text: string; score: number; onCopy: (text: string) => void }) {
  const [copied, setCopied] = useState(false)
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

  return (
    <div className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3 text-left transition-colors hover:bg-accent/50">
      <div className="flex-1 min-w-0">
        <span className="font-mono text-sm break-all leading-relaxed">
          {text}
        </span>
        <p className="text-xs text-slate-400 dark:text-slate-500 tabular-nums mt-0.5">
          {compositionStats(text)}
        </p>
      </div>
      <StrengthDot score={score} />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0"
        onClick={handleCopy}
        aria-label="Copy to clipboard"
      >
        {copied
          ? <Check className="h-4 w-4 text-green-500" />
          : <Copy className="h-4 w-4 text-muted-foreground" />
        }
      </Button>
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
  const [batch, setBatch] = useState<GenerateResult[]>([])
  const [mounted, setMounted] = useState(false)
  const history = usePasswordHistory()

  const form = useForm<PasswordOptions>({
    resolver: zodResolver(PasswordOptionsSchema),
    defaultValues: {
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
    },
  })

  const mode = form.watch('mode')

  useEffect(() => {
    setBatch(generateBatch({
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
    }))
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
    setBatch(generateBatch(data))
  }

  return (
    <div className="w-full max-w-lg">
      <div className="text-center mb-8">
        <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">
          SecureGen 🔐
        </h1>
        <p className="text-slate-500 mt-2">
          Cryptographically secure passwords and passphrases
        </p>
      </div>

      <div className="flex justify-center gap-2 mb-6">
        <Button
          type="button"
          variant={mode === 'password' ? 'default' : 'outline'}
          size="sm"
          onClick={() => form.setValue('mode', 'password')}
        >
          Password
        </Button>
        <Button
          type="button"
          variant={mode === 'passphrase' ? 'default' : 'outline'}
          size="sm"
          onClick={() => form.setValue('mode', 'passphrase')}
        >
          Passphrase
        </Button>
      </div>

      {mounted && (
        <div className="space-y-2 mb-6" aria-live="polite" aria-label="Generated passwords">
          {batch.map(([text, score], i) => (
            <BatchRow key={i} text={text} score={score} onCopy={history.add} />
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

          <p className="text-xs text-slate-500 text-center">
            💡 Tip: Press Ctrl+G (or Cmd+G) to regenerate
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
