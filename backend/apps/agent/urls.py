from django.urls import path
from . import views

urlpatterns = [
    path('fields/', views.get_fields, name='agent_fields'),
    path('updates/', views.get_updates, name='agent_updates'),
]
