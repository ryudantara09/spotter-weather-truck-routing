from __future__ import annotations

from dataclasses import dataclass
from typing import Any

import httpx
from django.conf import settings

from api.integrations.errors import IntegrationError

ORS_BASE = "https://api.openrouteservice.org"


@dataclass(frozen=True)
class ParsedRoute:
    route_id: str
    coordinates_lat_lng: list[tuple[float, float]]
    distance_m: float
    duration_s: float
    geometry: dict[str, Any]


def _headers() -> dict[str, str]:
    key = settings.ORS_API_KEY
    if not key:
        raise IntegrationError("ORS_API_KEY is not configured")
    return {"Authorization": key, "Content-Type": "application/json"}


def geocode(text: str) -> tuple[float, float]:
    try:
        response = httpx.get(
            f"{ORS_BASE}/geocode/search",
            params={"text": text, "size": 1},
            headers=_headers(),
            timeout=30.0,
        )
        response.raise_for_status()
    except httpx.HTTPError as exc:
        raise IntegrationError(f"Geocoding failed: {exc}") from exc

    features = response.json().get("features") or []
    if not features:
        raise IntegrationError(f"No geocoding result for '{text}'")

    lng, lat = features[0]["geometry"]["coordinates"]
    return lat, lng


def _parse_geojson_routes(payload: dict[str, Any], id_prefix: str) -> list[ParsedRoute]:
    routes: list[ParsedRoute] = []
    for index, feature in enumerate(payload.get("features") or []):
        geometry = feature.get("geometry") or {}
        coords = geometry.get("coordinates") or []
        lat_lng = [(lat, lng) for lng, lat in coords]
        summary = feature.get("properties", {}).get("summary") or {}
        routes.append(
            ParsedRoute(
                route_id=f"{id_prefix}-{index}",
                coordinates_lat_lng=lat_lng,
                distance_m=float(summary.get("distance", 0)),
                duration_s=float(summary.get("duration", 0)),
                geometry=geometry,
            )
        )
    return routes


def _directions_request(
    start: tuple[float, float],
    end: tuple[float, float],
    *,
    alternative_count: int = 3,
    avoid_features: list[str] | None = None,
) -> list[ParsedRoute]:
    start_lat, start_lng = start
    end_lat, end_lng = end
    body: dict[str, Any] = {
        "coordinates": [[start_lng, start_lat], [end_lng, end_lat]],
    }
    if alternative_count > 1:
        body["alternative_routes"] = {
            "target_count": alternative_count,
            "share_factor": 0.8,
            "weight_factor": 2,
        }
    if avoid_features:
        body["options"] = {"avoid_features": avoid_features}

    try:
        response = httpx.post(
            f"{ORS_BASE}/v2/directions/driving-hgv/geojson",
            json=body,
            headers=_headers(),
            timeout=60.0,
        )
        response.raise_for_status()
    except httpx.HTTPError as exc:
        raise IntegrationError(f"Routing failed: {exc}") from exc

    prefix = "avoid-" + "-".join(avoid_features) if avoid_features else "route"
    return _parse_geojson_routes(response.json(), prefix)


def _route_signature(route: ParsedRoute) -> tuple:
    return (round(route.distance_m), round(route.duration_s), len(route.coordinates_lat_lng))


def get_route_options(
    start: tuple[float, float],
    end: tuple[float, float],
    *,
    target_count: int = 3,
) -> list[ParsedRoute]:
    collected: list[ParsedRoute] = []
    seen: set[tuple] = set()

    def add_routes(routes: list[ParsedRoute]) -> None:
        for route in routes:
            signature = _route_signature(route)
            if signature in seen:
                continue
            seen.add(signature)
            collected.append(route)

    add_routes(_directions_request(start, end, alternative_count=target_count))

    if len(collected) < target_count:
        for avoid in (["highways"], ["tollways"], ["ferries"]):
            if len(collected) >= target_count:
                break
            try:
                add_routes(
                    _directions_request(
                        start,
                        end,
                        alternative_count=1,
                        avoid_features=avoid,
                    )
                )
            except IntegrationError:
                continue

    if not collected:
        raise IntegrationError("No routes returned for this trip")

    for index, route in enumerate(collected[:target_count]):
        # Normalize ids for response
        collected[index] = ParsedRoute(
            route_id=f"route-{index + 1}",
            coordinates_lat_lng=route.coordinates_lat_lng,
            distance_m=route.distance_m,
            duration_s=route.duration_s,
            geometry=route.geometry,
        )

    return collected[:target_count]
