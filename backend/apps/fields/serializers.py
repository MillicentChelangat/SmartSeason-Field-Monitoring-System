from django.contrib.auth.models import User
from rest_framework import serializers
from apps.fields.models import Profile, Field, FieldUpdate, FieldIssue

class RegisterSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(min_length=8, write_only=True)
    full_name = serializers.CharField(required=False, allow_blank=True, default='')


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)


class RegisterAgentSerializer(RegisterSerializer):
    phone = serializers.CharField(required=False, allow_blank=True, default='')
    residence = serializers.CharField(required=False, allow_blank=True, default='')

# Profile
class ProfileSerializer(serializers.ModelSerializer):
    email = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = Profile
        fields = ['full_name', 'email', 'phone', 'residence', 'role']
        read_only_fields = ['role']  

class ProfileUpdateSerializer(serializers.ModelSerializer):
    current_password = serializers.CharField(required=False, write_only=True)
    new_password = serializers.CharField(required=False, min_length=8, write_only=True)

    class Meta:
        model = Profile
        fields = ['full_name', 'phone', 'residence',
                  'current_password', 'new_password']
        extra_kwargs = {f: {'required': False}
                        for f in ['full_name', 'phone', 'residence']}

    def validate(self, attrs):
        if attrs.get('new_password') and not attrs.get('current_password'):
            raise serializers.ValidationError(
                {'current_password': 'Required to set a new password.'})
        return attrs

# Fields
class FieldSerializer(serializers.ModelSerializer):
    assigned_agent_id = serializers.PrimaryKeyRelatedField(
        source='assigned_agent',
        queryset=User.objects.all(),
        required=False,
        allow_null=True,
    )

    class Meta:
        model = Field
        fields = ['id', 'name', 'crop_type', 'planting_date', 'current_stage',
                  'location', 'assigned_agent_id', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class AssignFieldSerializer(serializers.Serializer):
    agent_id = serializers.PrimaryKeyRelatedField(queryset=User.objects.all())


# Field updates
class FieldUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = FieldUpdate
        fields = ['id', 'field', 'agent', 'stage', 'notes',
                  'pest_detected', 'disease_detected',
                  'irrigation_issue', 'created_at']
        read_only_fields = ['id', 'field', 'agent', 'created_at']

# Issues
class FieldIssueSerializer(serializers.ModelSerializer):
    class Meta:
        model = FieldIssue
        fields = ['id', 'field', 'reported_by', 'issue_type', 'severity',
                  'description', 'status', 'created_at', 'updated_at']
        read_only_fields = ['id', 'field', 'reported_by',
                            'status', 'created_at', 'updated_at']


class IssueStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = FieldIssue
        fields = ['status']

class FieldInputSerializer(serializers.ModelSerializer):
    assigned_agent_id = serializers.IntegerField(required=False, allow_null=True)

    class Meta:
        model = Field
        fields = ['name', 'crop_type', 'planting_date',
                  'current_stage', 'location', 'assigned_agent_id']




