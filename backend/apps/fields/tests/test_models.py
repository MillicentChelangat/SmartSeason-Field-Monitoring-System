from django.test import TestCase
from django.contrib.auth.models import User
from apps.fields.models import Profile, Field


class ProfileModelTest(TestCase):
    def test_profile_creation(self):
        user = User.objects.create_user(username='test@example.com', password='pass')
        profile = Profile.objects.create(user=user, full_name='Test User', role='field_agent')
        self.assertEqual(str(profile), 'Test User (field_agent)')


class FieldModelTest(TestCase):
    def test_field_creation(self):
        field = Field.objects.create(name='Farm A', crop_type='Maize', planting_date='2025-01-01')
        self.assertEqual(field.current_stage, 'planted')
