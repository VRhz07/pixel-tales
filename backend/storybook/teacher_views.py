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
