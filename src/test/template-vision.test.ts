import { describe, it, expect, vi, beforeEach } from 'vitest'

// ---------------------------------------------------------------------------
// Mock OpenAI — must be before imports
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

import { analyzeTemplateImage, TemplateVisionError } from '@/lib/template-vision'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeOpenAiResponse(content: string) {
  return {
    choices: [{ message: { content } }],
  }
}

const MOCK_ANALYSIS_RESULT = {
  layout: 'single',
  primaryColor: '#336699',
  secondaryColor: '#ffffff',
  fontFamily: 'sans-serif',
  detectedSections: ['summary', 'experience', 'education', 'skills'],
  confidence: 0.92,
  css: 'body{font-family:sans-serif;color:#222;margin:0} h1{font-size:24px} h2{font-size:14px;text-transform:uppercase}',
}

// A minimal valid PNG buffer (1x1 white pixel PNG)
const MINIMAL_PNG_BUFFER = Buffer.from(
  '89504e470d0a1a0a0000000d49484452000000010000000108020000009001' +
  '2e0000000c4944415478016360f8ff0f0001b0037900000000049454e44ae426082',
  'hex',
)

// ---------------------------------------------------------------------------
// [template-import] Unit — analyzeTemplateImage()
// ---------------------------------------------------------------------------

describe('analyzeTemplateImage()', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Provide a fake API key so the check passes
    process.env.OPENAI_API_KEY = 'test-api-key-12345'
  })

  it('calls chat.completions.create exactly once', async () => {
    mockCreate.mockResolvedValue(makeOpenAiResponse(JSON.stringify(MOCK_ANALYSIS_RESULT)))

    await analyzeTemplateImage(MINIMAL_PNG_BUFFER, 'image/png')

    expect(mockCreate).toHaveBeenCalledTimes(1)
  })

  it('uses a vision-capable model (gpt-4o)', async () => {
    mockCreate.mockResolvedValue(makeOpenAiResponse(JSON.stringify(MOCK_ANALYSIS_RESULT)))

    await analyzeTemplateImage(MINIMAL_PNG_BUFFER, 'image/png')

    const callArgs = mockCreate.mock.calls[0][0]
    expect(callArgs.model).toContain('gpt-4o')
  })

  it('content includes an image_url block with base64 encoded PNG', async () => {
    mockCreate.mockResolvedValue(makeOpenAiResponse(JSON.stringify(MOCK_ANALYSIS_RESULT)))

    await analyzeTemplateImage(MINIMAL_PNG_BUFFER, 'image/png')

    const callArgs = mockCreate.mock.calls[0][0]
    const message = callArgs.messages[0]
    const contentParts = message.content as Array<{ type: string; image_url?: { url: string } }>

    const imageBlock = contentParts.find(p => p.type === 'image_url')
    expect(imageBlock).toBeDefined()

    const base64 = MINIMAL_PNG_BUFFER.toString('base64')
    expect(imageBlock!.image_url!.url).toContain(`data:image/png;base64,${base64}`)
  })

  it('correctly parses and returns the analysis structure', async () => {
    mockCreate.mockResolvedValue(makeOpenAiResponse(JSON.stringify(MOCK_ANALYSIS_RESULT)))

    const result = await analyzeTemplateImage(MINIMAL_PNG_BUFFER, 'image/png')

    expect(result.layout).toBe('single')
    expect(result.primaryColor).toBe('#336699')
    expect(result.secondaryColor).toBe('#ffffff')
    expect(result.fontFamily).toBe('sans-serif')
    expect(result.detectedSections).toEqual(['summary', 'experience', 'education', 'skills'])
    expect(result.confidence).toBe(0.92)
    expect(typeof result.css).toBe('string')
    expect(result.css.length).toBeGreaterThan(0)
  })

  it('filters out invalid section names from detectedSections', async () => {
    const resultWithInvalidSections = {
      ...MOCK_ANALYSIS_RESULT,
      detectedSections: ['summary', 'experience', 'invalid_section', 'hobbies', 'skills'],
    }
    mockCreate.mockResolvedValue(makeOpenAiResponse(JSON.stringify(resultWithInvalidSections)))

    const result = await analyzeTemplateImage(MINIMAL_PNG_BUFFER, 'image/png')

    expect(result.detectedSections).toContain('summary')
    expect(result.detectedSections).toContain('experience')
    expect(result.detectedSections).toContain('skills')
    expect(result.detectedSections).not.toContain('invalid_section')
    expect(result.detectedSections).not.toContain('hobbies')
  })

  it('throws TemplateVisionError when Vision API call fails', async () => {
    mockCreate.mockRejectedValue(new Error('Connection timeout'))

    await expect(analyzeTemplateImage(MINIMAL_PNG_BUFFER, 'image/png')).rejects.toThrow(TemplateVisionError)
    await expect(analyzeTemplateImage(MINIMAL_PNG_BUFFER, 'image/png')).rejects.toThrow(
      'Vision API request failed',
    )
  })

  it('throws TemplateVisionError when JSON parsing fails', async () => {
    mockCreate.mockResolvedValue(makeOpenAiResponse('not valid json {{{}'))

    await expect(analyzeTemplateImage(MINIMAL_PNG_BUFFER, 'image/png')).rejects.toThrow(TemplateVisionError)
    await expect(analyzeTemplateImage(MINIMAL_PNG_BUFFER, 'image/png')).rejects.toThrow(
      'Failed to parse Vision API response',
    )
  })

  it('throws TemplateVisionError when response is missing required fields', async () => {
    const incomplete = { layout: 'single', primaryColor: '#123456' } // missing many fields
    mockCreate.mockResolvedValue(makeOpenAiResponse(JSON.stringify(incomplete)))

    await expect(analyzeTemplateImage(MINIMAL_PNG_BUFFER, 'image/png')).rejects.toThrow(TemplateVisionError)
    await expect(analyzeTemplateImage(MINIMAL_PNG_BUFFER, 'image/png')).rejects.toThrow(
      'Incomplete Vision API response',
    )
  })

  it('throws Error when OPENAI_API_KEY is not configured', async () => {
    delete process.env.OPENAI_API_KEY

    await expect(analyzeTemplateImage(MINIMAL_PNG_BUFFER, 'image/png')).rejects.toThrow(
      'OPENAI_API_KEY not configured',
    )

    process.env.OPENAI_API_KEY = 'test-api-key-12345'
  })

  it('passes jpeg mimeType correctly in image_url', async () => {
    mockCreate.mockResolvedValue(makeOpenAiResponse(JSON.stringify(MOCK_ANALYSIS_RESULT)))

    const jpegBuffer = Buffer.from('fake jpeg data')
    await analyzeTemplateImage(jpegBuffer, 'image/jpeg')

    const callArgs = mockCreate.mock.calls[0][0]
    const message = callArgs.messages[0]
    const contentParts = message.content as Array<{ type: string; image_url?: { url: string } }>
    const imageBlock = contentParts.find(p => p.type === 'image_url')
    expect(imageBlock!.image_url!.url).toContain('data:image/jpeg;base64,')
  })
})
