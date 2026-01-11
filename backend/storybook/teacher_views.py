"""
Teacher Dashboard API Views
"""
from rest_framework import status, viewsets
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.contrib.auth.models import User
from django.db.models import Q, Count, Avg
from .models import TeacherClass, TeacherStudentRelationship, UserProfile, Story
from .serializers import (
    TeacherClassSerializer, 
    TeacherStudentRelationshipSerializer,
    UserSerializer
)


class TeacherClassViewSet(viewsets.ModelViewSet):
    """ViewSet for managing teacher classes"""
    serializer_class = TeacherClassSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None  # Disable pagination for simpler response
    
    def get_queryset(self):
        """Return only classes belonging to the current teacher"""
        user = self.request.user
        if user.profile.is_teacher:
            return TeacherClass.objects.filter(teacher=user).order_by('-date_created')
        return TeacherClass.objects.none()
    
    def perform_create(self, serializer):
        """Set the teacher to the current user"""
        serializer.save(teacher=self.request.user)
    
    def list(self, request, *args, **kwargs):
        """Override list to ensure proper response format"""
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def students(self, request, pk=None):
        """Get all students in a class"""
        teacher_class = self.get_object()
        relationships = TeacherStudentRelationship.objects.filter(
            teacher_class=teacher_class,
            is_active=True
        ).select_related('student', 'student__profile')
        
        students = []
        for rel in relationships:
            student = rel.student
            profile = student.profile
            
            # Get student statistics
            stories_count = Story.objects.filter(author=student, is_published=True).count()
            
            students.append({
                'id': student.id,
                'username': student.username,
                'display_name': profile.display_name,
                'avatar_emoji': profile.avatar_emoji,
                'email': student.email,
                'level': profile.level,
                'experience_points': profile.experience_points,
                'stories_count': stories_count,
                'date_added': rel.date_created,
                'notes': rel.notes
            })
        
        return Response({'students': students})
    
    @action(detail=True, methods=['post'])
    def add_student(self, request, pk=None):
        """Add a student to this class by child account ID"""
        teacher_class = self.get_object()
        student_id = request.data.get('student_id')
        
        if not student_id:
            return Response(
                {'error': 'student_id is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            student = User.objects.get(id=student_id)
            
            # Verify it's a child account
            if not student.profile.is_child:
                return Response(
                    {'error': 'Only child accounts can be added to classes'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Check if relationship already exists
            relationship, created = TeacherStudentRelationship.objects.get_or_create(
                teacher=self.request.user,
                student=student,
                defaults={'teacher_class': teacher_class, 'is_active': True}
            )
            
            if not created:
                # Update existing relationship
                relationship.teacher_class = teacher_class
                relationship.is_active = True
                relationship.save()
            
            return Response({
                'message': 'Student added successfully',
                'relationship_id': relationship.id
            }, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)
            
        except User.DoesNotExist:
            return Response(
                {'error': 'Student not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def teacher_dashboard_stats(request):
    """Get statistics for teacher dashboard"""
    user = request.user
    
    if not user.profile.is_teacher:
        return Response(
            {'error': 'Only teachers can access this endpoint'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Get all classes
    classes = TeacherClass.objects.filter(teacher=user, is_active=True)
    total_classes = classes.count()
    
    # Get all students
    students = User.objects.filter(
        teacher_accounts__teacher=user,
        teacher_accounts__is_active=True
    ).distinct()
    total_students = students.count()
    
    # Get total stories by students
    total_stories = Story.objects.filter(
        author__in=students,
        is_published=True
    ).count()
    
    # Get recent activities
    recent_stories = Story.objects.filter(
        author__in=students,
        is_published=True
    ).order_by('-date_created')[:10]
    
    activities = []
    for story in recent_stories:
        activities.append({
            'id': story.id,
            'type': 'story_published',
            'student_name': story.author.profile.display_name,
            'story_title': story.title,
            'timestamp': story.date_created,
            'category': story.category
        })
    
    return Response({
        'total_classes': total_classes,
        'total_students': total_students,
        'total_stories': total_stories,
        'recent_activities': activities
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def available_students(request):
    """Get list of available child accounts (not in any of teacher's classes yet)"""
    user = request.user
    
    if not user.profile.is_teacher:
        return Response(
            {'error': 'Only teachers can access this endpoint'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Get all child accounts
    all_children = User.objects.filter(profile__user_type='child')
    
    # Get students already in teacher's classes
    existing_students = User.objects.filter(
        teacher_accounts__teacher=user,
        teacher_accounts__is_active=True
    ).distinct()
    
    # Get available students (not in teacher's classes)
    available = all_children.exclude(id__in=existing_students.values_list('id', flat=True))
    
    students = []
    for student in available:
        profile = student.profile
        stories_count = Story.objects.filter(author=student, is_published=True).count()
        
        students.append({
            'id': student.id,
            'username': student.username,
            'display_name': profile.display_name,
            'avatar_emoji': profile.avatar_emoji,
            'level': profile.level,
            'stories_count': stories_count
        })
    
    return Response({'students': students})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def teacher_students(request):
    """Get all students under this teacher (across all classes)"""
    user = request.user
    
    if not user.profile.is_teacher:
        return Response(
            {'error': 'Only teachers can access this endpoint'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Get all students
    relationships = TeacherStudentRelationship.objects.filter(
        teacher=user,
        is_active=True
    ).select_related('student', 'student__profile', 'teacher_class')
    
    students = []
    for rel in relationships:
        student = rel.student
        profile = student.profile
        
        # Get student statistics
        stories_count = Story.objects.filter(author=student, is_published=True).count()
        
        students.append({
            'id': student.id,
            'username': student.username,
            'display_name': profile.display_name,
            'avatar_emoji': profile.avatar_emoji,
            'email': student.email,
            'level': profile.level,
            'experience_points': profile.experience_points,
            'stories_count': stories_count,
            'class_name': rel.teacher_class.name if rel.teacher_class else 'No Class',
            'class_id': rel.teacher_class.id if rel.teacher_class else None,
            'date_added': rel.date_created,
            'notes': rel.notes
        })
    
    return Response({'students': students})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def teacher_reports(request):
    """Get comprehensive reports and analytics for teacher dashboard"""
    from django.db.models import Sum, Avg, Count, Q as QueryQ
    from django.utils import timezone
    from datetime import timedelta
    
    user = request.user
    
    if not user.profile.is_teacher:
        return Response(
            {'error': 'Only teachers can access this endpoint'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Get all students
    students = User.objects.filter(
        teacher_accounts__teacher=user,
        teacher_accounts__is_active=True
    ).distinct().select_related('profile')
    
    # Time ranges
    now = timezone.now()
    today = now.date()
    week_ago = now - timedelta(days=7)
    month_ago = now - timedelta(days=30)
    
    # Overall statistics
    total_students = students.count()
    
    # Student activity
    active_today = students.filter(profile__last_seen__date=today).count()
    active_this_week = students.filter(profile__last_seen__gte=week_ago).count()
    active_this_month = students.filter(profile__last_seen__gte=month_ago).count()
    
    # Story statistics
    all_student_stories = Story.objects.filter(author__in=students)
    total_stories = all_student_stories.filter(is_published=True).count()
    stories_this_week = all_student_stories.filter(
        is_published=True,
        date_created__gte=week_ago
    ).count()
    stories_this_month = all_student_stories.filter(
        is_published=True,
        date_created__gte=month_ago
    ).count()
    
    # Average statistics
    avg_stories_per_student = total_stories / total_students if total_students > 0 else 0
    avg_level = students.aggregate(avg_level=Avg('profile__level'))['avg_level'] or 0
    avg_xp = students.aggregate(avg_xp=Avg('profile__experience_points'))['avg_xp'] or 0
    
    # Top performers
    top_story_writers = list(students.annotate(
        story_count=Count('stories', filter=QueryQ(stories__is_published=True))
    ).order_by('-story_count')[:5].values(
        'id', 'profile__display_name', 'profile__avatar_emoji', 'story_count'
    ))
    
    top_xp_earners = list(students.order_by('-profile__experience_points')[:5].values(
        'id', 'profile__display_name', 'profile__avatar_emoji', 'profile__experience_points', 'profile__level'
    ))
    
    # Class breakdown
    classes = TeacherClass.objects.filter(teacher=user, is_active=True)
    class_stats = []
    for cls in classes:
        class_students = students.filter(teacher_accounts__teacher_class=cls)
        class_student_count = class_students.count()
        class_stories = Story.objects.filter(
            author__in=class_students,
            is_published=True
        ).count()
        class_avg_level = class_students.aggregate(
            avg_level=Avg('profile__level')
        )['avg_level'] or 0
        
        class_stats.append({
            'id': cls.id,
            'name': cls.name,
            'student_count': class_student_count,
            'total_stories': class_stories,
            'avg_level': round(class_avg_level, 1),
            'grade_level': cls.grade_level,
            'subject': cls.subject
        })
    
    # Recent activities (last 20)
    recent_stories = all_student_stories.filter(
        is_published=True
    ).select_related('author__profile').order_by('-date_created')[:20]
    
    activities = []
    for story in recent_stories:
        activities.append({
            'id': story.id,
            'type': 'story_published',
            'student_id': story.author.id,
            'student_name': story.author.profile.display_name,
            'student_avatar': story.author.profile.avatar_emoji,
            'story_title': story.title,
            'story_id': story.id,
            'timestamp': story.date_created.isoformat(),
            'category': story.category,
            'time_ago': _get_time_ago(story.date_created)
        })
    
    # Engagement trends (last 7 days)
    engagement_trend = []
    for i in range(7):
        day = today - timedelta(days=i)
        day_start = timezone.make_aware(timezone.datetime.combine(day, timezone.datetime.min.time()))
        day_end = day_start + timedelta(days=1)
        
        stories_count = all_student_stories.filter(
            is_published=True,
            date_created__gte=day_start,
            date_created__lt=day_end
        ).count()
        
        active_students = students.filter(
            profile__last_seen__gte=day_start,
            profile__last_seen__lt=day_end
        ).count()
        
        engagement_trend.insert(0, {
            'date': day.isoformat(),
            'day_name': day.strftime('%a'),
            'stories': stories_count,
            'active_students': active_students
        })
    
    # Achievement statistics
    from .models import UserAchievement
    total_achievements = UserAchievement.objects.filter(
        user__in=students,
        is_earned=True
    ).count()
    
    recent_achievements = UserAchievement.objects.filter(
        user__in=students,
        is_earned=True
    ).select_related('user__profile', 'achievement').order_by('-earned_at')[:10]
    
    achievement_activities = []
    for ua in recent_achievements:
        achievement_activities.append({
            'type': 'achievement_earned',
            'student_id': ua.user.id,
            'student_name': ua.user.profile.display_name,
            'student_avatar': ua.user.profile.avatar_emoji,
            'achievement_name': ua.achievement.name,
            'achievement_icon': ua.achievement.icon,
            'timestamp': ua.earned_at.isoformat() if ua.earned_at else None,
            'time_ago': _get_time_ago(ua.earned_at) if ua.earned_at else 'Recently'
        })
    
    return Response({
        'success': True,
        'overview': {
            'total_students': total_students,
            'total_stories': total_stories,
            'total_achievements': total_achievements,
            'avg_stories_per_student': round(avg_stories_per_student, 1),
            'avg_level': round(avg_level, 1),
            'avg_xp': round(avg_xp, 0),
            'active_today': active_today,
            'active_this_week': active_this_week,
            'active_this_month': active_this_month,
            'stories_this_week': stories_this_week,
            'stories_this_month': stories_this_month
        },
        'top_performers': {
            'story_writers': top_story_writers,
            'xp_earners': top_xp_earners
        },
        'class_breakdown': class_stats,
        'recent_activities': activities,
        'achievement_activities': achievement_activities,
        'engagement_trend': engagement_trend,
        'generated_at': now.isoformat()
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def student_stories(request, student_id):
    """Get all stories created by a specific student (for teachers only)"""
    user = request.user
    
    if not user.profile.is_teacher:
        return Response(
            {'error': 'Only teachers can access this endpoint'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Verify the student is under this teacher
    try:
        student = User.objects.get(id=student_id)
        relationship = TeacherStudentRelationship.objects.filter(
            teacher=user,
            student=student,
            is_active=True
        ).first()
        
        if not relationship:
            return Response(
                {'error': 'This student is not in your classes'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get all stories by this student
        stories = Story.objects.filter(
            author=student,
            is_published=True
        ).order_by('-date_created')
        
        stories_data = []
        for story in stories:
            # Get word count from content
            word_count = len(story.content.split()) if story.content else 0
            
            # Parse canvas_data to get page count
            page_count = 0
            try:
                if story.canvas_data:
                    import json
                    canvas = json.loads(story.canvas_data) if isinstance(story.canvas_data, str) else story.canvas_data
                    if isinstance(canvas, dict) and 'pages' in canvas:
                        page_count = len(canvas['pages'])
                    elif isinstance(canvas, list):
                        page_count = len(canvas)
            except:
                pass
            
            stories_data.append({
                'id': story.id,
                'title': story.title,
                'category': story.category,
                'cover_image': story.cover_image if story.cover_image else None,
                'language': story.language,
                'content': story.content,  # Include full story content
                'canvas_data': story.canvas_data,  # Include canvas data for viewing
                'summary': story.summary if story.summary else '',
                'genres': story.genres if story.genres else [],
                'date_created': story.date_created.isoformat(),
                'is_published': story.is_published,
                'likes_count': story.likes.count(),
                'likes': story.likes.count(),  # Alias for compatibility
                'comments': story.comments.count(),
                'views': story.views,
                'word_count': word_count,
                'page_count': page_count,
                'time_ago': _get_time_ago(story.date_created)
            })
        
        return Response({
            'success': True,
            'student': {
                'id': student.id,
                'display_name': student.profile.display_name,
                'avatar_emoji': student.profile.avatar_emoji,
                'level': student.profile.level,
                'experience_points': student.profile.experience_points
            },
            'stories': stories_data,
            'total_stories': len(stories_data)
        })
        
    except User.DoesNotExist:
        return Response(
            {'error': 'Student not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )


def _get_time_ago(dt):
    """Helper function to get human-readable time ago"""
    if not dt:
        return 'Unknown'
    
    from django.utils import timezone
    now = timezone.now()
    diff = now - dt
    
    if diff.days > 30:
        return f"{diff.days // 30} month{'s' if diff.days // 30 > 1 else ''} ago"
    elif diff.days > 0:
        return f"{diff.days} day{'s' if diff.days > 1 else ''} ago"
    elif diff.seconds > 3600:
        hours = diff.seconds // 3600
        return f"{hours} hour{'s' if hours > 1 else ''} ago"
    elif diff.seconds > 60:
        minutes = diff.seconds // 60
        return f"{minutes} minute{'s' if minutes > 1 else ''} ago"
    else:
        return 'Just now'
