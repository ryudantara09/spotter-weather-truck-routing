from __future__ import annotations

from dataclasses import dataclass
from typing import Any

import httpx
from django.conf import settings

from api.integrations.errors import IntegrationError
from api.utils.geo import METERS_PER_MILE, haversine_miles

ORS_BASE = "https://api.openrouteservice.org"

# ORS alternative-routes algorithm only supports ~100 km; longer trips need other strategies.
ALT_ROUTES_MAX_DISTANCE_M = 100_000


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


def _ors_error_message(response: httpx.Response) -> str:
    try:
        payload = response.json()
        err = payload.get("error") or {}
        if isinstance(err, dict) and err.get("message"):
            return str(err["message"])
    except Exception:
        pass
    return response.text[:300] or response.reason_phrase


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
    profile: str = "driving-hgv",
    alternative_count: int = 1,
    avoid_features: list[str] | None = None,
) -> list[ParsedRoute]:
    start_lat, start_lng = start
    end_lat, end_lng = end
    body: dict[str, Any] = {
        "coordinates": [[start_lng, start_lat], [end_lng, end_lat]],
    }

    approx_m = haversine_miles(start_lat, start_lng, end_lat, end_lng) * METERS_PER_MILE
    if alternative_count > 1 and approx_m <= ALT_ROUTES_MAX_DISTANCE_M:
        body["alternative_routes"] = {
            "target_count": min(alternative_count, 3),
            "share_factor": 0.6,
            "weight_factor": 1.4,
        }

    if avoid_features:
        body["options"] = {"avoid_features": avoid_features}

    try:
        response = httpx.post(
            f"{ORS_BASE}/v2/directions/{profile}/geojson",
            json=body,
            headers=_headers(),
            timeout=60.0,
        )
        if response.status_code >= 400:
            detail = _ors_error_message(response)
            raise IntegrationError(f"Routing failed ({response.status_code}): {detail}")
        response.raise_for_status()
    except httpx.HTTPError as exc:
        raise IntegrationError(f"Routing failed: {exc}") from exc

    prefix = "avoid-" + "-".join(avoid_features) if avoid_features else "route"
    return _parse_geojson_routes(response.json(), prefix)


def _route_signature(route: ParsedRoute) -> tuple:
    return (round(route.distance_m, -2), round(route.duration_s, -1))


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

    approx_m = haversine_miles(start[0], start[1], end[0], end[1]) * METERS_PER_MILE

    if approx_m <= ALT_ROUTES_MAX_DISTANCE_M:
        add_routes(_directions_request(start, end, alternative_count=target_count))
    else:
        # Long haul: ORS cannot compute alternative_routes; request variants instead.
        variant_avoids: list[list[str] | None] = [
            None,
            ["highways"],
            ["tollways"],
            ["ferries"],
            ["highways", "tollways"],
        ]
        for avoid in variant_avoids:
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

    normalized: list[ParsedRoute] = []
    for index, route in enumerate(collected[:target_count]):
        normalized.append(
            ParsedRoute(
                route_id=f"route-{index + 1}",
                coordinates_lat_lng=route.coordinates_lat_lng,
                distance_m=route.distance_m,
                duration_s=route.duration_s,
                geometry=route.geometry,
            )
        )

    return normalized
