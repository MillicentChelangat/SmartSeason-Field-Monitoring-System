"""Role helpers used by the API views and the AI assistant.

The API identifies users by the id inside their JWT. These helpers turn that id
into a role and answer "may this user see this field?" in one place, so the
views and the assistant tools enforce exactly the same rules.
"""
from django.http import JsonResponse


def get_role(user_id):
    """Return 'admin', 'field_agent', or None when the user has no profile."""
    from apps.fields.models import Profile

    profile = Profile.objects.filter(user_id=user_id).first()
    return profile.role if profile else None


def is_admin(user_id):
    return get_role(user_id) == 'admin'


def can_access_field(user_id, field_id):
    """Admins can see every field; everyone else only fields assigned to them."""
    if is_admin(user_id):
        return True
    from apps.fields.models import Field

    return Field.objects.filter(id=field_id, assigned_agent_id=user_id).exists()


def forbidden():
    return JsonResponse({'error': 'Forbidden'}, status=403)
