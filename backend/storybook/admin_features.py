"""
Enhanced Admin Features for PixelTales Platform Management
"""
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.contrib.auth.models import User
from django.db.models import Count, Q, Sum, Avg, F
from django.utils import timezone
from datetime import timedelta, datetime
from .models import (
    UserProfile, Story, Character, Comment, Like, Rating,
    ParentChildRelationship, TeacherStudentRelationship,
    Achievement, UserAchievement, Notification, Message, 
    Friendship, CollaborationSession, SavedStory, StoryRead
)
from .serializers import UserProfileSerializer, StorySerializer
from .admin_decorators import admin_required


# ============================================================
# CONTENT MODERATION
# ============================================================

@api_view(['GET'])
@permission_classes([AllowAny])
@admin_required
def get_flagged_content(request):
    """Get all flagged/reported content for moderation"""
    
    # Get stories with many reports or low ratings
    flagged_stories = Story.objects.filter(
        Q(is_published=True) & 
        (Q(rating__rating__lt=2) | Q(like__isnull=False))
    ).annotate(
        total_ratings=Count('rating'),
        avg_rating=Avg('rating__rating'),
        total_likes=Count('like'),
        total_comments=Count('comment')
    ).filter(
        Q(avg_rating__lt=2.5) | Q(total_ratings__gte=10)
    ).order_by('avg_rating')[:20]
    
    # Get inappropriate comments (you can add a flagged field to Comment model)
    recent_comments = Comment.objects.select_related(
        'user', 'story'
    ).order_by('-date_created')[:50]
    
    flagged_data = {
        'stories': [{
            'id': story.id,
            'title': story.title,
            'author': story.author.username,
            'author_id': story.author.id,
            'avg_rating': float(story.avg_rating or 0),
            'total_ratings': story.total_ratings,
            'total_likes': story.total_likes,
            'total_comments': story.total_comments,
            'date_created': story.date_created,
            'is_published': story.is_published,
        } for story in flagged_stories],
        'recent_comments': [{
            'id': comment.id,
            'content': comment.content[:200],
            'user': comment.user.username,
            'user_id': comment.user.id,
            'story_title': comment.story.title,
            'story_id': comment.story.id,
            'date_created': comment.date_created,
        } for comment in recent_comments]
    }
    
    return Response({
        'success': True,
        'data': flagged_data
    })


@api_view(['POST'])
@permission_classes([AllowAny])
@admin_required
def moderate_story(request, story_id):
    """Moderate a story - unpublish, delete, or approve"""
    
    action = request.data.get('action')  # 'unpublish', 'delete', 'approve'
    reason = request.data.get('reason', '')
    
    try:
        story = Story.objects.get(id=story_id)
    except Story.DoesNotExist:
        return Response({
            'success': False,
            'error': 'Story not found'
        }, status=status.HTTP_404_NOT_FOUND)
    
    if action == 'unpublish':
        story.is_published = False
        story.save()
        
        # Notify author
        Notification.objects.create(
            user=story.author,
            notification_type='moderation',
            title='Story Unpublished',
            message=f'Your story "{story.title}" has been unpublished by an administrator. Reason: {reason}',
            related_story=story
        )
        
        return Response({
            'success': True,
            'message': 'Story unpublished successfully'
        })
    
    elif action == 'delete':
        story_title = story.title
        author = story.author
        story.delete()
        
        # Notify author
        Notification.objects.create(
            user=author,
            notification_type='moderation',
            title='Story Removed',
            message=f'Your story "{story_title}" has been removed by an administrator. Reason: {reason}'
        )
        
        return Response({
            'success': True,
            'message': 'Story deleted successfully'
        })
    
    elif action == 'approve':
        story.is_published = True
        story.save()
        
        return Response({
            'success': True,
            'message': 'Story approved successfully'
        })
    
    return Response({
        'success': False,
        'error': 'Invalid action'
    }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
@permission_classes([AllowAny])
@admin_required
def delete_comment(request, comment_id):
    """Delete inappropriate comment"""
    
    try:
        comment = Comment.objects.get(id=comment_id)
        user = comment.user
        comment.delete()
        
        # Notify user
        Notification.objects.create(
            user=user,
            notification_type='moderation',
            title='Comment Removed',
            message='One of your comments has been removed by an administrator for violating community guidelines.'
        )
        
        return Response({
            'success': True,
            'message': 'Comment deleted successfully'
        })
    except Comment.DoesNotExist:
        return Response({
            'success': False,
            'error': 'Comment not found'
        }, status=status.HTTP_404_NOT_FOUND)


# ============================================================
# USER MANAGEMENT
# ============================================================

@api_view(['POST'])
@permission_classes([AllowAny])
@admin_required
def suspend_user(request, user_id):
    """Suspend a user account"""
    
    duration_days = request.data.get('duration_days', 7)
    reason = request.data.get('reason', 'Terms of service violation')
    
    try:
        user = User.objects.get(id=user_id)
        
        # Prevent suspending other admins
        if user.is_staff or user.is_superuser:
            return Response({
                'success': False,
                'error': 'Cannot suspend admin users'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Mark user as inactive
        user.is_active = False
        user.save()
        
        # Unpublish all their stories
        Story.objects.filter(author=user).update(is_published=False)
        
        # Notify user
        Notification.objects.create(
            user=user,
            notification_type='moderation',
            title='Account Suspended',
            message=f'Your account has been suspended for {duration_days} days. Reason: {reason}'
        )
        
        return Response({
            'success': True,
            'message': f'User suspended for {duration_days} days'
        })
    except User.DoesNotExist:
        return Response({
            'success': False,
            'error': 'User not found'
        }, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
@permission_classes([AllowAny])
@admin_required
def unsuspend_user(request, user_id):
    """Unsuspend a user account"""
    
    try:
        user = User.objects.get(id=user_id)
        user.is_active = True
        user.save()
        
        # Notify user
        Notification.objects.create(
            user=user,
            notification_type='system',
            title='Account Reactivated',
            message='Your account has been reactivated. Welcome back!'
        )
        
        return Response({
            'success': True,
            'message': 'User unsuspended successfully'
        })
    except User.DoesNotExist:
        return Response({
            'success': False,
            'error': 'User not found'
        }, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
@permission_classes([AllowAny])
@admin_required
def get_user_activity(request, user_id):
    """Get detailed activity log for a specific user"""
    
    try:
        user = User.objects.get(id=user_id)
        profile = UserProfile.objects.get(user=user)
    except (User.DoesNotExist, UserProfile.DoesNotExist):
        return Response({
            'success': False,
            'error': 'User not found'
        }, status=status.HTTP_404_NOT_FOUND)
    
    # Get user's stories
    stories = Story.objects.filter(author=user).annotate(
        total_likes=Count('like'),
        total_comments=Count('comment'),
        avg_rating=Avg('rating__rating')
    ).order_by('-date_created')[:10]
    
    # Get user's comments
    comments = Comment.objects.filter(user=user).select_related('story').order_by('-date_created')[:20]
    
    # Get user's friendships
    friendships = Friendship.objects.filter(
        Q(user1=user) | Q(user2=user),
        status='accepted'
    ).count()
    
    # Get achievements
    achievements = UserAchievement.objects.filter(user=profile).select_related('achievement')
    
    # Get parent-child relationships
    parent_relationships = ParentChildRelationship.objects.filter(parent=profile)
    child_relationships = ParentChildRelationship.objects.filter(child=profile)
    
    activity_data = {
        'user_info': {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'display_name': profile.display_name,
            'user_type': profile.user_type,
            'date_joined': user.date_joined,
            'last_login': user.last_login,
            'is_active': user.is_active,
        },
        'statistics': {
            'total_stories': stories.count(),
            'total_comments': comments.count(),
            'total_friends': friendships,
            'total_achievements': achievements.count(),
        },
        'recent_stories': [{
            'id': story.id,
            'title': story.title,
            'is_published': story.is_published,
            'date_created': story.date_created,
            'total_likes': story.total_likes,
            'total_comments': story.total_comments,
            'avg_rating': float(story.avg_rating or 0),
        } for story in stories],
        'recent_comments': [{
            'id': comment.id,
            'content': comment.content[:100],
            'story_title': comment.story.title,
            'date_created': comment.date_created,
        } for comment in comments],
        'achievements': [{
            'name': ua.achievement.name,
            'description': ua.achievement.description,
            'date_earned': ua.date_earned,
        } for ua in achievements],
        'relationships': {
            'children': parent_relationships.count(),
            'parents': child_relationships.count(),
        }
    }
    
    return Response({
        'success': True,
        'data': activity_data
    })


# ============================================================
# ANALYTICS & INSIGHTS
# ============================================================

@api_view(['GET'])
@permission_classes([AllowAny])
@admin_required
def get_platform_analytics(request):
    """Get detailed platform analytics and trends"""
    
    now = timezone.now()
    last_7_days = now - timedelta(days=7)
    last_30_days = now - timedelta(days=30)
    
    # User growth trend (last 30 days)
    user_growth = []
    for i in range(30, -1, -1):
        date = now - timedelta(days=i)
        count = User.objects.filter(date_joined__date=date.date()).count()
        user_growth.append({
            'date': date.date().isoformat(),
            'count': count
        })
    
    # Story creation trend (last 30 days)
    story_trend = []
    for i in range(30, -1, -1):
        date = now - timedelta(days=i)
        count = Story.objects.filter(date_created__date=date.date()).count()
        story_trend.append({
            'date': date.date().isoformat(),
            'count': count
        })
    
    # Most active users
    active_users = User.objects.annotate(
        story_count=Count('story'),
        comment_count=Count('comment')
    ).order_by('-story_count', '-comment_count')[:10]
    
    # Most popular stories
    popular_stories = Story.objects.filter(
        is_published=True
    ).annotate(
        total_likes=Count('like'),
        total_reads=Count('storyread'),
        total_saves=Count('savedstory')
    ).order_by('-total_likes', '-total_reads')[:10]
    
    # Engagement metrics
    total_likes = Like.objects.count()
    total_comments = Comment.objects.count()
    total_ratings = Rating.objects.count()
    total_saves = SavedStory.objects.count()
    total_reads = StoryRead.objects.count()
    
    analytics_data = {
        'trends': {
            'user_growth': user_growth,
            'story_creation': story_trend,
        },
        'top_users': [{
            'id': user.id,
            'username': user.username,
            'story_count': user.story_count,
            'comment_count': user.comment_count,
        } for user in active_users],
        'popular_stories': [{
            'id': story.id,
            'title': story.title,
            'author': story.author.username,
            'total_likes': story.total_likes,
            'total_reads': story.total_reads,
            'total_saves': story.total_saves,
        } for story in popular_stories],
        'engagement': {
            'total_likes': total_likes,
            'total_comments': total_comments,
            'total_ratings': total_ratings,
            'total_saves': total_saves,
            'total_reads': total_reads,
            'likes_last_7_days': Like.objects.filter(date_created__gte=last_7_days).count(),
            'comments_last_7_days': Comment.objects.filter(date_created__gte=last_7_days).count(),
        }
    }
    
    return Response({
        'success': True,
        'data': analytics_data
    })


# ============================================================
# SYSTEM MANAGEMENT
# ============================================================

@api_view(['POST'])
@permission_classes([AllowAny])
@admin_required
def send_announcement(request):
    """Send announcement to all users or specific user types"""
    
    title = request.data.get('title')
    message = request.data.get('message')
    target_type = request.data.get('target_type', 'all')  # 'all', 'child', 'parent', 'teacher'
    
    if not title or not message:
        return Response({
            'success': False,
            'error': 'Title and message are required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Get target users
    if target_type == 'all':
        users = User.objects.filter(is_active=True)
    else:
        profiles = UserProfile.objects.filter(user_type=target_type)
        users = User.objects.filter(id__in=profiles.values_list('user_id', flat=True), is_active=True)
    
    # Create notifications
    notifications = [
        Notification(
            user=user,
            notification_type='announcement',
            title=title,
            message=message
        ) for user in users
    ]
    
    Notification.objects.bulk_create(notifications)
    
    return Response({
        'success': True,
        'message': f'Announcement sent to {len(notifications)} users'
    })


@api_view(['GET'])
@permission_classes([AllowAny])
@admin_required
def get_system_health(request):
    """Get system health metrics"""
    import psutil
    import sys
    import django
    
    now = timezone.now()
    last_24_hours = now - timedelta(hours=24)
    
    # Get system metrics
    cpu_usage = psutil.cpu_percent(interval=1)
    memory = psutil.virtual_memory()
    disk = psutil.disk_usage('/')
    
    # Calculate health score (0-100)
    health_score = 100
    if cpu_usage > 70:
        health_score -= 20
    if memory.percent > 70:
        health_score -= 20
    if disk.percent > 70:
        health_score -= 20
    
    # Determine status
    if health_score >= 80:
        health_status = 'healthy'
    elif health_score >= 60:
        health_status = 'warning'
    else:
        health_status = 'critical'
    
    health_data = {
        'status': health_status,
        'health_score': health_score,
        'timestamp': now.isoformat(),
        'server': {
            'cpu_usage': cpu_usage,
            'memory_total': memory.total,
            'memory_used': memory.used,
            'memory_percent': memory.percent,
            'disk_total': disk.total,
            'disk_used': disk.used,
            'disk_percent': disk.percent,
        },
        'database': {
            'size': f'{disk.used / (1024**3):.2f} GB',  # Approximate
            'active_connections': 1,  # Simplified
            'query_response_time_ms': 10.5,  # Mock value
        },
        'application': {
            'total_users': User.objects.count(),
            'total_stories': Story.objects.count(),
            'django_version': django.get_version(),
            'python_version': f'{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}',
        }
    }
    
    return Response(health_data)


@api_view(['GET'])
@permission_classes([AllowAny])
@admin_required
def export_data(request):
    """Export platform data for backup/analysis"""
    
    export_type = request.GET.get('type', 'users')  # 'users', 'stories', 'analytics'
    
    try:
        if export_type == 'users':
            users = User.objects.all().select_related('userprofile')
            data = [{
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'date_joined': user.date_joined.isoformat() if user.date_joined else None,
                'last_login': user.last_login.isoformat() if user.last_login else None,
                'user_type': user.userprofile.user_type if hasattr(user, 'userprofile') else 'unknown',
                'display_name': user.userprofile.display_name if hasattr(user, 'userprofile') else user.username,
                'is_active': user.is_active,
            } for user in users]
        
        elif export_type == 'stories':
            stories = Story.objects.all().select_related('author').annotate(
                total_likes=Count('like'),
                total_comments=Count('comment'),
                total_views=Count('storyread')
            )
            data = [{
                'id': story.id,
                'title': story.title,
                'author': story.author.username if story.author else 'Unknown',
                'author_id': story.author.id if story.author else None,
                'is_published': story.is_published,
                'date_created': story.date_created.isoformat() if story.date_created else None,
                'date_updated': story.date_updated.isoformat() if story.date_updated else None,
                'total_likes': story.total_likes,
                'total_comments': story.total_comments,
                'total_views': story.total_views,
                'language': story.language if hasattr(story, 'language') else 'en',
            } for story in stories]
        
        elif export_type == 'analytics':
            # Platform-wide statistics
            now = timezone.now()
            last_7_days = now - timedelta(days=7)
            last_30_days = now - timedelta(days=30)
            
            data = {
                'export_date': now.isoformat(),
                'users': {
                    'total': User.objects.count(),
                    'active': User.objects.filter(is_active=True).count(),
                    'last_7_days': User.objects.filter(date_joined__gte=last_7_days).count(),
                    'last_30_days': User.objects.filter(date_joined__gte=last_30_days).count(),
                    'by_type': {
                        'child': UserProfile.objects.filter(user_type='child').count(),
                        'parent': UserProfile.objects.filter(user_type='parent').count(),
                        'teacher': UserProfile.objects.filter(user_type='teacher').count(),
                    }
                },
                'stories': {
                    'total': Story.objects.count(),
                    'published': Story.objects.filter(is_published=True).count(),
                    'drafts': Story.objects.filter(is_published=False).count(),
                    'last_7_days': Story.objects.filter(date_created__gte=last_7_days).count(),
                    'last_30_days': Story.objects.filter(date_created__gte=last_30_days).count(),
                },
                'engagement': {
                    'total_likes': Like.objects.count(),
                    'total_comments': Comment.objects.count(),
                    'total_saves': SavedStory.objects.count(),
                    'total_reads': StoryRead.objects.count(),
                    'likes_last_7_days': Like.objects.filter(date_created__gte=last_7_days).count(),
                    'comments_last_7_days': Comment.objects.filter(date_created__gte=last_7_days).count(),
                },
                'social': {
                    'total_friendships': Friendship.objects.filter(status='accepted').count(),
                    'total_messages': Message.objects.count(),
                }
            }
        
        else:
            data = []
        
        return Response({
            'success': True,
            'export_type': export_type,
            'count': len(data) if isinstance(data, list) else 1,
            'data': data
        })
    
    except Exception as e:
        import traceback
        print(f"❌ Export error: {str(e)}")
        print(traceback.format_exc())
        return Response({
            'success': False,
            'error': str(e),
            'message': 'Failed to export data. Check server logs for details.'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
