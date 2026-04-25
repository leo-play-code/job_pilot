import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'

// ---------------------------------------------------------------------------
// Mock lucide-react — render Loader2 as a plain span with data-testid
// ---------------------------------------------------------------------------

vi.mock('lucide-react', () => ({
  Loader2: ({ className }: { className?: string }) => (
    <span data-testid="loader2" className={className} />
  ),
}))

// ---------------------------------------------------------------------------
// Import after mocks
// ---------------------------------------------------------------------------

import { LoadingButton } from '@/components/shared/LoadingButton'

// ---------------------------------------------------------------------------
// [ux-feedback] Unit — LoadingButton 元件
// ---------------------------------------------------------------------------

describe('LoadingButton', () => {
  it('isLoading=false: button is not disabled', () => {
    const { getByRole } = render(
      <LoadingButton isLoading={false}>Submit</LoadingButton>,
    )
    const btn = getByRole('button')
    expect(btn).not.toBeDisabled()
  })

  it('isLoading=false: does not render Loader2 spinner', () => {
    const { queryByTestId } = render(
      <LoadingButton isLoading={false}>Submit</LoadingButton>,
    )
    expect(queryByTestId('loader2')).toBeNull()
  })

  it('isLoading=true: button is disabled', () => {
    const { getByRole } = render(
      <LoadingButton isLoading={true}>Submit</LoadingButton>,
    )
    expect(getByRole('button')).toBeDisabled()
  })

  it('isLoading=true: renders Loader2 with animate-spin class', () => {
    const { getByTestId } = render(
      <LoadingButton isLoading={true}>Submit</LoadingButton>,
    )
    const spinner = getByTestId('loader2')
    expect(spinner.className).toContain('animate-spin')
  })

  it('disabled prop: button is disabled even when isLoading=false', () => {
    const { getByRole } = render(
      <LoadingButton disabled>Submit</LoadingButton>,
    )
    expect(getByRole('button')).toBeDisabled()
  })

  it('variant="destructive": button has bg-destructive class', () => {
    const { getByRole } = render(
      <LoadingButton variant="destructive">Delete</LoadingButton>,
    )
    expect(getByRole('button').className).toContain('bg-destructive')
  })

  it('onClick is called when isLoading=false', () => {
    const handleClick = vi.fn()
    const { getByRole } = render(
      <LoadingButton isLoading={false} onClick={handleClick}>Submit</LoadingButton>,
    )
    fireEvent.click(getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('onClick is not called when isLoading=true (button is disabled)', () => {
    const handleClick = vi.fn()
    const { getByRole } = render(
      <LoadingButton isLoading={true} onClick={handleClick}>Submit</LoadingButton>,
    )
    fireEvent.click(getByRole('button'))
    expect(handleClick).not.toHaveBeenCalled()
  })
})
