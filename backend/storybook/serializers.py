"""
Serializers for the Storybook API
"""
from rest_framework import serializers
from django.contrib.auth.models import User
from .models import (
    UserProfile, Story, Character, Comment, Like, Rating, 
    Friendship, Achievement, UserAchievement, Notification,
    ParentChildRelationship, TeacherStudentRelationship, Message
)


class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer for user profile information"""
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.CharField(source='user.email', read_only=True)
    first_name = serializers.CharField(source='user.first_name', read_only=True)
    last_name = serializers.CharField(source='user.last_name', read_only=True)

    class Meta:
        model = UserProfile
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'user_type', 'display_name', 'avatar', 'bio', 
            'date_of_birth', 'is_online', 'last_seen', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'is_online', 'last_seen', 'created_at', 'updated_at']


class UserSerializer(serializers.ModelSerializer):
    """Basic user serializer"""
    profile = UserProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'profile']


class StorySerializer(serializers.ModelSerializer):
    """Serializer for stories"""
    author_name = serializers.CharField(source='author.profile.display_name', read_only=True)
    author_username = serializers.CharField(source='author.username', read_only=True)
    authors_names = serializers.SerializerMethodField()  # Co-authors names for collaborative stories
    total_ratings = serializers.SerializerMethodField()
    average_rating = serializers.SerializerMethodField()
    is_owner = serializers.SerializerMethodField()
    likes_count = serializers.SerializerMethodField()
    comments_count = serializers.SerializerMethodField()
    is_liked_by_user = serializers.SerializerMethodField()

    class Meta:
        model = Story
        fields = [
            'id', 'title', 'author', 'author_name', 'author_username', 'authors_names',
            'content', 'canvas_data', 'summary', 'category', 'genres', 'language', 'cover_image',
            'is_published', 'date_created', 'date_updated', 'views',
            'total_ratings', 'average_rating', 'is_owner',
            'likes_count', 'comments_count', 'is_liked_by_user', 'is_collaborative'
        ]
        read_only_fields = ['id', 'author', 'date_created', 'date_updated', 'views']

    def get_total_ratings(self, obj):
        return obj.ratings.count()

    def get_average_rating(self, obj):
        ratings = obj.ratings.all()
        if ratings:
            return sum(rating.value for rating in ratings) / len(ratings)
        return 0

    def get_is_owner(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.author == request.user
        return False
    
    def get_likes_count(self, obj):
        return obj.likes.count()
    
    def get_comments_count(self, obj):
        return obj.comments.count()
    
    def get_is_liked_by_user(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.likes.filter(user=request.user).exists()
        return False
    
    def get_authors_names(self, obj):
        """Get all co-authors names for collaborative stories"""
        if obj.is_collaborative and obj.authors.exists():
            # Return list of all co-authors' display names
            return [author.profile.display_name for author in obj.authors.all()]
        return []


class CharacterSerializer(serializers.ModelSerializer):
    """Serializer for characters"""
    creator_name = serializers.CharField(source='creator.profile.display_name', read_only=True)

    class Meta:
        model = Character
        fields = [
            'id', 'name', 'creator', 'creator_name', 'canvas_data',
            'description', 'image', 'date_created'
        ]
        read_only_fields = ['id', 'creator', 'date_created']


class CommentSerializer(serializers.ModelSerializer):
    """Serializer for comments"""
    author_name = serializers.CharField(source='author.profile.display_name', read_only=True)
    author_avatar = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = [
            'id', 'story', 'author', 'author_name', 'author_avatar',
            'text', 'date_created'
        ]
        read_only_fields = ['id', 'author', 'date_created']

    def get_author_avatar(self, obj):
        if obj.author.profile.avatar:
            return obj.author.profile.avatar.url
        return None


class LikeSerializer(serializers.ModelSerializer):
    """Serializer for likes"""
    user_name = serializers.CharField(source='user.profile.display_name', read_only=True)
    
    class Meta:
        model = Like
        fields = ['id', 'story', 'user', 'user_name', 'date_created']
        read_only_fields = ['id', 'user', 'date_created']

class RatingSerializer(serializers.ModelSerializer):
    """Serializer for ratings"""
    
    class Meta:
        model = Rating
        fields = ['id', 'story', 'user', 'value', 'date_created']
        read_only_fields = ['id', 'user', 'date_created']


class FriendshipSerializer(serializers.ModelSerializer):
    """Serializer for friendships"""
    sender = serializers.SerializerMethodField()
    receiver = serializers.SerializerMethodField()

    class Meta:
        model = Friendship
        fields = [
            'id', 'sender', 'receiver', 'status', 'date_created'
        ]
        read_only_fields = ['id', 'date_created']

    def get_sender(self, obj):
        """Get sender user information"""
        user = obj.sender
        profile = getattr(user, 'profile', None)
        
        return {
            'id': user.id,
            'username': user.username,
            'profile': {
                'display_name': profile.display_name if profile else user.username,
                'is_online': profile.is_online if profile else False,
            } if profile else None,
            'story_count': user.stories.filter(is_published=True).count()
        }

    def get_receiver(self, obj):
        """Get receiver user information"""
        user = obj.receiver
        profile = getattr(user, 'profile', None)
        
        return {
            'id': user.id,
            'username': user.username,
            'profile': {
                'display_name': profile.display_name if profile else user.username,
                'is_online': profile.is_online if profile else False,
            } if profile else None,
            'story_count': user.stories.filter(is_published=True).count()
        }


class MessageSerializer(serializers.ModelSerializer):
    """Serializer for messages"""
    sender = serializers.SerializerMethodField()
    receiver = serializers.SerializerMethodField()
    
    class Meta:
        model = Message
        fields = ['id', 'sender', 'receiver', 'content', 'message_type', 'metadata', 'is_read', 'created_at']
        read_only_fields = ['id', 'created_at']
    
    def get_sender(self, obj):
        """Get sender user information"""
        user = obj.sender
        profile = getattr(user, 'profile', None)
        
        return {
            'id': user.id,
            'username': user.username,
            'name': profile.display_name if profile else user.username,
        }
    
    def get_receiver(self, obj):
        """Get receiver user information"""
        user = obj.receiver
        profile = getattr(user, 'profile', None)
        
        return {
            'id': user.id,
            'username': user.username,
            'name': profile.display_name if profile else user.username,
        }


class AchievementSerializer(serializers.ModelSerializer):
    """Serializer for achievements"""
    
    class Meta:
        model = Achievement
        fields = [
            'id', 'name', 'description', 'category', 'icon', 'color',
            'target_value', 'is_active', 'sort_order'
        ]
        read_only_fields = ['id']

class UserAchievementSerializer(serializers.ModelSerializer):
    """Serializer for user achievements"""
    achievement = AchievementSerializer(read_only=True)
    
    class Meta:
        model = UserAchievement
        read_only_fields = ['id', 'user', 'date_earned']


class NotificationSerializer(serializers.ModelSerializer):
    """Serializer for notifications"""
    sender_name = serializers.CharField(source='sender.profile.display_name', read_only=True)
    icon = serializers.CharField(source='get_icon', read_only=True)
    url = serializers.CharField(source='get_url', read_only=True)
    session_id = serializers.SerializerMethodField()
    story_title = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = [
            'id', 'recipient', 'sender', 'sender_name', 'notification_type',
            'title', 'message', 'data', 'is_read', 'created_at', 'icon', 'url',
            'session_id', 'story_title'
        ]
        read_only_fields = ['id', 'recipient', 'created_at']
    
    def get_session_id(self, obj):
        """Extract session_id from data field"""
        if isinstance(obj.data, dict):
            return obj.data.get('session_id')
        return None
    
    def get_story_title(self, obj):
        """Extract story_title from data field"""
        if isinstance(obj.data, dict):
            return obj.data.get('story_title')
        return None


class ParentChildRelationshipSerializer(serializers.ModelSerializer):
    """Serializer for parent-child relationships"""
    parent_name = serializers.CharField(source='parent.profile.display_name', read_only=True)
    child_name = serializers.CharField(source='child.profile.display_name', read_only=True)

    class Meta:
        model = ParentChildRelationship
        fields = [
            'id', 'parent', 'child', 'parent_name', 'child_name',
            'date_created', 'is_active'
        ]
        read_only_fields = ['id', 'date_created']


# Simplified serializers for list views
class StoryListSerializer(serializers.ModelSerializer):
    """Simplified serializer for story lists"""
    author_name = serializers.CharField(source='author.profile.display_name', read_only=True)
    average_rating = serializers.SerializerMethodField()
    likes_count = serializers.SerializerMethodField()
    comments_count = serializers.SerializerMethodField()
    is_liked_by_user = serializers.SerializerMethodField()

    class Meta:
        model = Story
        fields = [
            'id', 'title', 'author_name', 'summary', 'category', 'genres', 'language',
            'cover_image', 'is_published', 'date_created', 'date_updated', 'views',
            'average_rating', 'likes_count', 'comments_count', 'is_liked_by_user',
            'content', 'canvas_data'
        ]

    def get_average_rating(self, obj):
        ratings = obj.ratings.all()
        if ratings:
            return round(sum(rating.value for rating in ratings) / len(ratings), 1)
        return 0
    
    def get_likes_count(self, obj):
        return obj.likes.count()
    
    def get_comments_count(self, obj):
        return obj.comments.count()
    
    def get_is_liked_by_user(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.likes.filter(user=request.user).exists()
        return False


class CharacterListSerializer(serializers.ModelSerializer):
    """Simplified serializer for character lists"""
    creator_name = serializers.CharField(source='creator.profile.display_name', read_only=True)

    class Meta:
        model = Character
        fields = ['id', 'name', 'creator_name', 'image', 'date_created']
