import json
from datetime import date

from django.contrib.auth.models import User
from django.test import TestCase
from rest_framework_simplejwt.tokens import AccessToken

from apps.fields.models import Field, Profile


def make_user(email, role, name):
    user = User.objects.create_user(username=email, password='pw-12345')
    Profile.objects.create(user=user, full_name=name, role=role)
    return user


def auth(user):
    return {'HTTP_AUTHORIZATION': f'Bearer {AccessToken.for_user(user)}'}


class PermissionTests(TestCase):
    def setUp(self):
        self.admin = make_user('admin@test.com', 'admin', 'Admin')
        self.alice = make_user('alice@test.com', 'field_agent', 'Alice')
        self.bob = make_user('bob@test.com', 'field_agent', 'Bob')
        self.alice_field = Field.objects.create(
            name='Alice Plot', crop_type='Maize', planting_date=date(2026, 3, 1),
            assigned_agent=self.alice)
        self.bob_field = Field.objects.create(
            name='Bob Plot', crop_type='Beans', planting_date=date(2026, 3, 1),
            assigned_agent=self.bob)

    # ── dashboard bug ────────────────────────────────────────────────────────
    def test_dashboard_agent_sees_only_own_fields(self):
        res = self.client.get('/api/dashboard/', **auth(self.alice))
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data['role'], 'field_agent')
        self.assertEqual([f['name'] for f in data['fields']], ['Alice Plot'])

    def test_dashboard_admin_sees_all_fields(self):
        data = self.client.get('/api/dashboard/', **auth(self.admin)).json()
        self.assertEqual(data['role'], 'admin')
        self.assertEqual(len(data['fields']), 2)

    # ── scoped reads ─────────────────────────────────────────────────────────
    def test_agent_field_list_is_scoped(self):
        data = self.client.get('/api/fields/', **auth(self.alice)).json()
        self.assertEqual([f['name'] for f in data], ['Alice Plot'])

    def test_admin_field_list_is_complete(self):
        data = self.client.get('/api/fields/', **auth(self.admin)).json()
        self.assertEqual(len(data), 2)

    def test_agent_cannot_open_someone_elses_field(self):
        res = self.client.get(f'/api/fields/{self.bob_field.id}/', **auth(self.alice))
        self.assertEqual(res.status_code, 403)

    def test_agent_can_open_own_field(self):
        res = self.client.get(f'/api/fields/{self.alice_field.id}/', **auth(self.alice))
        self.assertEqual(res.status_code, 200)

    def test_agent_agents_list_only_contains_themselves(self):
        data = self.client.get('/api/agents/', **auth(self.alice)).json()
        self.assertEqual([a['user_id'] for a in data], [self.alice.id])

    # ── admin-only actions ───────────────────────────────────────────────────
    def test_agent_cannot_create_assign_or_delete_fields(self):
        headers = auth(self.alice)
        body = json.dumps({'name': 'X', 'crop_type': 'Y', 'planting_date': '2026-01-01'})
        self.assertEqual(self.client.post(
            '/api/fields/create/', body, content_type='application/json', **headers).status_code, 403)
        self.assertEqual(self.client.post(
            f'/api/fields/{self.bob_field.id}/assign/', json.dumps({'agent_id': self.alice.id}),
            content_type='application/json', **headers).status_code, 403)
        self.assertEqual(self.client.delete(
            f'/api/fields/{self.bob_field.id}/delete/', **headers).status_code, 403)
        self.assertTrue(Field.objects.filter(id=self.bob_field.id).exists())

    def test_admin_can_create_field(self):
        body = json.dumps({'name': 'New', 'crop_type': 'Rice', 'planting_date': '2026-01-01'})
        res = self.client.post('/api/fields/create/', body, content_type='application/json',
                               **auth(self.admin))
        self.assertEqual(res.status_code, 201)

    def test_register_agent_requires_admin(self):
        body = json.dumps({'email': 'new@test.com', 'password': 'pw-12345', 'full_name': 'New'})
        self.assertEqual(self.client.post(
            '/api/admin/register-agent/', body, content_type='application/json').status_code, 401)
        self.assertEqual(self.client.post(
            '/api/admin/register-agent/', body, content_type='application/json',
            **auth(self.alice)).status_code, 403)
        self.assertEqual(self.client.post(
            '/api/admin/register-agent/', body, content_type='application/json',
            **auth(self.admin)).status_code, 201)

    def test_issue_admin_endpoints_are_admin_only(self):
        self.assertEqual(self.client.get('/api/issues/', **auth(self.alice)).status_code, 403)
        self.assertEqual(self.client.get('/api/issues/', **auth(self.admin)).status_code, 200)

    # ── updates ──────────────────────────────────────────────────────────────
    def test_agent_cannot_update_someone_elses_field(self):
        res = self.client.post(
            f'/api/fields/{self.bob_field.id}/updates/add/',
            json.dumps({'stage': 'growing'}), content_type='application/json',
            **auth(self.alice))
        self.assertEqual(res.status_code, 403)

    def test_agent_update_is_recorded_as_that_agent(self):
        res = self.client.post(
            f'/api/fields/{self.alice_field.id}/updates/add/',
            json.dumps({'stage': 'growing', 'notes': 'ok', 'agent_id': self.bob.id}),
            content_type='application/json', **auth(self.alice))
        self.assertEqual(res.status_code, 201)
        update = self.alice_field.updates.get()
        self.assertEqual(update.agent_id, self.alice.id)

    def test_agent_update_list_is_scoped(self):
        self.client.post(f'/api/fields/{self.alice_field.id}/updates/add/',
                         json.dumps({'stage': 'growing'}), content_type='application/json',
                         **auth(self.alice))
        self.client.post(f'/api/fields/{self.bob_field.id}/updates/add/',
                         json.dumps({'stage': 'growing'}), content_type='application/json',
                         **auth(self.bob))
        data = self.client.get('/api/field-updates/', **auth(self.alice)).json()
        self.assertEqual({u['field_id'] for u in data}, {self.alice_field.id})
