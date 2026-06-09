from django.test import TestCase
from apps.agent.services.agent_service import get_user_id_from_token


class TokenParseTest(TestCase):
    def test_missing_header_returns_none(self):
        self.assertIsNone(get_user_id_from_token(''))

    def test_bad_header_returns_none(self):
        self.assertIsNone(get_user_id_from_token('NotBearer abc'))
