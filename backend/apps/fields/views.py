import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from apps.fields.services import auth_service, field_service
from django.views.decorators.http import require_GET, require_http_methods
from apps.agent.services.agent_service import get_user_id_from_token



# ── Auth ──────────────────────────────────────────────────────────────────────

@csrf_exempt
@require_http_methods(["POST"])  
def register_api(request):
    try:
        data = json.loads(request.body)
    except Exception:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)

    try:
        user = auth_service.register_user(
            email=data.get('email'),
            password=data.get('password'),
            full_name=data.get('full_name', ''),
            role=data.get('role', 'field_agent'),
        )
    except ValueError as e:
        return JsonResponse({'error': str(e)}, status=400)

    tokens = auth_service.get_tokens(user)
    return JsonResponse({'message': 'User created', 'tokens': tokens,
                         'user': {'id': user.id, 'email': user.username}})


@csrf_exempt
@require_http_methods(["POST"])
def login_api(request):
    try:
        data = json.loads(request.body)
    except Exception:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)

    try:
        user, profile = auth_service.login_user(data.get('email'), data.get('password'))
    except ValueError as e:
        return JsonResponse({'error': str(e)}, status=400)

    tokens = auth_service.get_tokens(user)
    return JsonResponse({
        'message': 'Login successful',
        'tokens': tokens,
        'user': {
            'id': user.id,
            'email': user.username,
            'full_name': profile.full_name if profile else '',
            'role': profile.role if profile else 'field_agent',
        }
    })


@csrf_exempt
@require_http_methods(["POST"])
def register_agent(request):
    try:
        data = json.loads(request.body)
    except Exception:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)
    try:
        user = auth_service.register_agent(
            email=data.get('email'),
            password=data.get('password'),
            full_name=data.get('full_name', ''),
            phone=data.get('phone', ''),
            residence=data.get('residence', ''),
        )
    except ValueError as e:
        return JsonResponse({'error': str(e)}, status=400)
    return JsonResponse({'message': 'Agent registered', 'agent': {'id': user.id}}, status=201)


# ── Dashboard ─────────────────────────────────────────────────────────────────
@csrf_exempt
def dashboard(request):
    user_id = get_user_id_from_token(request.headers.get('Authorization', ''))
    if not user_id:
        return JsonResponse({'error': 'Unauthorized'}, status=401)
    data = field_service.get_dashboard_data(user_id)
    return JsonResponse(data)


# ── Fields ────────────────────────────────────────────────────────────────────

@csrf_exempt
@require_GET
def get_fields(request):
    user_id = get_user_id_from_token(request.headers.get('Authorization', ''))
    if not user_id:
        return JsonResponse({'error': 'Unauthorized'}, status=401)
    return JsonResponse(list(field_service.get_all_fields()), safe=False)


@csrf_exempt
@require_GET
def get_field_detail(request, id):
    user_id = get_user_id_from_token(request.headers.get('Authorization', ''))
    if not user_id:
        return JsonResponse({'error': 'Unauthorized'}, status=401)
    try:
        id = int(id)
    except (ValueError, TypeError):
        return JsonResponse({'error': 'Invalid ID'}, status=400)
    field = field_service.get_field_by_id(id)
    if not field:
        return JsonResponse({'error': 'Field not found'}, status=404)
    return JsonResponse(field)


@csrf_exempt
@require_http_methods(["POST"])
def create_field(request):
    user_id = get_user_id_from_token(request.headers.get('Authorization', ''))
    if not user_id:
        return JsonResponse({'error': 'Unauthorized'}, status=401)
    try:
        data = json.loads(request.body)
    except Exception:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)
    try:
        field = field_service.create_field(
            name=data.get('name'),
            crop_type=data.get('crop_type'),
            planting_date=data.get('planting_date'),
            current_stage=data.get('current_stage', 'planted'),
            location=data.get('location', ''),
            assigned_agent_id=data.get('assigned_agent_id'),
        )
    except ValueError as e:
        return JsonResponse({'error': str(e)}, status=400)
    return JsonResponse({'message': 'Field created', 'field': {'id': field.id, 'name': field.name}}, status=201)


@csrf_exempt
@require_http_methods(["POST"])
def assign_field(request, id):
    user_id = get_user_id_from_token(request.headers.get('Authorization', ''))
    if not user_id:
        return JsonResponse({'error': 'Unauthorized'}, status=401)
    try:
        id = int(id)
    except (ValueError, TypeError):
        return JsonResponse({'error': 'Invalid ID'}, status=400)
    try:
        data = json.loads(request.body)
    except Exception:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)
    try:
        field = field_service.assign_field(id, data.get('agent_id'))
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)
    return JsonResponse({'message': 'Field assigned', 'field_id': field.id,
                         'assigned_agent_id': field.assigned_agent_id})


@csrf_exempt
@require_http_methods(["DELETE"])
def delete_field(request, id):
    user_id = get_user_id_from_token(request.headers.get('Authorization', ''))
    if not user_id:
        return JsonResponse({'error': 'Unauthorized'}, status=401)
    try:
        field_service.delete_field(id)
    except Exception:
        return JsonResponse({'error': 'Field not found'}, status=404)
    return JsonResponse({'message': 'Field deleted'})


# ── Field updates ─────────────────────────────────────────────────────────────

@csrf_exempt
@require_GET
def get_field_updates(request):
    user_id = get_user_id_from_token(request.headers.get('Authorization', ''))
    if not user_id:
        return JsonResponse({'error': 'Unauthorized'}, status=401)
    return JsonResponse(list(field_service.get_all_field_updates()), safe=False)
   


@csrf_exempt
@require_GET
def get_field_updates_by_id(request, id):
    user_id = get_user_id_from_token(request.headers.get('Authorization', ''))
    if not user_id:
        return JsonResponse({'error': 'Unauthorized'}, status=401)
    try:
        id = int(id)
    except (ValueError, TypeError):
        return JsonResponse({'error': 'Invalid ID'}, status=400)
    return JsonResponse(list(field_service.get_updates_for_field(id)), safe=False)


@csrf_exempt
@require_http_methods(["POST"])
def add_field_update(request, id):
    user_id = get_user_id_from_token(request.headers.get('Authorization', ''))
    if not user_id:
        return JsonResponse({'error': 'Unauthorized'}, status=401)
    try:
        id = int(id)
    except (ValueError, TypeError):
        return JsonResponse({'error': 'Invalid ID'}, status=400)
    try:
        data = json.loads(request.body)
    except Exception:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)
    try:
        update = field_service.add_field_update(
            field_id=id,
            stage=data.get('stage'),
            notes=data.get('notes', ''),
            agent_id=data.get('agent_id'),
        )
    except ValueError as e:
        return JsonResponse({'error': str(e)}, status=400)
    return JsonResponse({'message': 'Update saved', 'update': {'id': update.id}}, status=201)


# ── Agents ────────────────────────────────────────────────────────────────────

@csrf_exempt
@require_GET
def get_agents(request):
    user_id = get_user_id_from_token(request.headers.get('Authorization', ''))
    if not user_id:
        return JsonResponse({'error': 'Unauthorized'}, status=401)
    return JsonResponse(list(field_service.get_all_agents()), safe=False)


@csrf_exempt
@require_GET
def get_field_agents(request, id):
    user_id = get_user_id_from_token(request.headers.get('Authorization', ''))
    if not user_id:
        return JsonResponse({'error': 'Unauthorized'}, status=401)
    try:
        id = int(id)
    except (ValueError, TypeError):
        return JsonResponse({'error': 'Invalid ID'}, status=400)
    return JsonResponse(list(field_service.get_agents_for_field(id)), safe=False)

@csrf_exempt
@require_http_methods(["PATCH"])
def update_field(request, id):
    user_id = get_user_id_from_token(request.headers.get('Authorization', ''))
    if not user_id:
        return JsonResponse({'error': 'Unauthorized'}, status=401)
    try:
        id = int(id)
    except (ValueError, TypeError):
        return JsonResponse({'error': 'Invalid ID'}, status=400)
    try:
        data = json.loads(request.body)
    except Exception:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)
    try:
        field = field_service.update_field(id, data)
    except Field.DoesNotExist:
        return JsonResponse({'error': 'Field not found'}, status=404)
    except ValueError as e:
        return JsonResponse({'error': str(e)}, status=400)
    return JsonResponse({'message': 'Field updated', 'field': {'id': field.id, 'name': field.name}})
