"""
Custom decorators for JWT and session authentication
"""
from functools import wraps
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from django.contrib.auth.models import AnonymousUser


def jwt_or_session_required(view_func):
    """
    Decorator that allows both JWT and session authentication.
    Useful for API endpoints that need to work with both web and API clients.
    """
    @wraps(view_func)
    def _wrapped_view(request, *args, **kwargs):
        # Check if user is already authenticated via session
        if request.user.is_authenticated:
            return view_func(request, *args, **kwargs)
        
        # Try JWT authentication
        jwt_auth = JWTAuthentication()
        try:
            # Get the user and token from JWT
            user_token_tuple = jwt_auth.authenticate(request)
            if user_token_tuple is not None:
                user, token = user_token_tuple
                request.user = user
                request.auth = token
                return view_func(request, *args, **kwargs)
        except (InvalidToken, TokenError):
            pass
        
        # If neither authentication method worked
        if request.content_type == 'application/json' or request.path.startswith('/api/'):
            # Return JSON response for API requests
            return JsonResponse({
                'error': 'Authentication required',
                'detail': 'You must be logged in to access this resource.'
            }, status=401)
        else:
            # Redirect to login for web requests
            return login_required(view_func)(request, *args, **kwargs)
    
    return _wrapped_view


def jwt_required(view_func):
    """
    Decorator that requires JWT authentication only.
    Returns JSON error responses for unauthenticated requests.
    """
    @wraps(view_func)
    def _wrapped_view(request, *args, **kwargs):
        jwt_auth = JWTAuthentication()
        try:
            # Get the user and token from JWT
            user_token_tuple = jwt_auth.authenticate(request)
            if user_token_tuple is not None:
                user, token = user_token_tuple
                request.user = user
                request.auth = token
                return view_func(request, *args, **kwargs)
            else:
                return JsonResponse({
                    'error': 'Authentication required',
                    'detail': 'Valid JWT token required.'
                }, status=401)
        except InvalidToken:
            return JsonResponse({
                'error': 'Invalid token',
                'detail': 'The provided token is invalid or expired.'
            }, status=401)
        except TokenError as e:
            return JsonResponse({
                'error': 'Token error',
                'detail': str(e)
            }, status=401)
    
    return _wrapped_view


def api_authentication_required(view_func):
    """
    Decorator for API views that accepts both JWT and session authentication
    but always returns JSON responses.
    """
    @wraps(view_func)
    def _wrapped_view(request, *args, **kwargs):
        authenticated = False
        
        # Check session authentication first
        if request.user.is_authenticated:
            authenticated = True
        else:
            # Try JWT authentication
            jwt_auth = JWTAuthentication()
            try:
                user_token_tuple = jwt_auth.authenticate(request)
                if user_token_tuple is not None:
                    user, token = user_token_tuple
                    request.user = user
                    request.auth = token
                    authenticated = True
            except (InvalidToken, TokenError):
                pass
        
        if not authenticated:
            return JsonResponse({
                'error': 'Authentication required',
                'detail': 'You must be logged in to access this API endpoint.'
            }, status=401)
        
        return view_func(request, *args, **kwargs)
    
    return _wrapped_view


def user_type_required(*allowed_types):
    """
    Decorator that checks if the authenticated user has one of the allowed user types.
    Works with both JWT and session authentication.
    
    Usage:
    @user_type_required('parent', 'teacher')
    def parent_or_teacher_only_view(request):
        pass
    """
    def decorator(view_func):
        @wraps(view_func)
        def _wrapped_view(request, *args, **kwargs):
            # First ensure user is authenticated
            if not request.user.is_authenticated:
                if request.content_type == 'application/json' or request.path.startswith('/api/'):
                    return JsonResponse({
                        'error': 'Authentication required'
                    }, status=401)
                else:
                    return login_required(view_func)(request, *args, **kwargs)
            
            # Check user type
            try:
                user_type = request.user.profile.user_type
                if user_type not in allowed_types:
                    if request.content_type == 'application/json' or request.path.startswith('/api/'):
                        return JsonResponse({
                            'error': 'Permission denied',
                            'detail': f'This endpoint requires one of the following user types: {", ".join(allowed_types)}'
                        }, status=403)
                    else:
                        from django.http import HttpResponseForbidden
                        return HttpResponseForbidden('You do not have permission to access this page.')
            except AttributeError:
                # User has no profile
                if request.content_type == 'application/json' or request.path.startswith('/api/'):
                    return JsonResponse({
                        'error': 'User profile not found'
                    }, status=400)
                else:
                    from django.http import HttpResponseBadRequest
                    return HttpResponseBadRequest('User profile not found.')
            
            return view_func(request, *args, **kwargs)
        
        return _wrapped_view
    return decorator


def parent_required(view_func):
    """
    Convenience decorator for parent-only views
    """
    return user_type_required('parent')(view_func)


def teacher_required(view_func):
    """
    Convenience decorator for teacher-only views
    """
    return user_type_required('teacher')(view_func)


def parent_or_teacher_required(view_func):
    """
    Convenience decorator for parent or teacher views
    """
    return user_type_required('parent', 'teacher')(view_func)
