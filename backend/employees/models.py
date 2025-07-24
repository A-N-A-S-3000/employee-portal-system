from django.db import models
from departments.models import Department

class Employee(models.Model):
    full_name = models.CharField(max_length=100)
    employee_id = models.CharField(max_length=20, unique=True)
    position = models.CharField(max_length=100)
    department = models.ForeignKey(Department, on_delete=models.CASCADE)
    GIN = models.CharField(max_length=20, unique=True, null=True, blank=True)
    phone_number = models.CharField(max_length=15, null=True, blank=True)
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)

    def save(self, *args, **kwargs):
        if not self.employee_id:
            self.employee_id = f"EMP{Employee.objects.count() + 1:04}"
        super().save(*args, **kwargs)

    def __str__(self):
        return self.full_name
