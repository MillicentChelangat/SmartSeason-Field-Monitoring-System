from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from fields.models import Profile
import json
from rest_framework_simplejwt.tokens import RefreshToken


def get_tokens(user):
    refresh = RefreshToken.for_user(user)
    return {
        "refresh": str(refresh),
        "access": str(refresh.access_token),
    }


@csrf_exempt
def register_api(request):
    if request.method != "POST":
        return JsonResponse({"error": "Method not allowed"}, status=405)

    try:
        data = json.loads(request.body)
    except:
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    email = data.get("email")
    password = data.get("password")
    full_name = data.get("full_name", "")
    role = data.get("role", "field_agent")

    if not email or not password:
        return JsonResponse({"error": "Email and password required"}, status=400)

    if User.objects.filter(username=email).exists():
        return JsonResponse({"error": "User exists"}, status=400)

    user = User.objects.create_user(username=email, password=password)
    Profile.objects.create(user=user, full_name=full_name, role=role)

    tokens = get_tokens(user)

    return JsonResponse({
        "message": "User created",
        "tokens": tokens,
        "user": {
            "id": user.id,
            "email": email,
            "full_name": full_name,
            "role": role
        }
    })


def dashboard(request):
    return JsonResponse({"message": "Dashboard working 🚀"})


@csrf_exempt
def login_api(request):
    if request.method != "POST":
        return JsonResponse({"error": "Method not allowed"}, status=405)

    try:
        data = json.loads(request.body)
    except:
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return JsonResponse({"error": "Email and password required"}, status=400)

    user = authenticate(username=email, password=password)

    if not user:
        return JsonResponse({"error": "Invalid credentials"}, status=400)

    try:
        profile = Profile.objects.get(user=user)
        full_name = profile.full_name
        role = profile.role
    except Profile.DoesNotExist:
        full_name = user.username
        role = "field_agent"

    tokens = get_tokens(user)

    return JsonResponse({
        "message": "Login successful",
        "tokens": tokens,
        "user": {
            "id": user.id,
            "email": email,
            "full_name": full_name,
            "role": role
        }
    })

@csrf_exempt
def get_fields(request):
    from fields.models import Field
    fields = Field.objects.all().values(
        'id', 'name', 'crop_type', 'planting_date',
        'current_stage', 'location', 'assigned_agent_id', 'created_at'
    )
    return JsonResponse(list(fields), safe=False)

@csrf_exempt
def get_field_updates(request):
    from fields.models import FieldUpdate
    updates = FieldUpdate.objects.all().order_by('-created_at').select_related('agent')
    
    result = []
    for update in updates:
        result.append({
            'id': update.id,
            'field_id': update.field_id,
            'stage': update.stage,
            'notes': update.notes,
            'created_at': str(update.created_at),
            'agent_id': update.agent_id,
            #'agent_name': update.agent.get_full_name() or update.agent.username if update.agent else 'Unknown', 
            'agent_name': (update.agent.get_full_name() or update.agent.username) if update.agent else 'Unknown',
        })
    
    return JsonResponse(result, safe=False)

@csrf_exempt
def get_agents(request):
    profiles = Profile.objects.filter(role='field_agent').select_related('user')

    result = []
    for profile in profiles:
        fields = profile.user.assigned_fields.values('id', 'name', 'crop_type')
        result.append({
            'id': profile.id,           # ✅ Profile id
            'user_id': profile.user.id, # ✅ User id — this is what assigned_agent_id matches
            'full_name': profile.full_name,
            'email': profile.user.username,
            'phone': profile.phone,
            'residence': profile.residence,
            'created_at': profile.user.date_joined.isoformat(),
            'fields': list(fields),
        })

    return JsonResponse(result, safe=False)

@csrf_exempt
def register_agent(request):
    if request.method != "POST":
        return JsonResponse({"error": "Method not allowed"}, status=405)

    try:
        data = json.loads(request.body)
    except:
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    email = data.get("email")
    password = data.get("password")
    full_name = data.get("full_name", "")
    phone = data.get("phone", "")
    residence = data.get("residence", "")

    if not email or not password:
        return JsonResponse({"error": "Email and password required"}, status=400)

    if User.objects.filter(username=email).exists():
        return JsonResponse({"error": "Agent with this email already exists"}, status=400)

    user = User.objects.create_user(username=email, password=password)
    Profile.objects.create(
        user=user,
        full_name=full_name,
        role='field_agent',
        phone=phone,
        residence=residence,
    )

    return JsonResponse({
        "message": "Agent registered successfully",
        "agent": {
            "id": user.id,
            "full_name": full_name,
            "email": email,
            "phone": phone,
            "residence": residence,
        }
    }, status=201)

@csrf_exempt
def get_field_detail(request, id):
    from fields.models import Field
    try:
        field = Field.objects.filter(id=id).values(
            'id', 'name', 'crop_type', 'planting_date',
            'current_stage', 'location', 'assigned_agent_id', 'created_at'
        ).first()
        if not field:
            return JsonResponse({"error": "Field not found"}, status=404)
        return JsonResponse(field)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


@csrf_exempt
def get_field_updates_by_id(request, id):
    from fields.models import FieldUpdate
    updates = FieldUpdate.objects.filter(field_id=id).order_by('-created_at').values(
        'id', 'field_id', 'stage', 'notes', 'created_at', 'agent_id'
    )
    return JsonResponse(list(updates), safe=False)


@csrf_exempt
def get_field_agents(request, id):
    from fields.models import Field
    try:
        field = Field.objects.get(id=id)
        if field.assigned_agent:
            profile = Profile.objects.filter(user=field.assigned_agent).values(
                'id', 'full_name', 'role', 'user_id'
            ).first()
            return JsonResponse([profile] if profile else [], safe=False)
        return JsonResponse([], safe=False)
    except Field.DoesNotExist:
        return JsonResponse([], safe=False)


@csrf_exempt
def create_field(request):
    if request.method != "POST":
        return JsonResponse({"error": "Method not allowed"}, status=405)

    try:
        data = json.loads(request.body)
    except:
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    name = data.get("name")
    crop_type = data.get("crop_type")
    planting_date = data.get("planting_date")
    current_stage = data.get("current_stage", "planted")
    location = data.get("location", "")
    assigned_agent_id = data.get("assigned_agent_id", None)

    if not name or not crop_type or not planting_date:
        return JsonResponse({"error": "Name, crop type and planting date are required"}, status=400)

    from fields.models import Field
    field = Field.objects.create(
        name=name,
        crop_type=crop_type,
        planting_date=planting_date,
        current_stage=current_stage,
        location=location,
        assigned_agent_id=assigned_agent_id
    )

    return JsonResponse({
        "message": "Field created",
        "field": {
            "id": field.id,
            "name": field.name,
            "crop_type": field.crop_type,
            "planting_date": str(field.planting_date),
            "current_stage": field.current_stage,
            "location": field.location,
            "assigned_agent_id": field.assigned_agent_id,
        }
    }, status=201)
@csrf_exempt
def assign_field(request, id):  
    if request.method != "POST":  
        return JsonResponse({"error": "Method not allowed"}, status=405)

    try:
        data = json.loads(request.body)
    except:
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    agent_id = data.get("agent_id")

    from fields.models import Field
    try:
        field = Field.objects.get(id=id)
        if agent_id:
            field.assigned_agent_id = int(agent_id)  
        else:
            field.assigned_agent = None
        field.save()

        return JsonResponse({
            "message": "Field assigned successfully",
            "field_id": field.id,
            "assigned_agent_id": field.assigned_agent_id
        })

    except Field.DoesNotExist:
        return JsonResponse({"error": "Field not found"}, status=404)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)

@csrf_exempt
def delete_field(request, id):
    if request.method != "DELETE":
        return JsonResponse({"error": "Method not allowed"}, status=405)
    from fields.models import Field
    try:
        field = Field.objects.get(id=id)
        field.delete()
        return JsonResponse({"message": "Field deleted"})
    except Field.DoesNotExist:
        return JsonResponse({"error": "Field not found"}, status=404)

@csrf_exempt
def add_field_update(request, id):
    if request.method != "POST":
        return JsonResponse({"error": "Method not allowed"}, status=405)

    try:
        data = json.loads(request.body)
    except:
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    stage = data.get("stage")
    notes = data.get("notes", "")
    agent_id = data.get("agent_id")

    if not stage:
        return JsonResponse({"error": "Stage is required"}, status=400)

    from fields.models import Field, FieldUpdate
    try:
        field = Field.objects.get(id=id)
        field.current_stage = stage
        field.save()

        update = FieldUpdate.objects.create(
            field=field,
            agent_id=agent_id,
            stage=stage,
            notes=notes
        )

        return JsonResponse({
            "message": "Update saved",
            "update": {
                "id": update.id,
                "field_id": update.field_id,
                "stage": update.stage,
                "notes": update.notes,
                "created_at": str(update.created_at),
            }
        }, status=201)
    except Field.DoesNotExist:
        return JsonResponse({"error": "Field not found"}, status=404)