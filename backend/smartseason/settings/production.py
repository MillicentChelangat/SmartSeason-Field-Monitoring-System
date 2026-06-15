from .base import *
import os
import dj_database_url

DEBUG = False

ALLOWED_HOSTS = [
    'smartseason-field-monitoring-system-1-bm87.onrender.com',
]

DATABASES = {
    'default': dj_database_url.config(
        default=os.environ.get('DATABASE_URL'),
        conn_max_age=600,
    )
}

CORS_ALLOWED_ORIGINS = [
    'https://smart-season-field-monitoring-syste-liard.vercel.app',
]

SECRET_KEY = os.environ.get('SECRET_KEY', '')