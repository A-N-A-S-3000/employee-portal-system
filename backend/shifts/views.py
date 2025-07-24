from django.shortcuts import render

# Create your views here.
from django.shortcuts import render

# Create your views here.
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from rest_framework.generics import (
    ListAPIView,
    RetrieveAPIView,
    CreateAPIView,
    UpdateAPIView,
    DestroyAPIView
)
from .models import Shift
from .serializers import ShiftSerializer
from rest_framework.permissions import IsAdminUser

@api_view(['GET'])
def api_root(request):
    """
    API root for Shift Swaps
    """
    api_urls = {
        'list': '/list/',
        'detail': '/detail/<int:pk>/',
        'create': '/create/',
        'update': '/update/<int:pk>/',
        'delete': '/delete/<int:pk>/',
    }
    return Response(api_urls)

# 🟢 List all swaps
class List(ListAPIView):
    queryset = Shift.objects.all()
    serializer_class = ShiftSerializer
    permission_classes = [IsAdminUser]

# 🟢 View one swap by ID
class Details(RetrieveAPIView):
    queryset = Shift.objects.all()
    serializer_class = ShiftSerializer
    lookup_field = 'pk'
    permission_classes = [IsAdminUser]

# 🟢 Create a new swap
class Create(CreateAPIView):
    queryset = Shift.objects.all()
    serializer_class = ShiftSerializer
    permission_classes = [IsAdminUser]

# 🟢 Update a swap
class Update(UpdateAPIView):
    queryset = Shift.objects.all()
    serializer_class = ShiftSerializer
    lookup_field = 'pk'
    permission_classes = [IsAdminUser]

# 🟢 Delete a swap
class Delete(DestroyAPIView):
    queryset = Shift.objects.all()
    serializer_class = ShiftSerializer
    lookup_field = 'pk'
    permission_classes = [IsAdminUser]
