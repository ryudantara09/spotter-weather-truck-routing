from dataclasses import dataclass

from api.domain.risk_levels import RiskLevel


@dataclass(frozen=True)
class RouteStats:
    no_travel_miles: float
    severe_miles: float
    high_miles: float
    avg_risk_score: float
    total_miles: float


def compute_route_stats(
    segments: list[tuple[float, RiskLevel]],
) -> RouteStats:
    """
    Aggregate risk along a route.

    Each segment is (distance_miles, risk_level) for the stretch ending at a checkpoint.
    """
    if not segments:
        return RouteStats(
            no_travel_miles=0.0,
            severe_miles=0.0,
            high_miles=0.0,
            avg_risk_score=0.0,
            total_miles=0.0,
        )

    no_travel = 0.0
    severe = 0.0
    high = 0.0
    weighted = 0.0
    total = 0.0

    for miles, level in segments:
        if miles <= 0:
            continue
        total += miles
        weighted += miles * level.value
        if level == RiskLevel.NO_TRAVEL:
            no_travel += miles
        elif level == RiskLevel.SEVERE:
            severe += miles
        elif level == RiskLevel.HIGH:
            high += miles

    avg = weighted / total if total else 0.0
    return RouteStats(
        no_travel_miles=no_travel,
        severe_miles=severe,
        high_miles=high,
        avg_risk_score=avg,
        total_miles=total,
    )
