from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

@csrf_exempt
def get_fields(request):
    return JsonResponse([], safe=False)

@csrf_exempt
def get_updates(request):
    return JsonResponse([], safe=False)

