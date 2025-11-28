"""
WebSocket URL routing for collaborative features
"""
from django.urls import re_path
from . import consumers
from .notification_consumer import NotificationConsumer

websocket_urlpatterns = [
    # Real-time notifications and presence
    re_path(r'ws/notifications/$', NotificationConsumer.as_asgi()),
    
    # Collaborative drawing sessions
    re_path(r'ws/collaborate/(?P<session_id>[\w-]+)/$', consumers.CollaborationConsumer.as_asgi()),
]
