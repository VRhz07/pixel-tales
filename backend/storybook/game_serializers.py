"""
Serializers for Game Models
"""
from rest_framework import serializers
from .models import Story, StoryGame, GameQuestion, GameAttempt, GameAnswer


class GameQuestionSerializer(serializers.ModelSerializer):
    """Serializer for game questions (without revealing answers)"""
    
    class Meta:
        model = GameQuestion
        fields = ['id', 'question_type', 'question_text', 'options', 'order', 'hint', 'context', 'points']


class GameQuestionWithAnswerSerializer(serializers.ModelSerializer):
    """Serializer for game questions with answers (for review)"""
    
    class Meta:
        model = GameQuestion
        fields = '__all__'


class StoryGameSerializer(serializers.ModelSerializer):
    """Serializer for story games"""
    story_title = serializers.CharField(source='story.title', read_only=True)
    questions_count = serializers.SerializerMethodField()
    game_type_display = serializers.CharField(source='get_game_type_display', read_only=True)
    
    class Meta:
        model = StoryGame
        fields = ['id', 'story', 'story_title', 'game_type', 'game_type_display', 
                  'difficulty', 'questions_count', 'created_at']
    
    def get_questions_count(self, obj):
        return obj.get_questions_count()


class GameAnswerSerializer(serializers.ModelSerializer):
    """Serializer for game answers"""
    question_text = serializers.CharField(source='question.question_text', read_only=True)
    correct_answer = serializers.CharField(source='question.correct_answer', read_only=True)
    
    class Meta:
        model = GameAnswer
        fields = ['id', 'question_text', 'user_answer', 'correct_answer', 
                  'is_correct', 'points_earned', 'answered_at']


class GameAttemptSerializer(serializers.ModelSerializer):
    """Serializer for game attempts"""
    game_type = serializers.CharField(source='game.game_type', read_only=True)
    game_type_display = serializers.CharField(source='game.get_game_type_display', read_only=True)
    story_title = serializers.CharField(source='game.story.title', read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = GameAttempt
        fields = ['id', 'user', 'username', 'game', 'game_type', 'game_type_display',
                  'story_title', 'total_questions', 'correct_answers', 'total_points',
                  'max_points', 'score_percentage', 'passed', 'xp_earned', 
                  'time_taken_seconds', 'started_at', 'completed_at', 'is_completed']
        read_only_fields = ['score_percentage', 'passed']


class GameAttemptDetailSerializer(GameAttemptSerializer):
    """Detailed serializer with answers"""
    answers = GameAnswerSerializer(many=True, read_only=True)
    
    class Meta(GameAttemptSerializer.Meta):
        fields = GameAttemptSerializer.Meta.fields + ['answers']
