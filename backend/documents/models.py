from django.db import models
from employees.models import Employee

class Document(models.Model):
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE)
    doc_type = models.CharField(max_length=100)
    issue_date = models.DateField()
    expiry_date = models.DateField()
    alert_before_days = models.IntegerField(default=7)
    document_id = models.CharField(max_length=30, null=True, blank=True)
    document_link = models.URLField(max_length=200, null=True, blank=True)
