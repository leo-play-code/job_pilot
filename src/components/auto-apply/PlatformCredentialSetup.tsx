'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Shield, CheckCircle2, AlertCircle, Eye, EyeOff, X, Loader2 } from 'lucide-react'

const schema = z.object({
  email: z.string().email('請輸入有效的 Email'),
  password: z.string().min(1, '請輸入密碼'),
})
type FormValues = z.infer<typeof schema>

interface Props {
  exists: boolean
  onSaved: () => void
}

export function PlatformCredentialSetup({ exists, onSaved }: Props) {
  const [open, setOpen] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormValues) => {
    const res = await fetch('/api/user/platform-credentials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ platform: 'JOB_104', ...data }),
    })
    if (!res.ok) {
      toast.error('儲存失敗，請稍後再試')
      return
    }
    toast.success('104 帳號已儲存')
    reset()
    setOpen(false)
    onSaved()
  }

  return (
    <div className="rounded-lg border bg-card p-5">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-medium flex items-center gap-2 text-sm">
            <Shield className="h-4 w-4 text-muted-foreground" />
            104 求職帳號
          </h3>
          <p className="text-xs text-muted-foreground mt-1">系統需要您的 104 帳號以自動投遞職缺</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-sm">
            {exists ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="text-green-600 text-xs">已設定</span>
              </>
            ) : (
              <>
                <AlertCircle className="h-4 w-4 text-amber-500" />
                <span className="text-muted-foreground text-xs">未設定</span>
              </>
            )}
          </div>

          <button
            onClick={() => setOpen(true)}
            className={`px-3 py-1.5 text-sm rounded-md font-medium transition-colors ${
              exists
                ? 'border hover:bg-muted'
                : 'bg-primary text-primary-foreground hover:opacity-90'
            }`}
          >
            {exists ? '更新帳號' : '設定帳號'}
          </button>
        </div>
      </div>

      {/* Dialog */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-background rounded-lg p-6 max-w-sm w-full mx-4 relative shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
            <h2 className="text-lg font-semibold mb-4">設定 104 帳號</h2>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="cred-email" className="text-sm font-medium">104 Email</label>
                <input
                  id="cred-email"
                  type="email"
                  placeholder="your@email.com"
                  className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  {...register('email')}
                />
                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="cred-password" className="text-sm font-medium">密碼</label>
                <div className="relative">
                  <input
                    id="cred-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 pr-10 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
              </div>

              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Shield className="h-3 w-3" />
                帳號以 AES-256 加密儲存，JobPilot 不會明文保存您的密碼
              </p>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-10 bg-primary text-primary-foreground rounded-md text-sm font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-60"
              >
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {isSubmitting ? '儲存中...' : '儲存'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
