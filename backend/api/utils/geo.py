import math
from datetime import datetime, timedelta


METERS_PER_MILE = 1609.344


def haversine_miles(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    radius_mi = 3958.8
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    d_phi = math.radians(lat2 - lat1)
    d_lambda = math.radians(lon2 - lon1)
    a = math.sin(d_phi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(d_lambda / 2) ** 2
    return 2 * radius_mi * math.asin(min(1.0, math.sqrt(a)))


def polyline_miles(coordinates_lat_lng: list[tuple[float, float]]) -> list[float]:
    """Cumulative distance in miles at each vertex (lat, lng)."""
    if not coordinates_lat_lng:
        return []

    cumulative = [0.0]
    for index in range(1, len(coordinates_lat_lng)):
        lat1, lon1 = coordinates_lat_lng[index - 1]
        lat2, lon2 = coordinates_lat_lng[index]
        cumulative.append(cumulative[-1] + haversine_miles(lat1, lon1, lat2, lon2))
    return cumulative


def interpolate_at_mile(
    coordinates_lat_lng: list[tuple[float, float]],
    target_mile: float,
) -> tuple[float, float]:
    if not coordinates_lat_lng:
        raise ValueError("empty coordinates")

    cumulative = polyline_miles(coordinates_lat_lng)
    total = cumulative[-1]
    if target_mile <= 0:
        return coordinates_lat_lng[0]
    if target_mile >= total:
        return coordinates_lat_lng[-1]

    for index in range(1, len(cumulative)):
        if cumulative[index] >= target_mile:
            prev_mile = cumulative[index - 1]
            next_mile = cumulative[index]
            ratio = (target_mile - prev_mile) / (next_mile - prev_mile) if next_mile > prev_mile else 0
            lat1, lon1 = coordinates_lat_lng[index - 1]
            lat2, lon2 = coordinates_lat_lng[index]
            lat = lat1 + (lat2 - lat1) * ratio
            lon = lon1 + (lon2 - lon1) * ratio
            return lat, lon

    return coordinates_lat_lng[-1]


def eta_at_mile(
    departure: datetime,
    target_mile: float,
    total_miles: float,
    duration_seconds: float,
) -> datetime:
    if total_miles <= 0:
        return departure
    fraction = min(1.0, max(0.0, target_mile / total_miles))
    return departure + timedelta(seconds=duration_seconds * fraction)
