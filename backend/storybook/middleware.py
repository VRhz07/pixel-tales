"""
Custom middleware for WebSocket JWT authentication
"""
from channels.db import database_sync_to_async
from channels.middleware import BaseMiddleware
from django.contrib.auth.models import AnonymousUser
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import TokenError, InvalidToken
from urllib.parse import parse_qs

User = get_user_model()


@database_sync_to_async
def get_user_from_token(token_string):
    """
    Get user from JWT token
    """
    try:
        # Decode and verify the token
        access_token = AccessToken(token_string)
        user_id = access_token['user_id']
        
        # Get user from database
        user = User.objects.get(id=user_id)
        return user
    except TokenError as e:
        print(f"❌ Token authentication failed (TokenError): {e}")
        return AnonymousUser()
    except InvalidToken as e:
        print(f"❌ Token authentication failed (InvalidToken): {e}")
        return AnonymousUser()
    except User.DoesNotExist as e:
        print(f"❌ Token authentication failed (User not found): {e}")
        return AnonymousUser()
    except Exception as e:
        print(f"❌ Unexpected token authentication error: {e}")
        return AnonymousUser()


class JWTAuthMiddleware(BaseMiddleware):
    """
    Custom middleware to authenticate WebSocket connections using JWT tokens
    Token can be passed as:
    1. Query parameter: ws://host/path/?token=<jwt_token>
    2. Header (if supported by client): Authorization: Bearer <jwt_token>
    """
    
    async def __call__(self, scope, receive, send):
        # Get token from query string
        query_string = scope.get('query_string', b'').decode()
        query_params = parse_qs(query_string)
        token = query_params.get('token', [None])[0]
        
        # If no token in query string, check headers
        if not token:
            headers = dict(scope.get('headers', []))
            auth_header = headers.get(b'authorization', b'').decode()
            if auth_header.startswith('Bearer '):
                token = auth_header.split(' ')[1]
        
        # Authenticate user
        if token:
            scope['user'] = await get_user_from_token(token)
        else:
            scope['user'] = AnonymousUser()
        
        return await super().__call__(scope, receive, send)


def JWTAuthMiddlewareStack(inner):
    """
    Helper function to wrap WebSocket connections with JWT authentication
    """
    return JWTAuthMiddleware(inner)


# HTTP Middleware for tracking user activity
from django.utils import timezone
from django.utils.deprecation import MiddlewareMixin
from .models import UserProfile


class UpdateLastSeenMiddleware(MiddlewareMixin):
    """
    Middleware to update user's last_seen timestamp on every request.
    Only updates if more than 1 minute has passed to reduce database writes.
    """
    
    def process_request(self, request):
        """Update last_seen timestamp for authenticated users"""
        if request.user.is_authenticated:
            try:
                profile = request.user.profile
                now = timezone.now()
                
                # Only update if last update was more than 1 minute ago (to reduce DB writes)
                if not profile.last_seen or (now - profile.last_seen).total_seconds() > 60:
                    UserProfile.objects.filter(id=profile.id).update(
                        last_seen=now,
                        is_online=True
                    )
            except (UserProfile.DoesNotExist, AttributeError):
                pass
        return None

