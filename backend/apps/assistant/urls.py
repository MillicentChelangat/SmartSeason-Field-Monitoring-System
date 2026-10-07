from django.urls import path
from . import views

urlpatterns = [
    path('chat/', views.chat, name='assistant_chat'),
    path('confirm/', views.confirm, name='assistant_confirm'),
]
