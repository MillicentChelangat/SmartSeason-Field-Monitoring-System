from .base import *
import os

DEBUG = False

ALLOWED_HOSTS = [
    'smartseason-field-monitoring-system-1-bm87.onrender.com',
]

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

CORS_ALLOWED_ORIGINS = [
    # add your frontend URL here
]

SECRET_KEY = os.environ.get('SECRET_KEY', '')
