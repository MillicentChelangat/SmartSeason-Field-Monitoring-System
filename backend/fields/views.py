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
    updates = FieldUpdate.objects.all().order_by('-created_at').values(
        'id', 'field_id', 'stage', 'notes', 'created_at', 'agent_id'
    )
    return JsonResponse(list(updates), safe=False)


@csrf_exempt
def get_agents(request):
    agents = Profile.objects.filter(role='field_agent').values(
        'id', 'full_name', 'role', 'user_id'
    )
    return JsonResponse(list(agents), safe=False)


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