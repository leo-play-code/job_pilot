import { describe, it, expect, vi, beforeEach } from 'vitest'

// ---------------------------------------------------------------------------
// Module mocks — must be declared before any imports that trigger side-effects
// ---------------------------------------------------------------------------

// Use vi.hoisted() so the variable is available inside vi.mock() factory
const { mockCreate } = vi.hoisted(() => ({ mockCreate: vi.fn() }))

vi.mock('openai', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: mockCreate,
        },
      },
    })),
  }
})

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { enhanceResume } from '@/lib/ai'
import type { ResumeContent } from '@/types/resume'

const MOCK_RESUME_CONTENT: ResumeContent = {
  personalInfo: { name: 'John Doe', email: 'john@example.com', phone: '0912345678', location: 'Taipei' },
  summary: 'Experienced software engineer',
  experience: [
    {
      company: 'Acme Corp',
      title: 'Senior Engineer',
      startDate: '2020-01',
      current: true,
      bullets: ['Built backend services', 'Led team of 5'],
    },
  ],
  education: [{ school: 'NTU', degree: 'B.S.', field: 'Computer Science', startDate: '2014', endDate: '2018' }],
  skills: ['TypeScript', 'Node.js', 'PostgreSQL'],
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('[refactor/openai] Unit — enhanceResume()', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Ensure OPENAI_API_KEY is set (module reads it at construction time)
    process.env.OPENAI_API_KEY = 'test-key'
  })

  it('calls chat.completions.create exactly once', async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [{ message: { content: JSON.stringify(MOCK_RESUME_CONTENT) } }],
    })

    await enhanceResume('raw text input', 'zh')

    expect(mockCreate).toHaveBeenCalledTimes(1)
  })

  it('passes system message containing ResumeContent schema description', async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [{ message: { content: JSON.stringify(MOCK_RESUME_CONTENT) } }],
    })

    await enhanceResume('raw text input', 'zh')

    const callArgs = mockCreate.mock.calls[0][0] as {
      messages: Array<{ role: string; content: string }>
    }
    const systemMsg = callArgs.messages.find(m => m.role === 'system')

    expect(systemMsg).toBeDefined()
    // The system prompt must mention the schema fields
    expect(systemMsg!.content).toContain('ResumeContent schema')
    expect(systemMsg!.content).toContain('personalInfo')
    expect(systemMsg!.content).toContain('experience')
  })

  it('correctly parses JSON response and returns ResumeContent', async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [{ message: { content: JSON.stringify(MOCK_RESUME_CONTENT) } }],
    })

    const result = await enhanceResume('raw text input', 'en')

    expect(result).toEqual(MOCK_RESUME_CONTENT)
    expect(result.personalInfo.name).toBe('John Doe')
    expect(result.skills).toContain('TypeScript')
  })

  it('uses json_object response_format', async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [{ message: { content: JSON.stringify(MOCK_RESUME_CONTENT) } }],
    })

    await enhanceResume('raw text', 'en')

    const callArgs = mockCreate.mock.calls[0][0] as { response_format: { type: string } }
    expect(callArgs.response_format).toEqual({ type: 'json_object' })
  })

  it('includes language instruction in user message for zh', async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [{ message: { content: JSON.stringify(MOCK_RESUME_CONTENT) } }],
    })

    await enhanceResume('raw text', 'zh')

    const callArgs = mockCreate.mock.calls[0][0] as {
      messages: Array<{ role: string; content: string }>
    }
    const userMsg = callArgs.messages.find(m => m.role === 'user')
    expect(userMsg).toBeDefined()
    expect(userMsg!.content).toContain('Traditional Chinese')
  })

  it('includes language instruction in user message for en', async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [{ message: { content: JSON.stringify(MOCK_RESUME_CONTENT) } }],
    })

    await enhanceResume('raw text', 'en')

    const callArgs = mockCreate.mock.calls[0][0] as {
      messages: Array<{ role: string; content: string }>
    }
    const userMsg = callArgs.messages.find(m => m.role === 'user')
    expect(userMsg!.content).toContain('English')
  })

  it('falls back to empty object when AI returns null content', async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [{ message: { content: null } }],
    })

    // JSON.parse('{}') returns {}, so the function shouldn't throw
    const result = await enhanceResume('raw text', 'zh')
    expect(result).toEqual({})
  })
})
