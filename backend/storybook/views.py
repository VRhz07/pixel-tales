"""
API Views for the Storybook platform
"""
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from django.contrib.auth.models import User
from django.shortcuts import get_object_or_404
from django.db.models import Q, Avg
from django.utils import timezone
import json

from .models import (
    UserProfile, Story, Character, Comment, Like, Rating, SavedStory,
    Friendship, Achievement, UserAchievement, Notification, Message,
    ParentChildRelationship, TeacherStudentRelationship, StoryRead,
    CollaborationSession, SessionParticipant, DrawingOperation, CollaborationInvite
)
from .serializers import (
    UserProfileSerializer, StorySerializer, StoryListSerializer,
    CharacterSerializer, CharacterListSerializer, CommentSerializer,
    LikeSerializer, RatingSerializer, AchievementSerializer, UserAchievementSerializer,
    NotificationSerializer, FriendshipSerializer, MessageSerializer, ParentChildRelationshipSerializer
)
from .jwt_decorators import jwt_required, api_authentication_required

import random
import string

def generate_join_code():
    """Generate a unique 5-character alphanumeric code"""
    while True:
        code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=5))
        # Avoid confusing characters
        code = code.replace('0', '2').replace('O', '3').replace('I', '4').replace('1', '5')
        if not CollaborationSession.objects.filter(join_code=code).exists():
            return code


# User Profile Views
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_profile(request):
    """Get current user's profile"""
    try:
        profile = request.user.profile
        serializer = UserProfileSerializer(profile)
        return Response({
            'success': True,
            'profile': serializer.data
        })
    except UserProfile.DoesNotExist:
        return Response({
            'error': 'Profile not found'
        }, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_rewards(request):
    """Get user's unlocked rewards (avatars and borders)"""
    from .reward_service import RewardService
    
    try:
        # Ensure user has a profile
        if not hasattr(request.user, 'profile'):
            return Response({
                'error': 'User profile not found. Please contact support.'
            }, status=status.HTTP_404_NOT_FOUND)
        
        profile = request.user.profile
        
        # Get rewards info based on user level
        rewards_info = RewardService.get_all_rewards_info(profile.level)
        
        return Response({
            'success': True,
            'rewards': rewards_info,
            'selected_border': profile.selected_avatar_border
        })
    except UserProfile.DoesNotExist:
        return Response({
            'error': 'User profile not found'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        import traceback
        print(f"Error in get_user_rewards: {str(e)}")
        print(traceback.format_exc())
        return Response({
            'error': f'Failed to load rewards: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def update_user_profile(request):
    """Update current user's profile"""
    from .reward_service import RewardService
    
    try:
        profile = request.user.profile
        
        # If updating avatar border, verify it's unlocked
        if 'selected_avatar_border' in request.data:
            border_id = request.data['selected_avatar_border']
            unlocked_borders = RewardService.get_unlocked_borders(profile.level)
            unlocked_border_ids = [b['id'] for b in unlocked_borders]
            
            if border_id not in unlocked_border_ids:
                return Response({
                    'error': 'This border is not unlocked yet',
                    'required_level': 'Level up to unlock more borders'
                }, status=status.HTTP_403_FORBIDDEN)
        
        serializer = UserProfileSerializer(profile, data=request.data, partial=True)
        
        if serializer.is_valid():
            serializer.save()
            return Response({
                'success': True,
                'message': 'Profile updated successfully',
                'profile': serializer.data
            })
        else:
            return Response({
                'error': 'Validation failed',
                'details': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
            
    except UserProfile.DoesNotExist:
        return Response({
            'error': 'Profile not found'
        }, status=status.HTTP_404_NOT_FOUND)


# Story Views
@api_view(['GET'])
@permission_classes([AllowAny])
def story_list(request):
    """Get list of stories - supports filtering by user, published status, etc."""
    
    # Check if requesting all published stories (for public library)
    public_library = request.GET.get('public', 'false').lower() == 'true'
    
    if public_library:
        # Return all published stories from all users
        stories = Story.objects.filter(is_published=True).select_related('author', 'author__profile').order_by('-date_created')
        print(f"📚 Public library: {stories.count()} published stories from all users")
    elif request.user.is_authenticated:
        # Return user's own stories (including drafts)
        stories = Story.objects.filter(author=request.user).order_by('-date_created')
        print(f"📚 User {request.user.id} has {stories.count()} total stories")
        print(f"   Published: {stories.filter(is_published=True).count()}")
        print(f"   Drafts: {stories.filter(is_published=False).count()}")
    else:
        # For anonymous users, only show published stories
        stories = Story.objects.filter(is_published=True).order_by('-date_created')
    
    # Add search functionality
    search = request.GET.get('search', '')
    if search:
        stories = stories.filter(
            Q(title__icontains=search) | 
            Q(content__icontains=search) |
            Q(author__profile__display_name__icontains=search)
        )
    
    # Add category filter (supports both single category and genres array)
    category = request.GET.get('category', '')
    if category:
        # For SQLite compatibility, we need to filter in Python since JSONField contains lookup isn't supported
        # Get all stories and filter manually
        all_stories = list(stories)
        filtered_stories = []
        for story in all_stories:
            # Check if category matches OR if category is in genres array
            if story.category == category or (story.genres and category in story.genres):
                filtered_stories.append(story.id)
        
        # Filter queryset by matching IDs
        if filtered_stories:
            stories = stories.filter(id__in=filtered_stories)
        else:
            stories = stories.none()  # No matches
    
    # Add language filter
    language = request.GET.get('language', '')
    if language:
        stories = stories.filter(language=language)
    
    # Pagination
    paginator = PageNumberPagination()
    # Allow client to specify page_size, default to 12, max 100
    page_size = request.GET.get('page_size', '12')
    try:
        paginator.page_size = min(int(page_size), 100)  # Cap at 100 to prevent abuse
    except ValueError:
        paginator.page_size = 12
    result_page = paginator.paginate_queryset(stories, request)
    
    serializer = StoryListSerializer(result_page, many=True, context={'request': request})
    return paginator.get_paginated_response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_story(request):
    """Create a new story"""
    from .xp_service import award_xp
    
    serializer = StorySerializer(data=request.data)
    
    if serializer.is_valid():
        story = serializer.save(author=request.user)
        
        # Award XP for creating a story
        xp_result = award_xp(request.user, 'story_created')
        
        return Response({
            'success': True,
            'message': 'Story created successfully',
            'story': StorySerializer(story, context={'request': request}).data,
            'xp_earned': xp_result if xp_result else None
        }, status=status.HTTP_201_CREATED)
    else:
        return Response({
            'error': 'Validation failed',
            'details': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([AllowAny])
def story_detail(request, story_id):
    """Get story details"""
    story = get_object_or_404(Story, id=story_id)
    
    # Check if story is published or user is the owner
    if not story.is_published and story.author != request.user:
        return Response({
            'error': 'Story not found or not published'
        }, status=status.HTTP_404_NOT_FOUND)
    
    # Increment view count
    story.views += 1
    story.save(update_fields=['views'])
    
    # Track story read for authenticated users (for achievements)
    # Only track if user is not the author (don't count reading your own stories)
    if request.user.is_authenticated and story.author != request.user:
        from storybook.models import StoryRead
        # Create or update the read record (get_or_create prevents duplicates)
        StoryRead.objects.get_or_create(
            story=story,
            user=request.user
        )
    
    serializer = StorySerializer(story, context={'request': request})
    return Response({
        'success': True,
        'story': serializer.data
    })


@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def update_story(request, story_id):
    """Update a story (only by owner)"""
    story = get_object_or_404(Story, id=story_id, author=request.user)
    
    serializer = StorySerializer(story, data=request.data, partial=True, context={'request': request})
    
    if serializer.is_valid():
        serializer.save()
        return Response({
            'success': True,
            'message': 'Story updated successfully',
            'story': serializer.data
        })
    else:
        return Response({
            'error': 'Validation failed',
            'details': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_story(request, story_id):
    """Delete a story (only by owner)"""
    story = get_object_or_404(Story, id=story_id, author=request.user)
    story.delete()
    
    return Response({
        'success': True,
        'message': 'Story deleted successfully'
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def publish_story(request, story_id):
    """Publish a story (make it visible in public library)"""
    from .xp_service import award_xp
    
    story = get_object_or_404(Story, id=story_id, author=request.user)
    
    if story.is_published:
        return Response({
            'success': False,
            'message': 'Story is already published'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    story.is_published = True
    story.save()
    
    # Award XP for publishing a story
    xp_result = award_xp(request.user, 'story_published')
    
    return Response({
        'success': True,
        'message': 'Story published successfully',
        'story_id': story.id,
        'xp_earned': xp_result if xp_result else None
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def unpublish_story(request, story_id):
    """Unpublish a story (remove from public library, move back to drafts)"""
    story = get_object_or_404(Story, id=story_id, author=request.user)
    
    print(f"📤 Unpublish request for story {story_id}: {story.title}")
    print(f"   Current is_published: {story.is_published}")
    
    if not story.is_published:
        print(f"⚠️ Story {story_id} is already unpublished")
        return Response({
            'success': False,
            'message': 'Story is already unpublished'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    story.is_published = False
    story.save()
    
    # Verify the change was saved
    story.refresh_from_db()
    print(f"✅ Story {story_id} unpublished successfully")
    print(f"   New is_published: {story.is_published}")
    
    return Response({
        'success': True,
        'message': 'Story unpublished successfully',
        'story_id': story.id,
        'is_published': story.is_published  # Include in response for verification
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def user_stories(request, user_id):
    """Get stories by a specific user"""
    user = get_object_or_404(User, id=user_id)
    stories = Story.objects.filter(author=user, is_published=True).order_by('-date_created')
    
    paginator = PageNumberPagination()
    paginator.page_size = 12
    result_page = paginator.paginate_queryset(stories, request)
    
    serializer = StoryListSerializer(result_page, many=True)
    return paginator.get_paginated_response(serializer.data)


# Character Views
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def character_list(request):
    """Get user's characters"""
    characters = Character.objects.filter(creator=request.user).order_by('-date_created')
    serializer = CharacterListSerializer(characters, many=True)
    
    return Response({
        'success': True,
        'characters': serializer.data
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_character(request):
    """Create a new character"""
    serializer = CharacterSerializer(data=request.data)
    
    if serializer.is_valid():
        character = serializer.save(creator=request.user)
        return Response({
            'success': True,
            'message': 'Character created successfully',
            'character': CharacterSerializer(character).data
        }, status=status.HTTP_201_CREATED)
    else:
        return Response({
            'error': 'Validation failed',
            'details': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def character_detail(request, character_id):
    """Get character details"""
    character = get_object_or_404(Character, id=character_id, creator=request.user)
    serializer = CharacterSerializer(character)
    
    return Response({
        'success': True,
        'character': serializer.data
    })


@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def update_character(request, character_id):
    """Update a character"""
    character = get_object_or_404(Character, id=character_id, creator=request.user)
    
    serializer = CharacterSerializer(character, data=request.data, partial=True)
    
    if serializer.is_valid():
        serializer.save()
        return Response({
            'success': True,
            'message': 'Character updated successfully',
            'character': serializer.data
        })
    else:
        return Response({
            'error': 'Validation failed',
            'details': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_character(request, character_id):
    """Delete a character"""
    character = get_object_or_404(Character, id=character_id, creator=request.user)
    character.delete()
    
    return Response({
        'success': True,
        'message': 'Character deleted successfully'
    })


# Comment Views
@api_view(['GET'])
@permission_classes([AllowAny])
def story_comments(request, story_id):
    """Get comments for a story"""
    story = get_object_or_404(Story, id=story_id, is_published=True)
    comments = Comment.objects.filter(story=story).order_by('-date_created')
    
    paginator = PageNumberPagination()
    paginator.page_size = 20
    result_page = paginator.paginate_queryset(comments, request)
    
    serializer = CommentSerializer(result_page, many=True)
    return paginator.get_paginated_response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_comment(request, story_id):
    """Create a comment on a story"""
    story = get_object_or_404(Story, id=story_id, is_published=True)
    
    data = request.data.copy()
    data['story'] = story.id
    
    serializer = CommentSerializer(data=data)
    
    if serializer.is_valid():
        comment = serializer.save(author=request.user)
        return Response({
            'success': True,
            'message': 'Comment created successfully',
            'comment': CommentSerializer(comment).data
        }, status=status.HTTP_201_CREATED)
    else:
        return Response({
            'error': 'Validation failed',
            'details': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)


# Like Views
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def like_story(request, story_id):
    """Like a story (toggle like/unlike)"""
    from .xp_service import award_xp
    
    story = get_object_or_404(Story, id=story_id, is_published=True)
    
    # Check if user already liked this story
    like = Like.objects.filter(story=story, user=request.user).first()
    
    if like:
        # Unlike - remove the like (no XP deduction)
        like.delete()
        return Response({
            'success': True,
            'message': 'Story unliked',
            'is_liked': False,
            'likes_count': story.likes.count()
        })
    else:
        # Like - create new like
        like = Like.objects.create(story=story, user=request.user)
        
        # Award XP to the story author (not the liker)
        if story.author != request.user:
            award_xp(story.author, 'story_liked', create_notification=False)
        
        return Response({
            'success': True,
            'message': 'Story liked',
            'is_liked': True,
            'likes_count': story.likes.count()
        }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def save_story(request, story_id):
    """Save a story to user's library (toggle save/unsave)"""
    story = get_object_or_404(Story, id=story_id, is_published=True)
    
    # Check if user already saved this story
    saved = SavedStory.objects.filter(story=story, user=request.user).first()
    
    if saved:
        # Unsave - remove the saved story
        saved.delete()
        return Response({
            'success': True,
            'message': 'Story removed from library',
            'is_saved': False,
            'saves_count': story.saved_by.count()
        })
    else:
        # Save - create new saved story
        saved = SavedStory.objects.create(story=story, user=request.user)
        return Response({
            'success': True,
            'message': 'Story saved to library',
            'is_saved': True,
            'saves_count': story.saved_by.count()
        }, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def saved_stories(request):
    """Get user's saved stories"""
    saved = SavedStory.objects.filter(user=request.user).select_related('story', 'story__author', 'story__author__profile')
    
    stories = []
    for saved_story in saved:
        story = saved_story.story
        serializer = StoryListSerializer(story)
        story_data = serializer.data
        story_data['date_saved'] = saved_story.date_saved
        stories.append(story_data)
    
    return Response({
        'success': True,
        'stories': stories
    })


# Rating Views
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def rate_story(request, story_id):
    """Rate a story"""
    story = get_object_or_404(Story, id=story_id, is_published=True)
    
    # Check if user already rated this story
    rating, created = Rating.objects.get_or_create(
        story=story,
        user=request.user,
        defaults={'value': request.data.get('rating', 5)}
    )
    
    if not created:
        # Update existing rating
        rating.value = request.data.get('rating', rating.value)
        rating.save()
        message = 'Rating updated successfully'
    else:
        message = 'Rating created successfully'
    
    return Response({
        'success': True,
        'message': message,
        'rating': RatingSerializer(rating).data
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def story_stats(request, story_id):
    """Get interaction statistics for a story"""
    story = get_object_or_404(Story, id=story_id)
    
    # Check if story is published or user is the owner
    if not story.is_published and (not request.user.is_authenticated or story.author != request.user):
        return Response({
            'error': 'Story not found or not published'
        }, status=status.HTTP_404_NOT_FOUND)
    
    # Get interaction counts
    likes_count = story.likes.count()
    comments_count = story.comments.count()
    views = story.views
    saves_count = story.saved_by.count()
    
    # Check if current user has liked/saved the story
    is_liked_by_user = False
    is_saved_by_user = False
    if request.user.is_authenticated:
        is_liked_by_user = story.likes.filter(user=request.user).exists()
        is_saved_by_user = story.saved_by.filter(user=request.user).exists()
    
    return Response({
        'success': True,
        'likes_count': likes_count,
        'comments_count': comments_count,
        'views': views,
        'saves_count': saves_count,
        'is_liked_by_user': is_liked_by_user,
        'is_saved_by_user': is_saved_by_user
    })


# Achievement Views
@api_view(['GET'])
@permission_classes([AllowAny])
def achievement_list(request):
    """Get all achievements"""
    achievements = Achievement.objects.filter(is_active=True)
    serializer = AchievementSerializer(achievements, many=True)
    
    return Response({
        'success': True,
        'achievements': serializer.data
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_achievements(request):
    """Get user's achievements"""
    user_achievements = UserAchievement.objects.filter(user=request.user).select_related('achievement')
    serializer = UserAchievementSerializer(user_achievements, many=True)
    
    return Response({
        'success': True,
        'achievements': serializer.data
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def achievement_progress(request):
    """Get all achievements with user's progress"""
    try:
        from django.db.models import Count, Sum
        from storybook.models import StoryRead
        
        user = request.user
        
        # Calculate user stats
        stories = Story.objects.filter(author=user)
        total_stories = stories.count()  # Total stories created (manual + AI)
        published_stories = stories.filter(is_published=True).count()
        manual_stories = stories.filter(creation_type='manual').count()
        ai_stories = stories.filter(creation_type='ai_assisted').count()
        
        # Word count
        total_words = sum(len(story.content.split()) for story in stories)
        
        # Friends count
        friends_count = Friendship.objects.filter(
            Q(sender=user, status='accepted') | Q(receiver=user, status='accepted')
        ).count()
        
        # Likes received
        likes_received = Like.objects.filter(story__author=user).count()
        
        # Comments received
        comments_received = Comment.objects.filter(story__author=user).count()
        
        # Views received (sum of all views on user's stories)
        views_received = stories.aggregate(total_views=Sum('views'))['total_views'] or 0
        
        # Stories read
        stories_read_count = StoryRead.objects.filter(user=user).count()
        
        # Characters created
        characters_created = Character.objects.filter(creator=user).count()
        
        # Collaboration count - count stories where user is a co-author (has saved collaborative stories)
        collaboration_count = Story.objects.filter(
            is_collaborative=True,
            authors=user
        ).count()
        
        # Leaderboard rank (simplified - based on published stories)
        users_with_more_stories = User.objects.annotate(
            story_count=Count('stories', filter=Q(stories__is_published=True))
        ).filter(story_count__gt=published_stories).count()
        leaderboard_rank = users_with_more_stories + 1
        
        user_stats = {
            'total_stories': total_stories,
            'published_stories': published_stories,
            'manual_stories': manual_stories,
            'ai_stories': ai_stories,
            'total_words': total_words,
            'friends': friends_count,
            'likes_received': likes_received,
            'comments_received': comments_received,
            'views_received': views_received,
            'stories_read': stories_read_count,
            'characters_created': characters_created,
            'collaboration_count': collaboration_count,
            'leaderboard_rank': leaderboard_rank,
        }
        
        # Get all achievements
        achievements = Achievement.objects.filter(is_active=True).order_by('category', 'sort_order')
        
        # Get existing user achievements
        user_achievements_dict = {}
        for ua in UserAchievement.objects.filter(user=user).select_related('achievement'):
            user_achievements_dict[ua.achievement_id] = ua
        
        # Build response with progress
        achievements_data = []
        for achievement in achievements:
            # Get current progress based on metric type
            current_progress = user_stats.get(achievement.metric_type, 0)
            
            # Special handling for leaderboard (lower is better)
            if achievement.metric_type == 'leaderboard_rank':
                is_earned = current_progress <= achievement.target_value if achievement.target_value else False
                progress_percentage = min(100, (achievement.target_value / max(current_progress, 1)) * 100) if achievement.target_value else 0
            else:
                is_earned = current_progress >= achievement.target_value if achievement.target_value else False
                progress_percentage = min(100, (current_progress / achievement.target_value * 100)) if achievement.target_value else 0
            
            # Update or create UserAchievement
            if achievement.id in user_achievements_dict:
                ua = user_achievements_dict[achievement.id]
                if ua.progress != current_progress or ua.is_earned != is_earned:
                    ua.progress = current_progress
                    ua.is_earned = is_earned
                    if is_earned and not ua.earned_at:
                        from django.utils import timezone
                        ua.earned_at = timezone.now()
                    ua.save(update_fields=['progress', 'is_earned', 'earned_at'])
            else:
                from django.utils import timezone
                ua = UserAchievement.objects.create(
                    user=user,
                    achievement=achievement,
                    progress=current_progress,
                    is_earned=is_earned,
                    earned_at=timezone.now() if is_earned else None
                )
                user_achievements_dict[achievement.id] = ua
            
            achievements_data.append({
                'id': achievement.id,
                'name': achievement.name,
                'description': achievement.description,
                'category': achievement.category,
                'metric_type': achievement.metric_type,
                'icon': achievement.icon,
                'color': achievement.color,
                'target_value': achievement.target_value,
                'rarity': achievement.rarity,
                'sort_order': achievement.sort_order,
                'progress': current_progress,
                'progress_percentage': round(progress_percentage, 1),
                'is_earned': is_earned,
                'earned_at': ua.earned_at.isoformat() if ua.earned_at else None,
            })
        
        return Response({
            'success': True,
            'achievements': achievements_data,
            'user_stats': user_stats
        })
        
    except Exception as e:
        import traceback
        print(f"Error in achievement_progress: {str(e)}")
        print(traceback.format_exc())
        return Response({
            'error': str(e),
            'details': 'Failed to calculate achievement progress'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# Notification Views
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def notification_list(request):
    """Get user's notifications"""
    notifications = Notification.objects.filter(recipient=request.user).order_by('-created_at')
    
    paginator = PageNumberPagination()
    paginator.page_size = 20
    result_page = paginator.paginate_queryset(notifications, request)
    
    serializer = NotificationSerializer(result_page, many=True)
    return paginator.get_paginated_response(serializer.data)


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def mark_notification_read(request, notification_id):
    """Mark a notification as read"""
    notification = get_object_or_404(Notification, id=notification_id, recipient=request.user)
    notification.is_read = True
    notification.save()
    
    return Response({
        'success': True,
        'message': 'Notification marked as read'
    })


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def mark_all_notifications_read(request):
    """Mark all notifications as read"""
    Notification.objects.filter(recipient=request.user, is_read=False).update(is_read=True)
    
    return Response({
        'success': True,
        'message': 'All notifications marked as read'
    })


# Friendship Views (Basic implementation)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def search_users(request):
    """Search for users by name or username. Returns all users (friends and non-friends) with their relationship status."""
    query = request.GET.get('q', '').strip()
    offset = int(request.GET.get('offset', 0))
    limit = int(request.GET.get('limit', 10))
    # Note: exclude_friends parameter is now ignored to show all users
    # The frontend can filter by is_friend status if needed
    
    # Get current user's friends and pending requests first
    friend_ids = set()
    pending_sent_ids = set()
    pending_received_ids = set()
    
    friendships = Friendship.objects.filter(
        Q(sender=request.user) | Q(receiver=request.user)
    )
    
    for friendship in friendships:
        if friendship.status == 'accepted':
            friend_ids.add(friendship.sender_id if friendship.receiver_id == request.user.id else friendship.receiver_id)
        elif friendship.status == 'pending':
            if friendship.sender_id == request.user.id:
                pending_sent_ids.add(friendship.receiver_id)
            else:
                pending_received_ids.add(friendship.sender_id)
    
    # Build base query - exclude current user, admins/staff, and parent accounts
    users_query = User.objects.exclude(id=request.user.id).select_related('profile')
    
    # Exclude admin and staff users
    users_query = users_query.exclude(is_staff=True).exclude(is_superuser=True)
    
    # Exclude parent accounts (only show child accounts)
    users_query = users_query.exclude(profile__user_type='parent')
    
    # NOTE: We no longer exclude friends - show all users!
    # Users can see both friends and non-friends in search results
    # The is_friend flag will indicate their relationship status
    
    # Apply search filter if query provided
    if query:
        users_query = users_query.filter(
            Q(username__icontains=query) | 
            Q(profile__display_name__icontains=query)
        )
    
    # Get total count before pagination
    total_count = users_query.count()
    
    # Apply pagination
    users = users_query[offset:offset + limit]
    
    # Build user list with relationship status
    user_list = []
    for user in users:
        user_data = {
            'id': user.id,
            'username': user.username,
            'name': user.profile.display_name if hasattr(user, 'profile') else user.username,
            'avatar': user.profile.avatar_emoji if hasattr(user, 'profile') and user.profile.avatar_emoji else '📚',
            'bio': user.profile.bio if hasattr(user, 'profile') and user.profile.bio else '',
            'is_friend': user.id in friend_ids,
            'request_sent': user.id in pending_sent_ids,
            'request_received': user.id in pending_received_ids,
            'story_count': user.stories.filter(is_published=True).count(),
        }
        user_list.append(user_data)
    
    return Response({
        'success': True,
        'users': user_list,
        'total': total_count,
        'offset': offset,
        'limit': limit,
        'has_more': (offset + limit) < total_count
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def friend_list(request):
    """Get user's friends with message activity"""
    from django.db.models import Max, Count, Q as QueryQ
    
    friendships = Friendship.objects.filter(
        Q(sender=request.user, status='accepted') |
        Q(receiver=request.user, status='accepted')
    )
    
    friends_data = []
    for friendship in friendships:
        # Determine who the friend is (NOT the current user)
        friend = friendship.receiver if friendship.sender == request.user else friendship.sender
        friend_profile = getattr(friend, 'profile', None)
        
        # Get last message time between these two users
        last_message = Message.objects.filter(
            (QueryQ(sender=request.user, receiver=friend) | QueryQ(sender=friend, receiver=request.user))
        ).order_by('-created_at').first()
        
        # Count unread messages from this friend
        unread_count = Message.objects.filter(
            sender=friend,
            receiver=request.user,
            is_read=False
        ).count()
        
        # Check for pending collaboration invites from this friend
        collab_invite = Notification.objects.filter(
            recipient=request.user,
            sender=friend,
            notification_type='collaboration_invite',
            is_read=False
        ).order_by('-created_at').first()
        
        # Build friend data directly (no need for full serializer)
        friend_data = {
            'id': friend.id,
            'name': friend_profile.display_name if friend_profile else friend.username,
            'avatar': friend_profile.avatar_emoji if friend_profile and friend_profile.avatar_emoji else '👤',
            'username': friend.username,
            'is_online': friend_profile.is_online if friend_profile else False,
            'story_count': friend.stories.filter(is_published=True).count(),
            'last_message_time': last_message.created_at.isoformat() if last_message else None,
            'unread_messages': unread_count if unread_count > 0 else None,
        }
        
        # Add collaboration invite if exists
        if collab_invite:
            friend_data['collaboration_invite'] = {
                'id': collab_invite.id,
                'session_id': collab_invite.data.get('session_id') if collab_invite.data else None,
                'story_title': collab_invite.data.get('story_title') if collab_invite.data else 'Untitled Story',
                'created_at': collab_invite.created_at.isoformat()
            }
        
        friends_data.append(friend_data)
    
    return Response({
        'success': True,
        'friends': friends_data
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def friend_requests(request):
    """Get pending friend requests"""
    requests = Friendship.objects.filter(receiver=request.user, status='pending')
    serializer = FriendshipSerializer(requests, many=True)
    
    return Response({
        'success': True,
        'requests': serializer.data
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_friend_request(request):
    """Send a friend request"""
    from channels.layers import get_channel_layer
    from asgiref.sync import async_to_sync
    
    receiver_id = request.data.get('receiver_id')
    
    if not receiver_id:
        return Response({
            'error': 'Receiver ID is required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    receiver = get_object_or_404(User, id=receiver_id)
    
    # Check if friendship already exists
    existing = Friendship.objects.filter(
        Q(sender=request.user, receiver=receiver) |
        Q(sender=receiver, receiver=request.user)
    ).first()
    
    if existing:
        return Response({
            'error': 'Friend request already exists or you are already friends'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    friendship = Friendship.objects.create(
        sender=request.user,
        receiver=receiver,
        status='pending'
    )
    
    # Send real-time notification via WebSocket
    channel_layer = get_channel_layer()
    if channel_layer:
        friendship_data = FriendshipSerializer(friendship).data
        async_to_sync(channel_layer.group_send)(
            f'notifications_{receiver_id}',
            {
                'type': 'friend_request',
                'friendship': friendship_data
            }
        )
    
    return Response({
        'success': True,
        'message': 'Friend request sent successfully',
        'friendship': FriendshipSerializer(friendship).data
    }, status=status.HTTP_201_CREATED)


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def respond_friend_request(request, request_id):
    """Accept or reject a friend request"""
    from channels.layers import get_channel_layer
    from asgiref.sync import async_to_sync
    
    friendship = get_object_or_404(Friendship, id=request_id, receiver=request.user, status='pending')
    
    action = request.data.get('action')  # 'accept' or 'reject'
    
    if action == 'accept':
        friendship.status = 'accepted'
        message = 'Friend request accepted'
    elif action == 'reject':
        friendship.status = 'rejected'
        message = 'Friend request rejected'
    else:
        return Response({
            'error': 'Invalid action. Use "accept" or "reject"'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    friendship.save()
    
    # Send real-time notification to the sender via WebSocket
    if action == 'accept':
        channel_layer = get_channel_layer()
        if channel_layer:
            friendship_data = FriendshipSerializer(friendship).data
            async_to_sync(channel_layer.group_send)(
                f'notifications_{friendship.sender_id}',
                {
                    'type': 'friend_request_accepted',
                    'friendship': friendship_data
                }
            )
    
    return Response({
        'success': True,
        'message': message,
        'friendship': FriendshipSerializer(friendship).data
    })


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def unfriend_user(request, user_id):
    """Remove a friend"""
    other_user = get_object_or_404(User, id=user_id)
    
    # Find the friendship (could be in either direction)
    friendship = Friendship.objects.filter(
        Q(sender=request.user, receiver=other_user, status='accepted') |
        Q(sender=other_user, receiver=request.user, status='accepted')
    ).first()
    
    if not friendship:
        return Response({
            'error': 'Friendship not found'
        }, status=status.HTTP_404_NOT_FOUND)
    
    friendship.delete()
    
    return Response({
        'success': True,
        'message': 'Friend removed successfully'
    })


# Messaging Views
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_conversations(request):
    """Get list of conversations (users you've messaged with)"""
    # Get all users the current user has exchanged messages with
    sent_to = Message.objects.filter(sender=request.user).values_list('receiver', flat=True).distinct()
    received_from = Message.objects.filter(receiver=request.user).values_list('sender', flat=True).distinct()
    
    conversation_user_ids = set(list(sent_to) + list(received_from))
    
    conversations = []
    for user_id in conversation_user_ids:
        other_user = User.objects.get(id=user_id)
        
        # Get last message
        last_message = Message.objects.filter(
            Q(sender=request.user, receiver=other_user) |
            Q(sender=other_user, receiver=request.user)
        ).order_by('-created_at').first()
        
        # Count unread messages
        unread_count = Message.objects.filter(
            sender=other_user,
            receiver=request.user,
            is_read=False
        ).count()
        
        profile = getattr(other_user, 'profile', None)
        
        conversations.append({
            'user': {
                'id': other_user.id,
                'username': other_user.username,
                'name': profile.display_name if profile else other_user.username,
            },
            'last_message': {
                'content': last_message.content if last_message else '',
                'created_at': last_message.created_at if last_message else None,
                'is_from_me': last_message.sender_id == request.user.id if last_message else False,
            },
            'unread_count': unread_count,
        })
    
    # Sort by last message time
    conversations.sort(key=lambda x: x['last_message']['created_at'] or '', reverse=True)
    
    return Response({
        'success': True,
        'conversations': conversations
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_messages(request, user_id):
    """Get messages with a specific user"""
    other_user = get_object_or_404(User, id=user_id)
    
    # Get all messages between the two users
    messages = Message.objects.filter(
        Q(sender=request.user, receiver=other_user) |
        Q(sender=other_user, receiver=request.user)
    ).order_by('created_at')
    
    # Mark messages from other user as read
    Message.objects.filter(
        sender=other_user,
        receiver=request.user,
        is_read=False
    ).update(is_read=True)
    
    serializer = MessageSerializer(messages, many=True)
    
    return Response({
        'success': True,
        'messages': serializer.data
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_message(request):
    """Send a message to another user"""
    from channels.layers import get_channel_layer
    from asgiref.sync import async_to_sync
    
    receiver_id = request.data.get('receiver_id')
    content = request.data.get('content', '').strip()
    
    if not receiver_id:
        return Response({
            'error': 'Receiver ID is required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    if not content:
        return Response({
            'error': 'Message content is required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    receiver = get_object_or_404(User, id=receiver_id)
    
    # Check if users are friends (optional - remove if you want to allow messaging non-friends)
    are_friends = Friendship.objects.filter(
        Q(sender=request.user, receiver=receiver, status='accepted') |
        Q(sender=receiver, receiver=request.user, status='accepted')
    ).exists()
    
    if not are_friends:
        return Response({
            'error': 'You can only message your friends'
        }, status=status.HTTP_403_FORBIDDEN)
    
    # Create message
    message = Message.objects.create(
        sender=request.user,
        receiver=receiver,
        content=content
    )
    
    serializer = MessageSerializer(message)
    
    # Send real-time notification via WebSocket
    channel_layer = get_channel_layer()
    if channel_layer:
        message_data = serializer.data
        async_to_sync(channel_layer.group_send)(
            f'notifications_{receiver_id}',
            {
                'type': 'new_message',
                'message': message_data
            }
        )
    
    return Response({
        'success': True,
        'message': serializer.data
    }, status=status.HTTP_201_CREATED)


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def mark_messages_read(request, user_id):
    """Mark all messages from a user as read"""
    other_user = get_object_or_404(User, id=user_id)
    
    updated_count = Message.objects.filter(
        sender=other_user,
        receiver=request.user,
        is_read=False
    ).update(is_read=True)
    
    return Response({
        'success': True,
        'marked_read': updated_count
    })


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_message(request, message_id):
    """Delete a message (only sender can delete)"""
    message = get_object_or_404(Message, id=message_id)
    
    # Only the sender can delete their own message
    if message.sender != request.user:
        return Response({
            'error': 'You can only delete your own messages'
        }, status=status.HTTP_403_FORBIDDEN)
    
    message.delete()
    
    return Response({
        'success': True,
        'message': 'Message deleted successfully'
    })


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def edit_message(request, message_id):
    """Edit a message (only sender can edit)"""
    message = get_object_or_404(Message, id=message_id)
    
    # Only the sender can edit their own message
    if message.sender != request.user:
        return Response({
            'error': 'You can only edit your own messages'
        }, status=status.HTTP_403_FORBIDDEN)
    
    content = request.data.get('content', '').strip()
    
    if not content:
        return Response({
            'error': 'Message content is required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    message.content = content
    message.save()
    
    serializer = MessageSerializer(message)
    
    return Response({
        'success': True,
        'message': serializer.data
    })


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_comment(request, comment_id):
    """Delete a comment (only author can delete)"""
    comment = get_object_or_404(Comment, id=comment_id)
    
    # Only the author can delete their own comment
    if comment.author != request.user:
        return Response({
            'error': 'You can only delete your own comments'
        }, status=status.HTTP_403_FORBIDDEN)
    
    comment.delete()
    
    return Response({
        'success': True,
        'message': 'Comment deleted successfully'
    })


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def edit_comment(request, comment_id):
    """Edit a comment (only author can edit)"""
    comment = get_object_or_404(Comment, id=comment_id)
    
    # Only the author can edit their own comment
    if comment.author != request.user:
        return Response({
            'error': 'You can only edit your own comments'
        }, status=status.HTTP_403_FORBIDDEN)
    
    text = request.data.get('text', '').strip()
    
    if not text:
        return Response({
            'error': 'Comment text is required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    comment.text = text
    comment.save()
    
    serializer = CommentSerializer(comment)
    
    return Response({
        'success': True,
        'comment': serializer.data
    })


# Social Features - Activity Feed, Leaderboard, Friend Profile
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_activity_feed(request):
    """
    Get activity feed showing:
    1. All users (friends or not) who interact with YOUR stories (likes, comments, saves)
    2. Friends who publish new stories
    Note: Achievements are NOT included to reduce data transfer
    """
    try:
        limit = int(request.GET.get('limit', 50))
        
        # Get user's friends
        friendships = Friendship.objects.filter(
            Q(sender=request.user, status='accepted') |
            Q(receiver=request.user, status='accepted')
        )
        
        friend_ids = []
        for friendship in friendships:
            friend_id = friendship.sender_id if friendship.receiver_id == request.user.id else friendship.receiver_id
            friend_ids.append(friend_id)
        
        activities = []
        
        # 1. Get recent published stories from FRIENDS only
        recent_stories = Story.objects.filter(
            author_id__in=friend_ids,
            is_published=True
        ).select_related('author', 'author__profile').order_by('-date_created')[:limit]
        
        for story in recent_stories:
            activities.append({
                'id': f'story_{story.id}',
                'user_id': story.author.id,
                'user_name': story.author.profile.display_name if hasattr(story.author, 'profile') else story.author.username,
                'user_avatar': '👤',
                'activity_type': 'published',
                'story_title': story.title,
                'story_id': story.id,
                'timestamp': story.date_created.isoformat(),
            })
        
        # 2. Get likes on YOUR stories from ANYONE (including yourself)
        my_stories = Story.objects.filter(author=request.user).values_list('id', flat=True)
        recent_likes_on_my_stories = Like.objects.filter(
            story_id__in=my_stories
        ).select_related('user', 'user__profile', 'story').order_by('-date_created')[:limit]
        
        for like in recent_likes_on_my_stories:
            activities.append({
                'id': f'like_{like.id}',
                'user_id': like.user.id,
                'user_name': like.user.profile.display_name if hasattr(like.user, 'profile') else like.user.username,
                'user_avatar': '👤',
                'activity_type': 'liked_your_story',
                'story_title': like.story.title,
                'story_id': like.story.id,
                'timestamp': like.date_created.isoformat(),
            })
        
        # 3. Get comments on YOUR stories from ANYONE (including yourself)
        recent_comments_on_my_stories = Comment.objects.filter(
            story_id__in=my_stories
        ).select_related('author', 'author__profile', 'story').order_by('-date_created')[:limit]
        
        for comment in recent_comments_on_my_stories:
            activities.append({
                'id': f'comment_{comment.id}',
                'user_id': comment.author.id,
                'user_name': comment.author.profile.display_name if hasattr(comment.author, 'profile') else comment.author.username,
                'user_avatar': '👤',
                'activity_type': 'commented_on_your_story',
                'story_title': comment.story.title,
                'story_id': comment.story.id,
                'timestamp': comment.date_created.isoformat(),
            })
        
        # 4. Get saves on YOUR stories from ANYONE (including yourself)
        try:
            recent_saves_on_my_stories = SavedStory.objects.filter(
                story_id__in=my_stories
            ).select_related('user', 'user__profile', 'story').order_by('-date_saved')[:limit]
            
            for save in recent_saves_on_my_stories:
                activities.append({
                    'id': f'save_{save.id}',
                    'user_id': save.user.id,
                    'user_name': save.user.profile.display_name if hasattr(save.user, 'profile') else save.user.username,
                    'user_avatar': '👤',
                    'activity_type': 'saved_your_story',
                    'story_title': save.story.title,
                    'story_id': save.story.id,
                    'timestamp': save.date_saved.isoformat(),
                })
        except Exception as e:
            # Skip if error
            print(f"Error fetching saved stories: {e}")
        
        # Sort all activities by timestamp (most recent first)
        activities.sort(key=lambda x: x['timestamp'], reverse=True)
        
        # Limit to requested number
        activities = activities[:limit]
        
        return Response({
            'success': True,
            'activities': activities
        })
    except Exception as e:
        import traceback
        print(f"Error in get_activity_feed: {e}")
        print(traceback.format_exc())
        return Response({
            'success': False,
            'error': str(e),
            'activities': []
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([AllowAny])
def get_leaderboard(request):
    """Get leaderboard of top creators"""
    limit = int(request.GET.get('limit', 10))
    
    # Get users with their story counts, total reads, and total likes
    from django.db.models import Count, Sum
    
    users = User.objects.annotate(
        story_count=Count('stories', filter=Q(stories__is_published=True)),
        total_reads=Sum('stories__views', filter=Q(stories__is_published=True)),
        total_likes=Count('stories__likes', filter=Q(stories__is_published=True))
    ).filter(
        story_count__gt=0
    ).select_related('profile')
    
    leaderboard = []
    for user in users:
        # Get user's earned badges (achievements) - only show earned ones
        user_achievements = UserAchievement.objects.filter(
            user=user, 
            is_earned=True,
            earned_at__isnull=False
        ).select_related('achievement').order_by('-earned_at')
        
        # Get achievement count and icons
        achievement_count = user_achievements.count()
        badge_icons = [ua.achievement.icon or '🏆' for ua in user_achievements[:10]]  # Show up to 10 badges
        
        leaderboard.append({
            'id': user.id,
            'name': user.profile.display_name if hasattr(user, 'profile') else user.username,
            'avatar': '👤',
            'rank': 0,  # Rank will be assigned by frontend based on filter
            'story_count': user.story_count or 0,
            'total_reads': user.total_reads or 0,
            'total_likes': user.total_likes or 0,
            'badges': badge_icons,
            'achievement_count': achievement_count,
        })
    
    return Response({
        'success': True,
        'leaderboard': leaderboard
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_friend_profile(request, user_id):
    """Get detailed friend profile"""
    user = get_object_or_404(User, id=user_id)
    
    # Check if they are friends
    are_friends = Friendship.objects.filter(
        Q(sender=request.user, receiver=user, status='accepted') |
        Q(sender=user, receiver=request.user, status='accepted')
    ).exists()
    
    if not are_friends and user != request.user:
        return Response({
            'error': 'You can only view profiles of your friends'
        }, status=status.HTTP_403_FORBIDDEN)
    
    # Get profile data
    profile = getattr(user, 'profile', None)
    
    # Get story statistics
    from django.db.models import Count, Sum
    story_stats = Story.objects.filter(
        author=user,
        is_published=True
    ).aggregate(
        story_count=Count('id'),
        total_reads=Sum('views'),
        total_likes=Count('likes')
    )
    
    # Get follower/following count (using friendships)
    follower_count = Friendship.objects.filter(receiver=user, status='accepted').count()
    following_count = Friendship.objects.filter(sender=user, status='accepted').count()
    
    # Get user's earned badges (achievements) - only show earned ones
    user_achievements = UserAchievement.objects.filter(
        user=user,
        is_earned=True,
        earned_at__isnull=False
    ).select_related('achievement').order_by('-earned_at')
    
    achievement_count = user_achievements.count()
    badges = [ua.achievement.icon or '🏆' for ua in user_achievements[:10]]
    
    # Get recent stories
    recent_stories = Story.objects.filter(
        author=user,
        is_published=True
    ).order_by('-date_created')[:6]
    
    recent_stories_data = []
    for story in recent_stories:
        likes_count = story.likes.count()
        recent_stories_data.append({
            'id': story.id,
            'title': story.title,
            'cover': '📖',  # Default cover
            'likes': likes_count,
        })
    
    return Response({
        'success': True,
        'profile': {
            'id': user.id,
            'username': user.username,
            'name': profile.display_name if profile else user.username,
            'avatar': '👤',
            'bio': profile.bio if profile and profile.bio else '',
            'story_count': story_stats['story_count'] or 0,
            'follower_count': follower_count,
            'following_count': following_count,
            'total_reads': story_stats['total_reads'] or 0,
            'total_likes': story_stats['total_likes'] or 0,
            'joined_date': user.date_joined.strftime('%Y-%m-%d'),
            'is_online': False,  # TODO: Implement online status tracking
            'badges': badges,
            'achievement_count': achievement_count,
            'recent_stories': recent_stories_data,
        }
    })


# ========== Collaborative Drawing Views ==========

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_collaboration_session(request):
    """Create a new collaborative drawing session"""
    from .models import CollaborationSession, SessionParticipant
    import uuid
    from datetime import timedelta
    from django.utils import timezone
    
    try:
        canvas_name = request.data.get('canvas_name', 'Untitled Canvas')
        max_participants = request.data.get('max_participants', 10)
        duration_hours = request.data.get('duration_hours', 24)
        
        # Generate unique session ID (use full UUID for WebSocket compatibility)
        session_id = str(uuid.uuid4())
        join_code = generate_join_code()
        
        # Create session
        session = CollaborationSession.objects.create(
            session_id=session_id,
            join_code=join_code,
            host=request.user,
            canvas_name=canvas_name,
            max_participants=max_participants,
            expires_at=timezone.now() + timedelta(hours=duration_hours)
        )
        
        # Automatically add the host as a participant
        SessionParticipant.objects.create(
            session=session,
            user=request.user,
            role='host',
            is_active=True
        )
        
        return Response({
            'success': True,
            'session': {
                'session_id': session.session_id,
                'join_code': session.join_code,
                'canvas_name': session.canvas_name,
                'invite_link': session.invite_link,
                'max_participants': session.max_participants,
                'expires_at': session.expires_at,
                'websocket_url': f'/ws/collaborate/{session.session_id}/'
            }
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response({
            'error': f'Failed to create session: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def join_session_by_code(request):
    """Join a collaboration session using a 5-character code"""
    join_code = request.data.get('join_code', '').strip().upper()
    
    if not join_code:
        return Response({
            'error': 'Join code is required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    if len(join_code) != 5:
        return Response({
            'error': 'Join code must be 5 characters'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Find session by join code
    try:
        session = CollaborationSession.objects.get(join_code=join_code, is_active=True)
    except CollaborationSession.DoesNotExist:
        return Response({
            'error': 'Invalid or expired join code'
        }, status=status.HTTP_404_NOT_FOUND)
    
    # Check if session can accept new participants
    if not session.can_join():
        return Response({
            'error': 'Session is full or no longer accepting participants'
        }, status=status.HTTP_403_FORBIDDEN)
    
    # Check if user is already in the session
    existing_participant = SessionParticipant.objects.filter(
        session=session,
        user=request.user
    ).first()
    
    if existing_participant:
        if not existing_participant.is_active:
            existing_participant.is_active = True
            existing_participant.save()
    else:
        # Add user as participant
        colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', 
                  '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B4D9', '#A2D5AB']
        cursor_color = random.choice(colors)
        
        SessionParticipant.objects.create(
            session=session,
            user=request.user,
            role='participant',
            cursor_color=cursor_color,
            is_active=True
        )
    
    # Get session details
    participants = []
    for p in session.participants.filter(is_active=True):
        participants.append({
            'user_id': p.user.id,
            'username': p.user.username,
            'cursor_color': p.cursor_color,
            'joined_at': p.joined_at.isoformat()
        })
    
    return Response({
        'success': True,
        'session': {
            'session_id': session.session_id,
            'join_code': session.join_code,
            'canvas_name': session.canvas_name,
            'host': {
                'id': session.host.id,
                'username': session.host.username
            },
            'is_host': session.host.id == request.user.id,
            'max_participants': session.max_participants,
            'participant_count': len(participants),
            'can_join': session.can_join(),
            'participants': participants,
            'created_at': session.created_at.isoformat(),
            'expires_at': session.expires_at.isoformat() if session.expires_at else None,
            'websocket_url': f'/ws/collaborate/{session.session_id}/'
        }
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_collaboration_session(request, session_id):
    """Get collaboration session details"""
    from .models import CollaborationSession
    
    try:
        session = CollaborationSession.objects.get(session_id=session_id)
        
        # Check if user can access this session
        if not session.is_active:
            return Response({
                'error': 'Session is no longer active'
            }, status=status.HTTP_404_NOT_FOUND)
        
        participants = session.participants.filter(is_active=True).select_related('user')
        
        return Response({
            'success': True,
            'session': {
                'session_id': session.session_id,
                'join_code': session.join_code,
                'canvas_name': session.canvas_name,
                'host': {
                    'id': session.host.id,
                    'username': session.host.username
                },
                'host_id': session.host.id,
                'is_host': session.host.id == request.user.id,
                'max_participants': session.max_participants,
                'participant_count': session.participant_count,
                'can_join': session.can_join(),
                'is_lobby_open': session.is_lobby_open,
                'story_draft': session.story_draft,
                'story_title': session.story_draft.get('title', 'Collaborative Story') if session.story_draft else 'Collaborative Story',
                'participants': [
                    {
                        'user_id': p.user.id,
                        'username': p.user.username,
                        'cursor_color': p.cursor_color,
                        'joined_at': p.joined_at
                    }
                    for p in participants
                ],
                'created_at': session.created_at,
                'expires_at': session.expires_at,
                'websocket_url': f'/ws/collaborate/{session.session_id}/'
            }
        })
        
    except CollaborationSession.DoesNotExist:
        return Response({
            'error': 'Session not found'
        }, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_user_sessions(request):
    """List all sessions created by or participated in by the user"""
    from .models import CollaborationSession, SessionParticipant
    
    # Sessions hosted by user
    hosted_sessions = CollaborationSession.objects.filter(
        host=request.user,
        is_active=True
    ).order_by('-created_at')[:10]
    
    # Sessions user is participating in
    participated_sessions = CollaborationSession.objects.filter(
        participants__user=request.user,
        participants__is_active=True,
        is_active=True
    ).exclude(host=request.user).order_by('-created_at')[:10]
    
    return Response({
        'success': True,
        'hosted_sessions': [
            {
                'session_id': s.session_id,
                'canvas_name': s.canvas_name,
                'participant_count': s.participant_count,
                'max_participants': s.max_participants,
                'created_at': s.created_at,
                'invite_link': s.invite_link
            }
            for s in hosted_sessions
        ],
        'participated_sessions': [
            {
                'session_id': s.session_id,
                'canvas_name': s.canvas_name,
                'host': s.host.username,
                'participant_count': s.participant_count,
                'created_at': s.created_at
            }
            for s in participated_sessions
        ]
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def end_collaboration_session(request, session_id):
    """End a collaboration session (host only) - kicks all participants"""
    from .models import CollaborationSession
    from channels.layers import get_channel_layer
    from asgiref.sync import async_to_sync
    
    try:
        session = CollaborationSession.objects.get(session_id=session_id)
        
        # Only host can end session
        if session.host != request.user:
            return Response({
                'error': 'Only the host can end this session'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Get all participants before ending
        participants = session.participants.filter(is_active=True)
        
        # Broadcast session ended to all participants via collaboration WebSocket
        channel_layer = get_channel_layer()
        if channel_layer:
            print(f"🎬 Broadcasting session_ended to group: collab_{session_id}")
            async_to_sync(channel_layer.group_send)(
                f'collab_{session_id}',
                {
                    'type': 'session_ended',
                    'session_id': session_id,
                    'story_title': session.canvas_name,
                    'ended_by': request.user.username
                }
            )
            
            # Also send individual notifications
            for participant in participants:
                async_to_sync(channel_layer.group_send)(
                    f'notifications_{participant.user.id}',
                    {
                        'type': 'collaboration_host_left',
                        'session_id': session_id,
                        'story_title': session.canvas_name
                    }
                )
        
        session.is_active = False
        session.save()
        
        return Response({
            'success': True,
            'message': 'Session ended successfully'
        })
        
    except CollaborationSession.DoesNotExist:
        return Response({
            'error': 'Session not found'
        }, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def start_collaboration_session(request, session_id):
    """Start a collaboration session (host only) - notifies all participants"""
    from .models import CollaborationSession
    from channels.layers import get_channel_layer
    from asgiref.sync import async_to_sync
    
    try:
        session = CollaborationSession.objects.get(session_id=session_id)
        
        # Only host can start session
        if session.host != request.user:
            return Response({
                'error': 'Only the host can start this session'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Mark session as started - close lobby to indicate session is active
        session.is_lobby_open = False
        session.save(update_fields=['is_lobby_open'])
        
        # Get all participants who have accepted the invite
        participants = session.participants.filter(is_active=True)
        
        # Broadcast session start to all participants via WebSocket
        channel_layer = get_channel_layer()
        if channel_layer:
            for participant in participants:
                async_to_sync(channel_layer.group_send)(
                    f'notifications_{participant.user.id}',
                    {
                        'type': 'collaboration_session_started',
                        'session_id': session_id,
                        'story_title': session.canvas_name
                    }
                )
        
        return Response({
            'success': True,
            'message': 'Session started successfully',
            'session_id': session_id
        })
        
    except CollaborationSession.DoesNotExist:
        return Response({
            'error': 'Session not found'
        }, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def initiate_collaboration_vote(request, session_id):
    """Initiate a vote to save and end the collaboration session"""
    from .models import CollaborationSession
    from channels.layers import get_channel_layer
    from asgiref.sync import async_to_sync
    import uuid
    
    try:
        session = CollaborationSession.objects.get(session_id=session_id)
        
        # Check if user is a participant
        participant = session.participants.filter(user=request.user, is_active=True).first()
        if not participant:
            return Response({
                'error': 'You are not a participant in this session'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Get all active participants
        active_participants = session.participants.filter(is_active=True)
        total_participants = active_participants.count()
        
        # Generate vote ID
        vote_id = str(uuid.uuid4())
        
        # Broadcast vote initiation to all participants via collaboration WebSocket
        channel_layer = get_channel_layer()
        if channel_layer:
            print(f"🗳️ Broadcasting vote_initiated to group: collab_{session_id}")
            print(f"🗳️ Vote data: vote_id={vote_id}, initiated_by={request.user.id}, total={total_participants}")
            async_to_sync(channel_layer.group_send)(
                f'collab_{session_id}',
                {
                    'type': 'vote_initiated',
                    'vote_id': vote_id,
                    'initiated_by': request.user.id,
                    'initiated_by_username': request.user.username,
                    'total_participants': total_participants,
                    'question': 'Save and end the collaboration session?'
                }
            )
            print(f"✅ Vote initiation broadcast complete")
        else:
            print(f"❌ No channel_layer available!")
        
        return Response({
            'success': True,
            'vote_id': vote_id,
            'total_participants': total_participants
        })
        
    except CollaborationSession.DoesNotExist:
        return Response({
            'error': 'Session not found'
        }, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def cast_collaboration_vote(request, session_id):
    """Cast a vote to save the collaboration session"""
    from .models import CollaborationSession
    from channels.layers import get_channel_layer
    from asgiref.sync import async_to_sync
    from django.core.cache import cache
    
    try:
        session = CollaborationSession.objects.get(session_id=session_id)
        
        # Check if user is a participant
        participant = session.participants.filter(user=request.user, is_active=True).first()
        if not participant:
            return Response({
                'error': 'You are not a participant in this session'
            }, status=status.HTTP_403_FORBIDDEN)
        
        vote_id = request.data.get('vote_id')
        agree = request.data.get('agree', False)
        
        if not vote_id:
            return Response({
                'error': 'vote_id is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Store vote in cache (temporary storage)
        vote_key = f'collab_vote_{vote_id}'
        vote_data = cache.get(vote_key, {'yes': set(), 'no': set(), 'total_participants': 0})
        
        # Initialize if first vote
        if not vote_data.get('total_participants'):
            total_participants = session.participants.filter(is_active=True).count()
            vote_data['total_participants'] = total_participants
        
        # Record the vote
        user_id = str(request.user.id)
        if agree:
            vote_data['yes'].add(user_id)
            vote_data['no'].discard(user_id)
        else:
            vote_data['no'].add(user_id)
            vote_data['yes'].discard(user_id)
        
        # Save to cache for 5 minutes
        cache.set(vote_key, vote_data, timeout=300)
        
        yes_count = len(vote_data['yes'])
        no_count = len(vote_data['no'])
        total_participants = vote_data['total_participants']
        
        # Broadcast vote update to all participants
        channel_layer = get_channel_layer()
        if channel_layer:
            # Convert sets to dict for JSON serialization (use integer keys for frontend)
            voting_data_dict = {}
            for uid in vote_data['yes']:
                voting_data_dict[int(uid)] = True
            for uid in vote_data['no']:
                voting_data_dict[int(uid)] = False
            
            print(f"📊 Broadcasting vote_update: vote_id={vote_id}, voting_data={voting_data_dict}")
            async_to_sync(channel_layer.group_send)(
                f'collab_{session_id}',
                {
                    'type': 'vote_updated',
                    'vote_id': vote_id,
                    'voting_data': voting_data_dict,
                    'yes_count': yes_count,
                    'no_count': no_count,
                    'current_votes': yes_count + no_count,
                    'total_participants': total_participants
                }
            )
        
        # Check if all participants have voted
        if yes_count + no_count >= total_participants:
            # Vote is complete - determine result
            approved = yes_count > no_count
            
            print(f"🎉 All votes collected! Result: {'APPROVED' if approved else 'REJECTED'}")
            print(f"📊 Final tally: Yes={yes_count}, No={no_count}, Total={total_participants}")
            
            # Broadcast result to all participants
            channel_layer = get_channel_layer()
            if channel_layer:
                print(f"📢 Broadcasting vote_result to group: collab_{session_id}")
                async_to_sync(channel_layer.group_send)(
                    f'collab_{session_id}',
                    {
                        'type': 'vote_result',
                        'vote_id': vote_id,
                        'approved': approved,
                        'yes_votes': yes_count,
                        'no_votes': no_count,
                        'total_participants': total_participants
                    }
                )
                print(f"✅ vote_result broadcast complete")
            
            # Clean up vote data
            cache.delete(vote_key)
            
            return Response({
                'success': True,
                'vote_complete': True,
                'approved': approved,
                'yes_votes': yes_count,
                'no_votes': no_count
            })
        
        # Vote is still in progress
        return Response({
            'success': True,
            'vote_complete': False,
            'yes_votes': yes_count,
            'no_votes': no_count,
            'total_participants': total_participants
        })
        
    except CollaborationSession.DoesNotExist:
        return Response({
            'error': 'Session not found'
        }, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_collaboration_participants(request, session_id):
    """Get list of participants in a collaboration session"""
    from .models import CollaborationSession, Notification
    
    try:
        session = CollaborationSession.objects.get(session_id=session_id)
        
        # Check if user is host or participant
        is_host = session.host.id == request.user.id
        is_participant = session.participants.filter(user=request.user).exists()
        
        if not is_host and not is_participant:
            return Response({
                'error': 'You are not authorized to view this session'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Get all pending invites for this session
        pending_invites = Notification.objects.filter(
            notification_type='collaboration_invite',
            is_read=False,
            data__session_id=session_id
        ).select_related('recipient')
        
        # Get accepted participants
        accepted_participants = session.participants.filter(is_active=True).select_related('user')
        
        participants_list = []
        
        # Add host
        participants_list.append({
            'user_id': session.host.id,
            'username': session.host.username,
            'status': 'joined',
            'is_host': True
        })
        
        # Add accepted participants
        for participant in accepted_participants:
            participants_list.append({
                'user_id': participant.user.id,
                'username': participant.user.username,
                'status': 'joined',
                'is_host': False
            })
        
        # Add pending invites
        for invite in pending_invites:
            # Check if user hasn't already joined
            if not any(p['user_id'] == invite.recipient.id for p in participants_list):
                participants_list.append({
                    'user_id': invite.recipient.id,
                    'username': invite.recipient.username,
                    'status': 'pending',
                    'is_host': False
                })
        
        return Response({
            'success': True,
            'participants': participants_list
        })
        
    except CollaborationSession.DoesNotExist:
        return Response({
            'error': 'Session not found'
        }, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_collaboration_invite(request):
    """Send a collaboration invitation to a friend via message"""
    from .models import CollaborationSession
    from django.contrib.auth.models import User
    from channels.layers import get_channel_layer
    from asgiref.sync import async_to_sync
    
    session_id = request.data.get('session_id')
    friend_id = request.data.get('friend_id')
    story_title = request.data.get('story_title', 'Untitled Story')
    is_session_active = request.data.get('is_session_active', False)
    
    if not session_id or not friend_id:
        return Response({
            'error': 'session_id and friend_id are required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        print(f"🔔 Sending collaboration invite: session_id={session_id}, friend_id={friend_id}, story_title={story_title}")
        
        # Verify session exists and user is host
        session = CollaborationSession.objects.get(session_id=session_id)
        print(f"✅ Session found: {session.session_id}, host: {session.host.username}")
        
        if session.host != request.user:
            return Response({
                'error': 'Only the host can send invitations'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Verify friend exists
        friend = User.objects.get(id=friend_id)
        print(f"✅ Friend found: {friend.username}")
        
        # Check if there's already a pending invite for this session and friend
        # Note: Using filter then checking in Python for SQLite compatibility
        existing_invites = Notification.objects.filter(
            recipient=friend,
            sender=request.user,
            notification_type='collaboration_invite',
            is_read=False
        )
        
        existing_invite = None
        for invite in existing_invites:
            if invite.data and invite.data.get('session_id') == session_id:
                existing_invite = invite
                break
        
        if existing_invite:
            # Delete the old invite so we can create a fresh one (allows re-inviting)
            print(f"🔄 Deleting existing invite and creating new one for session {session_id}")
            existing_invite.delete()
        
        # Create a notification for collaboration invite
        try:
            inviter_name = request.user.profile.display_name if hasattr(request.user, 'profile') and request.user.profile.display_name else request.user.username
        except Exception as profile_error:
            print(f"⚠️ Error getting profile name: {profile_error}")
            inviter_name = request.user.username
        
        print(f"📝 Creating notification: inviter={inviter_name}, recipient={friend.username}")
        
        # Create notification
        notification = Notification.objects.create(
            recipient=friend,
            sender=request.user,
            notification_type='collaboration_invite',
            title='Collaboration Invitation',
            message=f"{inviter_name} invited you to collaborate on '{story_title}'",
            data={
                'session_id': session_id,
                'story_title': story_title,
                'inviter_id': request.user.id,
                'inviter_name': inviter_name,
                'is_session_active': is_session_active
            }
        )
        print(f"✅ Notification created: ID={notification.id}")
        
        # Send real-time notification via WebSocket
        channel_layer = get_channel_layer()
        print(f"📡 Channel layer: {channel_layer}")
        if channel_layer:
            from .serializers import NotificationSerializer
            notification_data = NotificationSerializer(notification).data
            print(f"📤 Sending WebSocket message to notifications_{friend_id}")
            print(f"📋 Notification data: {notification_data}")
            async_to_sync(channel_layer.group_send)(
                f'notifications_{friend_id}',
                {
                    'type': 'collaboration_invite',
                    'notification': notification_data
                }
            )
            print(f"✅ WebSocket message sent successfully")
        else:
            print(f"⚠️ No channel layer available, skipping WebSocket")
        
        print(f"🎉 Collaboration invite sent successfully!")
        return Response({
            'success': True,
            'message': 'Invitation sent as notification',
            'notification_id': notification.id
        })
        
    except CollaborationSession.DoesNotExist:
        return Response({
            'error': 'Session not found'
        }, status=status.HTTP_404_NOT_FOUND)
    except User.DoesNotExist:
        return Response({
            'error': 'Friend not found'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        import traceback
        print(f"❌ Error sending collaboration invite: {str(e)}")
        print(traceback.format_exc())
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_collaboration_invites(request):
    """Get pending collaboration invitations (automatically removes invites older than 24 hours)"""
    from .models import Notification
    from django.utils import timezone
    from datetime import timedelta
    
    try:
        # Delete invitations older than 1 minute
        timeout_threshold = timezone.now() - timedelta(minutes=1)
        old_invites = Notification.objects.filter(
            recipient=request.user,
            notification_type='collaboration_invite',
            is_read=False,
            created_at__lt=timeout_threshold
        )
        deleted_count = old_invites.count()
        if deleted_count > 0:
            print(f"🗑️ Deleted {deleted_count} expired collaboration invites for user {request.user.id}")
            old_invites.delete()
        
        # Get remaining valid invitations
        invitations = Notification.objects.filter(
            recipient=request.user,
            notification_type='collaboration_invite',
            is_read=False
        ).order_by('-created_at')
        
        invite_data = []
        for notification in invitations:
            try:
                # Handle both dict and None for data field
                data = notification.data if isinstance(notification.data, dict) else {}
                sender = notification.sender
                
                invite_data.append({
                    'id': notification.id,
                    'session_id': data.get('session_id', ''),
                    'story_title': data.get('story_title', 'Untitled Story'),
                    'inviter_id': data.get('inviter_id', sender.id if sender else 0),
                    'inviter_name': data.get('inviter_name', sender.username if sender else 'Unknown'),
                    'inviter_avatar': '👤',
                    'created_at': notification.created_at.isoformat() if notification.created_at else '',
                    'is_read': notification.is_read
                })
            except Exception as e:
                print(f"Error processing notification {notification.id}: {e}")
                continue
        
        return Response({
            'success': True,
            'invitations': invite_data
        })
    
    except Exception as e:
        print(f"Error in get_collaboration_invites: {e}")
        import traceback
        traceback.print_exc()
        return Response({
            'error': str(e),
            'invitations': []
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def respond_to_collaboration_invite(request, notification_id):
    """Accept or decline a collaboration invitation"""
    from .models import Notification
    
    action = request.data.get('action')  # 'accept' or 'decline'
    
    if action not in ['accept', 'decline']:
        return Response({
            'error': 'action must be "accept" or "decline"'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        notification = Notification.objects.get(
            id=notification_id,
            recipient=request.user,
            notification_type='collaboration_invite'
        )
        
        # Mark notification as read
        notification.is_read = True
        notification.save()
        
        data = notification.data or {}
        
        return Response({
            'success': True,
            'action': action,
            'session_id': data.get('session_id') if action == 'accept' else None
        })
        
    except Notification.DoesNotExist:
        return Response({
            'error': 'Invitation not found'
        }, status=status.HTTP_404_NOT_FOUND)


# ========== Parent/Teacher Dashboard Views ==========

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_parent_children(request):
    """Get all children associated with parent account"""
    try:
        print(f"🔍 GET PARENT CHILDREN - User: {request.user.username} (ID: {request.user.id})")
        user_profile = request.user.profile
        print(f"   User type: {user_profile.user_type}")
        
        if user_profile.user_type not in ['parent', 'teacher']:
            return Response({
                'error': 'Only parent/teacher accounts can access this endpoint'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Get all active children relationships
        if user_profile.user_type == 'parent':
            relationships = ParentChildRelationship.objects.filter(
                parent=request.user, 
                is_active=True
            ).select_related('child', 'child__profile')
        else:  # teacher
            relationships = TeacherStudentRelationship.objects.filter(
                teacher=request.user, 
                is_active=True
            ).select_related('student', 'student__profile')
        
        print(f"   Found {relationships.count()} relationships")
        
        children_data = []
        for rel in relationships:
            # Get child/student based on relationship type
            child = rel.child if user_profile.user_type == 'parent' else rel.student
            child_profile = child.profile
            
            # Get basic stats
            total_stories = child.stories.filter(is_published=True).count()
            total_reads = StoryRead.objects.filter(user=child).count()
            achievements_count = UserAchievement.objects.filter(user=child, is_earned=True).count()
            
            child_data = {
                'id': child.id,
                'username': child.username,
                'name': child_profile.display_name,
                'avatar': child_profile.avatar_emoji or (child_profile.avatar.url if child_profile.avatar else '📚'),
                'is_online': child_profile.is_online,
                'last_seen': child_profile.last_seen.isoformat() if child_profile.last_seen else None,
                'total_stories': total_stories,
                'total_reads': total_reads,
                'achievements_count': achievements_count,
                'date_added': rel.date_created.isoformat() if rel.date_created else None
            }
            print(f"   Added child: {child.username} (ID: {child.id})")
            children_data.append(child_data)
        
        print(f"✅ Returning {len(children_data)} children")
        return Response({
            'success': True,
            'children': children_data
        })
        
    except Exception as e:
        import traceback
        print(f"Error in get_parent_children: {str(e)}")
        print(traceback.format_exc())
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_teacher_students(request):
    """Get all students associated with teacher account"""
    try:
        user_profile = request.user.profile
        
        if user_profile.user_type != 'teacher':
            return Response({
                'error': 'Only teacher accounts can access this endpoint'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Get all active student relationships
        relationships = TeacherStudentRelationship.objects.filter(
            teacher=request.user, 
            is_active=True
        ).select_related('student', 'student__profile')
        
        students_data = []
        for rel in relationships:
            student = rel.student
            student_profile = student.profile
            
            # Get basic stats
            total_stories = student.stories.filter(is_published=True).count()
            total_reads = StoryRead.objects.filter(user=student).count()
            achievements_count = UserAchievement.objects.filter(user=student, is_earned=True).count()
            
            students_data.append({
                'id': student.id,
                'username': student.username,
                'name': student_profile.display_name,
                'avatar': student_profile.avatar.url if student_profile.avatar else None,
                'is_online': student_profile.is_online,
                'last_seen': student_profile.last_seen.isoformat() if student_profile.last_seen else None,
                'total_stories': total_stories,
                'total_reads': total_reads,
                'achievements_count': achievements_count,
                'class_name': rel.class_name,
                'date_added': rel.date_created.isoformat() if rel.date_created else None
            })
        
        return Response({
            'success': True,
            'students': students_data
        })
        
    except Exception as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_child_account(request):
    """Create a new child profile and link to parent/teacher"""
    try:
        user_profile = request.user.profile
        
        if user_profile.user_type not in ['parent', 'teacher']:
            return Response({
                'error': 'Only parent/teacher accounts can create child profiles'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Get form data
        name = request.data.get('name')
        username = request.data.get('username')
        date_of_birth = request.data.get('date_of_birth')
        class_name = request.data.get('class_name', '')
        
        # Validate required fields
        if not all([name, username]):
            return Response({
                'error': 'Name and username are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if username already exists
        if User.objects.filter(username=username).exists():
            return Response({
                'error': 'Username already exists'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Generate dummy email for child (not used for login)
        email = f"{username}@child.pixeltales.local"
        
        # Create child user account (no password needed - managed by parent)
        child_user = User.objects.create_user(
            username=username,
            email=email,
            password=User.objects.make_random_password(),  # Random password, not used
            first_name=name.split()[0] if name else '',
            last_name=' '.join(name.split()[1:]) if len(name.split()) > 1 else ''
        )
        
        # Create child profile
        child_profile = UserProfile.objects.create(
            user=child_user,
            user_type='child',
            display_name=name,
            date_of_birth=date_of_birth if date_of_birth else None
        )
        
        # Create relationship
        if user_profile.user_type == 'parent':
            ParentChildRelationship.objects.create(
                parent=request.user,
                child=child_user,
                is_active=True
            )
        else:  # teacher
            TeacherStudentRelationship.objects.create(
                teacher=request.user,
                student=child_user,
                is_active=True,
                class_name=class_name
            )
        
        return Response({
            'success': True,
            'message': f'Child profile created successfully for {name}',
            'child': {
                'id': child_user.id,
                'username': child_user.username,
                'name': name
            }
        })
        
    except Exception as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_child_relationship(request):
    """Add an existing child to parent account"""
    try:
        user_profile = request.user.profile
        
        if user_profile.user_type not in ['parent', 'teacher']:
            return Response({
                'error': 'Only parent/teacher accounts can add children/students'
            }, status=status.HTTP_403_FORBIDDEN)
        
        child_username = request.data.get('child_username')
        class_name = request.data.get('class_name', '')
        
        if not child_username:
            return Response({
                'error': 'Child username is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Find child user
        try:
            child = User.objects.get(username=child_username)
            child_profile = child.profile
            
            if child_profile.user_type != 'child':
                return Response({
                    'error': 'Can only add child accounts'
                }, status=status.HTTP_400_BAD_REQUEST)
        except User.DoesNotExist:
            return Response({
                'error': 'Child user not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Create relationship
        if user_profile.user_type == 'parent':
            relationship, created = ParentChildRelationship.objects.get_or_create(
                parent=request.user,
                child=child,
                defaults={'is_active': True}
            )
            if not created and not relationship.is_active:
                relationship.is_active = True
                relationship.save()
        else:  # teacher
            relationship, created = TeacherStudentRelationship.objects.get_or_create(
                teacher=request.user,
                student=child,
                defaults={'is_active': True, 'class_name': class_name}
            )
            if not created and not relationship.is_active:
                relationship.is_active = True
                relationship.class_name = class_name
                relationship.save()
        
        return Response({
            'success': True,
            'message': f'Successfully added {child.username}',
            'created': created
        })
        
    except Exception as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def update_child_profile(request, child_id):
    """Update a child's profile information"""
    try:
        user_profile = request.user.profile
        
        if user_profile.user_type not in ['parent', 'teacher']:
            return Response({
                'error': 'Only parent/teacher accounts can update child profiles'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Verify relationship exists
        if user_profile.user_type == 'parent':
            relationship = ParentChildRelationship.objects.filter(
                parent=request.user,
                child_id=child_id,
                is_active=True
            ).first()
        else:  # teacher
            relationship = TeacherStudentRelationship.objects.filter(
                teacher=request.user,
                student_id=child_id,
                is_active=True
            ).first()
        
        if not relationship:
            return Response({
                'error': 'Child not found or not associated with your account'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Get the child user
        child_user = get_object_or_404(User, id=child_id)
        child_profile = child_user.profile
        
        # Update name if provided
        name = request.data.get('name')
        if name:
            child_profile.display_name = name
            child_user.first_name = name.split()[0] if name else ''
            child_user.last_name = ' '.join(name.split()[1:]) if len(name.split()) > 1 else ''
        
        # Update username if provided and not taken
        username = request.data.get('username')
        if username and username != child_user.username:
            if User.objects.filter(username=username).exists():
                return Response({
                    'error': 'Username already exists'
                }, status=status.HTTP_400_BAD_REQUEST)
            child_user.username = username
            child_user.email = f"{username}@child.pixeltales.local"
        
        # Update date of birth if provided
        date_of_birth = request.data.get('dateOfBirth') or request.data.get('date_of_birth')
        if date_of_birth:
            child_profile.date_of_birth = date_of_birth
        
        # Update class name if provided (for teachers)
        class_name = request.data.get('className') or request.data.get('class_name')
        if class_name is not None:
            # Store in relationship metadata if needed
            pass
        
        # Save changes
        child_user.save()
        child_profile.save()
        
        return Response({
            'success': True,
            'message': 'Child profile updated successfully',
            'child': {
                'id': child_user.id,
                'name': child_profile.display_name,
                'username': child_user.username,
                'email': child_user.email
            }
        })
        
    except Exception as e:
        print(f"Error updating child profile: {str(e)}")
        return Response({
            'error': 'Failed to update child profile',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def remove_child_relationship(request, child_id):
    """Remove a child from parent account and archive the child's profile"""
    try:
        user_profile = request.user.profile
        
        if user_profile.user_type not in ['parent', 'teacher']:
            return Response({
                'error': 'Only parent/teacher accounts can remove children/students'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Find and deactivate relationship
        if user_profile.user_type == 'parent':
            relationship = ParentChildRelationship.objects.filter(
                parent=request.user,
                child_id=child_id,
                is_active=True
            ).first()
        else:  # teacher
            relationship = TeacherStudentRelationship.objects.filter(
                teacher=request.user,
                student_id=child_id,
                is_active=True
            ).first()
        
        if not relationship:
            return Response({
                'error': 'Relationship not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Deactivate the relationship
        relationship.is_active = False
        relationship.save()
        
        # Archive the child's profile
        try:
            child_user = User.objects.get(id=child_id)
            child_profile = child_user.profile
            
            # Mark profile as archived
            child_profile.is_archived = True
            child_profile.archived_at = timezone.now()
            child_profile.archive_reason = f'Removed by {user_profile.user_type}: {request.user.username}'
            child_profile.save()
            
            print(f"Child profile archived: {child_user.username} by {request.user.username}")
            
        except User.DoesNotExist:
            print(f"Child user not found: {child_id}")
        except Exception as archive_error:
            print(f"Error archiving child profile: {str(archive_error)}")
            # Continue even if archiving fails
        
        return Response({
            'success': True,
            'message': 'Child removed and archived successfully'
        })
        
    except Exception as e:
        import traceback
        print(f"Error in remove_child_relationship: {str(e)}")
        print(traceback.format_exc())
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_child_statistics(request, child_id):
    """Get detailed statistics for a specific child"""
    try:
        user_profile = request.user.profile
        
        # Verify parent/teacher relationship
        if user_profile.user_type == 'parent':
            has_access = ParentChildRelationship.objects.filter(
                parent=request.user,
                child_id=child_id,
                is_active=True
            ).exists()
        elif user_profile.user_type == 'teacher':
            has_access = TeacherStudentRelationship.objects.filter(
                teacher=request.user,
                student_id=child_id,
                is_active=True
            ).exists()
        else:
            has_access = False
        
        if not has_access:
            return Response({
                'error': 'You do not have access to this child\'s data'
            }, status=status.HTTP_403_FORBIDDEN)
        
        child = get_object_or_404(User, id=child_id)
        
        # Calculate statistics
        from datetime import datetime, timedelta
        from django.utils import timezone
        
        now = timezone.now()
        week_ago = now - timedelta(days=7)
        month_ago = now - timedelta(days=30)
        
        # Stories statistics
        total_stories = child.stories.filter(is_published=True).count()
        stories_this_week = child.stories.filter(is_published=True, date_created__gte=week_ago).count()
        stories_this_month = child.stories.filter(is_published=True, date_created__gte=month_ago).count()
        
        # Reading statistics
        total_reads = StoryRead.objects.filter(user=child).count()
        reads_this_week = StoryRead.objects.filter(user=child, date_read__gte=week_ago).count()
        reads_this_month = StoryRead.objects.filter(user=child, date_read__gte=month_ago).count()
        
        # Calculate reading time (estimate: 2 minutes per story)
        total_reading_time = total_reads * 2  # minutes
        reading_time_this_week = reads_this_week * 2
        
        # Achievements
        total_achievements = UserAchievement.objects.filter(user=child, is_earned=True).count()
        achievements_this_week = UserAchievement.objects.filter(
            user=child, 
            is_earned=True, 
            earned_at__gte=week_ago
        ).count()
        achievements_this_month = UserAchievement.objects.filter(
            user=child, 
            is_earned=True, 
            earned_at__gte=month_ago
        ).count()
        
        # Social statistics
        likes_received = Like.objects.filter(story__author=child).count()
        comments_received = Comment.objects.filter(story__author=child).count()
        friends_count = Friendship.objects.filter(
            Q(sender=child, status='accepted') | Q(receiver=child, status='accepted')
        ).count()
        
        # Progress calculation (based on multiple factors)
        max_expected_stories = 30
        max_expected_reads = 50
        max_expected_achievements = 20
        
        stories_progress = min((total_stories / max_expected_stories) * 100, 100)
        reads_progress = min((total_reads / max_expected_reads) * 100, 100)
        achievements_progress = min((total_achievements / max_expected_achievements) * 100, 100)
        
        overall_progress = (stories_progress + reads_progress + achievements_progress) / 3
        
        return Response({
            'success': True,
            'statistics': {
                'stories_read': total_reads,
                'stories_read_change': f'+{reads_this_week} this week' if reads_this_week > 0 else 'No change',
                'reading_time': f'{total_reading_time // 60}h {total_reading_time % 60}m',
                'reading_time_minutes': total_reading_time,
                'reading_time_change': f'+{reading_time_this_week}min this week',
                'achievements': total_achievements,
                'achievements_change': f'+{achievements_this_month} this month' if achievements_this_month > 0 else 'No change',
                'progress': round(overall_progress, 0),
                'stories_created': total_stories,
                'stories_this_week': stories_this_week,
                'stories_this_month': stories_this_month,
                'likes_received': likes_received,
                'comments_received': comments_received,
                'friends_count': friends_count,
            }
        })
        
    except Exception as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_child_activities(request, child_id):
    """Get recent activities for a specific child"""
    try:
        user_profile = request.user.profile
        
        # Verify parent/teacher relationship
        if user_profile.user_type == 'parent':
            has_access = ParentChildRelationship.objects.filter(
                parent=request.user,
                child_id=child_id,
                is_active=True
            ).exists()
        elif user_profile.user_type == 'teacher':
            has_access = TeacherStudentRelationship.objects.filter(
                teacher=request.user,
                student_id=child_id,
                is_active=True
            ).exists()
        else:
            has_access = False
        
        if not has_access:
            return Response({
                'error': 'You do not have access to this child\'s data'
            }, status=status.HTTP_403_FORBIDDEN)
        
        child = get_object_or_404(User, id=child_id)
        
        activities = []
        
        # Recent stories read
        recent_reads = StoryRead.objects.filter(user=child).order_by('-date_read')[:5]
        for read in recent_reads:
            story = read.story
            activities.append({
                'type': 'story_read',
                'title': story.title,
                'subtitle': f'Completed reading • {story.category}',
                'progress': 100,
                'timestamp': read.date_read.isoformat() if read.date_read else None,
                'rating': Rating.objects.filter(user=child, story=story).first().value if Rating.objects.filter(user=child, story=story).exists() else None
            })
        
        # Recent stories created
        recent_stories = child.stories.filter(is_published=True).order_by('-date_created')[:5]
        for story in recent_stories:
            activities.append({
                'type': 'story_created',
                'title': story.title,
                'subtitle': f'Published story • {story.category}',
                'progress': 100,
                'timestamp': story.date_created.isoformat() if story.date_created else None,
                'likes': story.likes.count()
            })
        
        # Recent achievements
        recent_achievements = UserAchievement.objects.filter(
            user=child, 
            is_earned=True
        ).order_by('-earned_at')[:5]
        for achievement in recent_achievements:
            timestamp = achievement.earned_at or achievement.date_earned
            activities.append({
                'type': 'achievement',
                'title': achievement.achievement.name,
                'subtitle': achievement.achievement.description,
                'progress': 100,
                'timestamp': timestamp.isoformat() if timestamp else None,
                'rarity': achievement.achievement.rarity
            })
        
        # Sort by timestamp
        activities.sort(key=lambda x: x['timestamp'], reverse=True)
        
        return Response({
            'success': True,
            'activities': activities[:10]  # Return top 10
        })
        
    except Exception as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_child_stories(request, child_id):
    """Get all stories created by a specific child"""
    try:
        user_profile = request.user.profile
        
        # Verify parent/teacher relationship
        if user_profile.user_type == 'parent':
            has_access = ParentChildRelationship.objects.filter(
                parent=request.user,
                child_id=child_id,
                is_active=True
            ).exists()
        elif user_profile.user_type == 'teacher':
            has_access = TeacherStudentRelationship.objects.filter(
                teacher=request.user,
                student_id=child_id,
                is_active=True
            ).exists()
        else:
            has_access = False
        
        if not has_access:
            return Response({
                'error': 'You do not have access to this child\'s data'
            }, status=status.HTTP_403_FORBIDDEN)
        
        child = get_object_or_404(User, id=child_id)
        
        # Get all stories (both published and drafts)
        stories = child.stories.all().order_by('-date_created')
        
        stories_data = []
        for story in stories:
            # Calculate page count based on canvas_data
            page_count = 1
            try:
                if story.canvas_data:
                    import json
                    canvas = json.loads(story.canvas_data) if isinstance(story.canvas_data, str) else story.canvas_data
                    if isinstance(canvas, dict) and 'pages' in canvas:
                        page_count = len(canvas['pages'])
                    elif isinstance(canvas, list):
                        page_count = len(canvas)
            except Exception:
                page_count = 1
            
            # Get interaction stats
            likes_count = story.likes.count()
            comments_count = story.comments.count()
            views_count = story.views
            
            # Parse canvas_data for the response
            canvas_data_json = None
            try:
                if story.canvas_data:
                    canvas_data_json = json.loads(story.canvas_data) if isinstance(story.canvas_data, str) else story.canvas_data
            except Exception:
                canvas_data_json = None
            
            stories_data.append({
                'id': story.id,
                'title': story.title,
                'category': story.category or 'Uncategorized',
                'genres': story.genres or [],
                'is_published': story.is_published,
                'creation_type': story.creation_type,
                'date_created': story.date_created.isoformat() if story.date_created else None,
                'date_updated': story.date_updated.isoformat() if story.date_updated else None,
                'page_count': page_count,
                'cover_image': story.cover_image if story.cover_image else None,
                'likes': likes_count,
                'comments': comments_count,
                'views': views_count,
                'language': story.language or 'en',
                'canvas_data': canvas_data_json,
                'content': story.content if story.content else '',
            })
        
        return Response({
            'success': True,
            'stories': stories_data,
            'total_count': len(stories_data),
            'published_count': len([s for s in stories_data if s['is_published']]),
            'draft_count': len([s for s in stories_data if not s['is_published']]),
        })
        
    except Exception as e:
        import traceback
        print(f"Error in get_child_stories: {str(e)}")
        print(traceback.format_exc())
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_child_analytics(request, child_id):
    """Get comprehensive analytics data for a specific child"""
    try:
        user_profile = request.user.profile
        
        # Verify parent/teacher relationship
        if user_profile.user_type == 'parent':
            has_access = ParentChildRelationship.objects.filter(
                parent=request.user,
                child_id=child_id,
                is_active=True
            ).exists()
        elif user_profile.user_type == 'teacher':
            has_access = TeacherStudentRelationship.objects.filter(
                teacher=request.user,
                student_id=child_id,
                is_active=True
            ).exists()
        else:
            has_access = False
        
        if not has_access:
            return Response({
                'error': 'You do not have access to this child\'s data'
            }, status=status.HTTP_403_FORBIDDEN)
        
        child = get_object_or_404(User, id=child_id)
        
        from datetime import datetime, timedelta
        from django.utils import timezone
        from django.db.models import Count, Avg
        
        now = timezone.now()
        week_ago = now - timedelta(days=7)
        
        # Daily reading time for the last 7 days
        daily_reading = []
        daily_stories = []
        for i in range(6, -1, -1):
            day_start = (now - timedelta(days=i)).replace(hour=0, minute=0, second=0)
            day_end = day_start + timedelta(days=1)
            
            reads_count = StoryRead.objects.filter(
                user=child,
                date_read__gte=day_start,
                date_read__lt=day_end
            ).count()
            
            stories_count = child.stories.filter(
                is_published=True,
                date_created__gte=day_start,
                date_created__lt=day_end
            ).count()
            
            daily_reading.append(reads_count * 2)  # 2 minutes per story
            daily_stories.append(stories_count)
        
        # Recent milestones
        milestones = []
        recent_achievements = UserAchievement.objects.filter(
            user=child,
            is_earned=True
        ).order_by('-earned_at')[:10]
        
        for ua in recent_achievements:
            milestones.append({
                'title': ua.achievement.name,
                'date': ua.earned_at.isoformat() if ua.earned_at else None,
                'icon': ua.achievement.icon or '🏆',
                'color': ua.achievement.color or '#FFB347',
                'rarity': ua.achievement.rarity or 'common'
            })
        
        # Category breakdown
        stories = child.stories.filter(is_published=True)
        category_counts = {}
        total_stories = stories.count()
        
        for story in stories:
            category = story.category or 'Other'
            category_counts[category] = category_counts.get(category, 0) + 1
        
        categories = []
        for category, count in sorted(category_counts.items(), key=lambda x: x[1], reverse=True):
            percentage = (count / total_stories * 100) if total_stories > 0 else 0
            categories.append({
                'category': category,
                'count': count,
                'percentage': round(percentage, 1)
            })
        
        # Favorite genre (most common category)
        favorite_genre = categories[0]['category'] if categories else 'Adventure'
        favorite_genre_pct = categories[0]['percentage'] if categories else 0
        
        # Average rating
        avg_rating = Rating.objects.filter(story__author=child).aggregate(
            avg=Avg('value')
        )['avg'] or 0
        
        # Strengths calculation
        total_reads = StoryRead.objects.filter(user=child).count()
        reads_this_week = StoryRead.objects.filter(user=child, date_read__gte=week_ago).count()
        
        # Reading consistency (based on weekly activity)
        reading_consistency = min((reads_this_week / 7) * 100 / 2, 100) if reads_this_week > 0 else 0
        
        # Story completion (estimated)
        story_completion = min((total_reads / max(total_stories, 1)) * 100, 100)
        
        # Genre diversity
        genre_diversity = min((len(category_counts) / 5) * 100, 100)
        
        return Response({
            'success': True,
            'analytics': {
                'daily_reading_time': daily_reading,
                'daily_stories_completed': daily_stories,
                'milestones': milestones,
                'categories': categories,
                'favorite_genre': favorite_genre,
                'favorite_genre_percentage': round(favorite_genre_pct, 1),
                'peak_reading_time': '7:00 PM',  # Could be calculated from activity timestamps
                'average_rating': round(avg_rating, 1),
                'strengths': {
                    'reading_consistency': round(reading_consistency, 0),
                    'story_completion': round(story_completion, 0),
                    'genre_diversity': round(genre_diversity, 0)
                }
            }
        })
        
    except Exception as e:
        import traceback
        print(f"Error in get_child_analytics: {str(e)}")
        print(traceback.format_exc())
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def switch_to_child_view(request, child_id):
    """Allow parent/teacher to view the app as a specific child"""
    try:
        user_profile = request.user.profile
        
        # Verify parent/teacher relationship
        if user_profile.user_type == 'parent':
            has_access = ParentChildRelationship.objects.filter(
                parent=request.user,
                child_id=child_id,
                is_active=True
            ).exists()
        elif user_profile.user_type == 'teacher':
            has_access = TeacherStudentRelationship.objects.filter(
                teacher=request.user,
                student_id=child_id,
                is_active=True
            ).exists()
        else:
            has_access = False
        
        if not has_access:
            return Response({
                'error': 'You do not have access to this child\'s account'
            }, status=status.HTTP_403_FORBIDDEN)
        
        child = get_object_or_404(User, id=child_id)
        
        # Generate JWT tokens for the child
        from rest_framework_simplejwt.tokens import RefreshToken
        
        refresh = RefreshToken.for_user(child)
        access_token = str(refresh.access_token)
        refresh_token = str(refresh)
        
        # Get child profile data
        child_profile = child.profile
        
        return Response({
            'success': True,
            'message': f'Switched to {child_profile.display_name}\'s view',
            'tokens': {
                'access': access_token,
                'refresh': refresh_token
            },
            'user': {
                'id': child.id,
                'username': child.username,
                'email': child.email,
                'name': child_profile.display_name,
                'user_type': child_profile.user_type,
                'profile': {
                    'avatar': child_profile.avatar.url if child_profile.avatar else None,
                    'bio': child_profile.bio,
                    'display_name': child_profile.display_name,
                    'user_type': child_profile.user_type
                }
            },
            'parent_id': request.user.id,  # Store parent ID to allow switching back
            'is_child_view': True
        })
        
    except Exception as e:
        import traceback
        print(f"Error in switch_to_child_view: {str(e)}")
        print(traceback.format_exc())
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_child_goals(request, child_id):
    """Get learning goals progress for a specific child"""
    try:
        user_profile = request.user.profile
        
        # Verify parent/teacher relationship
        if user_profile.user_type == 'parent':
            has_access = ParentChildRelationship.objects.filter(
                parent=request.user,
                child_id=child_id,
                is_active=True
            ).exists()
        elif user_profile.user_type == 'teacher':
            has_access = TeacherStudentRelationship.objects.filter(
                teacher=request.user,
                student_id=child_id,
                is_active=True
            ).exists()
        else:
            has_access = False
        
        if not has_access:
            return Response({
                'error': 'You do not have access to this child\'s data'
            }, status=status.HTTP_403_FORBIDDEN)
        
        child = get_object_or_404(User, id=child_id)
        
        from datetime import timedelta
        from django.utils import timezone
        
        now = timezone.now()
        week_ago = now - timedelta(days=7)
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        
        # Define goals
        goals = []
        
        # Goal 1: Read 30 stories this month
        stories_read_this_month = StoryRead.objects.filter(
            user=child, 
            date_read__gte=month_start
        ).count()
        goals.append({
            'label': 'Read 30 stories this month',
            'current': stories_read_this_month,
            'target': 30,
            'progress': min((stories_read_this_month / 30) * 100, 100)
        })
        
        # Goal 2: Spend 10 hours reading weekly
        reads_this_week = StoryRead.objects.filter(
            user=child, 
            date_read__gte=week_ago
        ).count()
        reading_hours_this_week = (reads_this_week * 2) / 60  # 2 min per story
        goals.append({
            'label': 'Spend 10 hours reading weekly',
            'current': round(reading_hours_this_week, 1),
            'target': 10,
            'progress': min((reading_hours_this_week / 10) * 100, 100)
        })
        
        # Goal 3: Complete 5 writing activities
        stories_created = child.stories.filter(is_published=True).count()
        goals.append({
            'label': 'Create 5 stories',
            'current': stories_created,
            'target': 5,
            'progress': min((stories_created / 5) * 100, 100)
        })
        
        # Goal 4: Earn 20 achievements
        achievements_earned = UserAchievement.objects.filter(
            user=child, 
            is_earned=True
        ).count()
        goals.append({
            'label': 'Earn 20 achievements',
            'current': achievements_earned,
            'target': 20,
            'progress': min((achievements_earned / 20) * 100, 100)
        })
        
        return Response({
            'success': True,
            'goals': goals
        })
        
    except Exception as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ========== NEW COLLABORATION REST API ENDPOINTS ==========

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def kick_participant(request, session_id):
    """Host kicks a participant from collaboration session"""
    try:
        session = get_object_or_404(CollaborationSession, session_id=session_id)
        
        # Verify that the requester is the host
        if session.host != request.user:
            return Response({
                'error': 'Only the host can kick participants'
            }, status=status.HTTP_403_FORBIDDEN)
        
        user_id = request.data.get('user_id')
        if not user_id:
            return Response({
                'error': 'user_id is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Find and deactivate the participant
        try:
            participant = SessionParticipant.objects.get(
                session=session,
                user_id=user_id,
                is_active=True
            )
            participant.is_active = False
            participant.save()
            
            return Response({
                'success': True,
                'message': 'Participant removed successfully'
            })
        except SessionParticipant.DoesNotExist:
            return Response({
                'error': 'Participant not found in this session'
            }, status=status.HTTP_404_NOT_FOUND)
            
    except CollaborationSession.DoesNotExist:
        return Response({
            'error': 'Collaboration session not found'
        }, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_session_presence(request, session_id):
    """Get all active users in collaboration session"""
    try:
        session = get_object_or_404(CollaborationSession, session_id=session_id)
        
        # Check if user is a participant
        is_participant = SessionParticipant.objects.filter(
            session=session,
            user=request.user,
            is_active=True
        ).exists()
        
        # If not a participant but is the host, automatically add them
        if not is_participant:
            if session.host == request.user:
                # Auto-add host as participant
                colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2']
                import random
                cursor_color = random.choice(colors)
                
                SessionParticipant.objects.create(
                    session=session,
                    user=request.user,
                    role='host',
                    cursor_color=cursor_color,
                    is_active=True
                )
            else:
                return Response({
                    'error': 'You are not a participant in this session'
                }, status=status.HTTP_403_FORBIDDEN)
        
        # Get all active participants
        participants = SessionParticipant.objects.filter(
            session=session,
            is_active=True
        ).select_related('user', 'user__profile')
        
        participants_data = []
        for p in participants:
            try:
                # Safely get profile display name
                display_name = p.user.username
                if hasattr(p.user, 'profile') and p.user.profile:
                    display_name = p.user.profile.display_name or p.user.username
                
                participants_data.append({
                    'user_id': p.user.id,
                    'username': p.user.username,
                    'display_name': display_name,
                    'role': p.role,
                    'cursor_position': p.cursor_position,
                    'cursor_color': p.cursor_color,
                    'current_tool': p.current_tool,
                    'is_active': p.is_active,
                    'current_page': getattr(p, 'current_page', None),  # Use getattr to safely get field
                    'joined_at': p.joined_at.isoformat() if p.joined_at else None,
                    'last_seen': p.last_seen.isoformat() if p.last_seen else None
                })
            except Exception as e:
                print(f"Error processing participant {p.user.id}: {str(e)}")
                # Continue with minimal data if there's an error
                participants_data.append({
                    'user_id': p.user.id,
                    'username': p.user.username,
                    'display_name': p.user.username,
                    'role': p.role,
                    'cursor_position': None,
                    'cursor_color': p.cursor_color,
                    'current_tool': None,
                    'is_active': p.is_active,
                    'current_page': None,
                    'joined_at': None,
                    'last_seen': None
                })
        
        return Response({
            'success': True,
            'participants': participants_data,
            'total': len(participants_data)
        })
        
    except CollaborationSession.DoesNotExist:
        return Response({
            'error': 'Collaboration session not found'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        print(f"Error in get_session_presence: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({
            'error': 'Internal server error',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_session_draft(request, session_id):
    """Update the story draft in collaboration session"""
    try:
        session = get_object_or_404(CollaborationSession, session_id=session_id)
        
        # Verify user is a participant
        is_participant = SessionParticipant.objects.filter(
            session=session,
            user=request.user,
            is_active=True
        ).exists()
        
        if not is_participant:
            return Response({
                'error': 'You are not a participant in this session'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Update story draft
        draft_data = request.data.get('story_draft')
        if draft_data:
            session.story_draft = draft_data
            session.save()
            
            return Response({
                'success': True,
                'message': 'Story draft updated successfully'
            })
        else:
            return Response({
                'error': 'story_draft is required'
            }, status=status.HTTP_400_BAD_REQUEST)
            
    except CollaborationSession.DoesNotExist:
        return Response({
            'error': 'Collaboration session not found'
        }, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_session_draft(request, session_id):
    """Get the current story draft from collaboration session"""
    try:
        session = get_object_or_404(CollaborationSession, session_id=session_id)
        
        # Verify user is a participant
        is_participant = SessionParticipant.objects.filter(
            session=session,
            user=request.user,
            is_active=True
        ).exists()
        
        if not is_participant:
            return Response({
                'error': 'You are not a participant in this session'
            }, status=status.HTTP_403_FORBIDDEN)
        
        return Response({
            'success': True,
            'story_draft': session.story_draft,
            'canvas_state': session.canvas_state,
            'current_page': session.current_page
        })
        
    except CollaborationSession.DoesNotExist:
        return Response({
            'error': 'Collaboration session not found'
        }, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def close_lobby(request, session_id):
    """Close the lobby (host only) - no more users can join"""
    try:
        session = get_object_or_404(CollaborationSession, session_id=session_id)
        
        # Verify that the requester is the host
        if session.host != request.user:
            return Response({
                'error': 'Only the host can close the lobby'
            }, status=status.HTTP_403_FORBIDDEN)
        
        session.is_lobby_open = False
        session.save()
        
        return Response({
            'success': True,
            'message': 'Lobby closed successfully'
        })
        
    except CollaborationSession.DoesNotExist:
        return Response({
            'error': 'Collaboration session not found'
        }, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def publish_collaborative_story(request, story_id):
    """Publish a collaborative story with conflict check"""
    try:
        story = get_object_or_404(Story, id=story_id)
        
        # Check if story is collaborative
        if not story.is_collaborative:
            return Response({
                'error': 'This is not a collaborative story'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if user is one of the authors
        is_author = story.authors.filter(id=request.user.id).exists()
        if not is_author:
            return Response({
                'error': 'You are not an author of this story'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Check if already published
        if story.published_by is not None:
            return Response({
                'error': 'already_published',
                'published_by': story.published_by.username,
                'message': f'This collaborative story was already published by {story.published_by.username}'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Publish the story
        story.is_published = True
        story.published_by = request.user
        story.save()
        
        return Response({
            'success': True,
            'message': 'Story published successfully',
            'story_id': story.id
        })
        
    except Story.DoesNotExist:
        return Response({
            'error': 'Story not found'
        }, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_collaborative_stories(request):
    """Get all collaborative stories where user is an author"""
    # Get stories where user is in the authors list
    stories = Story.objects.filter(
        is_collaborative=True,
        authors=request.user
    ).prefetch_related('authors', 'authors__profile').order_by('-date_created')
    
    stories_data = []
    for story in stories:
        # Get all author names
        author_names = [
            author.profile.display_name if hasattr(author, 'profile') else author.username
            for author in story.authors.all()
        ]
        
        story_dict = {
            'id': story.id,
            'title': story.title,
            'is_collaborative': story.is_collaborative,
            'authors': author_names,
            'author_ids': list(story.authors.values_list('id', flat=True)),
            'is_published': story.is_published,
            'published_by': story.published_by.username if story.published_by else None,
            'date_created': story.date_created.isoformat(),
            'date_updated': story.date_updated.isoformat(),
            'cover_image': story.cover_image,
            'category': story.category,
            'views': story.views
        }
        stories_data.append(story_dict)
    
    return Response({
        'success': True,
        'stories': stories_data,
        'total': len(stories_data)
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_session_operations(request, session_id):
    """Get drawing operations for a collaboration session"""
    try:
        session = get_object_or_404(CollaborationSession, session_id=session_id)
        
        # Verify user is a participant
        is_participant = SessionParticipant.objects.filter(
            session=session,
            user=request.user
        ).exists()
        
        if not is_participant:
            return Response({
                'error': 'You are not a participant in this session'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Get operations, optionally filtered by page
        page_number = request.GET.get('page_number')
        operations = DrawingOperation.objects.filter(session=session)
        
        if page_number is not None:
            operations = operations.filter(page_number=int(page_number))
        
        operations = operations.select_related('user').order_by('sequence_number')
        
        operations_data = []
        for op in operations:
            operations_data.append({
                'id': op.id,
                'user_id': op.user.id,
                'username': op.user.username,
                'operation_type': op.operation_type,
                'operation_data': op.operation_data,
                'page_number': op.page_number,
                'sequence_number': op.sequence_number,
                'timestamp': op.timestamp.isoformat()
            })
        
        return Response({
            'success': True,
            'operations': operations_data,
            'total': len(operations_data)
        })
        
    except CollaborationSession.DoesNotExist:
        return Response({
            'error': 'Collaboration session not found'
        }, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_collaboration_invites_new(request):
    """Get collaboration invites for current user"""
    invites = CollaborationInvite.objects.filter(
        receiver=request.user,
        status='pending'
    ).select_related('sender', 'session', 'sender__profile').order_by('-created_at')
    
    invites_data = []
    for invite in invites:
        invites_data.append({
            'id': invite.id,
            'session_id': invite.session.session_id,
            'sender': {
                'id': invite.sender.id,
                'username': invite.sender.username,
                'display_name': invite.sender.profile.display_name if hasattr(invite.sender, 'profile') else invite.sender.username
            },
            'message': invite.message,
            'status': invite.status,
            'created_at': invite.created_at.isoformat()
        })
    
    return Response({
        'success': True,
        'invites': invites_data,
        'total': len(invites_data)
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def respond_to_collaboration_invite_new(request, invite_id):
    """Accept or reject a collaboration invite"""
    try:
        invite = get_object_or_404(
            CollaborationInvite,
            id=invite_id,
            receiver=request.user,
            status='pending'
        )
        
        action = request.data.get('action')  # 'accept' or 'reject'
        
        if action not in ['accept', 'reject']:
            return Response({
                'error': 'Invalid action. Use "accept" or "reject"'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        from django.utils import timezone
        
        if action == 'accept':
            # Check if session is still accepting invited participants
            if not invite.session.can_accept_invite():
                return Response({
                    'error': 'This collaboration session is no longer accepting participants'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            invite.status = 'accepted'
            invite.responded_at = timezone.now()
            invite.save()
            
            # Add user as participant
            import random
            colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2']
            
            SessionParticipant.objects.get_or_create(
                session=invite.session,
                user=request.user,
                defaults={
                    'cursor_color': random.choice(colors),
                    'role': 'participant'
                }
            )
            
            return Response({
                'success': True,
                'message': 'Invite accepted successfully',
                'session_id': invite.session.session_id
            })
        else:
            invite.status = 'rejected'
            invite.responded_at = timezone.now()
            invite.save()
            
            return Response({
                'success': True,
                'message': 'Invite rejected'
            })
        
    except CollaborationInvite.DoesNotExist:
        return Response({
            'error': 'Invite not found'
        }, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_sessions(request):
    """Get all active collaboration sessions for current user"""
    # Get sessions where user is a participant
    participants = SessionParticipant.objects.filter(
        user=request.user,
        is_active=True
    ).select_related('session', 'session__host', 'session__host__profile')
    
    sessions_data = []
    for participant in participants:
        session = participant.session
        if session.is_active:
            sessions_data.append({
                'session_id': session.session_id,
                'canvas_name': session.canvas_name,
                'host': {
                    'id': session.host.id,
                    'username': session.host.username,
                    'display_name': session.host.profile.display_name if hasattr(session.host, 'profile') else session.host.username
                },
                'is_host': session.host.id == request.user.id,
                'participant_count': session.participant_count,
                'max_participants': session.max_participants,
                'is_lobby_open': session.is_lobby_open,
                'voting_active': session.voting_active,
                'created_at': session.created_at.isoformat(),
                'your_role': participant.role
            })
    
    return Response({
        'success': True,
        'sessions': sessions_data,
        'total': len(sessions_data)
    })

