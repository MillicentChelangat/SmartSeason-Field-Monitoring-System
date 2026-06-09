from rest_framework_simplejwt.tokens import AccessToken
from apps.fields.models import Field, FieldUpdate


def get_user_id_from_token(auth_header):
    """Extract user_id from a Bearer token header. Returns None on failure."""
    if not auth_header or not auth_header.startswith('Bearer '):
        return None
    try:
        token = AccessToken(auth_header.split(' ')[1])
        return int(token['user_id'])
    except Exception:
        return None


def get_fields_for_agent(user_id):
    return list(Field.objects.filter(assigned_agent_id=user_id).values(
        'id', 'name', 'crop_type', 'planting_date',
        'current_stage', 'location', 'assigned_agent_id', 'created_at'
    ))


def get_updates_for_agent(user_id):
    return list(FieldUpdate.objects.filter(agent_id=user_id).order_by('-created_at').values(
        'id', 'field_id', 'stage', 'notes', 'created_at', 'agent_id'
    ))
