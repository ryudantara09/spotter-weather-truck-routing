from dataclasses import dataclass
from datetime import datetime

from api.utils.geo import eta_at_mile, interpolate_at_mile, polyline_miles


@dataclass(frozen=True)
class CheckpointPlan:
    mile: float
    lat: float
    lng: float
    eta: datetime


def build_checkpoint_plans(
    coordinates_lat_lng: list[tuple[float, float]],
    *,
    interval_miles: float,
    departure: datetime,
    duration_seconds: float,
) -> list[CheckpointPlan]:
    cumulative = polyline_miles(coordinates_lat_lng)
    if not cumulative:
        return []

    total_miles = cumulative[-1]
    if total_miles <= 0:
        lat, lng = coordinates_lat_lng[0]
        return [
            CheckpointPlan(
                mile=0.0,
                lat=lat,
                lng=lng,
                eta=departure,
            )
        ]

    mile_marks = [0.0]
    mark = interval_miles
    while mark < total_miles:
        mile_marks.append(mark)
        mark += interval_miles
    if mile_marks[-1] < total_miles:
        mile_marks.append(total_miles)

    plans: list[CheckpointPlan] = []
    for mile in mile_marks:
        lat, lng = interpolate_at_mile(coordinates_lat_lng, mile)
        eta = eta_at_mile(departure, mile, total_miles, duration_seconds)
        plans.append(CheckpointPlan(mile=mile, lat=lat, lng=lng, eta=eta))
    return plans


def checkpoint_segments(plans: list[CheckpointPlan]) -> list[tuple[float, int]]:
    """Return (segment_miles, checkpoint_index) for stats aggregation."""
    if len(plans) < 2:
        return [(plans[0].mile, 0)] if plans else []

    segments: list[tuple[float, int]] = []
    for index in range(1, len(plans)):
        miles = plans[index].mile - plans[index - 1].mile
        segments.append((miles, index))
    return segments
