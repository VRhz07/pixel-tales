"""
Game Generation Service
Automatically generates educational games from story content using AI
"""
import json
import re
from django.contrib.auth.models import User
from django.db import models
from .models import Story, StoryGame, GameQuestion, GameAttempt, GameAnswer


class GameGenerationService:
    """
    Service for generating educational games from stories
    Uses AI to create comprehension questions
    """
    
    @classmethod
    def validate_story_for_games(cls, story):
        """
        Validate if a story has enough content to generate games
        Returns (is_valid: bool, error_message: str)
        """
        import json
        
        # Parse content if it's a string
        try:
            if isinstance(story.content, str):
                content = json.loads(story.content)
            else:
                content = story.content
        except (json.JSONDecodeError, TypeError):
            return False, "Invalid story content format"
        
        # Get pages
        pages = content.get('pages', []) if isinstance(content, dict) else []
        
        # Check minimum page count
        if len(pages) < 5:
            return False, f"Story must have at least 5 pages (current: {len(pages)})"
        
        # Check that each page has text content
        pages_with_text = 0
        for page in pages:
            text = page.get('text', '').strip()
            if text and len(text) > 10:  # At least 10 characters
                pages_with_text += 1
        
        if pages_with_text < 5:
            return False, f"At least 5 pages must have meaningful text content (current: {pages_with_text})"
        
        return True, ""
    
    @classmethod
    def generate_games_for_story(cls, story):
        """
        Generate all game types for a published story
        
        Args:
            story: Story object
            
        Returns:
            dict with created games
        """
        if not story.is_published:
            return {'error': 'Story must be published to generate games'}
        
        # Extract story content
        story_text = cls._extract_story_text(story)
        
        if not story_text or len(story_text) < 100:
            return {'error': 'Story content too short to generate games'}
        
        created_games = {}
        
        # Generate quiz game
        quiz_game = cls._generate_quiz_game(story, story_text)
        if quiz_game:
            created_games['quiz'] = quiz_game
        
        # Generate fill in the blanks game
        fill_blanks_game = cls._generate_fill_blanks_game(story, story_text)
        if fill_blanks_game:
            created_games['fill_blanks'] = fill_blanks_game
        
        # Generate word search game
        word_search_game = cls._generate_word_search_game(story, story_text)
        if word_search_game:
            created_games['word_search'] = word_search_game
        
        return created_games
    
    @classmethod
    def _extract_story_text(cls, story):
        """Extract all text content from story"""
        import json
        import re
        
        text_parts = []
        
        # Parse story content (it's JSON with pages)
        try:
            if isinstance(story.content, str):
                content = json.loads(story.content)
            else:
                content = story.content
            
            # Extract text from pages
            if isinstance(content, dict) and 'pages' in content:
                for page in content['pages']:
                    if isinstance(page, dict) and 'text' in page:
                        text = page['text'].strip()
                        if text:
                            text_parts.append(text)
            elif isinstance(content, str):
                text_parts.append(content)
        except (json.JSONDecodeError, TypeError):
            # Fallback to raw content
            if story.content:
                text_parts.append(str(story.content))
        
        # Add summary if available
        if story.summary:
            text_parts.append(story.summary)
        
        # Join and clean up text
        full_text = ' '.join(text_parts)
        
        # Remove page break markers
        full_text = re.sub(r'---PAGE BREAK---', '', full_text)
        
        # Clean up extra whitespace
        full_text = re.sub(r'\s+', ' ', full_text).strip()
        
        return full_text
    
    @classmethod
    def _generate_quiz_game(cls, story, story_text):
        """Generate multiple choice quiz game"""
        try:
            # Create or get game
            game, created = StoryGame.objects.get_or_create(
                story=story,
                game_type='quiz',
                defaults={'difficulty': 'medium'}
            )
            
            # If game already exists with questions, return it
            if not created and game.questions.filter(is_active=True).count() >= 5:
                return game
            
            # Generate 5 quiz questions using AI or template
            questions_data = cls._generate_quiz_questions(story, story_text)
            
            # Create questions
            for idx, q_data in enumerate(questions_data[:5]):
                GameQuestion.objects.create(
                    game=game,
                    question_type='multiple_choice',
                    question_text=q_data['question'],
                    correct_answer=q_data['correct_answer'],
                    options=q_data['options'],
                    order=idx + 1,
                    explanation=q_data.get('explanation', ''),
                    points=10
                )
            
            return game
            
        except Exception as e:
            print(f"Error generating quiz game: {str(e)}")
            return None
    
    @classmethod
    def _generate_fill_blanks_game(cls, story, story_text):
        """Generate fill in the blanks game"""
        try:
            # Create or get game
            game, created = StoryGame.objects.get_or_create(
                story=story,
                game_type='fill_blanks',
                defaults={'difficulty': 'medium'}
            )
            
            # If game already exists with questions, return it
            if not created and game.questions.filter(is_active=True).count() >= 5:
                return game
            
            # Generate fill-in-the-blank questions
            questions_data = cls._generate_fill_blank_questions(story, story_text)
            
            # Create questions
            for idx, q_data in enumerate(questions_data[:5]):
                GameQuestion.objects.create(
                    game=game,
                    question_type='fill_blank',
                    question_text=q_data['prompt'],
                    correct_answer=q_data['answer'],
                    options=q_data.get('options', []),  # Add options here
                    context=q_data['full_sentence'],
                    order=idx + 1,
                    hint=q_data.get('hint', ''),
                    points=10
                )
            
            return game
            
        except Exception as e:
            print(f"Error generating fill blanks game: {str(e)}")
            return None
    
    @classmethod
    def _generate_word_search_game(cls, story, story_text):
        """Generate word search game"""
        try:
            # Create or get game
            game, created = StoryGame.objects.get_or_create(
                story=story,
                game_type='word_search',
                defaults={'difficulty': 'medium'}
            )
            
            # If game already exists with questions, return it
            if not created and game.questions.filter(is_active=True).count() >= 1:
                return game
            
            # Generate word search grid and words
            word_search_data = cls._generate_word_search_grid(story, story_text)
            
            if not word_search_data:
                return None
            
            # Create a single question for the word search
            # The grid and words list will be stored in the question
            GameQuestion.objects.create(
                game=game,
                question_type='word_search',
                question_text='Find all the hidden words from the story in the grid',
                correct_answer=','.join(word_search_data['words']),  # Store words as comma-separated
                options=word_search_data['grid'],  # Store grid as list in options
                context=f"Words to find: {', '.join(word_search_data['words'])}",
                order=1,
                hint='Words can be horizontal, vertical, or diagonal',
                points=50
            )
            
            return game
            
        except Exception as e:
            print(f"Error generating word search game: {str(e)}")
            return None
    
    @classmethod
    def _generate_quiz_questions(cls, story, story_text):
        """
        Generate quiz questions from story content
        This is a template-based approach. Can be enhanced with AI later.
        """
        questions = []
        
        # Extract key information from story
        sentences = [s.strip() for s in story_text.split('.') if len(s.strip()) > 20]
        
        # Template questions about the story
        if story.title:
            questions.append({
                'question': 'What is the title of this story?',
                'correct_answer': story.title,
                'options': cls._generate_options_for_title(story.title),
                'explanation': f'The story is titled "{story.title}".'
            })
        
        # Category-based question
        if story.category:
            category_display = dict(story.CATEGORY_CHOICES).get(story.category, story.category)
            questions.append({
                'question': 'What type of story is this?',
                'correct_answer': category_display,
                'options': cls._generate_category_options(category_display),
                'explanation': f'This is a {category_display} story.'
            })
        
        # Content-based questions (extract from text)
        content_questions = cls._extract_content_questions(sentences, story)
        questions.extend(content_questions)
        
        return questions[:5]  # Return max 5 questions
    
    @classmethod
    def _generate_fill_blank_questions(cls, story, story_text):
        """Generate fill-in-the-blank questions from story with multiple choice options"""
        questions = []
        
        # Split into sentences
        sentences = [s.strip() + '.' for s in story_text.split('.') if len(s.strip()) > 20]
        
        # Collect all words for generating wrong options
        all_words = set()
        for sentence in sentences:
            words = [w.strip('.,!?').lower() for w in sentence.split() if len(w) > 4 and w.isalpha()]
            all_words.update(words)
        
        # Select interesting sentences (those with important words)
        for sentence in sentences[:10]:
            # Find important words (nouns, adjectives, verbs)
            words = sentence.split()
            if len(words) < 5:
                continue
            
            # Select a word to blank out (prefer longer words)
            important_words = [w for w in words if len(w) > 4 and w.isalpha()]
            if not important_words:
                continue
            
            word_to_blank = important_words[len(important_words) // 2]  # Pick middle word
            correct_answer = word_to_blank.strip('.,!?')
            blanked_sentence = sentence.replace(word_to_blank, '______')
            
            # Generate wrong options (similar length words from the story)
            wrong_options = []
            similar_words = [w for w in all_words if abs(len(w) - len(correct_answer)) <= 2 and w.lower() != correct_answer.lower()]
            
            # Add some generic wrong options if not enough from story
            generic_options = ['happy', 'quickly', 'beautiful', 'carefully', 'suddenly', 'amazing', 'wonderful', 'terrible']
            similar_words.extend([w for w in generic_options if w.lower() != correct_answer.lower()])
            
            # Select 3 wrong options
            import random
            if len(similar_words) >= 3:
                wrong_options = random.sample(list(similar_words)[:10], min(3, len(similar_words)))
            else:
                wrong_options = list(similar_words)
                while len(wrong_options) < 3:
                    wrong_options.append(f'option{len(wrong_options) + 1}')
            
            # Create options list with correct answer
            options = [correct_answer] + wrong_options
            random.shuffle(options)
            
            questions.append({
                'prompt': blanked_sentence,
                'answer': correct_answer,
                'options': options,  # Add multiple choice options
                'full_sentence': sentence,
                'hint': f'The word has {len(correct_answer)} letters'
            })
            
            if len(questions) >= 5:
                break
        
        return questions[:5]
    
    @classmethod
    def _generate_word_search_grid(cls, story, story_text):
        """Generate word search grid with story words"""
        import random
        
        # Extract interesting words from story (4-8 letters)
        words = re.findall(r'\b[a-zA-Z]{4,8}\b', story_text)
        unique_words = list(set([w.upper() for w in words]))
        
        # Filter out common words
        common_words = {'THERE', 'THEIR', 'WHERE', 'WHICH', 'THESE', 'THOSE', 'WOULD', 'COULD', 'SHOULD', 'ABOUT', 'OTHER', 'WHAT', 'WHEN', 'WITH', 'HAVE', 'FROM', 'THEY', 'BEEN', 'WERE', 'THAT', 'THIS'}
        interesting_words = [w for w in unique_words if w not in common_words]
        
        # Select 6-8 words for the puzzle
        if len(interesting_words) < 6:
            return None
        
        selected_words = random.sample(interesting_words, min(8, len(interesting_words)))
        
        # Create a 12x12 grid
        grid_size = 12
        grid = [['_' for _ in range(grid_size)] for _ in range(grid_size)]
        
        placed_words = []
        
        # Try to place each word in the grid
        for word in selected_words:
            placed = False
            attempts = 0
            max_attempts = 50
            
            while not placed and attempts < max_attempts:
                attempts += 1
                
                # Random direction: 0=horizontal, 1=vertical, 2=diagonal
                direction = random.randint(0, 2)
                
                if direction == 0:  # Horizontal
                    if len(word) <= grid_size:
                        row = random.randint(0, grid_size - 1)
                        col = random.randint(0, grid_size - len(word))
                        
                        # Check if space is available
                        can_place = all(grid[row][col + i] == '_' or grid[row][col + i] == word[i] 
                                      for i in range(len(word)))
                        
                        if can_place:
                            for i, letter in enumerate(word):
                                grid[row][col + i] = letter
                            placed = True
                            placed_words.append(word)
                
                elif direction == 1:  # Vertical
                    if len(word) <= grid_size:
                        row = random.randint(0, grid_size - len(word))
                        col = random.randint(0, grid_size - 1)
                        
                        # Check if space is available
                        can_place = all(grid[row + i][col] == '_' or grid[row + i][col] == word[i] 
                                      for i in range(len(word)))
                        
                        if can_place:
                            for i, letter in enumerate(word):
                                grid[row + i][col] = letter
                            placed = True
                            placed_words.append(word)
                
                elif direction == 2:  # Diagonal
                    if len(word) <= grid_size:
                        row = random.randint(0, grid_size - len(word))
                        col = random.randint(0, grid_size - len(word))
                        
                        # Check if space is available
                        can_place = all(grid[row + i][col + i] == '_' or grid[row + i][col + i] == word[i] 
                                      for i in range(len(word)))
                        
                        if can_place:
                            for i, letter in enumerate(word):
                                grid[row + i][col + i] = letter
                            placed = True
                            placed_words.append(word)
        
        # Fill empty spaces with random letters
        letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
        for i in range(grid_size):
            for j in range(grid_size):
                if grid[i][j] == '_':
                    grid[i][j] = random.choice(letters)
        
        # Convert grid to list of strings for storage
        grid_strings = [''.join(row) for row in grid]
        
        if len(placed_words) < 5:
            return None
        
        return {
            'grid': grid_strings,
            'words': placed_words[:8]  # Return up to 8 words
        }
    
    @classmethod
    def _generate_options_for_title(cls, correct_title):
        """Generate plausible wrong options for title question"""
        # This is a simple implementation
        # In production, you'd use more sophisticated methods
        options = [correct_title]
        
        # Add some generic story titles as options
        generic_titles = [
            'The Adventure Begins',
            'A Magical Journey',
            'The Secret Discovery',
            'The Brave Hero',
            'Mystery at Midnight',
            'The Lost Treasure'
        ]
        
        for title in generic_titles:
            if title != correct_title and len(options) < 4:
                options.append(title)
        
        return options
    
    @classmethod
    def _generate_category_options(cls, correct_category):
        """Generate options for category question"""
        options = [correct_category]
        
        all_categories = [
            'Adventure', 'Fantasy', 'Mystery', 'Action',
            'Friendship', 'Comedy', 'Educational'
        ]
        
        for cat in all_categories:
            if cat != correct_category and len(options) < 4:
                options.append(cat)
        
        return options
    
    @classmethod
    def _extract_content_questions(cls, sentences, story):
        """Extract comprehension questions from content"""
        questions = []
        
        # This is a template. Ideally, use AI for better question generation
        if len(sentences) > 2:
            # "What happened in the story?"
            questions.append({
                'question': 'What is the main theme of the story?',
                'correct_answer': 'Adventure and friendship',  # Default
                'options': [
                    'Adventure and friendship',
                    'Mystery and suspense',
                    'Love and romance',
                    'Fear and danger'
                ],
                'explanation': 'The story explores themes of adventure and friendship.'
            })
        
        return questions
    
    @classmethod
    def get_game_for_story(cls, story, game_type):
        """Get a specific game type for a story"""
        try:
            return StoryGame.objects.get(
                story=story,
                game_type=game_type,
                is_active=True
            )
        except StoryGame.DoesNotExist:
            return None
    
    @classmethod
    def start_game_attempt(cls, user, game):
        """Start a new game attempt for a user"""
        questions_count = game.questions.filter(is_active=True).count()
        max_points = questions_count * 10  # 10 points per question
        
        attempt = GameAttempt.objects.create(
            user=user,
            game=game,
            total_questions=questions_count,
            max_points=max_points
        )
        
        return attempt
    
    @classmethod
    def submit_answer(cls, attempt, question, user_answer):
        """Submit an answer for a question"""
        # Check if already answered
        if GameAnswer.objects.filter(attempt=attempt, question=question).exists():
            return {'error': 'Question already answered'}
        
        # Check answer
        is_correct, feedback = question.check_answer(user_answer)
        
        # Record answer
        points_earned = question.points if is_correct else 0
        
        answer = GameAnswer.objects.create(
            attempt=attempt,
            question=question,
            user_answer=user_answer,
            is_correct=is_correct,
            points_earned=points_earned
        )
        
        # Update attempt stats
        attempt.total_points += points_earned
        if is_correct:
            attempt.correct_answers += 1
        attempt.save()
        
        return {
            'is_correct': is_correct,
            'feedback': feedback,
            'points_earned': points_earned,
            'total_points': attempt.total_points
        }
    
    @classmethod
    def complete_game_attempt(cls, attempt):
        """Complete a game attempt and award rewards"""
        attempt.complete()
        
        return {
            'score_percentage': attempt.score_percentage,
            'passed': attempt.passed,
            'xp_earned': attempt.xp_earned,
            'correct_answers': attempt.correct_answers,
            'total_questions': attempt.total_questions
        }
    
    @classmethod
    def get_user_game_stats(cls, user):
        """Get user's overall game statistics"""
        from django.db.models import F
        
        attempts = GameAttempt.objects.filter(user=user, is_completed=True)
        
        if not attempts.exists():
            return {
                'games_played': 0,
                'average_score': 0,
                'total_xp_earned': 0,
                'perfect_scores': 0
            }
        
        total_attempts = attempts.count()
        avg_score = sum(a.score_percentage for a in attempts) / total_attempts
        total_xp = sum(a.xp_earned for a in attempts)
        perfect_scores = attempts.filter(correct_answers=F('total_questions')).count()
        
        return {
            'games_played': total_attempts,
            'average_score': round(avg_score, 1),
            'total_xp_earned': total_xp,
            'perfect_scores': perfect_scores
        }


# Shorthand functions
def generate_games(story):
    """Generate games for a story"""
    return GameGenerationService.generate_games_for_story(story)


def start_game(user, story, game_type):
    """Start a game for a user"""
    game = GameGenerationService.get_game_for_story(story, game_type)
    if not game:
        return None
    return GameGenerationService.start_game_attempt(user, game)
