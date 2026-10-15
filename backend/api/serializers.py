from rest_framework import serializers


class TripAnalyzeSerializer(serializers.Serializer):
    origin = serializers.CharField(max_length=500)
    destination = serializers.CharField(max_length=500)
    departure_at = serializers.DateTimeField()
    load_weight_lb = serializers.FloatField(min_value=0)
    checkpoint_interval_miles = serializers.FloatField(min_value=1, default=25.0, required=False)
