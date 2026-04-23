from django.urls import path
from . import views

urlpatterns = [
    path('fields/', views.get_fields, name='get_fields'),
    path('updates/', views.get_updates, name='get_updates'),
]