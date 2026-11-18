from rest_framework.permissions import BasePermission
# from apps.agent.views import 

class IsManager(BasePermission):
    """Allow access only to users with role='manager' in their Profile."""
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        try:
            return request.user.profile.role == 'manager'
        except Exception:
            return False


class IsFieldAgent(BasePermission):
    """Allow access only to users with role='field_agent'."""
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        try:
            return request.user.profile.role == 'field_agent'
        except Exception:
            return False
