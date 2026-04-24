import type { ResumeContent } from '@/types/resume'

export const DEFAULT_SECTION_ORDER = ['summary', 'experience', 'education', 'skills', 'achievements']

interface ResumeRendererProps {
  content: ResumeContent
  templateId: string
  sectionOrder?: string[]
}

export function ResumeRenderer({ content, templateId, sectionOrder }: ResumeRendererProps) {
  if (templateId === 'professional') return <ProfessionalTemplate content={content} sectionOrder={sectionOrder} />
  if (templateId === 'creative') return <CreativeTemplate content={content} sectionOrder={sectionOrder} />
  return <ModernTemplate content={content} sectionOrder={sectionOrder} />
}

// ─── Modern ──────────────────────────────────────────────────────────────────

function ModernTemplate({ content, sectionOrder }: { content: ResumeContent; sectionOrder?: string[] }) {
  const { personalInfo: p, summary, experience, education, skills, achievements } = content
  const order = sectionOrder ?? DEFAULT_SECTION_ORDER

  const sections: Record<string, React.ReactNode> = {
    summary: summary ? (
      <Section key="summary" title="SUMMARY">
        <p className="text-gray-700">{summary}</p>
      </Section>
    ) : null,
    experience: experience.length > 0 ? (
      <Section key="experience" title="EXPERIENCE">
        {experience.map((exp, i) => (
          <div key={i} className="mb-4">
            <div className="flex justify-between items-baseline">
              <span className="font-semibold">{exp.company}</span>
              <span className="text-gray-400 text-xs">
                {exp.startDate} – {exp.current ? 'Present' : exp.endDate}
              </span>
            </div>
            <p className="text-gray-600 italic text-xs mb-1">{exp.title}</p>
            <ul className="list-disc list-inside space-y-0.5">
              {exp.bullets.map((b, j) => b && (
                <li key={j} className="text-gray-700">{b}</li>
              ))}
            </ul>
          </div>
        ))}
      </Section>
    ) : null,
    education: education.length > 0 ? (
      <Section key="education" title="EDUCATION">
        {education.map((edu, i) => (
          <div key={i} className="mb-3">
            <div className="flex justify-between items-baseline">
              <span className="font-semibold">{edu.school}</span>
              <span className="text-gray-400 text-xs">{edu.startDate} – {edu.endDate}</span>
            </div>
            <p className="text-gray-600 text-xs">
              {edu.degree}{edu.field ? `, ${edu.field}` : ''}
              {edu.gpa ? ` · GPA ${edu.gpa}` : ''}
            </p>
          </div>
        ))}
      </Section>
    ) : null,
    skills: skills.length > 0 ? (
      <Section key="skills" title="SKILLS">
        <div className="flex flex-wrap gap-x-2 gap-y-1">
          {skills.map((s, i) => (
            <span key={i} className="text-gray-700">{s}{i < skills.length - 1 ? ' ·' : ''}</span>
          ))}
        </div>
      </Section>
    ) : null,
    achievements: achievements && achievements.length > 0 ? (
      <Section key="achievements" title="ACHIEVEMENTS">
        <ul className="list-disc list-inside space-y-0.5">
          {achievements.map((a, i) => a && <li key={i} className="text-gray-700">{a}</li>)}
        </ul>
      </Section>
    ) : null,
  }

  return (
    <div className="bg-white text-gray-900 min-h-[1056px] w-[816px] p-12 font-sans text-sm leading-relaxed">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">{p.name}</h1>
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-gray-500 text-xs">
          {p.email && <span>{p.email}</span>}
          {p.phone && <span>{p.phone}</span>}
          {p.location && <span>{p.location}</span>}
          {p.linkedin && <span>{p.linkedin}</span>}
          {p.website && <span>{p.website}</span>}
        </div>
      </div>
      <hr className="border-gray-200 mb-6" />
      {order.map(id => sections[id] ?? null)}
    </div>
  )
}

// ─── Professional (2-column) ──────────────────────────────────────────────────

function ProfessionalTemplate({ content, sectionOrder }: { content: ResumeContent; sectionOrder?: string[] }) {
  const { personalInfo: p, summary, experience, education, skills, achievements } = content
  const mainOrder = (sectionOrder ?? DEFAULT_SECTION_ORDER).filter(
    s => !['skills', 'education'].includes(s)
  )

  return (
    <div className="bg-white text-gray-900 min-h-[1056px] w-[816px] font-sans text-sm leading-relaxed flex flex-col">
      <div className="bg-gray-900 text-white px-10 py-8">
        <h1 className="text-3xl font-bold">{p.name}</h1>
        <div className="flex flex-wrap gap-x-4 mt-2 text-gray-300 text-xs">
          {p.email && <span>{p.email}</span>}
          {p.phone && <span>{p.phone}</span>}
          {p.location && <span>{p.location}</span>}
          {p.linkedin && <span>{p.linkedin}</span>}
        </div>
      </div>

      <div className="flex flex-1">
        <div className="w-56 bg-gray-50 px-6 py-8 shrink-0 space-y-6">
          {skills.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Skills</h3>
              <ul className="space-y-1">
                {skills.map((s, i) => <li key={i} className="text-gray-700">{s}</li>)}
              </ul>
            </div>
          )}
          {education.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Education</h3>
              {education.map((edu, i) => (
                <div key={i} className="mb-3">
                  <p className="font-semibold text-xs leading-snug">{edu.school}</p>
                  <p className="text-gray-600 text-xs">{edu.degree}</p>
                  {edu.field && <p className="text-gray-500 text-xs">{edu.field}</p>}
                  <p className="text-gray-400 text-xs">{edu.startDate} – {edu.endDate}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 px-8 py-8 space-y-6">
          {mainOrder.map(id => {
            if (id === 'summary' && summary) return (
              <div key="summary">
                <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500 border-b pb-1 mb-3">Summary</h2>
                <p className="text-gray-700">{summary}</p>
              </div>
            )
            if (id === 'experience' && experience.length > 0) return (
              <div key="experience">
                <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500 border-b pb-1 mb-3">Experience</h2>
                {experience.map((exp, i) => (
                  <div key={i} className="mb-4">
                    <div className="flex justify-between items-baseline">
                      <span className="font-semibold">{exp.company}</span>
                      <span className="text-gray-400 text-xs">{exp.startDate} – {exp.current ? 'Present' : exp.endDate}</span>
                    </div>
                    <p className="text-gray-500 italic text-xs mb-1">{exp.title}</p>
                    <ul className="list-disc list-inside space-y-0.5">
                      {exp.bullets.map((b, j) => b && <li key={j} className="text-gray-700">{b}</li>)}
                    </ul>
                  </div>
                ))}
              </div>
            )
            if (id === 'achievements' && achievements?.length) return (
              <div key="achievements">
                <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500 border-b pb-1 mb-3">Achievements</h2>
                <ul className="list-disc list-inside space-y-0.5">
                  {achievements.map((a, i) => a && <li key={i} className="text-gray-700">{a}</li>)}
                </ul>
              </div>
            )
            return null
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Creative (left color sidebar) ───────────────────────────────────────────

function CreativeTemplate({ content, sectionOrder }: { content: ResumeContent; sectionOrder?: string[] }) {
  const { personalInfo: p, summary, experience, education, skills, achievements } = content
  const mainOrder = (sectionOrder ?? DEFAULT_SECTION_ORDER).filter(
    s => !['skills', 'education'].includes(s)
  )

  return (
    <div className="bg-white text-gray-900 min-h-[1056px] w-[816px] font-sans text-sm leading-relaxed flex">
      <div className="w-60 bg-indigo-700 text-white px-7 py-10 shrink-0 space-y-8">
        <div>
          <h1 className="text-2xl font-bold leading-tight">{p.name}</h1>
          <div className="mt-4 space-y-1 text-indigo-200 text-xs break-words">
            {p.email && <p>{p.email}</p>}
            {p.phone && <p>{p.phone}</p>}
            {p.location && <p>{p.location}</p>}
            {p.linkedin && <p>{p.linkedin}</p>}
            {p.website && <p>{p.website}</p>}
          </div>
        </div>
        {skills.length > 0 && (
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-indigo-300 mb-3">Skills</h3>
            <ul className="space-y-1.5">
              {skills.map((s, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-300 shrink-0" />
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}
        {education.length > 0 && (
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-indigo-300 mb-3">Education</h3>
            {education.map((edu, i) => (
              <div key={i} className="mb-4">
                <p className="font-semibold text-xs leading-snug">{edu.school}</p>
                <p className="text-indigo-200 text-xs">{edu.degree}{edu.field ? `, ${edu.field}` : ''}</p>
                <p className="text-indigo-300 text-xs">{edu.startDate} – {edu.endDate}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 px-10 py-10 space-y-7">
        {mainOrder.map(id => {
          if (id === 'summary' && summary) return (
            <div key="summary">
              <h2 className="text-indigo-700 font-bold text-xs uppercase tracking-widest mb-2">About</h2>
              <p className="text-gray-700">{summary}</p>
            </div>
          )
          if (id === 'experience' && experience.length > 0) return (
            <div key="experience">
              <h2 className="text-indigo-700 font-bold text-xs uppercase tracking-widest mb-3">Experience</h2>
              {experience.map((exp, i) => (
                <div key={i} className="mb-5 pl-4 border-l-2 border-indigo-100">
                  <div className="flex justify-between items-baseline">
                    <span className="font-semibold">{exp.company}</span>
                    <span className="text-gray-400 text-xs">{exp.startDate} – {exp.current ? 'Present' : exp.endDate}</span>
                  </div>
                  <p className="text-indigo-600 text-xs italic mb-1">{exp.title}</p>
                  <ul className="list-disc list-inside space-y-0.5">
                    {exp.bullets.map((b, j) => b && <li key={j} className="text-gray-700">{b}</li>)}
                  </ul>
                </div>
              ))}
            </div>
          )
          if (id === 'achievements' && achievements?.length) return (
            <div key="achievements">
              <h2 className="text-indigo-700 font-bold text-xs uppercase tracking-widest mb-2">Achievements</h2>
              <ul className="list-disc list-inside space-y-0.5">
                {achievements.map((a, i) => a && <li key={i} className="text-gray-700">{a}</li>)}
              </ul>
            </div>
          )
          return null
        })}
      </div>
    </div>
  )
}

// ─── Shared section wrapper ───────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">{title}</h2>
      {children}
    </div>
  )
}
