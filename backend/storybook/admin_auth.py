"""
Separate Admin Authentication System
Independent from regular user authentication
"""
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from datetime import datetime, timedelta
import jwt
from django.conf import settings


def generate_admin_token(user):
    """Generate a separate admin JWT token"""
    payload = {
        'user_id': user.id,
        'username': user.username,
        'email': user.email,
        'is_admin': True,
        'is_staff': user.is_staff,
        'is_superuser': user.is_superuser,
        'exp': datetime.utcnow() + timedelta(hours=24),
        'iat': datetime.utcnow(),
        'token_type': 'admin_access'
    }
    
    token = jwt.encode(payload, settings.SECRET_KEY, algorithm='HS256')
    return token


@api_view(['POST'])
@permission_classes([AllowAny])
def admin_login(request):
    """
    Admin-specific login endpoint
    Separate from regular user authentication
    """
    email = request.data.get('email')
    password = request.data.get('password')
    
    # Debug logging
    print('='*60)
    print('🔐 Admin Login Attempt')
    print(f'Email received: "{email}"')
    print(f'Password received: {"*" * len(password) if password else "None"}')
    print('='*60)
    
    if not email or not password:
        print('❌ Missing email or password')
        return Response({
            'success': False,
            'error': 'Email and password are required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Find user by email (prioritize superuser if multiple exist)
    try:
        # Try to get superuser first
        user = User.objects.filter(email=email, is_superuser=True).first()
        
        if not user:
            # Fall back to staff user
            user = User.objects.filter(email=email, is_staff=True).first()
        
        if not user:
            # Fall back to any user with this email
            user = User.objects.filter(email=email).first()
        
        if not user:
            raise User.DoesNotExist
            
        print(f'✅ User found: {user.username} (superuser: {user.is_superuser}, staff: {user.is_staff})')
    except User.DoesNotExist:
        print(f'❌ No user found with email: {email}')
        return Response({
            'success': False,
            'error': 'Invalid email or password'
        }, status=status.HTTP_401_UNAUTHORIZED)
    
    # Authenticate with password
    print(f'🔐 Authenticating user: {user.username}')
    authenticated_user = authenticate(username=user.username, password=password)
    
    if not authenticated_user:
        print(f'❌ Authentication failed for: {user.username}')
        return Response({
            'success': False,
            'error': 'Invalid email or password'
        }, status=status.HTTP_401_UNAUTHORIZED)
    
    print(f'✅ Authentication successful!')
    
    # Check if user has admin privileges
    if not (user.is_staff or user.is_superuser):
        return Response({
            'success': False,
            'error': 'Access denied. Admin privileges required.'
        }, status=status.HTTP_403_FORBIDDEN)
    
    # Generate admin token
    admin_token = generate_admin_token(user)
    
    # Get user profile
    try:
        profile = user.profile
        display_name = profile.display_name
        user_type = profile.user_type
    except:
        display_name = user.username
        user_type = 'parent'
    
    return Response({
        'success': True,
        'message': 'Admin login successful',
        'admin_token': admin_token,
        'user': {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'display_name': display_name,
            'user_type': user_type,
            'is_staff': user.is_staff,
            'is_superuser': user.is_superuser,
        }
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([AllowAny])
def admin_verify_token(request):
    """
    Verify admin token
    """
    token = request.data.get('token')
    
    if not token:
        return Response({
            'success': False,
            'error': 'Token is required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        # Decode token
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
        
        # Check if it's an admin token
        if payload.get('token_type') != 'admin_access':
            return Response({
                'success': False,
                'error': 'Invalid admin token'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        # Check if user still exists and has admin privileges
        user = User.objects.get(id=payload['user_id'])
        
        if not (user.is_staff or user.is_superuser):
            return Response({
                'success': False,
                'error': 'Admin privileges revoked'
            }, status=status.HTTP_403_FORBIDDEN)
        
        return Response({
            'success': True,
            'valid': True,
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'is_staff': user.is_staff,
                'is_superuser': user.is_superuser,
            }
        }, status=status.HTTP_200_OK)
        
    except jwt.ExpiredSignatureError:
        return Response({
            'success': False,
            'error': 'Token has expired'
        }, status=status.HTTP_401_UNAUTHORIZED)
    except jwt.InvalidTokenError:
        return Response({
            'success': False,
            'error': 'Invalid token'
        }, status=status.HTTP_401_UNAUTHORIZED)
    except User.DoesNotExist:
        return Response({
            'success': False,
            'error': 'User not found'
        }, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
def admin_logout(request):
    """
    Admin logout endpoint
    """
    return Response({
        'success': True,
        'message': 'Admin logged out successfully'
    }, status=status.HTTP_200_OK)


def verify_admin_token_middleware(token):
    """
    Middleware function to verify admin token
    Returns user if valid, None otherwise
    """
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
        
        if payload.get('token_type') != 'admin_access':
            return None
        
        user = User.objects.get(id=payload['user_id'])
        
        if not (user.is_staff or user.is_superuser):
            return None
        
        return user
    except:
        return None
