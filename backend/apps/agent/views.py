from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.agent.serializers import FieldSerializer, FieldUpdateSerializer, FieldIssueSerializer
from apps.agent.services.agent_service import ( get_fields_for_agent, get_updates_for_agent )
from apps.agent.services.agent_service import (add_field_update)
from apps.agent.services import agent_service

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_fields(request):
    fields = get_fields_for_agent(request.user.id)
    return Response(FieldSerializer(fields, many=True).data)


# @api_view(['GET'])
# @permission_classes([IsAuthenticated])
# def get_updates(request):
#     updates = get_updates_for_agent(request.user.id)
#     return Response(FieldUpdateSerializer(updates, many=True).data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_field_update(request, id):
    serializer = FieldUpdateSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data

    try:
        update = agent_service.add_field_update(
            field_id=int(id),
            stage=data['stage'],
            notes=data.get('notes', ''),
            agent_id=request.user.id,
        )
    except ValueError as e:
        return Response({'error': str(e)}, status=400)
    return Response({'message': 'Update saved', 'update': {'id': update.id}}, status=201)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def report_field_issue(request, id):
    serializer = FieldIssueSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data
    try:
        issue = agent_service.report_issue(
            field_id=id,
            reported_by_id=request.user.id,
            issue_type=data.get('issue_type'),
            severity=data.get('severity', 'low'),
            description=data.get('description', ''),
        )
    except Exception as e:
        return Response({'error': str(e)}, status=400)
    return Response({'message': 'Issue reported', 'issue': {'id': issue.id}}, status=201)
