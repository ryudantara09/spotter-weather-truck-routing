from __future__ import annotations

import time
from dataclasses import dataclass
from datetime import datetime, timezone

import httpx

from api.integrations.errors import IntegrationError

FORECAST_URL = "https://api.open-meteo.com/v1/forecast"
MAX_FORECAST_HOURS = 48
_RETRYABLE_STATUS = {429, 502, 503, 504}

_forecast_cache: dict[tuple[float, float, int], HourlyWeather] = {}


@dataclass(frozen=True)
class HourlyWeather:
    times: list[datetime]
    wind_mph: list[float]
    rain_in_per_hr: list[float]
    snow_in_per_hr: list[float]


def location_key(lat: float, lng: float) -> tuple[float, float]:
    """Round coords so nearby checkpoints share one forecast request."""
    return (round(lat, 2), round(lng, 2))


def _parse_time(value: str) -> datetime:
    if value.endswith("Z"):
        value = value.replace("Z", "+00:00")
    parsed = datetime.fromisoformat(value)
    if parsed.tzinfo is None:
        return parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc)


def _parse_hourly_payload(payload: dict, *, hours: int) -> HourlyWeather:
    hourly = payload.get("hourly") or {}
    times = [_parse_time(t) for t in hourly.get("time") or []]
    wind = [float(v) for v in hourly.get("wind_speed_10m") or []]
    rain = [float(v) for v in hourly.get("rain") or []]
    precipitation = [float(v) for v in hourly.get("precipitation") or []]
    snow_cm = [float(v) for v in hourly.get("snowfall") or []]
    snow_in = [cm / 2.54 for cm in snow_cm]

    length = min(len(times), len(wind), len(snow_in))
    rain_in_per_hr: list[float] = []
    for index in range(length):
        rain_rate = rain[index] if index < len(rain) else 0.0
        precip_rate = precipitation[index] if index < len(precipitation) else 0.0
        rain_in_per_hr.append(max(rain_rate, precip_rate))

    limit = min(length, hours + 1)
    return HourlyWeather(
        times=times[:limit],
        wind_mph=wind[:limit],
        rain_in_per_hr=rain_in_per_hr[:limit],
        snow_in_per_hr=snow_in[:limit],
    )


def _request_forecast(lat: float, lng: float, *, hours: int) -> dict:
    params = {
        "latitude": lat,
        "longitude": lng,
        "hourly": "wind_speed_10m,precipitation,rain,snowfall",
        "wind_speed_unit": "mph",
        "precipitation_unit": "inch",
        "forecast_days": 3,
        "timezone": "UTC",
    }

    last_error: str | None = None
    for attempt in range(5):
        try:
            response = httpx.get(FORECAST_URL, params=params, timeout=45.0)
            if response.status_code in _RETRYABLE_STATUS:
                last_error = f"HTTP {response.status_code}"
                time.sleep(0.4 * (2**attempt))
                continue
            response.raise_for_status()
            return response.json()
        except httpx.HTTPError as exc:
            last_error = str(exc)
            time.sleep(0.4 * (2**attempt))

    raise IntegrationError(
        "Weather forecast is temporarily unavailable (Open-Meteo). "
        "Please wait a moment and try again."
        + (f" Detail: {last_error}" if last_error else "")
    )


def fetch_hourly_forecast(lat: float, lng: float, *, hours: int = MAX_FORECAST_HOURS) -> HourlyWeather:
    hours = min(hours, MAX_FORECAST_HOURS)
    lat_key, lng_key = location_key(lat, lng)
    cache_key = (lat_key, lng_key, hours)

    if cache_key in _forecast_cache:
        return _forecast_cache[cache_key]

    payload = _request_forecast(lat_key, lng_key, hours=hours)
    forecast = _parse_hourly_payload(payload, hours=hours)
    _forecast_cache[cache_key] = forecast
    return forecast


def clear_forecast_cache() -> None:
    _forecast_cache.clear()


def _index_for_time(forecast: HourlyWeather, moment: datetime) -> int:
    if moment.tzinfo is None:
        moment = moment.replace(tzinfo=timezone.utc)
    else:
        moment = moment.astimezone(timezone.utc)

    if not forecast.times:
        return 0

    best_index = 0
    best_delta = abs((forecast.times[0] - moment).total_seconds())
    for index, stamp in enumerate(forecast.times):
        delta = abs((stamp - moment).total_seconds())
        if delta < best_delta:
            best_delta = delta
            best_index = index
    return best_index


def weather_at_time(forecast: HourlyWeather, moment: datetime) -> tuple[float, float, float]:
    index = _index_for_time(forecast, moment)
    return (
        forecast.wind_mph[index],
        forecast.rain_in_per_hr[index],
        forecast.snow_in_per_hr[index],
    )
