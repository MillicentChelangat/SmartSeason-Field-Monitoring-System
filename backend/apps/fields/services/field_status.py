from django.utils import timezone
from apps.fields.services.field_status import compute_field_status

def compute_field_status(field):

    latest_update = field.updates.order_by('-created_at').first()

    if not latest_update:
        return "monitor"

    days_since_update = (
        timezone.now() - latest_update.created_at
    ).days

    notes = (latest_update.notes or "").lower()

    if "disease" in notes:
        return "critical"

    if "pest" in notes:
        return "at_risk"

    if days_since_update > 14:
        return "monitor"

    return "healthy"