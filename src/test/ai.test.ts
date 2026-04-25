import { describe, it, expect, vi, beforeEach } from 'vitest'

// ---------------------------------------------------------------------------
// Mock OpenAI client — must be declared before any imports that trigger side-effects
// Use vi.hoisted() so the variable is available inside vi.mock() factory
// ---------------------------------------------------------------------------

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

import { enhanceResume, generateCoverLetter } from '@/lib/ai'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeOpenAiResponse(content: string) {
  return {
    choices: [{ message: { content } }],
  }
}

const MOCK_RESUME_CONTENT = {
  personalInfo: { name: 'John Doe', email: 'john@example.com' },
  summary: 'Software engineer with 5 years of experience',
  experience: [
    {
      company: 'Acme Corp',
      title: 'Software Engineer',
      startDate: '2019',
      current: true,
      bullets: ['Built scalable APIs', 'Reduced latency by 40%'],
    },
  ],
  education: [{ school: 'NTU', degree: 'B.S.', field: 'Computer Science', startDate: '2015', endDate: '2019' }],
  skills: ['TypeScript', 'React', 'Node.js'],
}

// ---------------------------------------------------------------------------
// [refactor/openai] Unit — enhanceResume()
// ---------------------------------------------------------------------------

describe('enhanceResume()', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls chat.completions.create exactly once', async () => {
    mockCreate.mockResolvedValue(makeOpenAiResponse(JSON.stringify(MOCK_RESUME_CONTENT)))

    await enhanceResume('John Doe resume text', 'en')

    expect(mockCreate).toHaveBeenCalledTimes(1)
  })

  it('includes ResumeContent schema description in system message', async () => {
    mockCreate.mockResolvedValue(makeOpenAiResponse(JSON.stringify(MOCK_RESUME_CONTENT)))

    await enhanceResume('Some resume raw text', 'zh')

    const callArgs = mockCreate.mock.calls[0][0]
    const systemMessage = callArgs.messages.find((m: { role: string }) => m.role === 'system')
    expect(systemMessage).toBeDefined()
    // system message must describe the schema
    expect(systemMessage.content).toContain('ResumeContent schema')
    expect(systemMessage.content).toContain('personalInfo')
    expect(systemMessage.content).toContain('experience')
  })

  it('correctly parses JSON response and returns ResumeContent object', async () => {
    mockCreate.mockResolvedValue(makeOpenAiResponse(JSON.stringify(MOCK_RESUME_CONTENT)))

    const result = await enhanceResume('raw text input', 'en')

    expect(result).toMatchObject({
      personalInfo: { name: 'John Doe', email: 'john@example.com' },
      experience: expect.arrayContaining([expect.objectContaining({ company: 'Acme Corp' })]),
      skills: expect.arrayContaining(['TypeScript']),
    })
  })

  it('includes language instruction in user message for zh', async () => {
    mockCreate.mockResolvedValue(makeOpenAiResponse(JSON.stringify(MOCK_RESUME_CONTENT)))

    await enhanceResume('resume text', 'zh')

    const callArgs = mockCreate.mock.calls[0][0]
    const userMessage = callArgs.messages.find((m: { role: string }) => m.role === 'user')
    expect(userMessage.content).toContain('Traditional Chinese')
  })

  it('includes language instruction in user message for en', async () => {
    mockCreate.mockResolvedValue(makeOpenAiResponse(JSON.stringify(MOCK_RESUME_CONTENT)))

    await enhanceResume('resume text', 'en')

    const callArgs = mockCreate.mock.calls[0][0]
    const userMessage = callArgs.messages.find((m: { role: string }) => m.role === 'user')
    expect(userMessage.content).toContain('English')
  })

  it('includes raw input in user message', async () => {
    mockCreate.mockResolvedValue(makeOpenAiResponse(JSON.stringify(MOCK_RESUME_CONTENT)))

    const rawInput = 'This is my special resume content unique text 123'
    await enhanceResume(rawInput, 'en')

    const callArgs = mockCreate.mock.calls[0][0]
    const userMessage = callArgs.messages.find((m: { role: string }) => m.role === 'user')
    expect(userMessage.content).toContain(rawInput)
  })
})

// ---------------------------------------------------------------------------
// [refactor/openai] Unit — generateCoverLetter()
// ---------------------------------------------------------------------------

describe('generateCoverLetter()', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls chat.completions.create exactly once', async () => {
    mockCreate.mockResolvedValue(makeOpenAiResponse('This is a cover letter for you.'))

    await generateCoverLetter({
      resumeContent: MOCK_RESUME_CONTENT,
      jobTitle: 'Software Engineer',
      jobDesc: 'Build backend services',
      wordCount: 'MEDIUM',
      language: 'en',
    })

    expect(mockCreate).toHaveBeenCalledTimes(1)
  })

  it('includes jobTitle in user message', async () => {
    mockCreate.mockResolvedValue(makeOpenAiResponse('Cover letter content'))

    await generateCoverLetter({
      resumeContent: MOCK_RESUME_CONTENT,
      jobTitle: 'Senior Frontend Engineer',
      jobDesc: 'React development',
      wordCount: 'SHORT',
      language: 'en',
    })

    const callArgs = mockCreate.mock.calls[0][0]
    const userMessage = callArgs.messages.find((m: { role: string }) => m.role === 'user')
    expect(userMessage.content).toContain('Senior Frontend Engineer')
  })

  it('includes jobDesc in user message', async () => {
    mockCreate.mockResolvedValue(makeOpenAiResponse('Cover letter content'))

    const uniqueDesc = 'Build microservices with Kubernetes and unique_job_desc_here'
    await generateCoverLetter({
      resumeContent: MOCK_RESUME_CONTENT,
      jobTitle: 'Backend Engineer',
      jobDesc: uniqueDesc,
      wordCount: 'MEDIUM',
      language: 'en',
    })

    const callArgs = mockCreate.mock.calls[0][0]
    const userMessage = callArgs.messages.find((m: { role: string }) => m.role === 'user')
    expect(userMessage.content).toContain(uniqueDesc)
  })

  it('returns plain string (not JSON)', async () => {
    const expectedContent = 'I am writing to express my strong interest in this position.'
    mockCreate.mockResolvedValue(makeOpenAiResponse(expectedContent))

    const result = await generateCoverLetter({
      resumeContent: MOCK_RESUME_CONTENT,
      jobTitle: 'Engineer',
      jobDesc: 'Build stuff',
      wordCount: 'SHORT',
      language: 'en',
    })

    expect(typeof result).toBe('string')
    expect(result).toBe(expectedContent)
  })

  it('returns empty string when AI returns null content', async () => {
    mockCreate.mockResolvedValue({ choices: [{ message: { content: null } }] })

    const result = await generateCoverLetter({
      resumeContent: MOCK_RESUME_CONTENT,
      jobTitle: 'Engineer',
      jobDesc: 'Build stuff',
      wordCount: 'SHORT',
      language: 'en',
    })

    expect(result).toBe('')
  })

  it('includes resumeContent (as string) in user message when passed as string', async () => {
    mockCreate.mockResolvedValue(makeOpenAiResponse('Cover letter'))

    const rawResume = 'John Doe, 5 years TypeScript experience'
    await generateCoverLetter({
      resumeContent: rawResume,
      jobTitle: 'Frontend Dev',
      jobDesc: 'React apps',
      wordCount: 'MEDIUM',
      language: 'en',
    })

    const callArgs = mockCreate.mock.calls[0][0]
    const userMessage = callArgs.messages.find((m: { role: string }) => m.role === 'user')
    expect(userMessage.content).toContain(rawResume)
  })

  it('includes Chinese language instruction when language is zh', async () => {
    mockCreate.mockResolvedValue(makeOpenAiResponse('自薦信內容'))

    await generateCoverLetter({
      resumeContent: MOCK_RESUME_CONTENT,
      jobTitle: '工程師',
      jobDesc: '建構後端服務',
      wordCount: 'MEDIUM',
      language: 'zh',
    })

    const callArgs = mockCreate.mock.calls[0][0]
    const userMessage = callArgs.messages.find((m: { role: string }) => m.role === 'user')
    expect(userMessage.content).toContain('Traditional Chinese')
  })
})
