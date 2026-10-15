from django.views.decorators.csrf import csrf_exempt
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from api.integrations.errors import IntegrationError
from api.serializers import TripAnalyzeSerializer
from api.services.trip_analyzer import analyze_trip


@api_view(["GET"])
def health(_request):
    return Response({"status": "ok"})


@csrf_exempt
@api_view(["POST"])
def analyze_trip_view(request):
    serializer = TripAnalyzeSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data

    try:
        result = analyze_trip(
            origin=data["origin"],
            destination=data["destination"],
            departure_at=data["departure_at"],
            load_weight_lb=data["load_weight_lb"],
            checkpoint_interval_miles=data.get("checkpoint_interval_miles", 25.0),
        )
    except IntegrationError as exc:
        return Response({"detail": str(exc)}, status=status.HTTP_502_BAD_GATEWAY)

    return Response(result)
