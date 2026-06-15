from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from apps.fields.models import Profile
import os

class Command(BaseCommand):
    help = 'Create admin user'

    def handle(self, *args, **kwargs):
        email = os.environ.get('ADMIN_EMAIL')
        password = os.environ.get('ADMIN_PASSWORD')
        full_name = os.environ.get('ADMIN_FULL_NAME', 'Admin')

        if User.objects.filter(username=email).exists():
            self.stdout.write('Admin already exists, skipping.')
            return

        user = User.objects.create_user(username=email, password=password)
        Profile.objects.create(user=user, full_name=full_name, role='admin')
        self.stdout.write(f'Admin user {email} created successfully!')