from rest_framework import serializers
from .models import ShiftSwap

class ShiftSwapSerializer(serializers.ModelSerializer):
    class Meta:
        model = ShiftSwap
        fields = '__all__'
