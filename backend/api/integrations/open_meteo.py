from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone

import httpx

from api.integrations.errors import IntegrationError

FORECAST_URL = "https://api.open-meteo.com/v1/forecast"


@dataclass(frozen=True)
class HourlyWeather:
    times: list[datetime]
    wind_mph: list[float]
    rain_in_per_hr: list[float]
    snow_in_per_hr: list[float]


def _parse_time(value: str) -> datetime:
    if value.endswith("Z"):
        value = value.replace("Z", "+00:00")
    parsed = datetime.fromisoformat(value)
    if parsed.tzinfo is None:
        return parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc)


def fetch_hourly_forecast(lat: float, lng: float, *, hours: int = 48) -> HourlyWeather:
    params = {
        "latitude": lat,
        "longitude": lng,
        "hourly": "wind_speed_10m,precipitation,rain,snowfall",
        "wind_speed_unit": "mph",
        "precipitation_unit": "inch",
        "forecast_hours": hours,
        "timezone": "UTC",
    }
    try:
        response = httpx.get(FORECAST_URL, params=params, timeout=30.0)
        response.raise_for_status()
    except httpx.HTTPError as exc:
        raise IntegrationError(f"Weather forecast failed: {exc}") from exc

    hourly = response.json().get("hourly") or {}
    times = [_parse_time(t) for t in hourly.get("time") or []]
    wind = [float(v) for v in hourly.get("wind_speed_10m") or []]
    rain = [float(v) for v in hourly.get("rain") or []]
    snow_cm = [float(v) for v in hourly.get("snowfall") or []]
    snow_in = [cm / 2.54 for cm in snow_cm]

    length = min(len(times), len(wind), len(rain), len(snow_in))
    return HourlyWeather(
        times=times[:length],
        wind_mph=wind[:length],
        rain_in_per_hr=rain[:length],
        snow_in_per_hr=snow_in[:length],
    )


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
