from django.urls import path
from .views import api_root, List, Details, Create, Update, Delete

urlpatterns = [
    path('', api_root, name='swap-api-root'),
    path('list/', List.as_view(), name='swap-list'),
    path('detail/<int:pk>/', Details.as_view(), name='swap-detail'),
    path('create/', Create.as_view(), name='swap-create'),
    path('update/<int:pk>/', Update.as_view(), name='swap-update'),
    path('delete/<int:pk>/', Delete.as_view(), name='swap-delete'),
]
