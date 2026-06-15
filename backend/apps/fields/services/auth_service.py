from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from rest_framework_simplejwt.tokens import RefreshToken
from apps.fields.models import Profile



def register_user(email, password, full_name, role='field_agent'):
    if not email or not password:
        raise ValueError("Email and password required")
    if User.objects.filter(username=email).exists():
        raise ValueError("User already exists")

    # First user ever becomes admin automatically
    if User.objects.count() == 0:
        role = 'admin'

    user = User.objects.create_user(username=email, password=password)
    Profile.objects.create(user=user, full_name=full_name, role=role)
    return user