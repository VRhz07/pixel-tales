"""
Django admin configuration for Storybook models
"""
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import User
from django.utils.html import format_html
from .models import (
    UserProfile, Story, Character, Comment, Rating, Friendship,
    Achievement, UserAchievement, Notification, ParentChildRelationship,
    TeacherStudentRelationship, TeacherClass, Message, EmailVerification,
    StoryGame, GameQuestion, GameAttempt, GameAnswer, NotificationPreferences
)


# Inline admin classes
class UserProfileInline(admin.StackedInline):
    model = UserProfile
    can_delete = False
    verbose_name_plural = 'Profile'
    fk_name = 'user'  # Specify which ForeignKey to use
    fields = ('user_type', 'display_name', 'avatar', 'bio', 'date_of_birth', 'is_archived', 'archived_at', 'archive_reason')


# Extend User admin
class UserAdmin(BaseUserAdmin):
    inlines = (UserProfileInline,)
    list_display = ('username', 'email', 'first_name', 'last_name', 'get_user_type', 'is_staff')
    list_filter = BaseUserAdmin.list_filter + ('profile__user_type',)
    
    def get_user_type(self, obj):
        try:
            return obj.profile.user_type.title()
        except:
            return 'No Profile'
    get_user_type.short_description = 'User Type'


# Re-register UserAdmin
admin.site.unregister(User)
admin.site.register(User, UserAdmin)


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'user_type', 'display_name', 'created_at')
    list_filter = ('user_type', 'created_at')
    search_fields = ('user__username', 'user__email', 'display_name')
    readonly_fields = ('created_at', 'updated_at')


@admin.register(Story)
class StoryAdmin(admin.ModelAdmin):
    list_display = ('title', 'author', 'category', 'is_published', 'views', 'date_created')
    list_filter = ('category', 'is_published', 'date_created', 'is_flagged')
    search_fields = ('title', 'author__username', 'content')
    readonly_fields = ('date_created', 'date_updated', 'views')
    fieldsets = (
        ('Story Information', {
            'fields': ('title', 'author', 'content', 'summary', 'category', 'cover_image')
        }),
        ('Canvas Data', {
            'fields': ('canvas_data',),
            'classes': ('collapse',)
        }),
        ('Publishing', {
            'fields': ('is_published',)
        }),
        ('Moderation', {
            'fields': ('is_flagged', 'flagged_reason', 'flagged_by', 'flagged_at'),
            'classes': ('collapse',)
        }),
        ('Metadata', {
            'fields': ('views', 'date_created', 'date_updated'),
            'classes': ('collapse',)
        })
    )
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('author')


@admin.register(Character)
class CharacterAdmin(admin.ModelAdmin):
    list_display = ('name', 'creator', 'date_created')
    search_fields = ('name', 'creator__username', 'description')
    readonly_fields = ('date_created',)
    fieldsets = (
        ('Character Information', {
            'fields': ('name', 'creator', 'description', 'image')
        }),
        ('Canvas Data', {
            'fields': ('canvas_data',),
            'classes': ('collapse',)
        }),
        ('Metadata', {
            'fields': ('date_created',),
            'classes': ('collapse',)
        })
    )


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ('get_story_title', 'author', 'get_text_preview', 'date_created', 'is_flagged')
    list_filter = ('date_created', 'is_flagged')
    search_fields = ('story__title', 'author__username', 'text')
    readonly_fields = ('date_created',)
    
    def get_story_title(self, obj):
        return obj.story.title
    get_story_title.short_description = 'Story'
    
    def get_text_preview(self, obj):
        return obj.text[:50] + '...' if len(obj.text) > 50 else obj.text
    get_text_preview.short_description = 'Comment Preview'


@admin.register(Rating)
class RatingAdmin(admin.ModelAdmin):
    list_display = ('get_story_title', 'user', 'value', 'date_created')
    list_filter = ('value', 'date_created')
    search_fields = ('story__title', 'user__username')
    readonly_fields = ('date_created',)
    
    def get_story_title(self, obj):
        return obj.story.title
    get_story_title.short_description = 'Story'


@admin.register(Friendship)
class FriendshipAdmin(admin.ModelAdmin):
    list_display = ('sender', 'receiver', 'status', 'date_created')
    list_filter = ('status', 'date_created')
    search_fields = ('sender__username', 'receiver__username')
    readonly_fields = ('date_created',)


@admin.register(Achievement)
class AchievementAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'color', 'target_value', 'is_active', 'sort_order')
    list_filter = ('category', 'color', 'is_active')
    search_fields = ('name', 'description')
    list_editable = ('sort_order', 'is_active')


@admin.register(UserAchievement)
class UserAchievementAdmin(admin.ModelAdmin):
    list_display = ('user', 'get_achievement_name', 'date_earned')
    list_filter = ('achievement__category', 'date_earned')
    search_fields = ('user__username', 'achievement__name')
    readonly_fields = ('date_earned',)
    
    def get_achievement_name(self, obj):
        return obj.achievement.name
    get_achievement_name.short_description = 'Achievement'


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('recipient', 'get_title_preview', 'notification_type', 'is_read', 'created_at')
    list_filter = ('notification_type', 'is_read', 'created_at')
    search_fields = ('recipient__username', 'title', 'message')
    readonly_fields = ('created_at',)
    
    def get_title_preview(self, obj):
        return obj.title[:30] + '...' if len(obj.title) > 30 else obj.title
    get_title_preview.short_description = 'Title'


@admin.register(ParentChildRelationship)
class ParentChildRelationshipAdmin(admin.ModelAdmin):
    list_display = ('parent', 'child', 'is_active', 'date_created')
    list_filter = ('is_active', 'date_created')
    search_fields = ('parent__username', 'child__username')
    readonly_fields = ('date_created',)


@admin.register(TeacherStudentRelationship)
class TeacherStudentRelationshipAdmin(admin.ModelAdmin):
    list_display = ('teacher', 'student', 'get_class_name', 'is_active', 'date_created')
    list_filter = ('is_active', 'date_created')
    search_fields = ('teacher__username', 'student__username', 'notes', 'teacher_class__name')
    readonly_fields = ('date_created',)
    
    def get_class_name(self, obj):
        return obj.teacher_class.name if obj.teacher_class else 'No Class'
    get_class_name.short_description = 'Class'


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ('sender', 'receiver', 'content_preview', 'is_read', 'created_at')
    list_filter = ('is_read', 'created_at')
    search_fields = ('sender__username', 'receiver__username', 'content')
    readonly_fields = ('created_at',)
    
    def content_preview(self, obj):
        return obj.content[:50] + '...' if len(obj.content) > 50 else obj.content
    content_preview.short_description = 'Content'


@admin.register(EmailVerification)
class EmailVerificationAdmin(admin.ModelAdmin):
    list_display = ('email', 'user', 'verification_code', 'is_verified', 'created_at', 'expires_at')
    list_filter = ('is_verified', 'created_at')
    search_fields = ('email', 'user__username', 'verification_code')
    readonly_fields = ('created_at', 'verified_at')
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.select_related('user')


@admin.register(StoryGame)
class StoryGameAdmin(admin.ModelAdmin):
    list_display = ('story', 'game_type', 'difficulty', 'is_active', 'created_at', 'questions_count')
    list_filter = ('game_type', 'difficulty', 'is_active', 'created_at')
    search_fields = ('story__title',)
    readonly_fields = ('created_at', 'updated_at')
    
    def questions_count(self, obj):
        return obj.get_questions_count()
    questions_count.short_description = 'Questions'


@admin.register(GameQuestion)
class GameQuestionAdmin(admin.ModelAdmin):
    list_display = ('game', 'question_type', 'order', 'points', 'is_active', 'question_preview')
    list_filter = ('question_type', 'is_active', 'game__game_type')
    search_fields = ('question_text', 'game__story__title')
    ordering = ('game', 'order')
    readonly_fields = ('created_at',)
    
    def question_preview(self, obj):
        return obj.question_text[:50] + '...' if len(obj.question_text) > 50 else obj.question_text
    question_preview.short_description = 'Question'


@admin.register(GameAttempt)
class GameAttemptAdmin(admin.ModelAdmin):
    list_display = ('user', 'game', 'score_percentage', 'passed_status', 'xp_earned', 'is_completed', 'completed_at')
    list_filter = ('is_completed', 'game__game_type', 'completed_at')
    search_fields = ('user__username', 'game__story__title')
    readonly_fields = ('score_percentage', 'passed', 'started_at', 'completed_at')
    
    def score_percentage(self, obj):
        return f"{obj.score_percentage}%"
    score_percentage.short_description = 'Score'
    
    def passed_status(self, obj):
        if obj.is_completed:
            return '✅ Passed' if obj.passed else '❌ Failed'
        return '⏳ In Progress'
    passed_status.short_description = 'Status'


@admin.register(GameAnswer)
class GameAnswerAdmin(admin.ModelAdmin):
    list_display = ('attempt', 'question', 'is_correct', 'points_earned', 'answered_at')
    list_filter = ('is_correct', 'answered_at')
    search_fields = ('attempt__user__username', 'question__question_text')
    readonly_fields = ('answered_at',)


@admin.register(NotificationPreferences)
class NotificationPreferencesAdmin(admin.ModelAdmin):
    list_display = ('user', 'weekly_reports', 'achievement_alerts', 'goal_completion', 'realtime_updates', 'share_usage_data', 'allow_analytics', 'public_profile', 'updated_at')
    list_filter = ('weekly_reports', 'achievement_alerts', 'goal_completion', 'realtime_updates', 'share_usage_data', 'allow_analytics', 'public_profile', 'device_type')
    search_fields = ('user__username', 'user__email')
    readonly_fields = ('created_at', 'updated_at')
    fieldsets = (
        ('User', {
            'fields': ('user',)
        }),
        ('Email Notifications', {
            'fields': ('weekly_reports', 'achievement_alerts', 'goal_completion')
        }),
        ('Push Notifications', {
            'fields': ('realtime_updates', 'push_token', 'device_type')
        }),
        ('Privacy Settings', {
            'fields': ('share_usage_data', 'allow_analytics', 'public_profile')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        }),
    )


@admin.register(TeacherClass)
class TeacherClassAdmin(admin.ModelAdmin):
    list_display = ('name', 'teacher', 'grade_level', 'subject', 'student_count', 'is_active', 'date_created')
    list_filter = ('is_active', 'grade_level', 'subject', 'date_created')
    search_fields = ('name', 'teacher__username', 'teacher__profile__display_name', 'description')
    readonly_fields = ('date_created', 'date_updated')
    fieldsets = (
        ('Basic Information', {
            'fields': ('teacher', 'name', 'description')
        }),
        ('Details', {
            'fields': ('grade_level', 'subject', 'school_year')
        }),
        ('Status', {
            'fields': ('is_active', 'date_created', 'date_updated')
        }),
    )


# Customize admin site
admin.site.site_header = 'Imaginary Worlds Administration'
admin.site.site_title = 'Imaginary Worlds Admin'
admin.site.index_title = 'Welcome to Imaginary Worlds Administration'
