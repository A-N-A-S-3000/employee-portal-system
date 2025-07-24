from django.db import models
from employees.models import Employee
from shifts.models import Shift

class ShiftSwap(models.Model):
    from_employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='swaps_given')
    to_employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='swaps_received')
    shift = models.ForeignKey(Shift, on_delete=models.CASCADE)
    reason = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.from_employee.full_name} → {self.to_employee.full_name} on {self.shift.start_date}"
