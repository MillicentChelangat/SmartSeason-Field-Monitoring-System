from .base import *

DEBUG = True

ALLOWED_HOSTS = ['127.0.0.1', 'localhost']

# Database
db_url = os.getenv('DATABASE_URL_POOLED') or os.getenv('DATABASE_URL')

DATABASES = {
    'default': dj_database_url.config(
        default=db_url,
        conn_max_age=600,
        conn_health_checks=True,
        ssl_require=True
    )
}


CORS_ALLOWED_ORIGINS = [
    "https://your-frontend-url.vercel.app",
    "http://localhost:5173",  
]