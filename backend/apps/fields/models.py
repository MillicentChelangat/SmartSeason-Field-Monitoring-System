from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

from django.conf import settings

class Profile(models.Model):
    ROLE_CHOICES = [
        ('manager', 'Manager'),           
        ('field_agent', 'Field Agent'),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE)
    full_name = models.CharField(max_length=100, default='') 
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='field_agent')
    phone = models.CharField(max_length=20, blank=True, default='')
    residence = models.CharField(max_length=200, blank=True, default='')

    def __str__(self):
        return f"{self.full_name} ({self.role})"

class Field(models.Model):
    STAGE_CHOICES = [
        ('planted', 'Planted'),      
        ('growing', 'Growing'),
        ('ready', 'Ready'),
        ('harvested', 'Harvested'),
    ]

    name = models.CharField(max_length=100)
    crop_type = models.CharField(max_length=100)
    planting_date = models.DateField()
    current_stage = models.CharField(max_length=20, choices=STAGE_CHOICES, default='planted')
    location = models.CharField(max_length=200, blank=True, default='')  
    assigned_agent = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_fields' )
    created_at = models.DateTimeField(default=timezone.now)  
    updated_at = models.DateTimeField(auto_now=True)      

    def __str__(self):
        return f"{self.name} ({self.crop_type})"

class FieldUpdate(models.Model):                          
    field = models.ForeignKey(Field, on_delete=models.CASCADE, related_name='updates')
    agent = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name="field_updates_as_agent")
    stage = models.CharField(max_length=20, choices=Field.STAGE_CHOICES)
    notes = models.TextField(blank=True, default='')
    pest_detected = models.BooleanField(default=False)
    disease_detected = models.BooleanField(default=False)
    irrigation_issue = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    assigned_agent = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name="field_updates")

    def __str__(self):
        return f"Update on {self.field.name} by {self.agent}"
        
class FieldIssue(models.Model):
    ISSUE_TYPE_CHOICES = [
        ('pest', 'Pest Infestation'),
        ('disease', 'Crop Disease'),
        ('drought', 'Drought / Water Stress'),
        ('flood', 'Flood / Waterlogging'),
        ('crop_failure', 'Crop Failure'),
        ('poor_germination', 'Poor Germination'),
        ('nutrient_deficiency', 'Nutrient Deficiency'),
        ('other', 'Other'),
    ]

    SEVERITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
    ]

    STATUS_CHOICES = [
        ('open', 'Open'),
        ('in_progress', 'In Progress'),
        ('resolved', 'Resolved'),
    ]

    field = models.ForeignKey(Field, on_delete=models.CASCADE, related_name='issues')
    reported_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='reported_issues')
    issue_type = models.CharField(max_length=30, choices=ISSUE_TYPE_CHOICES)
    severity = models.CharField(max_length=10, choices=SEVERITY_CHOICES, default='low')
    description = models.TextField(blank=True, default='')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='open')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.issue_type} on {self.field.name} ({self.severity})"

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        open_issues = self.field.issues.exclude(status='resolved')
        if not open_issues.exists():
            self.field.status = 'healthy'
        else:
            has_high_severity = open_issues.filter(severity='high').exists()
            if has_high_severity:
                self.field.status = 'critical'
            else:
                self.field.status = 'at-risk'
        
        self.field.save()

photo = models.ImageField(upload_to='issue_photos/', blank=True, null=True)

class FieldIssueHistory(models.Model):
    issue = models.ForeignKey(FieldIssue, on_delete=models.CASCADE, related_name='history')
    old_status = models.CharField(max_length=50)
    new_status = models.CharField(max_length=50)
    changed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    changed_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.issue.id}: {self.old_status} -> {self.new_status} by {self.changed_by}"
    