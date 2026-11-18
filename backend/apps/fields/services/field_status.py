from django.utils import timezone

def compute_field_status(field):
    """
    Returns one of: 'completed', 'critical', 'at_risk', 'monitor', 'healthy'.
    Calculated dynamically using Field Stages, Field Updates, and active Field Issues.
    """
    print("STATUS CHECK:", field.name, repr(field.current_stage))

    if (field.current_stage or "").lower() == "harvested":
        return "completed"
    active_issues = field.issues.exclude(status='resolved')

    if active_issues.exists():
        if active_issues.filter(severity='high').exists():
            return "critical"
        return "at_risk"

    latest_update = field.updates.order_by('-created_at').first()

    if not latest_update:
        return "monitor"

    days_since_update = (timezone.now() - latest_update.created_at).days

    if days_since_update > 14:
        return "monitor"

    return "healthy"
