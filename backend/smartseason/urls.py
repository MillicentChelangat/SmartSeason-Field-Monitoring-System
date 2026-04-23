# main urls.py
from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('fields.urls')),       # → /api/register/, /api/login/, /api/dashboard/, /api/field/<id>/update/
    path('api/agent/', include('agent.urls')), # → /api/agent/...
    path('api/token/', TokenObtainPairView.as_view()),
    path('api/token/refresh/', TokenRefreshView.as_view()),  
]