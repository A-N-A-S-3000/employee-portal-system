from django.contrib.auth import authenticate
from rest_framework import status, serializers
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer


class AdminTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        
        # Check if user is admin (staff or superuser)
        if not (self.user.is_staff or self.user.is_superuser):
            raise serializers.ValidationError(
                'Access denied. Admin privileges required.'
            )
        
        # Add user info to response
        data['user'] = {
            'id': self.user.id,
            'username': self.user.username,
            'email': self.user.email,
            'is_staff': self.user.is_staff,
            'is_superuser': self.user.is_superuser,
        }
        
        return data


class AdminTokenObtainPairView(TokenObtainPairView):
    serializer_class = AdminTokenObtainPairSerializer


@api_view(['POST'])
@permission_classes([AllowAny])
def admin_login(request):
    """
    Custom admin login endpoint that only allows staff/superuser access
    """
    username = request.data.get('username')
    password = request.data.get('password')
    
    if not username or not password:
        return Response(
            {'error': 'Username and password are required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Authenticate user
    user = authenticate(username=username, password=password)
    
    if not user:
        return Response(
            {'error': 'Invalid username or password'},
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    if not user.is_active:
        return Response(
            {'error': 'User account is disabled'},
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    # Check if user is admin
    if not (user.is_staff or user.is_superuser):
        return Response(
            {'error': 'Access denied. Admin privileges required.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Generate tokens
    refresh = RefreshToken.for_user(user)
    access_token = refresh.access_token
    
    return Response({
        'access': str(access_token),
        'refresh': str(refresh),
        'user': {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'is_staff': user.is_staff,
            'is_superuser': user.is_superuser,
        }
    })


@api_view(['GET'])
def admin_profile(request):
    """
    Get current admin user profile
    """
    user = request.user
    
    if not (user.is_staff or user.is_superuser):
        return Response(
            {'error': 'Access denied. Admin privileges required.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    return Response({
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'first_name': user.first_name,
        'last_name': user.last_name,
        'is_staff': user.is_staff,
        'is_superuser': user.is_superuser,
        'last_login': user.last_login,
        'date_joined': user.date_joined,
    })


@api_view(['POST'])
def admin_logout(request):
    """
    Logout admin user by blacklisting the refresh token
    """
    try:
        refresh_token = request.data.get('refresh')
        if refresh_token:
            token = RefreshToken(refresh_token)
            token.blacklist()
        
        return Response({'message': 'Successfully logged out'})
    except Exception as e:
        return Response(
            {'error': 'Invalid refresh token'},
            status=status.HTTP_400_BAD_REQUEST
        )
