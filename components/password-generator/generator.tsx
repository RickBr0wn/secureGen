'use client'

import { Button } from '../ui/button'
import { Checkbox } from '../ui/checkbox'
import { Control, SubmitHandler, useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '../ui/form'
import generatePassword from '~/lib/generate-password'
import generatePassphrase from '~/lib/generate-passphrase'

import { useState, useEffect } from 'react'
import { Slider } from '../ui/slider'
import { useToast } from '../ui/use-toast'
import { Progress } from '../ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select'

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

type BooleanFieldName = {
  [K in keyof PasswordOptions]: PasswordOptions[K] extends boolean ? K : never
}[keyof PasswordOptions]

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

const STRENGTH_LABELS = ['Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong']

export default function PasswordGenerator() {
  const [password, setPassword] = useState<[string, number, string]>(['', 0, ''])
  const [mounted, setMounted] = useState(false)

  const { toast } = useToast()

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
    setPassword(generatePassword(16, true, true, true))
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

  const onSubmit: SubmitHandler<PasswordOptions> = async data => {
    const newPassword =
      data.mode === 'password'
        ? generatePassword(
            data.length[0],
            data.specials,
            data.capitals,
            data.numbers,
            data.excludeAmbiguous,
          )
        : generatePassphrase(
            data.wordCount[0],
            data.separator === 'none' ? '' : data.separator,
            data.capitalize,
            data.addNumbers,
          )

    setPassword(newPassword)

    try {
      await navigator.clipboard.writeText(newPassword[0])
      toast({
        title: 'Copied to clipboard',
        description: 'Your new password has been copied to the clipboard.',
      })
    } catch {
      toast({
        title: 'Copy failed',
        description:
          'Could not access clipboard. Please copy the password manually.',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="text-center w-full max-w-md">
      <div>
        <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">
          SecureGen 🔐
        </h1>
        <p className="text-slate-500 mt-2">
          Cryptographically secure passwords and passphrases
        </p>
      </div>

      <div className="my-6 flex justify-center gap-2">
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

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          {mounted && (
            <div className="my-10 w-full min-h-[3.5rem] flex items-center justify-center">
              <p className="scroll-m-20 xs:text-lg sm:text-2xl font-extrabold tracking-tight break-all">
                {password[0]}
              </p>
            </div>
          )}

          {mounted && (
            <div className="my-6 w-full max-w-sm mx-auto">
              <div className="flex items-center gap-2 mb-2">
                <Progress
                  value={(password[1] + 1) * 20}
                  className="flex-1"
                />
                <span className="text-xs font-medium text-slate-500">
                  {STRENGTH_LABELS[password[1]]}
                </span>
              </div>
              {password[2] && (
                <p className="text-xs text-slate-600 dark:text-slate-400 text-left">
                  {password[2]}
                </p>
              )}
            </div>
          )}

          {mode === 'password' && (
            <>
              <FormField
                control={form.control}
                name="length"
                render={({ field }) => (
                  <FormItem className="my-6">
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

              <div className="flex gap-6 items-center mb-6 justify-center">
                <CheckboxField control={form.control} name="specials" label="Specials" />
                <CheckboxField control={form.control} name="capitals" label="Capitals" />
                <CheckboxField control={form.control} name="numbers" label="Numbers" />
              </div>

              <FormField
                control={form.control}
                name="excludeAmbiguous"
                render={({ field }) => (
                  <FormItem className="mb-6 flex items-center justify-center gap-2">
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
                  <FormItem className="my-6">
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
                  <FormItem className="mb-6">
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

              <div className="flex gap-6 items-center mb-6 justify-center">
                <CheckboxField control={form.control} name="capitalize" label="Capitalize" />
                <CheckboxField control={form.control} name="addNumbers" label="Add numbers" />
              </div>
            </>
          )}

          <Button type="submit" className="w-full">
            GENERATE NEW {mode === 'password' ? 'PASSWORD' : 'PASSPHRASE'}
          </Button>

          <p className="text-xs text-slate-500 mt-4">
            💡 Tip: Press Ctrl+G (or Cmd+G) to generate
          </p>
        </form>
      </Form>
    </div>
  )
}
