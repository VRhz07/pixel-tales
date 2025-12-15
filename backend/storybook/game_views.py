"""
API Views for Educational Games
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.shortcuts import get_object_or_404
from django.db.models import Count, Avg

from .models import Story, StoryGame, GameQuestion, GameAttempt, GameAnswer
from .game_service import GameGenerationService
from .jwt_decorators import jwt_required


class StoryGameViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for accessing story games
    """
    permission_classes = [IsAuthenticated]
    
    def get_permissions(self):
        """
        Allow anyone to browse games, but require auth to play
        """
        if self.action in ['available_stories', 'games_for_story', 'leaderboard']:
            return [AllowAny()]
        return [IsAuthenticated()]
    
    def get_queryset(self):
        return StoryGame.objects.filter(is_active=True)
    
    @action(detail=False, methods=['get'])
    def available_stories(self, request):
        """
        Get all published stories that have games available
        """
        # Get stories with games
        stories_with_games = Story.objects.filter(
            is_published=True,
            games__is_active=True
        ).distinct().annotate(
            games_count=Count('games')
        ).values(
            'id', 'title', 'cover_image', 'category', 
            'author__username', 'games_count'
        )
        
        return Response({
            'stories': list(stories_with_games),
            'total': stories_with_games.count()
        })
    
    @action(detail=False, methods=['get'], url_path='story/(?P<story_id>[^/.]+)')
    def games_for_story(self, request, story_id=None):
        """
        Get all available games for a specific story with incomplete attempts info
        Only show games for published stories, unless user is the author
        """
        story = get_object_or_404(Story, id=story_id)
        
        # Check if story is published OR user is the author
        if not story.is_published:
            if not request.user.is_authenticated or story.author != request.user:
                return Response(
                    {'error': 'Story not found or not published'},
                    status=status.HTTP_404_NOT_FOUND
                )
        
        games = StoryGame.objects.filter(
            story=story,
            is_active=True
        ).values('id', 'game_type', 'difficulty')
        
        # Add question count and incomplete attempt info to each game
        games_data = []
        for game in games:
            game_obj = StoryGame.objects.get(id=game['id'])
            game_data = {
                **game,
                'questions_count': game_obj.get_questions_count(),
                'game_type_display': game_obj.get_game_type_display()
            }
            
            # Check for incomplete attempt and last completed attempt if user is authenticated
            if request.user.is_authenticated:
                # Get the most recent incomplete attempt only
                incomplete_attempt = GameAttempt.objects.filter(
                    user=request.user,
                    game=game_obj,
                    is_completed=False
                ).order_by('-started_at').first()
                
                if incomplete_attempt:
                    answered_count = GameAnswer.objects.filter(
                        attempt=incomplete_attempt
                    ).count()
                    
                    game_data['incomplete_attempt'] = {
                        'attempt_id': incomplete_attempt.id,
                        'current_score': incomplete_attempt.correct_answers,
                        'answered_count': answered_count,
                        'total_questions': incomplete_attempt.total_questions,
                        'started_at': incomplete_attempt.started_at
                    }
                
                # Get the most recent completed attempt
                last_attempt = GameAttempt.objects.filter(
                    user=request.user,
                    game=game_obj,
                    is_completed=True
                ).order_by('-completed_at').first()
                
                if last_attempt:
                    game_data['last_attempt'] = {
                        'score_percentage': last_attempt.score_percentage,
                        'time_taken_seconds': last_attempt.time_taken_seconds,
                        'is_completed': True,
                        'correct_answers': last_attempt.correct_answers,
                        'total_questions': last_attempt.total_questions
                    }
            
            games_data.append(game_data)
        
        return Response({
            'story_id': story.id,
            'story_title': story.title,
            'games': games_data
        })
    
    @action(detail=True, methods=['post'])
    def start_game(self, request, pk=None):
        """
        Start a new game attempt or resume incomplete one
        """
        game = self.get_object()
        force_new = request.data.get('force_new', False)
        
        # Check if user has an incomplete attempt
        incomplete_attempt = GameAttempt.objects.filter(
            user=request.user,
            game=game,
            is_completed=False
        ).first()
        
        if incomplete_attempt and not force_new:
            # Resume the incomplete attempt
            attempt = incomplete_attempt
            
            # Get answered question IDs
            answered_question_ids = GameAnswer.objects.filter(
                attempt=attempt
            ).values_list('question_id', flat=True)
            
            # Get all questions with answered status
            all_questions = game.questions.filter(is_active=True).order_by('order')
            questions_data = []
            for q in all_questions:
                questions_data.append({
                    'id': q.id,
                    'question_type': q.question_type,
                    'question_text': q.question_text,
                    'options': q.options,
                    'order': q.order,
                    'hint': q.hint,
                    'context': q.context,
                    'points': q.points,
                    'is_answered': q.id in answered_question_ids
                })
            
            return Response({
                'attempt_id': attempt.id,
                'game_type': game.game_type,
                'total_questions': attempt.total_questions,
                'max_points': attempt.max_points,
                'questions': questions_data,
                'started_at': attempt.started_at,
                'is_resume': True,
                'current_score': attempt.correct_answers,
                'answered_count': len(answered_question_ids)
            }, status=status.HTTP_200_OK)
        
        # Delete old incomplete attempt if force_new is True
        if incomplete_attempt and force_new:
            incomplete_attempt.delete()
        
        # Start new attempt
        attempt = GameGenerationService.start_game_attempt(request.user, game)
        
        # Get questions (without revealing answers)
        questions = game.questions.filter(is_active=True).order_by('order').values(
            'id', 'question_type', 'question_text', 'options',
            'order', 'hint', 'context', 'points'
        )
        
        questions_data = [dict(q, is_answered=False) for q in questions]
        
        return Response({
            'attempt_id': attempt.id,
            'game_type': game.game_type,
            'total_questions': attempt.total_questions,
            'max_points': attempt.max_points,
            'questions': questions_data,
            'started_at': attempt.started_at,
            'is_resume': False,
            'current_score': 0,
            'answered_count': 0
        }, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'])
    def clear_incomplete(self, request, pk=None):
        """
        Delete an incomplete attempt for a game
        """
        game = self.get_object()
        
        # Find and delete incomplete attempt
        incomplete_attempt = GameAttempt.objects.filter(
            user=request.user,
            game=game,
            is_completed=False
        ).first()
        
        if incomplete_attempt:
            incomplete_attempt.delete()
            return Response({
                'message': 'Incomplete attempt cleared',
                'success': True
            }, status=status.HTTP_200_OK)
        
        return Response({
            'message': 'No incomplete attempt found',
            'success': False
        }, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=True, methods=['get'])
    def leaderboard(self, request, pk=None):
        """
        Get leaderboard for a specific game
        """
        game = self.get_object()
        
        # Get top 10 attempts
        top_attempts = GameAttempt.objects.filter(
            game=game,
            is_completed=True
        ).select_related('user', 'user__userprofile').order_by(
            '-correct_answers', 'time_taken_seconds'
        )[:10]
        
        leaderboard_data = []
        for idx, attempt in enumerate(top_attempts, 1):
            leaderboard_data.append({
                'rank': idx,
                'username': attempt.user.username,
                'avatar_emoji': getattr(attempt.user.userprofile, 'avatar_emoji', '👤'),
                'score': attempt.score_percentage,
                'correct_answers': attempt.correct_answers,
                'total_questions': attempt.total_questions,
                'time_taken': attempt.time_taken_seconds,
                'completed_at': attempt.completed_at
            })
        
        return Response({
            'game_id': game.id,
            'game_type': game.get_game_type_display(),
            'leaderboard': leaderboard_data
        })


@api_view(['POST'])
@jwt_required
def submit_answer(request):
    """
    Submit an answer for a question in a game attempt
    """
    attempt_id = request.data.get('attempt_id')
    question_id = request.data.get('question_id')
    user_answer = request.data.get('answer')
    
    if not all([attempt_id, question_id, user_answer is not None]):
        return Response(
            {'error': 'Missing required fields: attempt_id, question_id, answer'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Get attempt and verify ownership
    attempt = get_object_or_404(GameAttempt, id=attempt_id, user=request.user)
    
    if attempt.is_completed:
        return Response(
            {'error': 'This game attempt is already completed'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Get question
    question = get_object_or_404(GameQuestion, id=question_id, game=attempt.game)
    
    # Submit answer
    result = GameGenerationService.submit_answer(attempt, question, user_answer)
    
    if 'error' in result:
        return Response(result, status=status.HTTP_400_BAD_REQUEST)
    
    return Response(result, status=status.HTTP_200_OK)


@api_view(['POST'])
@jwt_required
def complete_game(request):
    """
    Complete a game attempt and get results
    """
    attempt_id = request.data.get('attempt_id')
    
    if not attempt_id:
        return Response(
            {'error': 'attempt_id is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Get attempt and verify ownership
    attempt = get_object_or_404(GameAttempt, id=attempt_id, user=request.user)
    
    if attempt.is_completed:
        return Response(
            {'error': 'This game attempt is already completed'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Complete the attempt
    results = GameGenerationService.complete_game_attempt(attempt)
    
    # Clean up any other incomplete attempts for this game
    GameAttempt.objects.filter(
        user=request.user,
        game=attempt.game,
        is_completed=False
    ).exclude(id=attempt.id).delete()
    
    # Get all answers for review
    answers = GameAnswer.objects.filter(attempt=attempt).select_related('question').values(
        'question__question_text',
        'question__correct_answer',
        'user_answer',
        'is_correct',
        'points_earned'
    )
    
    return Response({
        **results,
        'answers_review': list(answers),
        'time_taken_seconds': attempt.time_taken_seconds
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@jwt_required
def my_game_stats(request):
    """
    Get current user's game statistics
    """
    stats = GameGenerationService.get_user_game_stats(request.user)
    
    # Get recent attempts
    recent_attempts = GameAttempt.objects.filter(
        user=request.user,
        is_completed=True
    ).select_related('game', 'game__story').order_by('-completed_at')[:5]
    
    recent_data = []
    for attempt in recent_attempts:
        recent_data.append({
            'story_title': attempt.game.story.title,
            'game_type': attempt.game.get_game_type_display(),
            'score': attempt.score_percentage,
            'xp_earned': attempt.xp_earned,
            'completed_at': attempt.completed_at
        })
    
    return Response({
        **stats,
        'recent_attempts': recent_data
    })


@api_view(['GET'])
@jwt_required
def check_story_games(request, story_id):
    """
    Check if a story has games generated
    Returns game availability status
    """
    story = get_object_or_404(Story, id=story_id)
    
    # Check if user can view this info
    is_author = story.author == request.user
    is_published = story.is_published
    
    if not is_published and not is_author and not request.user.is_staff:
        return Response(
            {'error': 'You do not have permission to view this story'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Get games for this story
    games = StoryGame.objects.filter(story=story, is_active=True)
    
    games_data = []
    for game in games:
        games_data.append({
            'id': game.id,
            'game_type': game.game_type,
            'game_type_display': game.get_game_type_display(),
            'questions_count': game.get_questions_count()
        })
    
    return Response({
        'story_id': story.id,
        'story_title': story.title,
        'has_games': games.exists(),
        'games_count': games.count(),
        'games': games_data,
        'is_author': is_author,
        'is_published': is_published,
        'can_generate': is_author or request.user.is_staff
    })


@api_view(['POST'])
@jwt_required
def generate_games_for_story(request):
    """
    Admin/Author endpoint: Generate games for a story
    Only story author or admin can generate games
    """
    story_id = request.data.get('story_id')
    
    if not story_id:
        return Response(
            {'error': 'story_id is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    story = get_object_or_404(Story, id=story_id)
    
    # Check permissions
    if story.author != request.user and not request.user.is_staff:
        return Response(
            {'error': 'Only the story author or admin can generate games'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    if not story.is_published:
        return Response(
            {'error': 'Story must be published to generate games'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Check if games already exist
    existing_games = StoryGame.objects.filter(story=story, is_active=True)
    if existing_games.exists():
        return Response({
            'message': 'Games already exist for this story',
            'games': {
                game.game_type: {
                    'id': game.id,
                    'questions_count': game.get_questions_count()
                }
                for game in existing_games
            }
        }, status=status.HTTP_200_OK)
    
    # Generate games
    result = GameGenerationService.generate_games_for_story(story)
    
    if 'error' in result:
        return Response(result, status=status.HTTP_400_BAD_REQUEST)
    
    return Response({
        'message': 'Games generated successfully',
        'games': {
            game_type: {
                'id': game.id,
                'questions_count': game.get_questions_count()
            }
            for game_type, game in result.items()
        }
    }, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@jwt_required
def game_attempt_detail(request, attempt_id):
    """
    Get detailed information about a game attempt
    """
    attempt = get_object_or_404(
        GameAttempt, 
        id=attempt_id, 
        user=request.user
    )
    
    answers = GameAnswer.objects.filter(attempt=attempt).select_related('question')
    
    answers_data = []
    for answer in answers:
        answers_data.append({
            'question': answer.question.question_text,
            'user_answer': answer.user_answer,
            'correct_answer': answer.question.correct_answer,
            'is_correct': answer.is_correct,
            'points_earned': answer.points_earned,
            'explanation': answer.question.explanation
        })
    
    return Response({
        'attempt_id': attempt.id,
        'game_type': attempt.game.get_game_type_display(),
        'story_title': attempt.game.story.title,
        'score_percentage': attempt.score_percentage,
        'passed': attempt.passed,
        'correct_answers': attempt.correct_answers,
        'total_questions': attempt.total_questions,
        'total_points': attempt.total_points,
        'max_points': attempt.max_points,
        'xp_earned': attempt.xp_earned,
        'time_taken_seconds': attempt.time_taken_seconds,
        'started_at': attempt.started_at,
        'completed_at': attempt.completed_at,
        'answers': answers_data
    })
