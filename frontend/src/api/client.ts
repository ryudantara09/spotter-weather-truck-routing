import type { TripAnalyzeRequest, TripAnalyzeResponse } from '../types/trip'

const API_BASE = import.meta.env.VITE_API_BASE ?? ''

export async function analyzeTrip(
  payload: TripAnalyzeRequest,
): Promise<TripAnalyzeResponse> {
  const response = await fetch(`${API_BASE}/api/trips/analyze/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { detail?: string }
    throw new Error(body.detail ?? `Request failed (${response.status})`)
  }

  return response.json() as Promise<TripAnalyzeResponse>
}
