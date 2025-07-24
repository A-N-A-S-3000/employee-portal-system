from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from rest_framework.generics import ListAPIView, RetrieveAPIView, CreateAPIView, UpdateAPIView, DestroyAPIView
from .models import Leave
from .serializers import LeaveSerializer
from rest_framework.permissions import IsAdminUser

@api_view(['GET'])
def api_root(request):
    return Response({
        'list': '/list/',
        'detail': '/detail/<str:pk>/',
        'create': '/create/',
        'update': '/update/<str:pk>/',
        'delete': '/delete/<str:pk>/',
    })

class List(ListAPIView):
    queryset = Leave.objects.all()
    serializer_class = LeaveSerializer
    permission_classes = [IsAdminUser]

class Details(RetrieveAPIView):
    queryset = Leave.objects.all()
    serializer_class = LeaveSerializer
    lookup_field = 'pk'
    permission_classes = [IsAdminUser]

class Create(CreateAPIView):
    queryset = Leave.objects.all()
    serializer_class = LeaveSerializer
    permission_classes = [IsAdminUser]

class Update(UpdateAPIView):
    queryset = Leave.objects.all()
    serializer_class = LeaveSerializer
    lookup_field = 'pk'
    permission_classes = [IsAdminUser]

class Delete(DestroyAPIView):
    queryset = Leave.objects.all()
    serializer_class = LeaveSerializer
    lookup_field = 'pk'
    permission_classes = [IsAdminUser]
