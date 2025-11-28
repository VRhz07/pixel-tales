"""
WebSocket consumer for real-time notifications and user presence
"""
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import User


class NotificationConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for handling real-time notifications and online presence
    """
    
    async def connect(self):
        """Handle WebSocket connection"""
        self.user = self.scope.get('user')
        
        # Check if user is authenticated
        if not self.user or not self.user.is_authenticated:
            await self.close()
            return
        
        # Join user's personal notification room
        self.room_group_name = f'notifications_{self.user.id}'
        
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        
        await self.accept()
        
        # Mark user as online
        await self.set_user_online(True)
        
        # Broadcast user's online status to friends
        await self.broadcast_online_status(True)
        
        # Send initial connection confirmation
        await self.send(text_data=json.dumps({
            'type': 'connection',
            'status': 'connected',
            'user_id': self.user.id
        }))
    
    async def disconnect(self, close_code):
        """Handle WebSocket disconnection"""
        if hasattr(self, 'room_group_name'):
            # Mark user as offline
            await self.set_user_online(False)
            
            # Broadcast user's offline status to friends
            await self.broadcast_online_status(False)
            
            # Leave room group
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )
    
    async def receive(self, text_data):
        """Handle incoming WebSocket messages"""
        try:
            data = json.loads(text_data)
            message_type = data.get('type')
            
            if message_type == 'ping':
                # Respond to ping with pong
                await self.send(text_data=json.dumps({
                    'type': 'pong'
                }))
            elif message_type == 'mark_read':
                # Mark notification as read
                notification_id = data.get('notification_id')
                if notification_id:
                    await self.mark_notification_read(notification_id)
                    
        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Invalid JSON'
            }))
    
    # Event handlers for group messages
    async def collaboration_invite(self, event):
        """Send collaboration invite notification to client"""
        # Extract notification data
        notification = event.get('notification', {})
        
        # Build the message with all necessary fields
        message_data = {
            'id': notification.get('id'),
            'sender_id': notification.get('sender'),
            'sender_name': notification.get('sender_name'),
            'session_id': notification.get('session_id') or (notification.get('data', {}).get('session_id') if isinstance(notification.get('data'), dict) else None),
            'story_title': notification.get('story_title') or (notification.get('data', {}).get('story_title') if isinstance(notification.get('data'), dict) else None),
            'created_at': notification.get('created_at'),
            'message_type': 'collaboration_invite'
        }
        
        await self.send(text_data=json.dumps({
            'type': 'collaboration_invite',
            'message': message_data
        }))
    
    async def new_message(self, event):
        """Send new message notification to client"""
        await self.send(text_data=json.dumps({
            'type': 'new_message',
            'message': event['message']
        }))
    
    async def friend_request(self, event):
        """Send friend request notification to client"""
        await self.send(text_data=json.dumps({
            'type': 'friend_request',
            'friendship': event['friendship']
        }))
    
    async def friend_request_accepted(self, event):
        """Send friend request accepted notification to client"""
        await self.send(text_data=json.dumps({
            'type': 'friend_request_accepted',
            'friendship': event['friendship']
        }))
    
    async def friend_online(self, event):
        """Notify user that a friend came online"""
        await self.send(text_data=json.dumps({
            'type': 'friend_online',
            'user_id': event['user_id'],
            'username': event['username']
        }))
    
    async def friend_offline(self, event):
        """Notify user that a friend went offline"""
        await self.send(text_data=json.dumps({
            'type': 'friend_offline',
            'user_id': event['user_id'],
            'username': event['username']
        }))
    
    async def notification(self, event):
        """Send generic notification to client"""
        await self.send(text_data=json.dumps({
            'type': 'notification',
            'notification': event['notification']
        }))
    
    async def collaboration_session_started(self, event):
        """Notify participant that collaboration session has started"""
        await self.send(text_data=json.dumps({
            'type': 'collaboration_session_started',
            'session_id': event['session_id'],
            'story_title': event['story_title']
        }))
    
    async def collaboration_host_left(self, event):
        """Notify participant that host has left the session"""
        await self.send(text_data=json.dumps({
            'type': 'collaboration_host_left',
            'session_id': event['session_id'],
            'story_title': event['story_title']
        }))
    
    # Database operations
    @database_sync_to_async
    def set_user_online(self, is_online):
        """Update user's online status"""
        try:
            from .models import UserProfile
            profile = UserProfile.objects.get(user=self.user)
            profile.is_online = is_online
            profile.save(update_fields=['is_online'])
        except UserProfile.DoesNotExist:
            pass
    
    @database_sync_to_async
    def get_friends(self):
        """Get list of user's friends"""
        from .models import Friendship
        from django.db.models import Q
        
        friendships = Friendship.objects.filter(
            Q(sender=self.user, status='accepted') |
            Q(receiver=self.user, status='accepted')
        )
        
        friend_ids = []
        for friendship in friendships:
            friend_id = friendship.sender_id if friendship.receiver_id == self.user.id else friendship.receiver_id
            friend_ids.append(friend_id)
        
        return friend_ids
    
    @database_sync_to_async
    def mark_notification_read(self, notification_id):
        """Mark notification as read"""
        try:
            from .models import Notification
            notification = Notification.objects.get(id=notification_id, recipient=self.user)
            notification.is_read = True
            notification.save()
        except Notification.DoesNotExist:
            pass
    
    async def broadcast_online_status(self, is_online):
        """Broadcast online/offline status to all friends"""
        friend_ids = await self.get_friends()
        
        event_type = 'friend_online' if is_online else 'friend_offline'
        
        for friend_id in friend_ids:
            await self.channel_layer.group_send(
                f'notifications_{friend_id}',
                {
                    'type': event_type,
                    'user_id': self.user.id,
                    'username': self.user.username
                }
            )
