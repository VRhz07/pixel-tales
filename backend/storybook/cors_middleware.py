"""
Custom CORS middleware to handle OPTIONS requests without authentication.
This ensures CORS preflight requests work properly.
"""


class CorsPreflightMiddleware:
    """
    Middleware to handle CORS preflight OPTIONS requests before authentication.
    Django REST Framework requires authentication by default, which blocks CORS preflight.
    """
    
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # If it's an OPTIONS request, let it pass through to get CORS headers
        # but don't require authentication
        if request.method == 'OPTIONS':
            from django.http import HttpResponse
            response = HttpResponse()
            response.status_code = 200
            # Manually add CORS headers since we're returning early
            response['Access-Control-Allow-Origin'] = '*'
            response['Access-Control-Allow-Methods'] = 'DELETE, GET, OPTIONS, PATCH, POST, PUT'
            response['Access-Control-Allow-Headers'] = 'accept, accept-encoding, authorization, content-type, dnt, origin, user-agent, x-csrftoken, x-requested-with'
            response['Access-Control-Max-Age'] = '86400'
            return response
        
        response = self.get_response(request)
        return response
