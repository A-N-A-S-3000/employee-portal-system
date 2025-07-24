from django.db import models
from employees.models import Employee
from departments.models import Department

class Shift(models.Model):
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE)
    department = models.ForeignKey(Department, on_delete=models.CASCADE)
    start_date = models.DateField()
    end_date = models.DateField()
    location = models.CharField(max_length=100)  # 🔹 New field

    def __str__(self):
        return f"{self.employee.full_name} - {self.start_date} to {self.end_date}"
