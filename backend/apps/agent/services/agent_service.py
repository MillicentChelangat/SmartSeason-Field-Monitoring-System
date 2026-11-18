from apps.fields.models import Field, FieldUpdate, FieldIssue

def get_fields_for_agent(user_id):
    return Field.objects.filter(assigned_agent_id=user_id)


def get_updates_for_agent(user_id):
    return FieldUpdate.objects.filter(agent_id=user_id).order_by('-created_at')

def add_field_update(field_id, stage, notes='', agent_id=None):
    if not stage:
        raise ValueError("Stage is required")
    field = Field.objects.get(id=field_id)
    field.current_stage = stage
    field.save()
    return FieldUpdate.objects.create(
        field=field, agent_id=agent_id, stage=stage, notes=notes
    )

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
        field.current_stage = field.current_stage  
        field.save()
    return issue
