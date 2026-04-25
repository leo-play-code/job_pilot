'use client'

import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ButtonHTMLAttributes } from 'react'

interface LoadingButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean
  variant?: 'primary' | 'secondary' | 'destructive'
}

const variantStyles: Record<string, string> = {
  primary: 'bg-primary text-primary-foreground hover:opacity-90',
  secondary: 'border bg-background text-foreground hover:bg-muted',
  destructive: 'bg-destructive text-destructive-foreground hover:bg-red-600',
}

export function LoadingButton({
  children,
  isLoading = false,
  variant = 'primary',
  className,
  disabled,
  ...props
}: LoadingButtonProps) {
  return (
    <button
      {...props}
      disabled={isLoading || disabled}
      className={cn(
        'flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium',
        'transition-all hover:scale-105 active:scale-95',
        'focus-visible:ring-2 focus-visible:ring-primary outline-none',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100',
        variantStyles[variant],
        className,
      )}
    >
      {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  )
}
