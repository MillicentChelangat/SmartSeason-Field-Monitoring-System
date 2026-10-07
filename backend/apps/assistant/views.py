import json

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST

from apps.agent.services.agent_service import get_user_id_from_token
from apps.assistant import agent
from apps.assistant.llm import LLMError, get_llm

MAX_MESSAGE = 1000


def _auth_and_body(request):
    """Returns (user_id, body, error_response)."""
    user_id = get_user_id_from_token(request.headers.get('Authorization', ''))
    if not user_id:
        return None, None, JsonResponse({'error': 'Unauthorized'}, status=401)
    try:
        body = json.loads(request.body)
        if not isinstance(body, dict):
            raise ValueError
    except Exception:
        return None, None, JsonResponse({'error': 'Invalid JSON'}, status=400)
    return user_id, body, None


@csrf_exempt
@require_POST
def chat(request):
    user_id, body, error = _auth_and_body(request)
    if error:
        return error

    message = body.get('message')
    if not isinstance(message, str) or not message.strip():
        return JsonResponse({'error': 'Please type a message.'}, status=400)
    if len(message) > MAX_MESSAGE:
        return JsonResponse({'error': f'Messages can be at most {MAX_MESSAGE} characters.'}, status=400)

    llm = get_llm()
    if llm is None:
        return JsonResponse({'error': 'The assistant is not set up on this server yet.'}, status=503)

    try:
        result = agent.run_chat(user_id, message.strip(), body.get('history'), llm)
    except LLMError as e:
        return JsonResponse({'error': str(e)}, status=502)
    return JsonResponse(result)


@csrf_exempt
@require_POST
def confirm(request):
    user_id, body, error = _auth_and_body(request)
    if error:
        return error
    token = body.get('token')
    if not isinstance(token, str) or not token:
        return JsonResponse({'error': 'Missing confirmation token.'}, status=400)
    return JsonResponse(agent.confirm_action(user_id, token, bool(body.get('approve'))))
