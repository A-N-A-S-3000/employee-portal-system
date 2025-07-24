from django.db import models
from employees.models import Employee

class Leave(models.Model):
    LEAVE_TYPES = [
        ('sick', 'Sick Leave'),
        ('annual', 'Annual Leave'),
        ('emergency', 'Emergency Leave'),
        ('other', 'Other'),
    ]

    employee = models.ForeignKey(Employee, on_delete=models.CASCADE)
    leave_type = models.CharField(max_length=20, choices=LEAVE_TYPES)
    start_date = models.DateField()
    end_date = models.DateField()
    reason = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.employee.full_name} - {self.leave_type} ({self.start_date} to {self.end_date})"
