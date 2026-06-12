from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

class Profile(models.Model):
    ROLE_CHOICES = [
        ('admin', 'Admin'),           
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