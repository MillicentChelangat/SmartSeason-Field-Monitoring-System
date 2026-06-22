from django.urls import path
from . import views

urlpatterns = [
    path('register/', views.register_api, name='register_api'),
    path('login/', views.login_api, name='login_api'),
    path('dashboard/', views.dashboard, name='dashboard'),
    path('fields/', views.get_fields, name='get_fields'),
    path('fields/create/', views.create_field, name='create_field'),
    path('fields/<int:id>/', views.get_field_detail, name='get_field_detail'),
    path('fields/<int:id>/update/', views.update_field, name='update_field'),
    path('fields/<int:id>/updates/', views.get_field_updates_by_id, name='field_updates'),
    path('fields/<int:id>/updates/add/', views.add_field_update, name='add_field_update'),
    path('fields/<int:id>/agents/', views.get_field_agents, name='field_agents'),
    path('fields/<int:id>/assign/', views.assign_field, name='assign_field'),
    path('fields/<int:id>/delete/', views.delete_field, name='delete_field'),
    path('fields/<int:id>/issues/', views.get_field_issues, name='field_issues'),
    path('fields/<int:id>/issues/report/', views.report_field_issue, name='report_field_issue'),
    path('field-updates/', views.get_field_updates, name='get_field_updates'),
    path('agents/', views.get_agents, name='get_agents'),
    path('admin/agents/', views.get_agents, name='admin_agents'),
    path('admin/register-agent/', views.register_agent, name='register_agent'),
    path('issues/', views.get_all_issues, name='get_all_issues'),
    path('issues/count/', views.get_issues_count, name='issues_count'),
    path('issues/<int:id>/status/', views.update_issue_status, name='update_issue_status'),
    
]
