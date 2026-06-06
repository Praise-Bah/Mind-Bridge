from django.urls import path
from .views import landing_data

urlpatterns = [
    path('', landing_data),
]
