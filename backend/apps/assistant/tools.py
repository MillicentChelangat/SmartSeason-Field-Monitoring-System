"""The tools the AI model is allowed to use.

Each tool is an ordinary Python function that receives the *logged-in user's id*
as its first argument and only ever touches data that user may see. The model
never gets database access of its own: it can only ask for one of these tools
by name, and `run_tool` enforces the role rules before anything runs.

Read tools execute immediately. Write tools (`write=True`) never execute from a
model request; the agent turns them into a "please confirm" step for the user.
"""
from dataclasses import dataclass
from datetime import timedelta
from typing import Callable

from django.contrib.auth.models import User
from django.db.models import Max
from django.utils import timezone

from apps.common.access import can_access_field, get_role, is_admin
from apps.fields.models import Field, FieldIssue, FieldUpdate, Profile
from apps.fields.services import field_service
from apps.fields.services.field_status import compute_field_status

STAGES = [c[0] for c in Field.STAGE_CHOICES]
ISSUE_TYPES = [c[0] for c in FieldIssue.ISSUE_TYPE_CHOICES]
SEVERITIES = [c[0] for c in FieldIssue.SEVERITY_CHOICES]
ISSUE_STATUSES = [c[0] for c in FieldIssue.STATUS_CHOICES]
MAX_ROWS = 15
MAX_TEXT = 200


class ToolError(Exception):
    """A problem the model should be told about so it can explain or retry."""


# ── helpers ───────────────────────────────────────────────────────────────────

def _scope(user_id):
    """Plain queryset of the fields this user may see (admins: all, agents: assigned)."""
    return Field.objects.all() if is_admin(user_id) else Field.objects.filter(assigned_agent_id=user_id)


def _visible_fields(user_id):
    """Same fields, with the agent and last-update time attached for display."""
    return _scope(user_id).select_related('assigned_agent').annotate(last_update_at=Max('updates__created_at'))


def _agent_name(user):
    if not user:
        return None
    profile = Profile.objects.filter(user=user).first()
    return (profile.full_name if profile and profile.full_name else user.username)


def _clip(text):
    text = text or ''
    return text if len(text) <= MAX_TEXT else text[:MAX_TEXT] + '...'


def _field_row(f):
    last = getattr(f, 'last_update_at', None)
    return {
        'id': f.id,
        'name': f.name,
        'crop_type': f.crop_type,
        'stage': f.current_stage,
        'status': compute_field_status(f),
        'location': f.location,
        'planting_date': str(f.planting_date),
        'assigned_agent': _agent_name(f.assigned_agent),
        'last_update_at': last.isoformat() if last else None,
        'days_since_update': (timezone.now() - last).days if last else None,
    }


def _get_field_or_error(user_id, field_id):
    try:
        field_id = int(field_id)
    except (TypeError, ValueError):
        raise ToolError('field_id must be a number.')
    if not Field.objects.filter(id=field_id).exists() or not can_access_field(user_id, field_id):
        # Same message for "missing" and "not yours" so nothing leaks.
        raise ToolError(f'No accessible field with id {field_id}.')
    return Field.objects.get(id=field_id)


def _get_issue_or_error(issue_id):
    try:
        return FieldIssue.objects.select_related('field').get(id=int(issue_id))
    except (FieldIssue.DoesNotExist, TypeError, ValueError):
        raise ToolError(f'No issue with id {issue_id}.')


def _check_choice(value, allowed, label):
    if value not in allowed:
        raise ToolError(f'{label} must be one of: {", ".join(allowed)}.')


# ── read tools ────────────────────────────────────────────────────────────────

def list_fields(user_id, stage=None, status=None, crop_type=None):
    if stage:
        _check_choice(stage, STAGES, 'stage')
    qs = _visible_fields(user_id)
    if stage:
        qs = qs.filter(current_stage=stage)
    if crop_type:
        qs = qs.filter(crop_type__icontains=crop_type)
    rows = [_field_row(f) for f in qs.order_by('name')]
    if status:
        rows = [r for r in rows if r['status'] == status]
    return {'count': len(rows), 'fields': rows[:MAX_ROWS]}


def get_field_details(user_id, field_id):
    field = _get_field_or_error(user_id, field_id)
    row = _field_row(_visible_fields(user_id).get(id=field.id))
    updates = FieldUpdate.objects.filter(field=field).order_by('-created_at')[:10]
    issues = FieldIssue.objects.filter(field=field).order_by('-created_at')[:10]
    row['recent_updates'] = [{
        'date': u.created_at.date().isoformat(), 'stage': u.stage, 'notes': _clip(u.notes),
        'pest_detected': u.pest_detected, 'disease_detected': u.disease_detected,
        'irrigation_issue': u.irrigation_issue,
    } for u in updates]
    row['issues'] = [{
        'id': i.id, 'type': i.issue_type, 'severity': i.severity, 'status': i.status,
        'description': _clip(i.description), 'date': i.created_at.date().isoformat(),
    } for i in issues]
    return row


def find_stale_fields(user_id, days=7):
    try:
        days = max(1, int(days))
    except (TypeError, ValueError):
        raise ToolError('days must be a number.')
    rows = [_field_row(f) for f in _visible_fields(user_id).exclude(current_stage='harvested')]
    stale = [r for r in rows if r['days_since_update'] is None or r['days_since_update'] >= days]
    stale.sort(key=lambda r: (r['days_since_update'] is not None, -(r['days_since_update'] or 0)))
    return {'days': days, 'count': len(stale), 'fields': stale[:MAX_ROWS],
            'note': 'days_since_update null means the field has never had an update.'}


def search_updates(user_id, keyword=None, flag=None, field_id=None, days=None):
    qs = FieldUpdate.objects.filter(field__in=_scope(user_id)).select_related('field')
    if keyword:
        qs = qs.filter(notes__icontains=keyword)
    if flag:
        _check_choice(flag, ['pest', 'disease', 'irrigation'], 'flag')
        qs = qs.filter(**{'irrigation_issue' if flag == 'irrigation' else f'{flag}_detected': True})
    if field_id is not None:
        qs = qs.filter(field=_get_field_or_error(user_id, field_id))
    if days is not None:
        try:
            qs = qs.filter(created_at__gte=timezone.now() - timedelta(days=int(days)))
        except (TypeError, ValueError):
            raise ToolError('days must be a number.')
    total = qs.count()
    rows = [{
        'field_id': u.field_id, 'field_name': u.field.name, 'date': u.created_at.date().isoformat(),
        'stage': u.stage, 'notes': _clip(u.notes), 'pest_detected': u.pest_detected,
        'disease_detected': u.disease_detected, 'irrigation_issue': u.irrigation_issue,
    } for u in qs.order_by('-created_at')[:MAX_ROWS]]
    return {'total_matches': total, 'updates': rows}


def list_issues(user_id, status=None, severity=None):
    if status:
        _check_choice(status, ISSUE_STATUSES + ['unresolved'], 'status')
    if severity:
        _check_choice(severity, SEVERITIES, 'severity')
    qs = FieldIssue.objects.filter(field__in=_scope(user_id)).select_related('field')
    if status == 'unresolved':
        qs = qs.exclude(status='resolved')  # open + in progress, same as the sidebar count
    elif status:
        qs = qs.filter(status=status)
    if severity:
        qs = qs.filter(severity=severity)
    rows = [{
        'id': i.id, 'field_id': i.field_id, 'field_name': i.field.name, 'type': i.issue_type,
        'severity': i.severity, 'status': i.status, 'description': _clip(i.description),
        'date': i.created_at.date().isoformat(),
    } for i in qs.order_by('-created_at')[:MAX_ROWS]]
    return {'count': qs.count(), 'issues': rows}


def season_summary(user_id):
    rows = [_field_row(f) for f in _visible_fields(user_id)]
    by_stage, by_status = {}, {}
    for r in rows:
        by_stage[r['stage']] = by_stage.get(r['stage'], 0) + 1
        by_status[r['status']] = by_status.get(r['status'], 0) + 1
    open_issues = FieldIssue.objects.filter(field__in=_scope(user_id)).exclude(status='resolved').count()
    stale = sum(1 for r in rows if r['stage'] != 'harvested'
                and (r['days_since_update'] is None or r['days_since_update'] >= 7))
    return {'total_fields': len(rows), 'by_stage': by_stage, 'by_status': by_status,
            'open_issues': open_issues, 'fields_without_update_for_7_days': stale}


def list_agents(user_id):
    agents = field_service.get_all_agents()
    if not is_admin(user_id):
        agents = [a for a in agents if a['user_id'] == user_id]
    return {'agents': [{
        'user_id': a['user_id'], 'name': a['full_name'], 'residence': a['residence'],
        'fields': [f['name'] for f in a['fields']],
    } for a in agents]}


# ── write tools (run only after the user confirms) ────────────────────────────

def add_field_update(user_id, field_id, stage, notes=''):
    field = _get_field_or_error(user_id, field_id)
    _check_choice(stage, STAGES, 'stage')
    update = field_service.add_field_update(field.id, stage, notes or '', agent_id=user_id)
    return {'done': True, 'update_id': update.id, 'field': field.name, 'new_stage': stage}


ADMIN_CANT_REPORT = ("Admins don't report issues, field agents do. "
                     "As an admin you can review issues and mark them in progress or resolved.")


def report_issue(user_id, field_id, issue_type, severity, description=''):
    if is_admin(user_id):
        raise ToolError(ADMIN_CANT_REPORT)
    field = _get_field_or_error(user_id, field_id)
    _check_choice(issue_type, ISSUE_TYPES, 'issue_type')
    _check_choice(severity, SEVERITIES, 'severity')
    issue = field_service.report_issue(field.id, user_id, issue_type, severity, description or '')
    return {'done': True, 'issue_id': issue.id, 'field': field.name}


def update_issue_status(user_id, issue_id, status):
    if not is_admin(user_id):
        raise ToolError('Only admins can change the status of an issue.')
    _check_choice(status, ISSUE_STATUSES, 'status')
    issue = _get_issue_or_error(issue_id)
    field_service.update_issue_status(issue.id, status)
    return {'done': True, 'issue_id': issue.id, 'field': issue.field.name, 'new_status': status}


def assign_field(user_id, field_id, agent_id):
    if not is_admin(user_id):
        raise ToolError('Only admins can assign fields.')
    field = _get_field_or_error(user_id, field_id)
    try:
        agent_id = int(agent_id)
    except (TypeError, ValueError):
        raise ToolError('agent_id must be a number.')
    if get_role(agent_id) != 'field_agent':
        raise ToolError(f'No field agent with user id {agent_id}.')
    field_service.assign_field(field.id, agent_id)
    return {'done': True, 'field': field.name, 'assigned_agent_id': agent_id}


# ── registry ──────────────────────────────────────────────────────────────────

@dataclass
class Tool:
    name: str
    description: str
    parameters: dict
    func: Callable
    write: bool = False
    admin_only: bool = False
    agent_only: bool = False


def _params(properties=None, required=()):
    return {'type': 'object', 'properties': properties or {}, 'required': list(required)}


_FIELD_ID = {'type': 'integer', 'description': 'The numeric field id.'}

TOOLS = [
    Tool('list_fields',
         'List the fields the user can see, optionally filtered by growth stage, health status or crop. '
         'Each field includes stage, status, assigned agent and days since its last update.',
         _params({'stage': {'type': 'string', 'enum': STAGES},
                  'status': {'type': 'string', 'enum': ['healthy', 'at_risk', 'critical', 'monitor']},
                  'crop_type': {'type': 'string', 'description': 'Crop name, e.g. maize.'}}),
         list_fields),
    Tool('get_field_details',
         'Get one field with its recent updates (notes, pest/disease/irrigation flags) and issues.',
         _params({'field_id': _FIELD_ID}, ['field_id']), get_field_details),
    Tool('find_stale_fields',
         'Find unharvested fields that have had no update for at least N days (default 7).',
         _params({'days': {'type': 'integer', 'description': 'Minimum days without an update.'}}),
         find_stale_fields),
    Tool('search_updates',
         'Search field update notes by keyword and/or a flag (pest, disease, irrigation), '
         'optionally for one field or the last N days.',
         _params({'keyword': {'type': 'string'},
                  'flag': {'type': 'string', 'enum': ['pest', 'disease', 'irrigation']},
                  'field_id': _FIELD_ID,
                  'days': {'type': 'integer', 'description': 'Only updates from the last N days.'}}),
         search_updates),
    Tool('list_issues',
         'List reported field issues, optionally filtered by status or severity. '
         "For questions about 'open' or 'current' issues use status 'unresolved' "
         "(open + in progress). status 'open' means only issues nobody has started on.",
         _params({'status': {'type': 'string', 'enum': ISSUE_STATUSES + ['unresolved']},
                  'severity': {'type': 'string', 'enum': SEVERITIES}}),
         list_issues),
    Tool('season_summary',
         'Overall numbers: fields by stage and status, open issues, fields with no recent update.',
         _params(), season_summary),
    Tool('list_agents',
         'List field agents and the fields assigned to them (agents only see themselves).',
         _params(), list_agents),
    Tool('add_field_update',
         'Record a new update on a field: its current stage plus notes. Changes data, so the user '
         'must confirm first.',
         _params({'field_id': _FIELD_ID, 'stage': {'type': 'string', 'enum': STAGES},
                  'notes': {'type': 'string'}}, ['field_id', 'stage']),
         add_field_update, write=True),
    Tool('report_issue',
         'Report a problem on a field (pest, disease, drought, etc.). Field agents only: admins do '
         'not report issues. Changes data, so the user must confirm first.',
         _params({'field_id': _FIELD_ID, 'issue_type': {'type': 'string', 'enum': ISSUE_TYPES},
                  'severity': {'type': 'string', 'enum': SEVERITIES},
                  'description': {'type': 'string'}}, ['field_id', 'issue_type', 'severity']),
         report_issue, write=True, agent_only=True),
    Tool('update_issue_status',
         'Change the status of a reported issue to open, in_progress or resolved (admins only). '
         'Get the issue id from list_issues first. Changes data, so the user must confirm first.',
         _params({'issue_id': {'type': 'integer', 'description': 'The issue id.'},
                  'status': {'type': 'string', 'enum': ISSUE_STATUSES}}, ['issue_id', 'status']),
         update_issue_status, write=True, admin_only=True),
    Tool('assign_field',
         'Assign a field to a field agent (admins only). Changes data, so the user must confirm first.',
         _params({'field_id': _FIELD_ID, 'agent_id': {'type': 'integer', 'description': 'The agent user id.'}},
                 ['field_id', 'agent_id']),
         assign_field, write=True, admin_only=True),
]

TOOLS_BY_NAME = {t.name: t for t in TOOLS}


def tools_for(user_id):
    """Tool specs shown to the model; admin-only tools are hidden from agents."""
    admin = is_admin(user_id)
    return [{'name': t.name, 'description': t.description, 'parameters': t.parameters}
            for t in TOOLS if (not t.agent_only if admin else not t.admin_only)]


def _clean_args(tool, args):
    """Keep only arguments the tool declares, so the model can't pass anything else."""
    allowed = tool.parameters['properties']
    args = args if isinstance(args, dict) else {}
    cleaned = {k: v for k, v in args.items() if k in allowed}
    missing = [r for r in tool.parameters['required'] if cleaned.get(r) in (None, '')]
    if missing:
        raise ToolError(f'Missing required argument(s): {", ".join(missing)}.')
    return cleaned


def run_tool(user_id, name, args, *, allow_write=False):
    """Run a tool for this user. Returns a JSON-safe dict; never raises ToolError."""
    tool = TOOLS_BY_NAME.get(name)
    if tool is None:
        return {'error': f'Unknown tool {name}.'}
    if tool.admin_only and not is_admin(user_id):
        return {'error': 'You do not have permission to do that.'}
    if tool.agent_only and is_admin(user_id):
        return {'error': ADMIN_CANT_REPORT}
    if tool.write and not allow_write:
        return {'error': 'This action needs the user to confirm it first.'}
    try:
        return tool.func(user_id, **_clean_args(tool, args))
    except ToolError as e:
        return {'error': str(e)}
    except Exception:
        return {'error': 'That action failed. Check the details and try again.'}


def check_write(user_id, name, args):
    """Validate a write request *without* running it. Returns an error string or None."""
    tool = TOOLS_BY_NAME.get(name)
    if tool is None or not tool.write:
        return 'Unknown action.'
    if tool.admin_only and not is_admin(user_id):
        return 'You do not have permission to do that.'
    if tool.agent_only and is_admin(user_id):
        return ADMIN_CANT_REPORT
    try:
        cleaned = _clean_args(tool, args)
        if name == 'update_issue_status':
            _get_issue_or_error(cleaned['issue_id'])
            _check_choice(cleaned['status'], ISSUE_STATUSES, 'status')
            return None
        _get_field_or_error(user_id, cleaned['field_id'])
        if 'stage' in cleaned:
            _check_choice(cleaned['stage'], STAGES, 'stage')
        if 'issue_type' in cleaned:
            _check_choice(cleaned['issue_type'], ISSUE_TYPES, 'issue_type')
            _check_choice(cleaned['severity'], SEVERITIES, 'severity')
        if name == 'assign_field' and get_role(int(cleaned['agent_id'])) != 'field_agent':
            raise ToolError(f"No field agent with user id {cleaned['agent_id']}.")
    except ToolError as e:
        return str(e)
    except (TypeError, ValueError):
        return 'Some details are invalid.'
    return None


def describe_write(user_id, name, args):
    """A short plain-English line for the confirmation prompt."""
    args = _clean_args(TOOLS_BY_NAME[name], args)
    if name == 'update_issue_status':
        issue = FieldIssue.objects.select_related('field').get(id=int(args['issue_id']))
        return (f'Mark the {issue.get_issue_type_display().lower()} issue on "{issue.field.name}" '
                f'as {args["status"].replace("_", " ")}.')
    field = Field.objects.get(id=int(args['field_id']))
    if name == 'add_field_update':
        notes = f' with the note "{_clip(args.get("notes"))}"' if args.get('notes') else ''
        return f'Record an update on "{field.name}": stage → {args["stage"]}{notes}.'
    if name == 'report_issue':
        return (f'Report a {args["severity"]}-severity {args["issue_type"]} issue on "{field.name}"'
                f'{": " + _clip(args.get("description")) if args.get("description") else ""}.')
    if name == 'assign_field':
        agent = _agent_name(User.objects.filter(id=int(args['agent_id'])).first())
        return f'Assign "{field.name}" to {agent}.'
    return name