from rest_framework import serializers
from apps.fields.models import Field, FieldUpdate, FieldIssue


class FieldSerializer(serializers.ModelSerializer):
    class Meta:
        model = Field
        fields = ['id', 'name', 'crop_type', 'planting_date',
                  'current_stage', 'location', 'assigned_agent_id',
                  'created_at']
        read_only_fields = fields


# class FieldUpdateSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = FieldUpdate
#         fields = ['id', 'field_id', 'agent_id', 'stage',
#                   'notes', 'created_at']
#         read_only_fields = fields


class FieldUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = FieldUpdate
        fields = ['id', 'field_id', 'stage',
                  'notes', 'created_at']
        read_only_fields = ['id', 'field_id', 'stage', 'created_at' ]

# Issues
class FieldIssueSerializer(serializers.ModelSerializer):
    class Meta:
        model = FieldIssue
        fields = ['id', 'field', 'reported_by', 'issue_type', 'severity',
                  'description', 'status', 'created_at', 'updated_at']
        read_only_fields = ['id', 'field', 'reported_by',
                            'status', 'created_at', 'updated_at']