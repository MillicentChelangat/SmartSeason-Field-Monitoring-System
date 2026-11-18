from django.contrib import admin
from .models import Field, Profile, FieldUpdate, FieldIssue, FieldIssueHistory

admin.site.register(Field)
admin.site.register(Profile)
admin.site.register(FieldUpdate)
admin.site.register(FieldIssue)
admin.site.register(FieldIssueHistory)
