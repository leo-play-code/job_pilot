'use client'

import type { PersonalInfo } from '@/types/resume'

interface PersonalInfoFormProps {
  data: PersonalInfo
  onChange: (data: PersonalInfo) => void
}

type Field = keyof PersonalInfo

const fields: { key: Field; label: string; type?: string; required?: boolean }[] = [
  { key: 'name', label: '姓名', required: true },
  { key: 'email', label: 'Email', type: 'email', required: true },
  { key: 'phone', label: '電話' },
  { key: 'location', label: '所在地' },
  { key: 'linkedin', label: 'LinkedIn URL' },
  { key: 'website', label: '個人網站 URL' },
]

export function PersonalInfoForm({ data, onChange }: PersonalInfoFormProps) {
  const update = (key: Field, value: string) => {
    onChange({ ...data, [key]: value })
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {fields.map(({ key, label, type = 'text', required }) => (
          <div key={key}>
            <label htmlFor={key} className="block text-sm font-medium mb-1.5">
              {label}
              {required && <span className="text-destructive ml-0.5">*</span>}
            </label>
            <input
              id={key}
              type={type}
              value={data[key] ?? ''}
              onChange={(e) => update(key, e.target.value)}
              className="w-full border rounded-md px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
          </div>
        ))}
      </div>
    </div>
  )
}
