"""
Notification Preferences API Views
Handles saving and loading notification preferences for parents and teachers
"""
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404

from .models import NotificationPreferences
from .email_service import EmailService


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_notification_preferences(request):
    """Get notification and privacy preferences for the current user"""
    try:
        # Get or create preferences for the user
        preferences, created = NotificationPreferences.objects.get_or_create(
            user=request.user,
            defaults={
                'weekly_reports': True,
                'achievement_alerts': True,
                'goal_completion': True,
                'realtime_updates': False,
                'share_usage_data': True,
                'allow_analytics': True,
                'public_profile': False,
            }
        )
        
        return Response({
            'success': True,
            'preferences': {
                # Notification preferences
                'weekly_reports': preferences.weekly_reports,
                'achievement_alerts': preferences.achievement_alerts,
                'goal_completion': preferences.goal_completion,
                'realtime_updates': preferences.realtime_updates,
                'push_token': preferences.push_token,
                'device_type': preferences.device_type,
                # Privacy preferences
                'share_usage_data': preferences.share_usage_data,
                'allow_analytics': preferences.allow_analytics,
                'public_profile': preferences.public_profile,
            }
        })
    except Exception as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def update_notification_preferences(request):
    """Update notification and privacy preferences for the current user"""
    try:
        # Get or create preferences for the user
        preferences, created = NotificationPreferences.objects.get_or_create(
            user=request.user
        )
        
        # Update notification fields if provided
        if 'weekly_reports' in request.data:
            preferences.weekly_reports = request.data['weekly_reports']
        
        if 'achievement_alerts' in request.data:
            preferences.achievement_alerts = request.data['achievement_alerts']
        
        if 'goal_completion' in request.data:
            preferences.goal_completion = request.data['goal_completion']
        
        if 'realtime_updates' in request.data:
            preferences.realtime_updates = request.data['realtime_updates']
        
        if 'push_token' in request.data:
            preferences.push_token = request.data['push_token']
        
        if 'device_type' in request.data:
            preferences.device_type = request.data['device_type']
        
        # Update privacy fields if provided
        if 'share_usage_data' in request.data:
            preferences.share_usage_data = request.data['share_usage_data']
        
        if 'allow_analytics' in request.data:
            preferences.allow_analytics = request.data['allow_analytics']
        
        if 'public_profile' in request.data:
            preferences.public_profile = request.data['public_profile']
        
        preferences.save()
        
        return Response({
            'success': True,
            'message': 'Preferences updated successfully',
            'preferences': {
                # Notification preferences
                'weekly_reports': preferences.weekly_reports,
                'achievement_alerts': preferences.achievement_alerts,
                'goal_completion': preferences.goal_completion,
                'realtime_updates': preferences.realtime_updates,
                'push_token': preferences.push_token,
                'device_type': preferences.device_type,
                # Privacy preferences
                'share_usage_data': preferences.share_usage_data,
                'allow_analytics': preferences.allow_analytics,
                'public_profile': preferences.public_profile,
            }
        })
    except Exception as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def register_push_token(request):
    """Register or update push notification token for the user's device"""
    try:
        push_token = request.data.get('push_token')
        device_type = request.data.get('device_type', 'web')
        
        if not push_token:
            return Response({
                'error': 'Push token is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Get or create preferences
        preferences, created = NotificationPreferences.objects.get_or_create(
            user=request.user
        )
        
        # Update push token and device type
        preferences.push_token = push_token
        preferences.device_type = device_type
        preferences.save()
        
        return Response({
            'success': True,
            'message': 'Push notification token registered successfully'
        })
    except Exception as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_test_email(request):
    """Send a test notification email to verify SendGrid is working"""
    try:
        user = request.user
        email = user.email
        
        if not email:
            return Response({
                'error': 'No email address associated with your account'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Get user's name
        user_name = user.first_name or user.username
        
        # Send test email
        success = EmailService.send_test_notification_email(email, user_name)
        
        if success:
            return Response({
                'success': True,
                'message': f'Test email sent successfully to {email}!'
            })
        else:
            return Response({
                'error': 'Failed to send test email. Please check SendGrid configuration.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
    except Exception as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_achievement_notification(request):
    """Send achievement alert email (for testing or triggered by system)"""
    try:
        user = request.user
        email = user.email
        
        # Check if user has achievement alerts enabled
        try:
            preferences = NotificationPreferences.objects.get(user=user)
            if not preferences.achievement_alerts:
                return Response({
                    'success': False,
                    'message': 'Achievement alerts are disabled in your settings'
                })
        except NotificationPreferences.DoesNotExist:
            pass  # Use defaults (enabled)
        
        # Get data from request
        child_name = request.data.get('child_name', user.username)
        achievement_name = request.data.get('achievement_name', 'First Story Created')
        achievement_description = request.data.get('achievement_description', 'Created your first story!')
        
        # Send email
        success = EmailService.send_achievement_alert(
            email, 
            child_name, 
            achievement_name, 
            achievement_description
        )
        
        if success:
            return Response({
                'success': True,
                'message': f'Achievement notification sent to {email}!'
            })
        else:
            return Response({
                'error': 'Failed to send achievement notification'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
    except Exception as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_weekly_report(request):
    """Send weekly progress report email (for testing or scheduled task)"""
    try:
        user = request.user
        email = user.email
        
        # Check if user has weekly reports enabled
        try:
            preferences = NotificationPreferences.objects.get(user=user)
            if not preferences.weekly_reports:
                return Response({
                    'success': False,
                    'message': 'Weekly reports are disabled in your settings'
                })
        except NotificationPreferences.DoesNotExist:
            pass  # Use defaults (enabled)
        
        # Get data from request or use sample data
        parent_name = user.first_name or user.username
        child_name = request.data.get('child_name', 'Your Child')
        
        # Sample stats (in real implementation, this would come from database)
        stats = request.data.get('stats', {
            'stories_read': 5,
            'stories_created': 3,
            'achievements_earned': 2,
            'total_reading_time': '2h 30m',
            'games_completed': 4
        })
        
        # Send email
        success = EmailService.send_weekly_progress_report(
            email,
            parent_name,
            child_name,
            stats
        )
        
        if success:
            return Response({
                'success': True,
                'message': f'Weekly progress report sent to {email}!'
            })
        else:
            return Response({
                'error': 'Failed to send weekly report'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
    except Exception as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
