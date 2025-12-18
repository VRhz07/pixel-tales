from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

# Create your models here.
class UserProfile(models.Model):
    USER_TYPES = [
        ('child', 'Child'),
        ('parent', 'Parent'),
        ('teacher', 'Teacher'),
    ]
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    user_type = models.CharField(max_length=10, choices=USER_TYPES, default='child')
    display_name = models.CharField(max_length=50)
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
    avatar_emoji = models.CharField(max_length=10, blank=True, default='📚')  # Emoji avatar
    bio = models.TextField(blank=True, null=True)
    date_of_birth = models.DateField(null=True, blank=True)
    is_online = models.BooleanField(default=False)  # Real-time online status
    last_seen = models.DateTimeField(auto_now=True)  # Last activity timestamp
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Gamification fields
    experience_points = models.PositiveIntegerField(default=0)  # Total XP earned (never decreases)
    level = models.PositiveIntegerField(default=1)  # Current level based on XP
    
    # Reward system fields
    selected_avatar_border = models.CharField(max_length=50, blank=True, default='basic')  # Selected border ID

    # Moderation fields
    violation_count = models.PositiveIntegerField(default=0)
    last_violation_date = models.DateTimeField(null=True, blank=True)
    is_flagged = models.BooleanField(default=False)
    flagged_reason = models.TextField(blank=True)
    
    # Archive/Soft Delete fields
    is_archived = models.BooleanField(default=False)
    archived_at = models.DateTimeField(null=True, blank=True)
    archived_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='archived_users')
    archive_reason = models.TextField(blank=True)
    
    def __str__(self):
        return self.user.username
    
    @property
    def is_child(self):
        return self.user_type == 'child'
    
    @property
    def is_parent(self):
        return self.user_type == 'parent'
    
    @property
    def is_teacher(self):
        return self.user_type == 'teacher'
    
    def add_experience(self, amount):
        """Add XP and update level accordingly (XP never decreases)"""
        if amount <= 0:
            return
        
        self.experience_points += amount
        
        # Calculate new level (500 XP per level)
        new_level = (self.experience_points // 500) + 1
        
        # Check if leveled up
        leveled_up = new_level > self.level
        self.level = new_level
        
        self.save(update_fields=['experience_points', 'level'])
        
        return {
            'xp_gained': amount,
            'total_xp': self.experience_points,
            'level': self.level,
            'leveled_up': leveled_up
        }
    
    @property
    def xp_for_next_level(self):
        """Calculate XP needed for next level"""
        return self.level * 500
    
    @property
    def xp_progress_in_current_level(self):
        """Calculate XP progress within current level"""
        return self.experience_points % 500
    
    @property
    def xp_progress_percentage(self):
        """Calculate percentage progress to next level"""
        return (self.xp_progress_in_current_level / 500) * 100
    
    def get_children(self):
        """Return all children associated with this parent account"""
        if self.is_parent:
            return User.objects.filter(parent_accounts__parent=self.user, parent_accounts__is_active=True)
        return User.objects.none()
    
    def get_parents(self):
        """Return all parents associated with this child account"""
        if self.is_child:
            return User.objects.filter(children_accounts__child=self.user, children_accounts__is_active=True)
        return User.objects.none()

    def get_students(self):
        """Return all students associated with this teacher account"""
        if self.is_teacher:
            try:
                return User.objects.filter(teacher_accounts__teacher=self.user, teacher_accounts__is_active=True)
            except Exception:
                # Handle case where TeacherStudentRelationship table doesn't exist yet
                return User.objects.none()
        return User.objects.none()

    def get_teachers(self):
        """Return all teachers associated with this student account"""
        if self.is_child:
            try:
                return User.objects.filter(student_accounts__student=self.user, student_accounts__is_active=True)
            except Exception:
                # Handle case where TeacherStudentRelationship table doesn't exist yet
                return User.objects.none()
        return User.objects.none()

class Story(models.Model):
    CATEGORY_CHOICES = [
        ('adventure', 'Adventure'),
        ('fantasy', 'Fantasy'),
        ('mystery', 'Mystery'),
        ('action', 'Action'),
        ('friendship', 'Friendship'),
        ('scifi', 'Sci-Fi'),
        ('comedy', 'Comedy'),
        ('sci_fi', 'Science Fiction'),
        ('fairy_tale', 'Fairy Tale'),
        ('educational', 'Educational'),
        ('animal', 'Animal Stories'),
        ('other', 'Other'),
    ]
    
    LANGUAGE_CHOICES = [
        ('en', 'English'),
        ('tl', 'Tagalog'),
    ]
    
    CREATION_TYPE_CHOICES = [
        ('manual', 'Manual Creation'),
        ('ai_assisted', 'AI-Assisted'),
        ('collaborative', 'Collaborative'),
    ]
    
    title = models.CharField(max_length=200)
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='stories')
    content = models.TextField()
    canvas_data = models.TextField()  # JSON data for the canvas/illustration
    summary = models.TextField(blank=True, null=True)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='other')  # Primary category (backward compatibility)
    genres = models.JSONField(default=list, blank=True)  # Multiple genres as list of strings
    language = models.CharField(max_length=2, choices=LANGUAGE_CHOICES, default='en')
    cover_image = models.TextField(blank=True, default='')  # URL to AI-generated cover image (TextField to support long Pollinations.ai URLs with special chars)
    creation_type = models.CharField(max_length=20, choices=CREATION_TYPE_CHOICES, default='manual')  # Track if story was created manually or with AI
    is_published = models.BooleanField(default=False)
    date_created = models.DateTimeField(auto_now_add=True)
    date_updated = models.DateTimeField(auto_now=True)
    views = models.PositiveIntegerField(default=0)

    # Collaboration fields
    is_collaborative = models.BooleanField(default=False)
    collaboration_session = models.ForeignKey('CollaborationSession', null=True, blank=True, on_delete=models.SET_NULL, related_name='finalized_story')
    authors = models.ManyToManyField(User, related_name='co_authored_stories', blank=True)  # Multiple authors for collaborative stories
    published_by = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name='published_collab_stories')  # Track who published collaborative story

    # Moderation fields
    is_flagged = models.BooleanField(default=False)
    flagged_reason = models.TextField(blank=True)
    flagged_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='flagged_stories')
    flagged_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return self.title
    
    class Meta:
        verbose_name_plural = "Stories"

class Character(models.Model):
    name = models.CharField(max_length=100)
    creator = models.ForeignKey(User, on_delete=models.CASCADE, related_name='characters')
    canvas_data = models.TextField()  # JSON data for the character illustration
    description = models.TextField(blank=True, null=True)
    image = models.ImageField(upload_to='character_images/', blank=True, null=True)  # Store the character image
    date_created = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.name

class Comment(models.Model):
    story = models.ForeignKey(Story, on_delete=models.CASCADE, related_name='comments')
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='comments')
    text = models.TextField()
    date_created = models.DateTimeField(auto_now_add=True)

    # Moderation fields
    is_flagged = models.BooleanField(default=False)
    flagged_reason = models.TextField(blank=True)
    flagged_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='flagged_comments')
    flagged_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Comment by {self.author.username} on {self.story.title}"

class Like(models.Model):
    story = models.ForeignKey(Story, on_delete=models.CASCADE, related_name='likes')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='likes')
    date_created = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('story', 'user')
    
    def __str__(self):
        return f"{self.user.username} liked {self.story.title}"

class Rating(models.Model):
    story = models.ForeignKey(Story, on_delete=models.CASCADE, related_name='ratings')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='ratings')
    value = models.PositiveSmallIntegerField(choices=[(1, '1'), (2, '2'), (3, '3'), (4, '4'), (5, '5')])
    date_created = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('story', 'user')
    
    def __str__(self):
        return f"{self.user.username} rated {self.story.title} as {self.value}"

class SavedStory(models.Model):
    """Model for users saving stories to their library"""
    story = models.ForeignKey(Story, on_delete=models.CASCADE, related_name='saved_by')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='saved_stories')
    date_saved = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('story', 'user')
        ordering = ['-date_saved']
    
    def __str__(self):
        return f"{self.user.username} saved {self.story.title}"

class StoryRead(models.Model):
    """Model to track stories read by users"""
    story = models.ForeignKey(Story, on_delete=models.CASCADE, related_name='read_by')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='stories_read')
    date_read = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('story', 'user')
        ordering = ['-date_read']
    
    def __str__(self):
        return f"{self.user.username} read {self.story.title}"

class Friendship(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
    ]
    
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='friend_requests_sent')
    receiver = models.ForeignKey(User, on_delete=models.CASCADE, related_name='friend_requests_received')
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    date_created = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('sender', 'receiver')
    
    def __str__(self):
        return f"Friendship: {self.sender.username} -> {self.receiver.username} ({self.status})"

class Achievement(models.Model):
    CATEGORY_CHOICES = [
        ('published_stories', 'Published Stories'),
        ('friends', 'Friends & Social'),
        ('words', 'Word Count'),
        ('likes', 'Likes Received'),
        ('comments', 'Comments Received'),
        ('stories_read', 'Stories Read'),
        ('leaderboard', 'Leaderboard Rank'),
        ('creation_type', 'Creation Type'),
        ('collaboration', 'Collaboration'),
        ('characters', 'Characters Created'),
        ('views', 'Story Views'),
    ]
    
    METRIC_TYPE_CHOICES = [
        ('published_stories', 'Published Stories Count'),
        ('friends', 'Friends Count'),
        ('total_words', 'Total Words Written'),
        ('likes_received', 'Likes Received'),
        ('comments_received', 'Comments Received'),
        ('stories_read', 'Stories Read Count'),
        ('leaderboard_rank', 'Leaderboard Rank'),
        ('total_stories', 'Total Stories Created'),
        ('manual_stories', 'Manual Stories Created'),
        ('ai_stories', 'AI-Assisted Stories Created'),
        ('collaboration_count', 'Collaboration Count'),
        ('characters_created', 'Characters Created'),
        ('views_received', 'Story Views Received'),
    ]

    name = models.CharField(max_length=100)
    description = models.TextField()
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='published_stories')
    metric_type = models.CharField(max_length=30, choices=METRIC_TYPE_CHOICES, default='published_stories')
    icon = models.CharField(max_length=50, default='📖')  # Emoji icon
    color = models.CharField(max_length=20, default='blue')  # Color theme
    target_value = models.IntegerField(null=True, blank=True)  # Target value for progress-based achievements
    rarity = models.CharField(max_length=20, default='common')  # common, uncommon, rare, epic, legendary
    is_active = models.BooleanField(default=True)
    sort_order = models.IntegerField(default=0)

    class Meta:
        ordering = ['category', 'sort_order', 'name']

    def __str__(self):
        return self.name

class UserAchievement(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='achievements')
    achievement = models.ForeignKey(Achievement, on_delete=models.CASCADE)
    progress = models.IntegerField(default=0)  # Current progress value
    is_earned = models.BooleanField(default=False)  # Whether achievement is completed
    earned_at = models.DateTimeField(null=True, blank=True)  # When achievement was earned
    date_earned = models.DateTimeField(auto_now_add=True)  # Legacy field for compatibility
    
    class Meta:
        unique_together = ('user', 'achievement')
    
    def __str__(self):
        return f"{self.user.username} earned {self.achievement.name}"
    
    @property
    def progress_percentage(self):
        """Calculate progress percentage"""
        if not self.achievement.target_value or self.achievement.target_value == 0:
            return 100 if self.is_earned else 0
        percentage = (self.progress / self.achievement.target_value) * 100
        return min(100, max(0, percentage))

class ParentChildRelationship(models.Model):
    """Model to establish relationship between parent and child accounts"""
    parent = models.ForeignKey(User, on_delete=models.CASCADE, related_name='children_accounts')
    child = models.ForeignKey(User, on_delete=models.CASCADE, related_name='parent_accounts')
    date_created = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        unique_together = ('parent', 'child')
        verbose_name = "Parent-Child Relationship"
        verbose_name_plural = "Parent-Child Relationships"

    def __str__(self):
        return f"Parent: {self.parent.username} - Child: {self.child.username}"

class TeacherClass(models.Model):
    """Model for teacher's classes"""
    teacher = models.ForeignKey(User, on_delete=models.CASCADE, related_name='teacher_classes')
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    grade_level = models.CharField(max_length=50, blank=True, null=True)
    subject = models.CharField(max_length=100, blank=True, null=True)
    school_year = models.CharField(max_length=20, blank=True, null=True)  # e.g., "2024-2025"
    is_active = models.BooleanField(default=True)
    date_created = models.DateTimeField(auto_now_add=True)
    date_updated = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Teacher Class"
        verbose_name_plural = "Teacher Classes"
        ordering = ['-date_created']

    def __str__(self):
        return f"{self.name} - {self.teacher.username}"
    
    @property
    def student_count(self):
        """Get the number of students in this class"""
        return self.class_students.filter(is_active=True).count()

class TeacherStudentRelationship(models.Model):
    """Model to establish relationship between teacher and student accounts"""
    teacher = models.ForeignKey(User, on_delete=models.CASCADE, related_name='student_accounts')
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='teacher_accounts')
    teacher_class = models.ForeignKey(TeacherClass, on_delete=models.CASCADE, related_name='class_students', null=True, blank=True)
    date_created = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)
    notes = models.TextField(blank=True, null=True)  # Teacher notes about the student

    class Meta:
        unique_together = ('teacher', 'student')
        verbose_name = "Teacher-Student Relationship"
        verbose_name_plural = "Teacher-Student Relationships"

    def __str__(self):
        return f"Teacher: {self.teacher.username} - Student: {self.student.username}"

class Message(models.Model):
    """Model for direct messages between users"""
    MESSAGE_TYPES = [
        ('text', 'Text Message'),
        ('collaboration_invite', 'Collaboration Invite'),
    ]
    
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_messages')
    receiver = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_messages')
    content = models.TextField()
    message_type = models.CharField(max_length=30, choices=MESSAGE_TYPES, default='text')
    metadata = models.JSONField(default=dict, blank=True, null=True)  # For storing additional data like session_id
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['sender', 'receiver']),
            models.Index(fields=['receiver', 'is_read']),
        ]
    
    def __str__(self):
        return f"Message from {self.sender.username} to {self.receiver.username}"


class Notification(models.Model):
    """Model for user notifications"""
    NOTIFICATION_TYPES = [
        ('friend_request', 'Friend Request'),
        ('friend_accepted', 'Friend Request Accepted'),
        ('story_liked', 'Story Liked'),
        ('story_commented', 'Story Commented'),
        ('story_rated', 'Story Rated'),
        ('achievement_earned', 'Achievement Earned'),
        ('story_published', 'Story Published'),
        ('new_message', 'New Message'),
        ('collaboration_invite', 'Collaboration Invitation'),
    ]

    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_notifications', null=True, blank=True)
    notification_type = models.CharField(max_length=30, choices=NOTIFICATION_TYPES)  # Increased max_length for 'collaboration_invite'
    title = models.CharField(max_length=200)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    data = models.JSONField(default=dict, blank=True, null=True)  # For storing additional data

    # Optional related objects
    related_story = models.ForeignKey(Story, on_delete=models.CASCADE, null=True, blank=True)
    related_comment = models.ForeignKey(Comment, on_delete=models.CASCADE, null=True, blank=True)
    related_achievement = models.ForeignKey(Achievement, on_delete=models.CASCADE, null=True, blank=True)
    related_friendship = models.ForeignKey(Friendship, on_delete=models.CASCADE, null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Notification for {self.recipient.username}: {self.title}"

    def get_icon(self):
        """Return appropriate icon for notification type"""
        icons = {
            'friend_request': 'user-plus',
            'friend_accepted': 'user-check',
            'story_liked': 'heart',
            'story_commented': 'message-circle',
            'story_rated': 'star',
            'achievement_earned': 'award',
            'story_published': 'book-open',
        }
        return icons.get(self.notification_type, 'bell')

    def get_url(self):
        """Return URL to navigate to when notification is clicked"""
        if self.notification_type == 'friend_request':
            return '/friends/'
        elif self.notification_type == 'friend_accepted':
            return '/friends/'
        elif self.notification_type in ['story_liked', 'story_commented', 'story_rated'] and self.related_story:
            return f'/story/{self.related_story.id}/'
        elif self.notification_type == 'achievement_earned':
            return '/profile/'
        elif self.notification_type == 'story_published' and self.related_story:
            return f'/story/{self.related_story.id}/'
        return '/'


# ========== Collaborative Drawing Models ==========

class CollaborationSession(models.Model):
    """
    Represents a collaborative drawing session where multiple users can draw together
    """
    session_id = models.CharField(max_length=100, unique=True, db_index=True)
    join_code = models.CharField(max_length=5, unique=True, db_index=True, null=True, blank=True)  # 5-character join code
    host = models.ForeignKey(User, on_delete=models.CASCADE, related_name='hosted_sessions')
    canvas_name = models.CharField(max_length=200, default='Untitled Canvas')
    canvas_data = models.JSONField(default=dict, blank=True)  # Stores the current canvas state
    is_active = models.BooleanField(default=True)
    max_participants = models.IntegerField(default=5)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    
    # Enhanced collaboration fields for story creation
    story_draft = models.JSONField(default=dict, blank=True)  # Store story draft data (pages, text, etc.)
    canvas_state = models.JSONField(default=dict, blank=True)  # Store complete canvas state for each page
    current_page = models.IntegerField(default=0)  # Current page being edited
    is_lobby_open = models.BooleanField(default=True)  # Whether lobby is still accepting joins
    voting_active = models.BooleanField(default=False)  # Whether a save vote is in progress
    voting_data = models.JSONField(default=dict, blank=True)  # Store voting state {user_id: True/False}
    last_autosave = models.DateTimeField(null=True, blank=True)  # Track last auto-save time
    operation_count = models.IntegerField(default=0)  # Count operations since last save
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.canvas_name} - {self.session_id}"
    
    @property
    def invite_link(self):
        """Generate invite link for this session"""
        return f"/canvas/collaborate/{self.session_id}"
    
    @property
    def participant_count(self):
        """Get current number of active participants"""
        return self.participants.filter(is_active=True).count()
    
    def can_join(self):
        """Check if new participants can join via join code"""
        # Check if session is expired and auto-deactivate if needed
        if self.is_expired():
            self.is_active = False
            self.save()
            return False
            
        # Allow joining anytime as long as session is active and not full
        # This allows resuming work on collaborative stories even when others aren't active
        return self.is_active and self.participant_count < self.max_participants
    
    def is_expired(self):
        """Check if session has expired"""
        from django.utils import timezone
        return self.expires_at and timezone.now() > self.expires_at
    
    def can_accept_invite(self):
        """Check if new participants can accept invitations (same as can_join now)"""
        # Invites can be accepted even after lobby closes, as long as session is active and not full
        return self.is_active and self.participant_count < self.max_participants
    
    def reset_voting(self):
        """Reset voting state"""
        self.voting_active = False
        self.voting_data = {}
        self.save()
    
    def all_voted(self):
        """Check if all participants have voted"""
        active_participants = self.participants.filter(is_active=True).count()
        return len(self.voting_data) >= active_participants and active_participants > 0
    
    def all_agreed(self):
        """Check if all votes are YES"""
        return self.all_voted() and all(self.voting_data.values())


class SessionParticipant(models.Model):
    """
    Tracks users participating in a collaboration session
    """
    ROLE_CHOICES = [
        ('host', 'Host'),
        ('participant', 'Participant'),
    ]
    
    session = models.ForeignKey(CollaborationSession, on_delete=models.CASCADE, related_name='participants')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='collaboration_sessions')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='participant')
    cursor_position = models.JSONField(default=dict, blank=True)  # {x: 0, y: 0}
    cursor_color = models.CharField(max_length=7, default='#FF0000')  # Hex color for cursor
    current_tool = models.CharField(max_length=50, blank=True)  # Current tool being used
    is_active = models.BooleanField(default=True)
    joined_at = models.DateTimeField(auto_now_add=True)
    last_seen = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['session', 'user']
        ordering = ['joined_at']
    
    def __str__(self):
        return f"{self.user.username} in {self.session.session_id}"


class DrawingOperation(models.Model):
    """
    Stores individual drawing operations for synchronization and history
    """
    OPERATION_TYPES = [
        ('path', 'Path Drawing'),
        ('shape', 'Shape'),
        ('text', 'Text'),
        ('erase', 'Erase'),
        ('clear', 'Clear Canvas'),
        ('transform', 'Transform'),
        ('delete', 'Delete Object'),
        ('text_edit', 'Text Edit'),
        ('page_change', 'Page Change'),
        ('add_page', 'Add Page'),
        ('delete_page', 'Delete Page'),
    ]
    
    session = models.ForeignKey(CollaborationSession, on_delete=models.CASCADE, related_name='operations')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='drawing_operations')
    operation_type = models.CharField(max_length=20, choices=OPERATION_TYPES)
    operation_data = models.JSONField()  # Stores the actual drawing data
    timestamp = models.DateTimeField(auto_now_add=True)
    sequence_number = models.IntegerField(default=0)  # For ordering operations
    page_number = models.IntegerField(default=0)  # Which page this operation applies to
    
    class Meta:
        ordering = ['timestamp', 'sequence_number']
        indexes = [
            models.Index(fields=['session', 'timestamp']),
            models.Index(fields=['session', 'page_number']),
        ]
    
    def __str__(self):
        return f"{self.operation_type} by {self.user.username} at {self.timestamp}"


class CollaborationInvite(models.Model):
    """
    Tracks collaboration invitations sent to users
    """
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
        ('expired', 'Expired'),
    ]
    
    session = models.ForeignKey(CollaborationSession, on_delete=models.CASCADE, related_name='invites')
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_collab_invites')
    receiver = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_collab_invites')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    message = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    responded_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        unique_together = ['session', 'receiver']
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Invite from {self.sender.username} to {self.receiver.username} - {self.status}"


class EmailVerification(models.Model):
    """
    Model to store email verification codes
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='email_verifications', null=True, blank=True)
    email = models.EmailField()
    verification_code = models.CharField(max_length=6)
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    verified_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Verification for {self.email} - {'Verified' if self.is_verified else 'Pending'}"
    
    def is_expired(self):
        """Check if verification code has expired"""
        from django.utils import timezone
        return timezone.now() > self.expires_at
    
    def mark_verified(self):
        """Mark this verification as completed"""
        from django.utils import timezone
        self.is_verified = True
        self.verified_at = timezone.now()
        self.save()


class ProfanityWord(models.Model):
    """
    Model to store profanity words that should be filtered
    Managed by admins through the admin dashboard
    """
    LANGUAGE_CHOICES = [
        ('en', 'English'),
        ('tl', 'Tagalog'),
        ('both', 'Both'),
    ]
    
    SEVERITY_CHOICES = [
        ('mild', 'Mild'),
        ('moderate', 'Moderate'),
        ('severe', 'Severe'),
    ]
    
    word = models.CharField(max_length=100, unique=True)
    language = models.CharField(max_length=10, choices=LANGUAGE_CHOICES, default='en')
    severity = models.CharField(max_length=20, choices=SEVERITY_CHOICES, default='moderate')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Profanity Word'
        verbose_name_plural = 'Profanity Words'
        ordering = ['word']
    
    def __str__(self):
        return f"{self.word} ({self.language})"


# ============================================================================
# EDUCATIONAL GAMES MODELS
# ============================================================================

class StoryGame(models.Model):
    """
    Game data associated with a published story
    Games are generated from story content to test comprehension
    """
    GAME_TYPES = [
        ('quiz', 'Multiple Choice Quiz'),
        ('fill_blanks', 'Fill in the Blanks'),
        ('word_search', 'Word Search'),
    ]
    
    story = models.ForeignKey('Story', on_delete=models.CASCADE, related_name='games')
    game_type = models.CharField(max_length=20, choices=GAME_TYPES)
    difficulty = models.CharField(
        max_length=10, 
        choices=[('easy', 'Easy'), ('medium', 'Medium'), ('hard', 'Hard')],
        default='medium'
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ('story', 'game_type')
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.get_game_type_display()} - {self.story.title}"
    
    def get_questions_count(self):
        """Get total number of questions for this game"""
        return self.questions.filter(is_active=True).count()


class GameQuestion(models.Model):
    """
    Individual questions for story games
    """
    QUESTION_TYPES = [
        ('multiple_choice', 'Multiple Choice'),
        ('fill_blank', 'Fill in the Blank'),
        ('word_search', 'Word Search'),
    ]
    
    game = models.ForeignKey(StoryGame, on_delete=models.CASCADE, related_name='questions')
    question_type = models.CharField(max_length=20, choices=QUESTION_TYPES)
    question_text = models.TextField()
    correct_answer = models.CharField(max_length=500)
    
    # For multiple choice questions (JSON array of options)
    options = models.JSONField(null=True, blank=True)
    
    # Additional context (e.g., sentence for fill in the blank)
    context = models.TextField(blank=True, null=True)
    
    # Question ordering
    order = models.PositiveIntegerField(default=0)
    
    # Hints and explanations
    hint = models.TextField(blank=True, null=True)
    explanation = models.TextField(blank=True, null=True)
    
    # Points for correct answer
    points = models.PositiveIntegerField(default=10)
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['game', 'order']
    
    def __str__(self):
        return f"Q{self.order}: {self.question_text[:50]}"
    
    def check_answer(self, user_answer):
        """
        Check if the user's answer is correct
        Returns tuple: (is_correct, feedback)
        """
        if not user_answer:
            return False, "No answer provided"
        
        user_answer = str(user_answer).strip().lower()
        correct_answer = str(self.correct_answer).strip().lower()
        
        # For spelling and fill-in-the-blank, allow for minor variations
        if self.question_type in ['spelling', 'fill_blank']:
            import re
            user_answer = re.sub(r'[^\w\s]', '', user_answer)
            correct_answer = re.sub(r'[^\w\s]', '', correct_answer)
        
        is_correct = user_answer == correct_answer
        
        if is_correct:
            feedback = "Correct! " + (self.explanation or "Great job!")
        else:
            feedback = f"Not quite. The correct answer is: {self.correct_answer}"
            if self.explanation:
                feedback += f"\n{self.explanation}"
        
        return is_correct, feedback


class GameAttempt(models.Model):
    """
    Track user attempts at games
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='game_attempts')
    game = models.ForeignKey(StoryGame, on_delete=models.CASCADE, related_name='attempts')
    
    # Score tracking
    total_questions = models.PositiveIntegerField()
    correct_answers = models.PositiveIntegerField(default=0)
    total_points = models.PositiveIntegerField(default=0)
    max_points = models.PositiveIntegerField()
    
    # Timing
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    time_taken_seconds = models.PositiveIntegerField(null=True, blank=True)
    
    # Rewards
    xp_earned = models.PositiveIntegerField(default=0)
    
    # Status
    is_completed = models.BooleanField(default=False)
    
    class Meta:
        ordering = ['-started_at']
    
    def __str__(self):
        return f"{self.user.username} - {self.game} - {self.score_percentage}%"
    
    @property
    def score_percentage(self):
        """Calculate percentage score"""
        if self.total_questions == 0:
            return 0
        return round((self.correct_answers / self.total_questions) * 100, 1)
    
    @property
    def passed(self):
        """Check if user passed (70% or higher)"""
        return self.score_percentage >= 70
    
    def complete(self):
        """Mark attempt as completed and award XP"""
        if self.is_completed:
            return
        
        self.is_completed = True
        self.completed_at = timezone.now()
        
        # Calculate time taken
        if self.started_at:
            duration = self.completed_at - self.started_at
            self.time_taken_seconds = int(duration.total_seconds())
        
        # Award XP based on performance
        self.xp_earned = self.calculate_xp_reward()
        self.save()
        
        # Award XP to user
        if self.xp_earned > 0:
            from .xp_service import XPService
            XPService.award_xp(
                self.user,
                'game_completed',
                amount=self.xp_earned,
                create_notification=True
            )
    
    def calculate_xp_reward(self):
        """Calculate XP reward based on performance"""
        base_xp = 30  # Base XP for completing a game
        
        # Bonus XP for correct answers
        performance_xp = self.correct_answers * 5
        
        # Bonus for perfect score
        if self.score_percentage == 100:
            performance_xp += 20
        
        # Bonus for passing
        elif self.passed:
            performance_xp += 10
        
        # Time bonus (if completed quickly - under 2 minutes)
        if self.time_taken_seconds and self.time_taken_seconds < 120:
            performance_xp += 15
        
        return base_xp + performance_xp


class GameAnswer(models.Model):
    """
    Individual answers given by user during a game attempt
    """
    attempt = models.ForeignKey(GameAttempt, on_delete=models.CASCADE, related_name='answers')
    question = models.ForeignKey(GameQuestion, on_delete=models.CASCADE)
    user_answer = models.CharField(max_length=500)
    is_correct = models.BooleanField()
    points_earned = models.PositiveIntegerField(default=0)
    answered_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['answered_at']
        unique_together = ('attempt', 'question')
    
    def __str__(self):
        return f"{self.attempt.user.username} - Q{self.question.order} - {'✓' if self.is_correct else '✗'}"
