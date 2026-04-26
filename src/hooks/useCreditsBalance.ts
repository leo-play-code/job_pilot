import { useQuery } from '@tanstack/react-query'

export const CREDITS_QUERY_KEY = ['credits', 'balance'] as const

async function fetchCreditsBalance(): Promise<number | null> {
  const r = await fetch('/api/credits/balance')
  if (!r.ok) return null
  const json = await r.json()
  return json.data?.credits ?? 0
}

export function useCreditsBalance() {
  return useQuery({
    queryKey: CREDITS_QUERY_KEY,
    queryFn: fetchCreditsBalance,
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchInterval: 30_000,
  })
}
