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

import { useState } from 'react'
import { Slider } from '../ui/slider'
import { useToast } from '../ui/use-toast'

const PasswordOptionsSchema = z.object({
  length: z.number().array(),
  specials: z.boolean(),
  capitals: z.boolean(),
  numbers: z.boolean(),
})

type PasswordOptions = z.infer<typeof PasswordOptionsSchema>

export default function PasswordGenerator() {
  const [password, setPassword] = useState<Array<string>>(
    generatePassword(32, true, true, true)
  )

  const { toast } = useToast()

  const form = useForm<PasswordOptions>({
    resolver: zodResolver(PasswordOptionsSchema),
    defaultValues: {
      length: [32],
      specials: true,
      capitals: true,
      numbers: true,
    },
  })

  const onSubmit: SubmitHandler<PasswordOptions> = async (
    data: z.infer<typeof PasswordOptionsSchema>
  ) => {
    const newPassword = generatePassword(
      data.length[0],
      data.specials,
      data.capitals,
      data.numbers
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
        description: 'Could not access clipboard. Please copy the password manually.',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="text-center">
      <div>
        <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">
          SecureGen 🔐
        </h1>
        <p className="text-slate-500 mt-2">
          Defend against cyber threats with passwords built for strength
        </p>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="my-10 w-fit mx-auto">
            <p
              className={`scroll-m-20 xs:text-lg sm:text-2xl font-extrabold tracking-tight ${
                password[0] === 'password' ? 'opacity-0' : 'opacity-1'
              }`}
            >
              {password[0]}
            </p>
            <p
              className={`${
                password[1] === 'strength'
                  ? 'text-transparent'
                  : password[1] === 'very good' || password[1] === 'good'
                  ? 'text-green-500'
                  : password[1] === 'average'
                  ? 'text-yellow-500'
                  : 'text-red-500'
              } text-xs sm:text-right`}
            >
              {password[1]}
            </p>
          </div>
          <FormField
            control={form.control}
            name="length"
            render={({ field }) => {
              return (
                <FormItem>
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
              )
            }}
          />
          <div className="flex gap-6 items-center mb-6 justify-center">
            <FormField
              control={form.control}
              name="specials"
              render={({ field }) => {
                return (
                  <FormItem>
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>{' '}
                    <FormLabel className="mr-2">Specials</FormLabel>
                    <FormMessage />
                  </FormItem>
                )
              }}
            />
            <FormField
              control={form.control}
              name="capitals"
              render={({ field }) => {
                return (
                  <FormItem>
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>{' '}
                    <FormLabel className="mr-2">Capitals</FormLabel>
                    <FormMessage />
                  </FormItem>
                )
              }}
            />
            <FormField
              control={form.control}
              name="numbers"
              render={({ field }) => {
                return (
                  <FormItem>
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>{' '}
                    <FormLabel className="mr-2">Numbers</FormLabel>
                    <FormMessage />
                  </FormItem>
                )
              }}
            />
          </div>
          <Button type="submit" className="w-full">
            GENERATE NEW PASSWORD
          </Button>
        </form>
      </Form>
    </div>
  )
}

