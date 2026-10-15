"""
Weather and load rules for checkpoint risk (assessment spec).
"""

from api.domain.risk_levels import RiskLevel, max_risk


def _classify_wind(mph: float) -> RiskLevel:
    if mph >= 55:
        return RiskLevel.NO_TRAVEL
    if mph >= 45:
        return RiskLevel.SEVERE
    if mph >= 35:
        return RiskLevel.HIGH
    if mph >= 25:
        return RiskLevel.MODERATE
    return RiskLevel.LOW


def _classify_rain(in_per_hr: float) -> RiskLevel:
    if in_per_hr > 1.0:
        return RiskLevel.NO_TRAVEL
    if in_per_hr >= 0.50:
        return RiskLevel.SEVERE
    if in_per_hr >= 0.25:
        return RiskLevel.HIGH
    if in_per_hr >= 0.10:
        return RiskLevel.MODERATE
    return RiskLevel.LOW


def _classify_snow(in_per_hr: float) -> RiskLevel:
    if in_per_hr > 3.0:
        return RiskLevel.NO_TRAVEL
    if in_per_hr >= 2.0:
        return RiskLevel.SEVERE
    if in_per_hr >= 1.0:
        return RiskLevel.HIGH
    if in_per_hr >= 0.5:
        return RiskLevel.MODERATE
    return RiskLevel.LOW


def _apply_load_rules(wind_mph: float, load_weight_lb: float, base: RiskLevel) -> RiskLevel:
    level = base

    if wind_mph >= 55:
        return RiskLevel.NO_TRAVEL

    if 45 <= wind_mph <= 54 and load_weight_lb > 30_000:
        return RiskLevel.NO_TRAVEL

    if 35 <= wind_mph <= 44 and load_weight_lb > 40_000:
        level = max_risk(level, RiskLevel.SEVERE)

    return level


def assess_checkpoint_risk(
    *,
    wind_mph: float,
    rain_in_per_hr: float,
    snow_in_per_hr: float,
    load_weight_lb: float,
) -> RiskLevel:
    """Return the highest applicable risk for a checkpoint."""
    weather = max_risk(
        _classify_wind(wind_mph),
        _classify_rain(rain_in_per_hr),
        _classify_snow(snow_in_per_hr),
    )
    return _apply_load_rules(wind_mph, load_weight_lb, weather)
