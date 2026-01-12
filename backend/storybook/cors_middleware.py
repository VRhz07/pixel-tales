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
        # If it's an OPTIONS request, return 200 OK with CORS headers
        # The CorsMiddleware will add the proper CORS headers
        if request.method == 'OPTIONS':
            from django.http import HttpResponse
            response = HttpResponse()
            response.status_code = 200
            return response
        
        response = self.get_response(request)
        return response
