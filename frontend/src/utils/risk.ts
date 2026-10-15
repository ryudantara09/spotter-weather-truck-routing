import type { RiskLevel } from '../types/trip'

export function riskColor(level: RiskLevel): string {
  switch (level) {
    case 'Low':
      return '#2e7d32'
    case 'Moderate':
      return '#f9a825'
    case 'High':
      return '#ef6c00'
    case 'Severe':
      return '#c62828'
    case 'No Travel':
      return '#4a148c'
    default:
      return '#757575'
  }
}

export function riskHeatRadius(score: number): number {
  return 8000 + score * 4000
}
