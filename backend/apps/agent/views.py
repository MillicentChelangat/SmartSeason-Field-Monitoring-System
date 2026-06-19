from django.http import JsonResponse
from django.views.decorators.http import require_GET
from django.views.decorators.csrf import csrf_exempt
from apps.agent.services.agent_service import (
    get_user_id_from_token,
    get_fields_for_agent,
    get_updates_for_agent,
)

@csrf_exempt
@require_GET
@csrf_exempt
def get_fields(request):
    user_id = get_user_id_from_token(request.headers.get('Authorization', ''))
    if not user_id:
        return JsonResponse({"error": "Unauthorized"}, status=401)
    return JsonResponse(get_fields_for_agent(user_id), safe=False)

@csrf_exempt
@require_GET
@csrf_exempt
def get_updates(request):
    user_id = get_user_id_from_token(request.headers.get('Authorization', ''))
    if not user_id:
        return JsonResponse({"error": "Unauthorized"}, status=401)
    return JsonResponse(get_updates_for_agent(user_id), safe=False)
