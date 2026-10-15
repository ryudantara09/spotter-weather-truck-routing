from dataclasses import dataclass

from api.domain.route_stats import RouteStats


@dataclass(frozen=True)
class RouteOption:
    route_id: str
    duration_seconds: float
    stats: RouteStats


def recommend_route(routes: list[RouteOption]) -> str | None:
    """
    Pick the best route:
    1. Fewest Severe miles (No Travel miles count as Severe for ranking)
    2. Fewest High miles
    3. Lowest average risk score
    4. Shortest travel time
    """
    if not routes:
        return None

    def sort_key(route: RouteOption) -> tuple:
        stats = route.stats
        return (
            stats.no_travel_miles,
            stats.severe_miles,
            stats.high_miles,
            stats.avg_risk_score,
            route.duration_seconds,
        )

    best = min(routes, key=sort_key)
    return best.route_id
