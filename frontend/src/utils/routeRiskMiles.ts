import type { Checkpoint } from '../types/trip'

export interface RiskMileBreakdown {
  low: number
  moderate: number
  high: number
  severe: number
  noTravel: number
  total: number
}

export function riskMilesFromCheckpoints(checkpoints: Checkpoint[]): RiskMileBreakdown {
  const out: RiskMileBreakdown = {
    low: 0,
    moderate: 0,
    high: 0,
    severe: 0,
    noTravel: 0,
    total: 0,
  }
  if (checkpoints.length < 2) {
    return out
  }

  for (let i = 1; i < checkpoints.length; i += 1) {
    const miles = checkpoints[i].mile - checkpoints[i - 1].mile
    if (miles <= 0) continue
    out.total += miles
    switch (checkpoints[i].risk.level) {
      case 'Low':
        out.low += miles
        break
      case 'Moderate':
        out.moderate += miles
        break
      case 'High':
        out.high += miles
        break
      case 'Severe':
        out.severe += miles
        break
      case 'No Travel':
        out.noTravel += miles
        break
      default:
        break
    }
  }
  return out
}

export function overallRiskLabel(breakdown: RiskMileBreakdown): 'Low Risk' | 'Moderate Risk' | 'High Risk' {
  if (breakdown.noTravel > 0 || breakdown.severe > breakdown.total * 0.15) {
    return 'High Risk'
  }
  if (breakdown.high > breakdown.total * 0.2 || breakdown.severe > 0) {
    return 'Moderate Risk'
  }
  return 'Low Risk'
}
