'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { signIn } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import { Link } from '@/i18n/navigation'
import { Loader2 } from 'lucide-react'

const schema = z.object({
  name: z.string().min(1, '請輸入姓名').max(100),
  email: z.string().email('請輸入有效的 Email'),
  password: z.string().min(8, '密碼至少 8 個字元'),
})

type FormData = z.infer<typeof schema>

export function RegisterForm() {
  const t = useTranslations('auth')
  const router = useRouter()
  const [serverError, setServerError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    setServerError('')
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!res.ok) {
      const json = await res.json()
      setServerError(json.error === 'Email already registered' ? '此 Email 已被註冊' : '註冊失敗，請稍後再試')
      return
    }

    const result = await signIn('credentials', {
      email: data.email,
      password: data.password,
      redirect: false,
    })
    if (result?.error) {
      router.push('/login')
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium mb-1.5">
          {t('name')}
        </label>
        <input
          id="name"
          type="text"
          autoComplete="name"
          {...register('name')}
          aria-invalid={!!errors.name}
          className="w-full border rounded-md px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary aria-[invalid=true]:border-destructive"
        />
        {errors.name && (
          <p role="alert" className="text-xs text-destructive mt-1">
            {errors.name.message}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-1.5">
          {t('email')}
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          {...register('email')}
          aria-invalid={!!errors.email}
          className="w-full border rounded-md px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary aria-[invalid=true]:border-destructive"
        />
        {errors.email && (
          <p role="alert" className="text-xs text-destructive mt-1">
            {errors.email.message}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium mb-1.5">
          {t('password')}
        </label>
        <input
          id="password"
          type="password"
          autoComplete="new-password"
          {...register('password')}
          aria-invalid={!!errors.password}
          className="w-full border rounded-md px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary aria-[invalid=true]:border-destructive"
        />
        {errors.password && (
          <p role="alert" className="text-xs text-destructive mt-1">
            {errors.password.message}
          </p>
        )}
      </div>

      {serverError && (
        <p role="alert" className="text-sm text-destructive">
          {serverError}
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-primary text-primary-foreground rounded-md py-2.5 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-primary outline-none"
      >
        {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
        {t('register')}
      </button>

      <p className="text-center text-sm text-muted-foreground">
        {t('hasAccount')}{' '}
        <Link href="/login" className="text-primary hover:underline">
          {t('login')}
        </Link>
      </p>
    </form>
  )
}
