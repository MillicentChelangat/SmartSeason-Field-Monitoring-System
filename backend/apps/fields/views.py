from operator import is_

from django.db.migrations import serializer
from django.db.models import ObjectDoesNotExist
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from apps.fields.services import auth_service, field_service
from apps.fields.models import Field, Profile
from apps.common.access import is_manager
from apps.common.permissions import IsManager
from apps.fields.serializers import ( LoginSerializer, ProfileSerializer, RegisterSerializer, 
RegisterAgentSerializer, FieldSerializer, ProfileUpdateSerializer, FieldIssueSerializer, 
FieldUpdateSerializer )

MANAGER_ONLY = [IsAuthenticated, IsManager]
FIELD_ACCESS = [IsAuthenticated]

@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
def register_api(request):
    serializer = RegisterSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data

    try:
        user = auth_service.register_user(
            email=data['email'],
            password=data['password'],
            full_name=data['full_name'],
            role='field_agent',   
        )
    except ValueError as e:
        return Response({'error': str(e)}, status=400)

    tokens = auth_service.get_tokens(user)
    return Response({'message': 'User created', 'tokens': tokens,
                     'user': {'id': user.id, 'email': user.username}})


@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
def login_api(request):
    serializer = LoginSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data

    try:
        user, profile = auth_service.login_user(data['email'], data['password'])
    except ValueError as e:
        return Response({'error': str(e)}, status=400)

    tokens = auth_service.get_tokens(user)
    return Response({
        'message': 'Login successful',
        'tokens': tokens,
        'user': {
            'id': user.id,
            'email': user.username,
            'full_name': profile.full_name if profile else '',
            'role': profile.role if profile else 'field_agent',
            'phone': profile.phone if profile else '',
            'residence': profile.residence if profile else '',
        }
    })


@api_view(['POST'])
@permission_classes(MANAGER_ONLY)
def register_agent(request):
    serializer = RegisterAgentSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data
    try:
        user = auth_service.register_agent(
            email=data.get('email'),
            password=data.get('password'),
            full_name=data.get('full_name', ''),
            phone=data.get('phone', ''),
            residence=data.get('residence', ''),
        )
    except ValueError as e:
        return Response({'error': str(e)}, status=400)
    return Response({'message': 'Agent registered', 'agent': {'id': user.id}}, status=201)


#Dashboard

@api_view(['GET'])
def dashboard(request):
    # request.user is already the User object (set by AgentTokenAuthentication)
    return Response(field_service.get_dashboard_data(request.user))


#Fields
@api_view(['GET'])
def get_fields(request):    
    user_id = request.user.id
    fields = list(field_service.get_all_fields())
    if not is_manager(user_id):
        fields = [f for f in fields if f['assigned_agent_id'] == user_id]
    return Response(fields) 

#Profile 
@api_view(['GET'])
def get_profile(request):

    try:
        u = request.user
        profile = Profile.objects.get(user=u)
        return Response({
            'full_name': profile.full_name,
            'email': u.username,
            'phone': profile.phone,
            'residence': profile.residence,
            'role': profile.role,
        })
    except Exception as e:
        return Response({'error': str(e)}, status=400)


@api_view(['PATCH'])
def update_profile(request):
    serializer = ProfileUpdateSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data
    try:
        u = request.user
        profile = Profile.objects.get(user=u)
        if 'full_name' in data:
            profile.full_name = data['full_name']
        if 'phone' in data:
            profile.phone = data['phone']
        if 'residence' in data:
            profile.residence = data['residence']
        profile.save()
        if data.get('new_password'):
            if not u.check_password(data.get('current_password', '')):
                return Response({'error': 'Current password is incorrect'}, status=400)
            u.set_password(data['new_password'])
            u.save()
        return Response({'message': 'Profile updated'})
    except Exception as e:
        return Response({'error': str(e)}, status=400)


@api_view(['GET'])
@permission_classes(FIELD_ACCESS)
def get_field_detail(request, id):
    try:
        id = int(id)
    except (ValueError, TypeError):
        return Response({'error': 'Invalid ID'}, status=400)
    field = field_service.get_field_by_id(id)
    if not field:
        return Response({'error': 'Field not found'}, status=404)
    return Response(field)


@api_view(['POST'])
@permission_classes(MANAGER_ONLY)
def create_field(request):
    serializer = FieldSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)   
    data = serializer.validated_data
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
        return Response({'error': str(e)}, status=400)
    return Response({'message': 'Field created', 'field': {'id': field.id, 'name': field.name}}, status=201)


@api_view(['POST'])
@permission_classes(MANAGER_ONLY)
def assign_field(request, id):
    try:
        id = int(id)
    except (ValueError, TypeError):
        return Response({'error': 'Invalid ID'}, status=400)
    data = request.data
    try:
        field = field_service.assign_field(id, data.get('agent_id'))
    except Exception as e:
        return Response({'error': str(e)}, status=400)
    return Response({'message': 'Field assigned', 'field_id': field.id,
                     'assigned_agent_id': field.assigned_agent_id})


@api_view(['DELETE'])
@permission_classes(MANAGER_ONLY)
def delete_field(request, id):
    try:
        field_service.delete_field(id)
    except Exception:
        return Response({'error': 'Field not found'}, status=404)
    return Response({'message': 'Field deleted'})


#Field updates

@api_view(['GET'])
def get_field_updates(request):
    user_id = request.user.id
    updates = list(field_service.get_all_field_updates())
    if not is_manager(user_id):
        mine = set(Field.objects.filter(assigned_agent_id=user_id).values_list('id', flat=True))
        updates = [u for u in updates if u['field_id'] in mine]
    return Response(updates)


@api_view(['GET'])
@permission_classes(FIELD_ACCESS)
def get_field_updates_by_id(request, id):
    try:
        id = int(id)
    except (ValueError, TypeError):
        return Response({'error': 'Invalid ID'}, status=400)
    return Response(list(field_service.get_updates_for_field(id)))


@api_view(['PATCH'])
@permission_classes(MANAGER_ONLY)
def update_field(request, id):
    serializer = FieldSerializer(data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data

    try:
        id = int(id)
    except (ValueError, TypeError):
        return Response({'error': 'Invalid ID'}, status=400)
    data = request.data
    try:
        field = field_service.update_field(id, data)
    except Exception as e:
        if 'not found' in str(e).lower():
            return Response({'error': 'Field not found'}, status=404)
        return Response({'error': str(e)}, status=400)
    return Response({'message': 'Field updated', 'field': {'id': field.id, 'name': field.name}})


#Agents 
@api_view(['GET'])
def get_agents(request):
    user_id = request.user.id
    agents = list(field_service.get_all_agents())
    if not is_manager(user_id):
        agents = [a for a in agents if a['user_id'] == user_id]
    return Response(agents)


@api_view(['GET'])
@permission_classes(FIELD_ACCESS)
def get_field_agents(request, id):
    try:
        id = int(id)
    except (ValueError, TypeError):
        return Response({'error': 'Invalid ID'}, status=400)
    return Response(list(field_service.get_agents_for_field(id)))


#Issues
@api_view(['GET'])
@permission_classes(FIELD_ACCESS)
def get_field_issues(request, id):
    try:
        id = int(id)
    except (ValueError, TypeError):
        return Response({'error': 'Invalid ID'}, status=400)
    return Response(field_service.get_issues_for_field(id))


@api_view(['GET'])
@permission_classes(MANAGER_ONLY)
def get_all_issues(request):
    return Response(field_service.get_all_issues())


@api_view(['GET'])
@permission_classes(MANAGER_ONLY)
def get_issues_count(request):
    return Response({'open_issues': field_service.get_open_issues_count()})


@api_view(['PATCH'])
@permission_classes(MANAGER_ONLY)
def update_issue_status(request, id):
    data = request.data
    try:
        issue = field_service.update_issue_status(id, data.get('status'), changed_by=request.user)

    except ObjectDoesNotExist:
        return Response({'error': f'Issue with id {id} not found'}, status=404)
    except Exception as e:
        return Response({'error': str(e)}, status=400)
    return Response({'message': 'Issue status updated', 'issue': {'id': issue.id, 'status': issue.status}})