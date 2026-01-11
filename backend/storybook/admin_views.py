"""
Admin API Views for managing users, accounts, and viewing statistics
Uses separate admin authentication system
"""
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.contrib.auth.models import User
from django.db.models import Count, Q, Sum, Avg
from django.utils import timezone
from datetime import timedelta
from .models import (
    UserProfile, Story, Character, Comment, Like, Rating,
    ParentChildRelationship, Achievement, UserAchievement,
    Notification, Message, Friendship, CollaborationSession
)
from .serializers import UserProfileSerializer
from .admin_decorators import admin_required


@api_view(['GET'])
@permission_classes([AllowAny])
@admin_required
def admin_dashboard_stats(request):
    """Get overall platform statistics for admin dashboard"""
    
    # Calculate date ranges
    now = timezone.now()
    last_7_days = now - timedelta(days=7)
    last_30_days = now - timedelta(days=30)
    last_24_hours = now - timedelta(hours=24)
    last_1_day = now - timedelta(days=1)
    yesterday = now - timedelta(days=1)
    
    # User statistics
    total_users = User.objects.count()
    users_last_7_days = User.objects.filter(date_joined__gte=last_7_days).count()
    users_last_30_days = User.objects.filter(date_joined__gte=last_30_days).count()
    
    # User type breakdown
    user_types = UserProfile.objects.values('user_type').annotate(count=Count('id'))
    user_type_stats = {item['user_type']: item['count'] for item in user_types}
    
    # Story statistics
    total_stories = Story.objects.count()
    published_stories = Story.objects.filter(is_published=True).count()
    draft_stories = Story.objects.filter(is_published=False).count()
    stories_last_7_days = Story.objects.filter(date_created__gte=last_7_days).count()
    stories_last_30_days = Story.objects.filter(date_created__gte=last_30_days).count()
    
    # Story creation type breakdown
    manual_stories = Story.objects.filter(creation_type='manual').count()
    ai_stories = Story.objects.filter(creation_type='ai_assisted').count()
    
    # Engagement statistics
    total_likes = Like.objects.count()
    total_comments = Comment.objects.count()
    total_ratings = Rating.objects.count()
    avg_rating = Rating.objects.aggregate(Avg('value'))['value__avg'] or 0
    
    # Character statistics
    total_characters = Character.objects.count()
    characters_last_7_days = Character.objects.filter(date_created__gte=last_7_days).count()
    
    # Social statistics
    total_friendships = Friendship.objects.filter(status='accepted').count()
    pending_friend_requests = Friendship.objects.filter(status='pending').count()
    total_messages = Message.objects.count()
    
    # Collaboration statistics
    total_sessions = CollaborationSession.objects.count()
    active_sessions = CollaborationSession.objects.filter(is_active=True).count()
    
    # Parent-child relationships
    total_parent_child_relationships = ParentChildRelationship.objects.filter(is_active=True).count()
    
    # Achievement statistics
    total_achievements_earned = UserAchievement.objects.filter(is_earned=True).count()
    
    # Flagged content
    flagged_stories = Story.objects.filter(is_flagged=True).count()
    flagged_comments = Comment.objects.filter(is_flagged=True).count()
    flagged_users = UserProfile.objects.filter(is_flagged=True).count()
    
    # Most active users (by story count)
    top_authors = Story.objects.values('author__username', 'author__id').annotate(
        story_count=Count('id')
    ).order_by('-story_count')[:10]
    
    # Most popular stories (by likes)
    popular_stories = Story.objects.annotate(
        like_count=Count('likes')
    ).order_by('-like_count')[:10].values('id', 'title', 'author__username', 'like_count')
    
    # ===== HIGH PRIORITY ANALYTICS =====
    
    # 1. Real-time Active Users (users active in last 15 minutes)
    fifteen_minutes_ago = now - timedelta(minutes=15)
    active_users_now = UserProfile.objects.filter(
        last_seen__gte=fifteen_minutes_ago
    ).count()
    
    # 2. DAU/WAU/MAU (Daily/Weekly/Monthly Active Users)
    # DAU - users who logged in within last 24 hours
    dau = User.objects.filter(last_login__gte=last_24_hours).count()
    
    # WAU - users who logged in within last 7 days
    wau = User.objects.filter(last_login__gte=last_7_days).count()
    
    # MAU - users who logged in within last 30 days
    mau = User.objects.filter(last_login__gte=last_30_days).count()
    
    # 3. User Retention Rates
    # Day 1 retention - users who signed up yesterday and came back today
    users_signed_yesterday = User.objects.filter(
        date_joined__gte=yesterday.replace(hour=0, minute=0, second=0),
        date_joined__lt=now.replace(hour=0, minute=0, second=0)
    )
    users_signed_yesterday_count = users_signed_yesterday.count()
    users_returned_day1 = users_signed_yesterday.filter(last_login__gte=now.replace(hour=0, minute=0, second=0)).count()
    retention_day1 = (users_returned_day1 / users_signed_yesterday_count * 100) if users_signed_yesterday_count > 0 else 0
    
    # Day 7 retention - users who signed up 7 days ago and came back since then
    users_signed_7_days_ago = User.objects.filter(
        date_joined__gte=(now - timedelta(days=8)).replace(hour=0, minute=0, second=0),
        date_joined__lt=(now - timedelta(days=7)).replace(hour=0, minute=0, second=0)
    )
    users_signed_7_days_count = users_signed_7_days_ago.count()
    users_returned_day7 = users_signed_7_days_ago.filter(last_login__gte=(now - timedelta(days=7))).count()
    retention_day7 = (users_returned_day7 / users_signed_7_days_count * 100) if users_signed_7_days_count > 0 else 0
    
    # Day 30 retention
    users_signed_30_days_ago = User.objects.filter(
        date_joined__gte=(now - timedelta(days=31)).replace(hour=0, minute=0, second=0),
        date_joined__lt=(now - timedelta(days=30)).replace(hour=0, minute=0, second=0)
    )
    users_signed_30_days_count = users_signed_30_days_ago.count()
    users_returned_day30 = users_signed_30_days_ago.filter(last_login__gte=(now - timedelta(days=30))).count()
    retention_day30 = (users_returned_day30 / users_signed_30_days_count * 100) if users_signed_30_days_count > 0 else 0
    
    # 4. Feature Usage Breakdown (last 7 days)
    # AI story generation usage
    ai_stories_last_7_days = Story.objects.filter(
        creation_type='ai_assisted',
        date_created__gte=last_7_days
    ).count()
    
    # Manual story creation usage
    manual_stories_last_7_days = Story.objects.filter(
        creation_type='manual',
        date_created__gte=last_7_days
    ).count()
    
    # Photo Story / OCR usage (stories created from photos)
    photo_story_usage_last_7_days = Story.objects.filter(
        creation_type='photo',
        date_created__gte=last_7_days
    ).count()
    
    # Collaborative stories usage
    collaborative_stories_last_7_days = Story.objects.filter(
        is_collaborative=True,
        date_created__gte=last_7_days
    ).count()
    
    # Game plays (game attempts in last 7 days)
    from .models import GameAttempt
    game_plays_last_7_days = GameAttempt.objects.filter(
        started_at__gte=last_7_days
    ).count()
    
    # 5. Story Views - Top 10 most viewed stories
    top_viewed_stories = Story.objects.filter(
        is_published=True
    ).order_by('-views')[:10].values('id', 'title', 'author__username', 'views')
    
    # Total views across all stories
    total_story_views = Story.objects.aggregate(Sum('views'))['views__sum'] or 0
    
    # Average views per story
    avg_views_per_story = total_story_views / total_stories if total_stories > 0 else 0
    
    return Response({
        'success': True,
        'stats': {
            'users': {
                'total': total_users,
                'last_7_days': users_last_7_days,
                'last_30_days': users_last_30_days,
                'by_type': user_type_stats,
            },
            'stories': {
                'total': total_stories,
                'published': published_stories,
                'drafts': draft_stories,
                'last_7_days': stories_last_7_days,
                'last_30_days': stories_last_30_days,
                'manual': manual_stories,
                'ai_assisted': ai_stories,
            },
            'engagement': {
                'total_likes': total_likes,
                'total_comments': total_comments,
                'total_ratings': total_ratings,
                'average_rating': round(avg_rating, 2),
            },
            'characters': {
                'total': total_characters,
                'last_7_days': characters_last_7_days,
            },
            'social': {
                'friendships': total_friendships,
                'pending_requests': pending_friend_requests,
                'messages': total_messages,
            },
            'collaboration': {
                'total_sessions': total_sessions,
                'active_sessions': active_sessions,
            },
            'relationships': {
                'parent_child': total_parent_child_relationships,
            },
            'achievements': {
                'total_earned': total_achievements_earned,
            },
            'moderation': {
                'flagged_stories': flagged_stories,
                'flagged_comments': flagged_comments,
                'flagged_users': flagged_users,
            },
            'top_authors': list(top_authors),
            'popular_stories': list(popular_stories),
            
            # NEW: High Priority Analytics
            'active_users': {
                'now': active_users_now,  # Real-time active users (last 15 min)
                'daily': dau,  # Daily Active Users (last 24h)
                'weekly': wau,  # Weekly Active Users (last 7d)
                'monthly': mau,  # Monthly Active Users (last 30d)
            },
            'retention': {
                'day_1': round(retention_day1, 2),  # % of users who return after 1 day
                'day_7': round(retention_day7, 2),  # % of users who return after 7 days
                'day_30': round(retention_day30, 2),  # % of users who return after 30 days
            },
            'feature_usage': {
                'ai_stories_last_7_days': ai_stories_last_7_days,
                'manual_stories_last_7_days': manual_stories_last_7_days,
                'photo_story_usage_last_7_days': photo_story_usage_last_7_days,
                'collaborative_stories_last_7_days': collaborative_stories_last_7_days,
                'game_plays_last_7_days': game_plays_last_7_days,
            },
            'story_views': {
                'total': total_story_views,
                'average_per_story': round(avg_views_per_story, 2),
                'top_viewed_stories': list(top_viewed_stories),
            },
        }
    })


@api_view(['GET'])
@permission_classes([AllowAny])
@admin_required
def admin_list_users(request):
    """List all users with filtering and pagination"""
    
    # Get query parameters
    user_type = request.GET.get('user_type', None)
    search = request.GET.get('search', '')
    page = int(request.GET.get('page', 1))
    page_size = int(request.GET.get('page_size', 20))
    
    # Base query - exclude admin users (staff and superusers) and archived users
    users = User.objects.select_related('profile').filter(
        is_staff=False, 
        is_superuser=False,
        profile__is_archived=False
    )
    
    # Filter by user type
    if user_type:
        users = users.filter(profile__user_type=user_type)
    
    # Search by username, email, or display name
    if search:
        users = users.filter(
            Q(username__icontains=search) |
            Q(email__icontains=search) |
            Q(profile__display_name__icontains=search)
        )
    
    # Order by date joined (newest first)
    users = users.order_by('-date_joined')
    
    # Pagination
    total_count = users.count()
    start = (page - 1) * page_size
    end = start + page_size
    users_page = users[start:end]
    
    # Serialize users with additional info
    users_data = []
    for user in users_page:
        try:
            profile = user.profile
            
            # Get children if parent
            children = []
            if profile.user_type == 'parent':
                child_relationships = ParentChildRelationship.objects.filter(
                    parent=user, is_active=True
                ).select_related('child', 'child__profile')
                children = [{
                    'id': rel.child.id,
                    'username': rel.child.username,
                    'display_name': rel.child.profile.display_name,
                } for rel in child_relationships]
            
            # Get parents if child
            parents = []
            if profile.user_type == 'child':
                parent_relationships = ParentChildRelationship.objects.filter(
                    child=user, is_active=True
                ).select_related('parent', 'parent__profile')
                parents = [{
                    'id': rel.parent.id,
                    'username': rel.parent.username,
                    'display_name': rel.parent.profile.display_name,
                } for rel in parent_relationships]
            
            # Get story count
            story_count = Story.objects.filter(author=user).count()
            published_story_count = Story.objects.filter(author=user, is_published=True).count()
            
            users_data.append({
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'display_name': profile.display_name,
                'user_type': profile.user_type,
                'date_joined': user.date_joined,
                'last_login': user.last_login,
                'is_active': user.is_active,
                'is_staff': user.is_staff,
                'is_superuser': user.is_superuser,
                'is_flagged': profile.is_flagged,
                'violation_count': profile.violation_count,
                'story_count': story_count,
                'published_story_count': published_story_count,
                'children': children,
                'parents': parents,
            })
        except UserProfile.DoesNotExist:
            continue
    
    return Response({
        'success': True,
        'users': users_data,
        'pagination': {
            'page': page,
            'page_size': page_size,
            'total_count': total_count,
            'total_pages': (total_count + page_size - 1) // page_size,
        }
    })


@api_view(['GET'])
@permission_classes([AllowAny])
@admin_required
def admin_get_user(request, user_id):
    """Get detailed information about a specific user"""
    
    try:
        user = User.objects.select_related('profile').get(id=user_id)
        profile = user.profile
        
        # Get relationships
        children = []
        if profile.user_type == 'parent':
            child_relationships = ParentChildRelationship.objects.filter(
                parent=user, is_active=True
            ).select_related('child', 'child__profile')
            children = [{
                'id': rel.child.id,
                'username': rel.child.username,
                'display_name': rel.child.profile.display_name,
                'date_created': rel.date_created,
            } for rel in child_relationships]
        
        parents = []
        if profile.user_type == 'child':
            parent_relationships = ParentChildRelationship.objects.filter(
                child=user, is_active=True
            ).select_related('parent', 'parent__profile')
            parents = [{
                'id': rel.parent.id,
                'username': rel.parent.username,
                'display_name': rel.parent.profile.display_name,
                'date_created': rel.date_created,
            } for rel in parent_relationships]
        
        # Get stories
        stories = Story.objects.filter(author=user).order_by('-date_created')[:10]
        stories_data = [{
            'id': story.id,
            'title': story.title,
            'is_published': story.is_published,
            'date_created': story.date_created,
            'views': story.views,
            'likes': story.likes.count(),
        } for story in stories]
        
        # Get characters
        characters = Character.objects.filter(creator=user).order_by('-date_created')[:10]
        characters_data = [{
            'id': char.id,
            'name': char.name,
            'date_created': char.date_created,
        } for char in characters]
        
        # Get achievements
        achievements = UserAchievement.objects.filter(
            user=user, is_earned=True
        ).select_related('achievement').order_by('-earned_at')[:10]
        achievements_data = [{
            'name': ua.achievement.name,
            'earned_at': ua.earned_at,
        } for ua in achievements]
        
        return Response({
            'success': True,
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'display_name': profile.display_name,
                'user_type': profile.user_type,
                'bio': profile.bio,
                'date_of_birth': profile.date_of_birth,
                'date_joined': user.date_joined,
                'last_login': user.last_login,
                'is_active': user.is_active,
                'is_staff': user.is_staff,
                'is_superuser': user.is_superuser,
                'is_flagged': profile.is_flagged,
                'flagged_reason': profile.flagged_reason,
                'violation_count': profile.violation_count,
                'last_violation_date': profile.last_violation_date,
                'children': children,
                'parents': parents,
                'stories': stories_data,
                'characters': characters_data,
                'achievements': achievements_data,
            }
        })
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['PUT', 'PATCH'])
@permission_classes([AllowAny])
@admin_required
def admin_update_user(request, user_id):
    """Update user information (admin only)"""
    
    try:
        user = User.objects.get(id=user_id)
        profile = user.profile
        
        # Update user fields
        if 'username' in request.data:
            user.username = request.data['username']
        if 'email' in request.data:
            user.email = request.data['email']
        if 'is_active' in request.data:
            user.is_active = request.data['is_active']
        if 'is_staff' in request.data:
            user.is_staff = request.data['is_staff']
        
        user.save()
        
        # Update profile fields
        if 'display_name' in request.data:
            profile.display_name = request.data['display_name']
        if 'user_type' in request.data:
            profile.user_type = request.data['user_type']
        if 'bio' in request.data:
            profile.bio = request.data['bio']
        if 'is_flagged' in request.data:
            profile.is_flagged = request.data['is_flagged']
        if 'flagged_reason' in request.data:
            profile.flagged_reason = request.data['flagged_reason']
        if 'violation_count' in request.data:
            profile.violation_count = request.data['violation_count']
        
        profile.save()
        
        return Response({
            'success': True,
            'message': 'User updated successfully',
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'display_name': profile.display_name,
                'user_type': profile.user_type,
                'is_active': user.is_active,
                'is_staff': user.is_staff,
            }
        })
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['DELETE'])
@permission_classes([AllowAny])
@admin_required
def admin_delete_user(request, user_id):
    """Archive a user account (soft delete - admin only)"""
    
    # Prevent deleting own account
    if request.admin_user.id == user_id:
        return Response({'error': 'Cannot archive your own account'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user = User.objects.get(id=user_id)
        profile = user.profile
        username = user.username
        
        # Get archive reason from request
        archive_reason = request.data.get('reason', 'Archived by admin')
        
        # Archive the user (soft delete)
        profile.is_archived = True
        profile.archived_at = timezone.now()
        profile.archived_by = request.admin_user
        profile.archive_reason = archive_reason
        profile.save()
        
        # Deactivate the user account so they can't login
        user.is_active = False
        user.save()
        
        return Response({
            'success': True,
            'message': f'User {username} archived successfully'
        })
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
@permission_classes([AllowAny])
@admin_required
def admin_restore_user(request, user_id):
    """Restore an archived user account (admin only)"""
    
    try:
        user = User.objects.get(id=user_id)
        profile = user.profile
        username = user.username
        
        # Check if user is archived
        if not profile.is_archived:
            return Response({'error': 'User is not archived'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Restore the user
        profile.is_archived = False
        profile.archived_at = None
        profile.archived_by = None
        profile.archive_reason = ''
        profile.save()
        
        # Reactivate the user account
        user.is_active = True
        user.save()
        
        return Response({
            'success': True,
            'message': f'User {username} restored successfully'
        })
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
@permission_classes([AllowAny])
@admin_required
def admin_list_archived_users(request):
    """List all archived users (admin only)"""
    
    # Get query parameters
    search = request.GET.get('search', '')
    page = int(request.GET.get('page', 1))
    page_size = int(request.GET.get('page_size', 20))
    
    # Base query - archived users only
    users = User.objects.select_related('profile').filter(
        profile__is_archived=True
    )
    
    # Search by username, email, or display name
    if search:
        users = users.filter(
            Q(username__icontains=search) |
            Q(email__icontains=search) |
            Q(profile__display_name__icontains=search)
        )
    
    # Order by archived date (most recent first)
    users = users.order_by('-profile__archived_at')
    
    # Pagination
    total_count = users.count()
    start = (page - 1) * page_size
    end = start + page_size
    users_page = users[start:end]
    
    # Serialize users
    users_data = []
    for user in users_page:
        profile = user.profile
        
        # Get story count
        story_count = Story.objects.filter(author=user).count()
        
        archived_by_username = None
        if profile.archived_by:
            archived_by_username = profile.archived_by.username
        
        users_data.append({
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'display_name': profile.display_name,
            'user_type': profile.user_type,
            'date_joined': user.date_joined,
            'archived_at': profile.archived_at,
            'archived_by': archived_by_username,
            'archive_reason': profile.archive_reason,
            'story_count': story_count,
        })
    
    return Response({
        'success': True,
        'users': users_data,
        'pagination': {
            'page': page,
            'page_size': page_size,
            'total_count': total_count,
            'total_pages': (total_count + page_size - 1) // page_size,
        }
    })


@api_view(['POST'])
@permission_classes([AllowAny])
@admin_required
def admin_add_parent_child(request):
    """Add a parent-child relationship (admin only)"""
    
    parent_id = request.data.get('parent_id')
    child_id = request.data.get('child_id')
    
    if not parent_id or not child_id:
        return Response({'error': 'Both parent_id and child_id are required'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        parent = User.objects.get(id=parent_id)
        child = User.objects.get(id=child_id)
        
        # Verify user types
        if parent.profile.user_type != 'parent':
            return Response({'error': 'Parent user must have user_type "parent"'}, status=status.HTTP_400_BAD_REQUEST)
        if child.profile.user_type != 'child':
            return Response({'error': 'Child user must have user_type "child"'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Create relationship
        relationship, created = ParentChildRelationship.objects.get_or_create(
            parent=parent,
            child=child,
            defaults={'is_active': True}
        )
        
        if not created:
            relationship.is_active = True
            relationship.save()
        
        return Response({
            'success': True,
            'message': 'Parent-child relationship created successfully',
            'relationship': {
                'parent': parent.username,
                'child': child.username,
            }
        })
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['DELETE'])
@permission_classes([AllowAny])
@admin_required
def admin_remove_parent_child(request, parent_id, child_id):
    """Remove a parent-child relationship (admin only)"""
    
    try:
        relationship = ParentChildRelationship.objects.get(parent_id=parent_id, child_id=child_id)
        relationship.is_active = False
        relationship.save()
        
        return Response({
            'success': True,
            'message': 'Parent-child relationship removed successfully'
        })
    except ParentChildRelationship.DoesNotExist:
        return Response({'error': 'Relationship not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
@permission_classes([AllowAny])
@admin_required
def admin_regenerate_word_searches(request):
    """Regenerate all word search games with new 8x8 format (admin only)"""
    from .models import StoryGame, GameQuestion, GameAnswer, GameAttempt, Story
    from .game_service import GameGenerationService
    
    try:
        # Get all word search games
        word_search_games = StoryGame.objects.filter(game_type='word_search')
        total_deleted = word_search_games.count()
        
        # Get unique stories with word searches
        story_ids = word_search_games.values_list('story_id', flat=True).distinct()
        
        # Delete old word searches
        GameAnswer.objects.filter(attempt__game__in=word_search_games).delete()
        GameAttempt.objects.filter(game__in=word_search_games).delete()
        GameQuestion.objects.filter(game__in=word_search_games).delete()
        word_search_games.delete()
        
        # Regenerate word searches for each story
        stories = Story.objects.filter(id__in=story_ids, is_published=True)
        success_count = 0
        error_count = 0
        
        for story in stories:
            try:
                story_text = GameGenerationService._extract_story_text(story)
                new_game = GameGenerationService._generate_word_search_game(story, story_text)
                if new_game:
                    success_count += 1
                else:
                    error_count += 1
            except Exception as e:
                error_count += 1
        
        return Response({
            'success': True,
            'message': f'Word search games regenerated successfully',
            'deleted': total_deleted,
            'regenerated': success_count,
            'failed': error_count,
            'details': 'All word searches now use 8x8 grid with 4-5 words'
        })
        
    except Exception as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
@admin_required
def admin_regenerate_all_games(request):
    """Regenerate ALL games for all published stories (admin only)"""
    from .models import StoryGame, GameQuestion, GameAnswer, GameAttempt, Story
    from .game_service import GameGenerationService
    
    try:
        # Get all games
        all_games = StoryGame.objects.all()
        total_deleted = all_games.count()
        
        # Delete all games and related data
        GameAnswer.objects.filter(attempt__game__in=all_games).delete()
        GameAttempt.objects.filter(game__in=all_games).delete()
        GameQuestion.objects.filter(game__in=all_games).delete()
        all_games.delete()
        
        # Get all published stories
        stories = Story.objects.filter(is_published=True)
        success_count = 0
        error_count = 0
        game_types_created = {'quiz': 0, 'fill_blanks': 0, 'word_search': 0}
        
        for story in stories:
            try:
                result = GameGenerationService.generate_games_for_story(story)
                if 'error' not in result:
                    success_count += 1
                    for game_type in result.keys():
                        if game_type in game_types_created:
                            game_types_created[game_type] += 1
                else:
                    error_count += 1
            except Exception as e:
                error_count += 1
        
        return Response({
            'success': True,
            'message': f'All games regenerated successfully',
            'deleted': total_deleted,
            'stories_processed': success_count,
            'failed': error_count,
            'games_created': game_types_created,
            'details': 'All games regenerated with new 8x8 word search format'
        })
        
    except Exception as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
