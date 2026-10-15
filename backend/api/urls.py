from django.urls import path

from api import views

urlpatterns = [
    path("health/", views.health, name="health"),
    path("trips/analyze/", views.analyze_trip_view, name="trips-analyze"),
]
