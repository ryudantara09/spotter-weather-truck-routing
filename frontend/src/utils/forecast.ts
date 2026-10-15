import type { HeatmapPoint, RiskInfo } from '../types/trip'

export function riskAtForecastHour(
  point: HeatmapPoint,
  departureIso: string,
  hourOffset: number,
): RiskInfo {
  const targetMs = new Date(departureIso).getTime() + hourOffset * 3600 * 1000
  if (!point.hourly_risk.length) {
    return { level: 'Low', score: 1 }
  }

  let best = point.hourly_risk[0]
  let bestDelta = Math.abs(new Date(best.time).getTime() - targetMs)
  for (const entry of point.hourly_risk) {
    const delta = Math.abs(new Date(entry.time).getTime() - targetMs)
    if (delta < bestDelta) {
      bestDelta = delta
      best = entry
    }
  }
  return best.risk
}
