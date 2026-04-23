'use client'

interface StepIndicatorProps {
  steps: string[]
  current: number
}

export function StepIndicator({ steps, current }: StepIndicatorProps) {
  return (
    <div className="flex items-center gap-2 mb-6">
      {steps.map((label, i) => (
        <div key={label} className="flex items-center gap-2">
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium ${
              i < current
                ? 'bg-primary text-primary-foreground'
                : i === current
                  ? 'border-2 border-primary text-primary'
                  : 'border-2 border-muted text-muted-foreground'
            }`}
          >
            {i + 1}
          </div>
          <span
            className={`text-sm hidden sm:block ${
              i === current ? 'font-medium' : 'text-muted-foreground'
            }`}
          >
            {label}
          </span>
          {i < steps.length - 1 && (
            <div className="w-8 h-px bg-muted mx-1" />
          )}
        </div>
      ))}
    </div>
  )
}
