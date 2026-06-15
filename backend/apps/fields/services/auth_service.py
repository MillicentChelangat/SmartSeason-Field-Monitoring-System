from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from rest_framework_simplejwt.tokens import RefreshToken
from apps.fields.models import Profile


def get_tokens(user):
    refresh = RefreshToken.for_user(user)
    return {
        "refresh": str(refresh),
        "access": str(refresh.access_token),
    }


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


def login_user(email, password):
    user = authenticate(username=email, password=password)
    if not user:
        raise ValueError("Invalid credentials")
    try:
        profile = Profile.objects.get(user=user)
    except Profile.DoesNotExist:
        profile = None
    return user, profile


def register_agent(email, password, full_name, phone='', residence=''):
    if not email or not password:
        raise ValueError("Email and password required")
    if User.objects.filter(username=email).exists():
        raise ValueError("Agent with this email already exists")

    user = User.objects.create_user(username=email, password=password)
    Profile.objects.create(
        user=user, full_name=full_name,
        role='field_agent', phone=phone, residence=residence,
    )
    return user