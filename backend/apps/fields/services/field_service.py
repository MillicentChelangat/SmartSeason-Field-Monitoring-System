from apps.fields.models import Field, FieldUpdate, Profile


def get_all_fields():
    return Field.objects.all().values(
        'id', 'name', 'crop_type', 'planting_date',
        'current_stage', 'location', 'assigned_agent_id', 'created_at'
    )


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
