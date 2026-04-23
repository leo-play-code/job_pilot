import type { ResumeContent, TemplateId } from '@/types/resume'

interface ResumeRendererProps {
  content: ResumeContent
  templateId: TemplateId
}

export function ResumeRenderer({ content, templateId }: ResumeRendererProps) {
  // TODO: render each template (modern, professional, creative)
  return (
    <div className="border rounded-lg p-8 bg-white text-black min-h-[1056px] w-[816px]">
      <h1 className="text-2xl font-bold">{content.personalInfo.name}</h1>
      <p className="text-sm text-gray-600">{content.personalInfo.email}</p>
      <pre className="text-xs mt-4 whitespace-pre-wrap">
        Template: {templateId} — full render coming soon
      </pre>
    </div>
  )
}
