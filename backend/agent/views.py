from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt


@csrf_exempt
def get_fields(request):
    from fields.models import Field
    from rest_framework_simplejwt.tokens import AccessToken

    auth_header = request.headers.get('Authorization', '')
    if not auth_header.startswith('Bearer '):
        return JsonResponse([], safe=False)

    try:
        token = AccessToken(auth_header.split(' ')[1])
        user_id = int(token['user_id'])

        print("USER ID:", user_id)

        fields = Field.objects.filter(assigned_agent_id=user_id).values(
            'id', 'name', 'crop_type', 'planting_date',
            'current_stage', 'location', 'assigned_agent_id', 'created_at'
        )

        print("FIELDS FOUND:", list(fields))

        return JsonResponse(list(fields), safe=False)

    except Exception as e:
        print("ERROR:", e)
        return JsonResponse([], safe=False)


@csrf_exempt
def get_updates(request):
    from fields.models import FieldUpdate
    from rest_framework_simplejwt.tokens import AccessToken

    auth_header = request.headers.get('Authorization', '')
    if not auth_header.startswith('Bearer '):
        return JsonResponse([], safe=False)

    try:
        token = AccessToken(auth_header.split(' ')[1])
        user_id = int(token['user_id'])

        updates = FieldUpdate.objects.filter(agent_id=user_id).order_by('-created_at').values(
            'id', 'field_id', 'stage', 'notes', 'created_at', 'agent_id'
        )
        return JsonResponse(list(updates), safe=False)

    except Exception as e:
        print("ERROR:", e)
        return JsonResponse([], safe=False)