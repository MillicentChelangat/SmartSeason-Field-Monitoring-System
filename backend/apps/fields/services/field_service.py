from apps.fields.services.field_status import compute_field_status
from apps.fields.models import Field, FieldUpdate, Profile, FieldIssue


def get_all_fields():
    fields = Field.objects.prefetch_related('updates').all()
    result = []
    for field in fields:
        result.append({
            'id': field.id,
            'name': field.name,
            'crop_type': field.crop_type,
            'planting_date': str(field.planting_date),
            'current_stage': field.current_stage,
            'location': field.location,
            'assigned_agent_id': field.assigned_agent_id,
            'created_at': str(field.created_at),
            'status': compute_field_status(field),
        })
    return result

def get_field_by_id(field_id):
    return Field.objects.filter(id=field_id).values(
        'id', 'name', 'crop_type', 'planting_date',
        'current_stage', 'location', 'assigned_agent_id', 'created_at'
    ).first()


def create_field(name, crop_type, planting_date, current_stage='planted',
                 location='', assigned_agent_id=None):
    if not name or not crop_type or not planting_date:
        raise ValueError("Name, crop type and planting date are required")
    return Field.objects.create(
        name=name, crop_type=crop_type, planting_date=planting_date,
        current_stage=current_stage, location=location,
        assigned_agent_id=assigned_agent_id,
    )


def assign_field(field_id, agent_id):
    field = Field.objects.get(id=field_id)
    field.assigned_agent_id = int(agent_id) if agent_id else None
    field.save()
    return field


def delete_field(field_id):
    field = Field.objects.get(id=field_id)
    field.delete()


def add_field_update(field_id, stage, notes='', agent_id=None):
    if not stage:
        raise ValueError("Stage is required")
    field = Field.objects.get(id=field_id)
    field.current_stage = stage
    field.save()
    return FieldUpdate.objects.create(
        field=field, agent_id=agent_id, stage=stage, notes=notes
    )

def update_field(id, data):
    try:
        field = Field.objects.get(id=id)
    except Field.DoesNotExist:
        raise ValueError("Field not found")
    
    if 'name' in data:
        field.name = data['name']
    if 'crop_type' in data:
        field.crop_type = data['crop_type']
    if 'planting_date' in data:
        field.planting_date = data['planting_date']
    if 'current_stage' in data:
        field.current_stage = data['current_stage']
    if 'location' in data:
        field.location = data['location']
    
    field.save()
    return field


def get_all_field_updates():
    updates = FieldUpdate.objects.all().order_by('-created_at').select_related('agent')
    return [
        {
            'id': u.id,
            'field_id': u.field_id,
            'stage': u.stage,
            'notes': u.notes,
            'created_at': str(u.created_at),
            'agent_id': u.agent_id,
            'agent_name': (u.agent.get_full_name() or u.agent.username) if u.agent else 'Unknown',
        }
        for u in updates
    ]


def get_updates_for_field(field_id):
    return FieldUpdate.objects.filter(field_id=field_id).order_by('-created_at').values(
        'id', 'field_id', 'stage', 'notes', 'created_at', 'agent_id'
    )


def get_agents_for_field(field_id):
    try:
        field = Field.objects.get(id=field_id)
    except Field.DoesNotExist:
        return []
    if not field.assigned_agent:
        return []
    profile = Profile.objects.filter(user=field.assigned_agent).values(
        'id', 'full_name', 'role', 'user_id'
    ).first()
    return [profile] if profile else []


def get_all_agents():
    profiles = Profile.objects.filter(role='field_agent').select_related('user')
    result = []
    for p in profiles:
        fields = p.user.assigned_fields.values('id', 'name', 'crop_type')
        result.append({
            'id': p.id,
            'user_id': p.user.id,
            'full_name': p.full_name,
            'email': p.user.username,
            'phone': p.phone,
            'residence': p.residence,
            'created_at': p.user.date_joined.isoformat(),
            'fields': list(fields),
        })
    return result


def get_dashboard_data(user):
    try:
        role = user.profile.role
    except Exception:
        role = 'admin'

    if role == 'admin':
        fields = list(Field.objects.values())
    else:
        fields = list(Field.objects.filter(assigned_agent=user).values())

    return {'role': role, 'fields': fields}


def report_issue(field_id, reported_by_id, issue_type, severity, description=''):
    field = Field.objects.get(id=field_id)
    issue = FieldIssue.objects.create(
        field=field,
        reported_by_id=reported_by_id,
        issue_type=issue_type,
        severity=severity,
        description=description,
    )
    # Auto-update field status if severity is high
    if severity == 'high':
        field.current_stage = field.current_stage  # keep stage
        field.save()
    return issue


def get_issues_for_field(field_id):
    issues = FieldIssue.objects.filter(field_id=field_id).order_by('-created_at')
    return [_serialize_issue(i) for i in issues]


def get_all_issues():
    issues = FieldIssue.objects.all().order_by('-created_at').select_related('field', 'reported_by')
    return [_serialize_issue(i) for i in issues]


def update_issue_status(issue_id, status):
    issue = FieldIssue.objects.get(id=issue_id)
    issue.status = status
    issue.save()
    return issue


def get_open_issues_count():
    return FieldIssue.objects.exclude(status='resolved').count()


def _serialize_issue(issue):
    return {
        'id': issue.id,
        'field_id': issue.field_id,
        'field_name': issue.field.name,
        'reported_by_id': issue.reported_by_id,
        'reported_by_name': issue.reported_by.get_full_name() or issue.reported_by.username if issue.reported_by else 'Unknown',
        'issue_type': issue.issue_type,
        'severity': issue.severity,
        'description': issue.description,
        'status': issue.status,
        'created_at': str(issue.created_at),
        'updated_at': str(issue.updated_at),
    }
