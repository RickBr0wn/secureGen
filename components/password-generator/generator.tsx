'use client'

import { Button } from '../ui/button'
import { Checkbox } from '../ui/checkbox'
import { SubmitHandler, useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '../ui/dropdown-menu'

const PasswordOptionsSchema = z.object({
  mode: z.enum(['password', 'passphrase']).default('password'),
  length: z.number().array(),
  specials: z.boolean(),
  capitals: z.boolean(),
  numbers: z.boolean(),
  excludeAmbiguous: z.boolean(),
  wordCount: z.number().array(),
  separator: z.string(),
  capitalize: z.boolean(),
  addNumbers: z.boolean(),
})

type PasswordOptions = z.infer<typeof PasswordOptionsSchema>

export default function PasswordGenerator() {
  const [password, setPassword] = useState<[string, number, string]>(
    generatePassword(16, true, true, true)
  )
  const [mode, setMode] = useState<'password' | 'passphrase'>('password')

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

  // Keyboard shortcut: Ctrl/Cmd+G to generate
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'g') {
        e.preventDefault()
        form.handleSubmit(onSubmit)()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [form])

  const onSubmit: SubmitHandler<PasswordOptions> = async (data) => {
    const newPassword =
      mode === 'password'
        ? generatePassword(
            data.length[0],
            data.specials,
            data.capitals,
            data.numbers,
            data.excludeAmbiguous
          )
        : generatePassphrase(data.wordCount[0], data.separator, data.capitalize, data.addNumbers)

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
        description: 'Could not access clipboard. Please copy the password manually.',
        variant: 'destructive',
      })
    }
  }

  const handleModeChange = (newMode: 'password' | 'passphrase') => {
    setMode(newMode)
    form.setValue('mode', newMode)
  }

  const scoreToPercentage = (score: number) => (score + 1) * 20
  const scoreToColor = (score: number) => {
    const colors = ['bg-red-500', 'bg-red-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500']
    return colors[score] || 'bg-red-500'
  }

  return (
    <div className="text-center">
      <div>
        <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">
          SecureGen 🔐
        </h1>
        <p className="text-slate-500 mt-2">
          Cryptographically secure passwords and passphrases
        </p>
      </div>

      {/* Mode Toggle */}
      <div className="my-6 flex justify-center gap-2">
        <Button
          type="button"
          variant={mode === 'password' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleModeChange('password')}
        >
          Password
        </Button>
        <Button
          type="button"
          variant={mode === 'passphrase' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleModeChange('passphrase')}
        >
          Passphrase
        </Button>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          {/* Password Display */}
          <div className="my-10 w-fit mx-auto">
            <p className="scroll-m-20 xs:text-lg sm:text-2xl font-extrabold tracking-tight">
              {password[0]}
            </p>
          </div>

          {/* Strength Meter */}
          <div className="my-6 w-full max-w-sm mx-auto">
            <div className="flex items-center gap-2 mb-2">
              <Progress value={scoreToPercentage(password[1])} className="flex-1" />
              <span className="text-xs font-medium text-slate-500">
                {['Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'][password[1]]}
              </span>
            </div>
            {password[2] && (
              <p className="text-xs text-slate-600 dark:text-slate-400 text-left">{password[2]}</p>
            )}
          </div>

          {/* Password Mode Controls */}
          {mode === 'password' && (
            <>
              <FormField
                control={form.control}
                name="length"
                render={({ field }) => (
                  <FormItem className="my-6">
                    <FormLabel className="text-left block">Length: {field.value?.[0] || 16}</FormLabel>
                    <FormControl>
                      <Slider
                        max={32}
                        min={8}
                        step={1}
                        onValueChange={field.onChange}
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="flex gap-6 items-center mb-6 justify-center">
                <FormField
                  control={form.control}
                  name="specials"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <FormLabel className="ml-2">Specials</FormLabel>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="capitals"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <FormLabel className="ml-2">Capitals</FormLabel>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="numbers"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <FormLabel className="ml-2">Numbers</FormLabel>
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="excludeAmbiguous"
                render={({ field }) => (
                  <FormItem className="mb-6 flex items-center justify-center gap-2">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="m-0">Exclude ambiguous (0/O, 1/l/I)</FormLabel>
                  </FormItem>
                )}
              />
            </>
          )}

          {/* Passphrase Mode Controls */}
          {mode === 'passphrase' && (
            <>
              <FormField
                control={form.control}
                name="wordCount"
                render={({ field }) => (
                  <FormItem className="my-6">
                    <FormLabel className="text-left block">Words: {field.value?.[0] || 4}</FormLabel>
                    <FormControl>
                      <Slider
                        max={10}
                        min={3}
                        step={1}
                        onValueChange={field.onChange}
                        {...field}
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
                        <SelectItem value="">None</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <div className="flex gap-6 items-center mb-6 justify-center">
                <FormField
                  control={form.control}
                  name="capitalize"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <FormLabel className="ml-2">Capitalize</FormLabel>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="addNumbers"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <FormLabel className="ml-2">Add numbers</FormLabel>
                    </FormItem>
                  )}
                />
              </div>
            </>
          )}

          <Button type="submit" className="w-full">
            GENERATE NEW {mode === 'password' ? 'PASSWORD' : 'PASSPHRASE'}
          </Button>

          <p className="text-xs text-slate-500 mt-4">💡 Tip: Press Ctrl+G (or Cmd+G) to generate</p>
        </form>
      </Form>
    </div>
  )
}
