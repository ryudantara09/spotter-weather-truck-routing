from __future__ import annotations

from datetime import datetime

from api.domain.recommender import RouteOption, recommend_route
from api.domain.risk_engine import assess_checkpoint_risk
from api.domain.risk_levels import RiskLevel
from api.domain.route_stats import compute_route_stats
from api.integrations.open_meteo import HourlyWeather, fetch_hourly_forecast, weather_at_time
from api.integrations.ors_client import ParsedRoute, geocode, get_route_options
from api.services.checkpoints import build_checkpoint_plans

FORECAST_HOURS = 48


def _risk_payload(level: RiskLevel) -> dict:
    return {"level": level.label, "score": level.value}


def _hourly_risk_from_forecast(forecast: HourlyWeather, load_weight_lb: float) -> list[dict]:
    series: list[dict] = []
    for index, stamp in enumerate(forecast.times):
        level = assess_checkpoint_risk(
            wind_mph=forecast.wind_mph[index],
            rain_in_per_hr=forecast.rain_in_per_hr[index],
            snow_in_per_hr=forecast.snow_in_per_hr[index],
            load_weight_lb=load_weight_lb,
        )
        series.append({"time": stamp.isoformat(), "risk": _risk_payload(level)})
    return series


def _segments_from_checkpoints(checkpoints: list[dict]) -> list[tuple[float, RiskLevel]]:
    if len(checkpoints) < 2:
        return []

    segments: list[tuple[float, RiskLevel]] = []
    for index in range(1, len(checkpoints)):
        miles = checkpoints[index]["mile"] - checkpoints[index - 1]["mile"]
        level = RiskLevel(checkpoints[index]["risk"]["score"])
        segments.append((miles, level))
    return segments


def _analyze_route(
    route: ParsedRoute,
    *,
    departure: datetime,
    load_weight_lb: float,
    interval_miles: float,
) -> dict:
    plans = build_checkpoint_plans(
        route.coordinates_lat_lng,
        interval_miles=interval_miles,
        departure=departure,
        duration_seconds=route.duration_s,
    )

    forecast_cache: dict[tuple[float, float], HourlyWeather] = {}
    hourly_risk_cache: dict[tuple[float, float], list[dict]] = {}
    checkpoints: list[dict] = []

    for plan in plans:
        key = (round(plan.lat, 3), round(plan.lng, 3))
        if key not in forecast_cache:
            forecast = fetch_hourly_forecast(plan.lat, plan.lng, hours=FORECAST_HOURS)
            forecast_cache[key] = forecast
            hourly_risk_cache[key] = _hourly_risk_from_forecast(forecast, load_weight_lb)
        forecast = forecast_cache[key]

        wind, rain, snow = weather_at_time(forecast, plan.eta)
        level = assess_checkpoint_risk(
            wind_mph=wind,
            rain_in_per_hr=rain,
            snow_in_per_hr=snow,
            load_weight_lb=load_weight_lb,
        )
        checkpoints.append(
            {
                "mile": round(plan.mile, 2),
                "lat": plan.lat,
                "lng": plan.lng,
                "eta": plan.eta.isoformat(),
                "weather": {
                    "wind_mph": round(wind, 2),
                    "rain_in_per_hr": round(rain, 3),
                    "snow_in_per_hr": round(snow, 3),
                },
                "risk": _risk_payload(level),
            }
        )

    stats = compute_route_stats(_segments_from_checkpoints(checkpoints))

    heatmap_points = []
    seen_heatmap: set[tuple[float, float]] = set()
    for cp in checkpoints:
        key = (round(cp["lat"], 3), round(cp["lng"], 3))
        if key in seen_heatmap:
            continue
        seen_heatmap.add(key)
        heatmap_points.append(
            {
                "lat": cp["lat"],
                "lng": cp["lng"],
                "mile": cp["mile"],
                "hourly_risk": hourly_risk_cache[key],
            }
        )

    return {
        "id": route.route_id,
        "summary": {
            "distance_miles": round(route.distance_m / 1609.344, 2),
            "duration_seconds": round(route.duration_s),
            "duration_hours": round(route.duration_s / 3600, 2),
        },
        "geometry": route.geometry,
        "checkpoints": checkpoints,
        "stats": {
            "no_travel_miles": round(stats.no_travel_miles, 2),
            "severe_miles": round(stats.severe_miles, 2),
            "high_miles": round(stats.high_miles, 2),
            "avg_risk_score": round(stats.avg_risk_score, 3),
            "total_miles": round(stats.total_miles, 2),
        },
        "heatmap": heatmap_points,
    }


def analyze_trip(
    *,
    origin: str,
    destination: str,
    departure_at: datetime,
    load_weight_lb: float,
    checkpoint_interval_miles: float = 25.0,
) -> dict:
    start = geocode(origin)
    end = geocode(destination)
    routes = get_route_options(start, end, target_count=3)

    analyzed = [
        _analyze_route(
            route,
            departure=departure_at,
            load_weight_lb=load_weight_lb,
            interval_miles=checkpoint_interval_miles,
        )
        for route in routes
    ]

    options = [
        RouteOption(
            route_id=route["id"],
            duration_seconds=float(route["summary"]["duration_seconds"]),
            stats=compute_route_stats(_segments_from_checkpoints(route["checkpoints"])),
        )
        for route in analyzed
    ]

    return {
        "origin": {"query": origin, "lat": start[0], "lng": start[1]},
        "destination": {"query": destination, "lat": end[0], "lng": end[1]},
        "departure_at": departure_at.isoformat(),
        "load_weight_lb": load_weight_lb,
        "checkpoint_interval_miles": checkpoint_interval_miles,
        "recommended_route_id": recommend_route(options),
        "routes": analyzed,
    }
