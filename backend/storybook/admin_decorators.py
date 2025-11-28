"""
Admin Authentication Decorators
Separate from regular user authentication
"""
from functools import wraps
from rest_framework.response import Response
from rest_framework import status
from .admin_auth import verify_admin_token_middleware


def admin_required(view_func):
    """
    Decorator to require admin authentication
    Uses separate admin token system
    """
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        # Get admin token from header
        auth_header = request.headers.get('Authorization', '')
        
        if not auth_header.startswith('AdminBearer '):
            return Response({
                'success': False,
                'error': 'Admin authentication required'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        token = auth_header.replace('AdminBearer ', '')
        
        # Verify admin token
        user = verify_admin_token_middleware(token)
        
        if not user:
            return Response({
                'success': False,
                'error': 'Invalid or expired admin token'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        # Attach user to request
        request.admin_user = user
        
        return view_func(request, *args, **kwargs)
    
    return wrapper
