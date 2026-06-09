from django.test import TestCase
from apps.fields.services import auth_service, field_service


class AuthServiceTest(TestCase):
    def test_register_user(self):
        user = auth_service.register_user('a@b.com', 'password123', 'Alice')
        self.assertEqual(user.username, 'a@b.com')

    def test_register_duplicate_raises(self):
        auth_service.register_user('a@b.com', 'password123', 'Alice')
        with self.assertRaises(ValueError):
            auth_service.register_user('a@b.com', 'password123', 'Alice')


class FieldServiceTest(TestCase):
    def test_create_field(self):
        field = field_service.create_field('Farm B', 'Wheat', '2025-03-01')
        self.assertEqual(field.name, 'Farm B')

    def test_create_field_missing_name_raises(self):
        with self.assertRaises(ValueError):
            field_service.create_field('', 'Wheat', '2025-03-01')
