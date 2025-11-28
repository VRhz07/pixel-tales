"""
JWT Authentication views for the Storybook platform
"""
from rest_framework import status, serializers
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import authenticate, login as auth_login
from django.contrib.auth.models import User
from django.db import transaction
from django.conf import settings
import json

from .models import UserProfile
from .jwt_decorators import jwt_required


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Custom JWT token serializer that accepts email instead of username
    and includes user profile information in the response
    """
    email = serializers.CharField(write_only=True)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Remove the username field since we're using email
        if 'username' in self.fields:
            del self.fields['username']
    
    def validate(self, attrs):
        from rest_framework_simplejwt.exceptions import AuthenticationFailed

        email = attrs.get('email')
        password = attrs.get('password')

        if not email or not password:
            raise AuthenticationFailed('Email and password are required')

        # Find user by email
        try:
            users = User.objects.filter(email=email)
            if not users.exists():
                raise AuthenticationFailed('Invalid email or password')

            # Try to authenticate with each user that has this email
            user = None
            for potential_user in users:
                authenticated_user = authenticate(
                    username=potential_user.username,
                    password=password
                )
                if authenticated_user:
                    user = authenticated_user
                    break

            if not user:
                raise AuthenticationFailed('Invalid email or password')

            # Set the user for token generation
            self.user = user

        except AuthenticationFailed:
            raise
        except Exception as e:
            raise AuthenticationFailed('Invalid email or password')
        
        # Generate tokens manually since we can't call parent validate
        refresh = RefreshToken.for_user(self.user)

        # Add user profile information to the response
        try:
            profile = self.user.profile
            user_data = {
                'id': self.user.id,
                'username': self.user.username,
                'email': self.user.email,
                'name': profile.display_name,  # Add 'name' field for frontend compatibility
                'first_name': self.user.first_name,
                'last_name': self.user.last_name,
                'user_type': profile.user_type,
                'display_name': profile.display_name,
                'avatar': profile.avatar_emoji or (profile.avatar.url if profile.avatar else '📚'),
            }
        except UserProfile.DoesNotExist:
            user_data = {
                'id': self.user.id,
                'username': self.user.username,
                'email': self.user.email,
                'name': self.user.get_full_name() or self.user.username,  # Add 'name' field
                'first_name': self.user.first_name,
                'last_name': self.user.last_name,
                'user_type': 'child',  # default
                'display_name': self.user.get_full_name() or self.user.username,
                'avatar': '📚',
            }

        return {
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': user_data
        }


class CustomTokenObtainPairView(TokenObtainPairView):
    """
    Custom JWT login view that returns user information along with tokens
    """
    serializer_class = CustomTokenObtainPairSerializer


@api_view(['POST'])
@permission_classes([AllowAny])
def jwt_register(request):
    """
    JWT-based user registration endpoint with email verification
    """
    try:
        from .models import EmailVerification
        from .email_service import EmailService
        from django.utils import timezone
        from datetime import timedelta
        import random
        import string
        
        data = request.data
        print(f"🔧 Registration data received: {data}")
        
        name = data.get('name', '').strip()
        email = data.get('email', '').strip()
        password = data.get('password', '')
        confirm_password = data.get('confirm_password', '')
        user_type = data.get('user_type', 'child')
        
        print(f"🔧 Parsed data: name='{name}', email='{email}', user_type='{user_type}', password_len={len(password)}")
        
        # Validation
        if not all([name, email, password, confirm_password]):
            return Response({
                'error': 'All fields are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if password != confirm_password:
            return Response({
                'error': 'Passwords do not match'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if len(password) < 8:
            return Response({
                'error': 'Password must be at least 8 characters long'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate email format
        import re
        email_regex = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_regex, email):
            return Response({
                'error': 'Invalid email format'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Create username from name
        username = name.replace(' ', '').lower()
        
        # Check if user already exists
        if User.objects.filter(username=username).exists():
            return Response({
                'error': 'Username already exists. Please use a different name.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if email exists - allow re-registration for unverified accounts
        existing_user = User.objects.filter(email=email).first()
        if existing_user:
            if existing_user.is_active:
                # Email belongs to an active/verified account
                return Response({
                    'error': 'Email already exists and is verified'
                }, status=status.HTTP_400_BAD_REQUEST)
            else:
                # Email belongs to an unverified account - delete it and allow re-registration
                print(f"🔧 Deleting unverified account for {email} to allow re-registration")
                existing_user.delete()  # This will cascade delete the profile and verification records
        
        # Generate 6-digit verification code
        verification_code = ''.join(random.choices(string.digits, k=6))
        
        # Calculate expiry time
        expiry_minutes = getattr(settings, 'EMAIL_VERIFICATION_EXPIRY_MINUTES', 15)
        expires_at = timezone.now() + timedelta(minutes=expiry_minutes)
        
        # Create user and profile in a transaction
        with transaction.atomic():
            # Create user (initially inactive until email verified)
            user = User.objects.create_user(
                username=username,
                email=email,
                password=password,
                is_active=False  # User must verify email first
            )
            
            # Set name fields
            if ' ' in name:
                first_name, last_name = name.rsplit(' ', 1)
                user.first_name = first_name
                user.last_name = last_name
            else:
                user.first_name = name
            user.save()
            
            # Create profile
            profile = UserProfile.objects.create(
                user=user,
                user_type=user_type,
                display_name=name,
                avatar="",
                bio=""
            )
            
            # Create email verification record
            email_verification = EmailVerification.objects.create(
                user=user,
                email=email,
                verification_code=verification_code,
                expires_at=expires_at
            )
        
        # Send verification email via SendGrid
        email_sent = EmailService.send_verification_email(
            to_email=email,
            verification_code=verification_code,
            user_name=name
        )
        
        if not email_sent:
            # If email fails, we should still allow the user to proceed
            # but log the error
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Failed to send verification email to {email}")

        return Response({
            'message': 'Registration successful! Please check your email for the verification code.',
            'user_id': user.id,
            'email': user.email,
            'requires_verification': True,
            'email_sent': email_sent
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Registration error: {str(e)}")
        return Response({
            'error': f'An error occurred during registration: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
def jwt_logout(request):
    """
    JWT logout endpoint - blacklists the refresh token
    """
    try:
        refresh_token = request.data.get('refresh')
        if refresh_token:
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({
                'message': 'Successfully logged out'
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'error': 'Refresh token is required'
            }, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({
            'error': 'Invalid token'
        }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'PATCH'])
def jwt_user_profile(request):
    """
    Get or update current user profile information
    """
    try:
        user = request.user
        profile = user.profile
        
        # GET: Return user profile
        if request.method == 'GET':
            user_data = {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'name': profile.display_name,  # Add 'name' field for frontend compatibility
                'first_name': user.first_name,
                'last_name': user.last_name,
                'user_type': profile.user_type,
                'display_name': profile.display_name,
                'avatar': profile.avatar_emoji or (profile.avatar.url if profile.avatar else '📚'),
                'bio': profile.bio,
                'date_of_birth': profile.date_of_birth,
                'created_at': profile.created_at,
            }
            
            return Response({
                'success': True,
                'data': user_data
            }, status=status.HTTP_200_OK)
        
        # PUT/PATCH: Update user profile
        elif request.method in ['PUT', 'PATCH']:
            data = request.data
            
            # Update display name
            if 'name' in data:
                profile.display_name = data['name']
                # Also update user's first name
                user.first_name = data['name']
                user.save()
            
            # Update avatar emoji
            if 'avatar' in data:
                profile.avatar_emoji = data['avatar']
            
            # Update bio if provided
            if 'bio' in data:
                profile.bio = data['bio']
            
            # Save profile
            profile.save()
            
            # Return updated profile with the emoji avatar from request
            user_data = {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'name': profile.display_name,  # Add 'name' field for frontend compatibility
                'first_name': user.first_name,
                'last_name': user.last_name,
                'user_type': profile.user_type,
                'display_name': profile.display_name,
                'avatar': profile.avatar_emoji or data.get('avatar', '📚'),  # Return the emoji avatar
                'bio': profile.bio,
                'date_of_birth': profile.date_of_birth,
                'created_at': profile.created_at,
            }
            
            return Response({
                'success': True,
                'data': user_data,
                'message': 'Profile updated successfully'
            }, status=status.HTTP_200_OK)
        
    except UserProfile.DoesNotExist:
        return Response({
            'success': False,
            'error': 'User profile not found'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Profile error: {str(e)}")
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@jwt_required
def jwt_create_session(request):
    """
    Create a Django session for a JWT-authenticated user.
    This allows the user to access dashboard views with regular browser navigation.
    """
    try:
        # The user is already authenticated via JWT (thanks to @jwt_required decorator)
        user = request.user

        # Create a Django session for this user
        auth_login(request, user)

        return Response({
            'message': 'Session created successfully',
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'user_type': user.profile.user_type if hasattr(user, 'profile') else None
            }
        }, status=status.HTTP_200_OK)

    except Exception as e:
        return Response({
            'error': f'Failed to create session: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
def verify_email(request):
    """
    Verify email using the 6-digit code sent to user's email
    """
    try:
        from .models import EmailVerification
        from django.utils import timezone
        
        data = request.data
        email = data.get('email', '').strip()
        verification_code = data.get('verification_code', '').strip()
        
        # Validation
        if not email or not verification_code:
            return Response({
                'error': 'Email and verification code are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Find the user by email
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({
                'error': 'User with this email does not exist'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Check if user is already verified
        if user.is_active:
            return Response({
                'message': 'Email is already verified. You can log in.',
                'already_verified': True
            }, status=status.HTTP_200_OK)
        
        # Find the most recent verification code for this email
        try:
            email_verification = EmailVerification.objects.filter(
                email=email,
                is_verified=False
            ).order_by('-created_at').first()
            
            if not email_verification:
                return Response({
                    'error': 'No pending verification found for this email'
                }, status=status.HTTP_404_NOT_FOUND)
            
            # Check if code has expired
            if email_verification.is_expired():
                return Response({
                    'error': 'Verification code has expired. Please request a new code.',
                    'expired': True
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Verify the code
            if email_verification.verification_code != verification_code:
                return Response({
                    'error': 'Invalid verification code'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Mark verification as complete
            with transaction.atomic():
                email_verification.mark_verified()
                user.is_active = True
                user.save()
            
            return Response({
                'message': 'Email verified successfully! You can now log in.',
                'verified': True,
                'user_id': user.id,
                'email': user.email
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'error': f'Verification failed: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
    except Exception as e:
        return Response({
            'error': f'An error occurred: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
def resend_verification_code(request):
    """
    Resend verification code to user's email
    """
    try:
        from .models import EmailVerification
        from .email_service import EmailService
        from django.utils import timezone
        from datetime import timedelta
        import random
        import string
        
        data = request.data
        email = data.get('email', '').strip()
        
        if not email:
            return Response({
                'error': 'Email is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Find the user by email
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({
                'error': 'User with this email does not exist'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Check if user is already verified
        if user.is_active:
            return Response({
                'message': 'Email is already verified',
                'already_verified': True
            }, status=status.HTTP_200_OK)
        
        # Generate new verification code
        verification_code = ''.join(random.choices(string.digits, k=6))
        
        # Calculate expiry time
        expiry_minutes = getattr(settings, 'EMAIL_VERIFICATION_EXPIRY_MINUTES', 15)
        expires_at = timezone.now() + timedelta(minutes=expiry_minutes)
        
        # Create new verification record
        with transaction.atomic():
            # Invalidate old codes
            EmailVerification.objects.filter(
                email=email,
                is_verified=False
            ).update(is_verified=True)  # Mark old codes as used
            
            # Create new verification
            email_verification = EmailVerification.objects.create(
                user=user,
                email=email,
                verification_code=verification_code,
                expires_at=expires_at
            )
        
        # Send verification email
        email_sent = EmailService.send_verification_email(
            to_email=email,
            verification_code=verification_code,
            user_name=user.profile.display_name if hasattr(user, 'profile') else user.username
        )
        
        if not email_sent:
            return Response({
                'error': 'Failed to send verification email. Please try again later.',
                'email_sent': False
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        return Response({
            'message': 'Verification code sent successfully! Please check your email.',
            'email_sent': True,
            'expires_in_minutes': expiry_minutes
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Resend verification error: {str(e)}")
        return Response({
            'error': f'An error occurred: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
def verify_password(request):
    """
    Verify a user's password without logging them in.
    Used for parent verification when switching from child view.
    """
    try:
        email = request.data.get('email')
        password = request.data.get('password')

        if not email or not password:
            return Response({
                'success': False,
                'error': 'Email and password are required'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Find user by email
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({
                'success': False,
                'error': 'Invalid credentials'
            }, status=status.HTTP_401_UNAUTHORIZED)

        # Verify password
        authenticated_user = authenticate(
            username=user.username,
            password=password
        )

        if authenticated_user:
            return Response({
                'success': True,
                'message': 'Password verified successfully'
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'success': False,
                'error': 'Invalid credentials'
            }, status=status.HTTP_401_UNAUTHORIZED)

    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Password verification error: {str(e)}")
        return Response({
            'success': False,
            'error': 'An error occurred during verification'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
def send_password_reset_code(request):
    """
    Send password reset code to user's email
    """
    try:
        from .models import EmailVerification
        from .email_service import EmailService
        from django.utils import timezone
        from datetime import timedelta
        import random
        import string
        import logging
        
        logger = logging.getLogger(__name__)
        
        data = request.data
        email = data.get('email', '').strip()
        
        if not email:
            return Response({
                'error': 'Email is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Find the user by email
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            # For security, don't reveal if email exists or not
            return Response({
                'message': 'If an account with that email exists, a reset code has been sent.',
                'email_sent': True
            }, status=status.HTTP_200_OK)
        
        # Generate 6-digit reset code
        reset_code = ''.join(random.choices(string.digits, k=6))
        
        # Calculate expiry time
        expiry_minutes = getattr(settings, 'EMAIL_VERIFICATION_EXPIRY_MINUTES', 15)
        expires_at = timezone.now() + timedelta(minutes=expiry_minutes)
        
        # Create password reset verification record
        with transaction.atomic():
            # Invalidate old reset codes for this email
            EmailVerification.objects.filter(
                email=email,
                is_verified=False
            ).update(is_verified=True)  # Mark old codes as used
            
            # Create new reset code
            email_verification = EmailVerification.objects.create(
                user=user,
                email=email,
                verification_code=reset_code,
                expires_at=expires_at
            )
        
        # Send reset code email
        email_sent = EmailService.send_password_reset_email(
            to_email=email,
            reset_code=reset_code,
            user_name=user.profile.display_name if hasattr(user, 'profile') else user.username
        )
        
        if not email_sent:
            logger.error(f"Failed to send password reset email to {email}")
            return Response({
                'error': 'Failed to send reset code. Please try again later.',
                'email_sent': False
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        return Response({
            'message': 'Password reset code sent successfully! Please check your email.',
            'email_sent': True,
            'expires_in_minutes': expiry_minutes
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Send password reset code error: {str(e)}")
        return Response({
            'error': f'An error occurred: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
def verify_password_reset_code(request):
    """
    Verify password reset code
    """
    try:
        from .models import EmailVerification
        
        data = request.data
        email = data.get('email', '').strip()
        reset_code = data.get('code', '').strip()
        
        # Validation
        if not email or not reset_code:
            return Response({
                'error': 'Email and reset code are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Find the user by email
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({
                'error': 'Invalid email or code'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Find the most recent reset code for this email
        try:
            email_verification = EmailVerification.objects.filter(
                email=email,
                is_verified=False
            ).order_by('-created_at').first()
            
            if not email_verification:
                return Response({
                    'error': 'No pending reset code found for this email'
                }, status=status.HTTP_404_NOT_FOUND)
            
            # Check if code has expired
            if email_verification.is_expired():
                return Response({
                    'error': 'Reset code has expired. Please request a new code.',
                    'expired': True
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Verify the code
            if email_verification.verification_code != reset_code:
                return Response({
                    'error': 'Invalid reset code'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Code is valid, don't mark as verified yet (will be marked when password is reset)
            return Response({
                'message': 'Reset code verified successfully',
                'verified': True
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'error': f'Verification failed: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
    except Exception as e:
        return Response({
            'error': f'An error occurred: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
def reset_password(request):
    """
    Reset user password using verified reset code
    """
    try:
        from .models import EmailVerification
        
        data = request.data
        email = data.get('email', '').strip()
        reset_code = data.get('code', '').strip()
        new_password = data.get('new_password', '')
        
        # Validation
        if not email or not reset_code or not new_password:
            return Response({
                'error': 'Email, reset code, and new password are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if len(new_password) < 8:
            return Response({
                'error': 'Password must be at least 8 characters long'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Find the user by email
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({
                'error': 'Invalid email or code'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Find the most recent reset code for this email
        try:
            email_verification = EmailVerification.objects.filter(
                email=email,
                is_verified=False
            ).order_by('-created_at').first()
            
            if not email_verification:
                return Response({
                    'error': 'No pending reset code found for this email'
                }, status=status.HTTP_404_NOT_FOUND)
            
            # Check if code has expired
            if email_verification.is_expired():
                return Response({
                    'error': 'Reset code has expired. Please request a new code.',
                    'expired': True
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Verify the code
            if email_verification.verification_code != reset_code:
                return Response({
                    'error': 'Invalid reset code'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Reset password
            with transaction.atomic():
                user.set_password(new_password)
                user.save()
                
                # Mark verification as used
                email_verification.mark_verified()
            
            return Response({
                'message': 'Password reset successfully! You can now log in with your new password.',
                'success': True
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Password reset error: {str(e)}")
            return Response({
                'error': f'Password reset failed: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Password reset error: {str(e)}")
        return Response({
            'error': f'An error occurred: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password(request):
    """
    Change user password (requires authentication)
    """
    try:
        current_password = request.data.get('current_password')
        new_password = request.data.get('new_password')
        
        if not current_password or not new_password:
            return Response({
                'error': 'Current password and new password are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        user = request.user
        
        # Verify current password
        if not user.check_password(current_password):
            return Response({
                'error': 'Current password is incorrect'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate new password strength
        if len(new_password) < 8:
            return Response({
                'error': 'New password must be at least 8 characters long'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if new password is same as current
        if current_password == new_password:
            return Response({
                'error': 'New password must be different from current password'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Set new password
        user.set_password(new_password)
        user.save()
        
        return Response({
            'success': True,
            'message': 'Password changed successfully'
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Password change error: {str(e)}")
        return Response({
            'error': f'Failed to change password: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def delete_account(request):
    """
    Delete user account (requires authentication and password confirmation)
    """
    try:
        password = request.data.get('password')
        
        if not password:
            return Response({
                'error': 'Password is required to delete account'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        user = request.user
        
        # Verify password
        if not user.check_password(password):
            return Response({
                'error': 'Incorrect password'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Delete the user account
        user.delete()
        
        return Response({
            'success': True,
            'message': 'Account deleted successfully'
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Account deletion error: {str(e)}")
        return Response({
            'error': f'Failed to delete account: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
