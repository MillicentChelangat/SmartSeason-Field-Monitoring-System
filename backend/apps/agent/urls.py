from django.contrib.auth import views
from django.urls import path
from . import views

urlpatterns = [
    path('fields/', views.get_fields, name='agent_fields'),
    # path('agent/updates/', views.get_updates, name='agent_updates'),
    path('<int:id>/updates/add/', views.add_field_update, name='add_field_update'),
    path('<int:id>/issues/report/', views.report_field_issue, name='report_field_issue'),
]
