FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    DJANGO_SETTINGS_MODULE=smartseason.settings.production

WORKDIR /app

COPY requirements/ requirements/
RUN pip install --no-cache-dir -r requirements/production.txt

COPY . .

EXPOSE 8000
# Set SECRET_KEY, DATABASE_URL and GEMINI_API_KEY as environment variables when you run it.
CMD ["gunicorn", "smartseason.wsgi:application", "--bind", "0.0.0.0:8000"]
