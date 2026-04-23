from .models import Field

def dashboard_api(request):
    user = request.user

    if not user.is_authenticated:
        return JsonResponse({"error": "Not authenticated"}, status=401)

    try:
        role = user.profile.role
    except:
        role = "Admin"

    if role == "Admin":
        fields = list(Field.objects.values())
    else:
        fields = list(Field.objects.filter(assigned_agent=user).values())

    return JsonResponse({
        "role": role,
        "fields": fields
    })