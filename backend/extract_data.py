import os
import django
import json

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "storybookapi.settings")
django.setup()

from storybook.models import Story, StoryGame, GameQuestion
from storybook.serializers import StorySerializer
from storybook.game_serializers import StoryGameSerializer, GameQuestionSerializer

def main():
    print("Starting data extraction...")
    
    # Get 5 published stories
    stories = Story.objects.filter(is_published=True)[:5]
    
    # 1. Bundled Stories
    # Need to mock the request context for serializers
    from rest_framework.request import Request
    from django.test import RequestFactory
    factory = RequestFactory()
    request = factory.get('/')
    
    # API usually returns a paginated structure or a list of StorySerializer objects
    # Let's use StorySerializer since that has full details (content, canvas_data)
    story_data = StorySerializer(stories, many=True, context={'request': Request(request)}).data
    
    bundled_stories = {
        "results": story_data
    }
    
    # 2. Bundled Games
    bundled_games = {
        "story_games": {},
        "games_data": {}
    }
    
    for story in stories:
        games = StoryGame.objects.filter(story=story)
        games_data = StoryGameSerializer(games, many=True).data
        
        bundled_games["story_games"][str(story.id)] = {
            "story_title": story.title,
            "games": games_data
        }
        
        for game in games:
            questions = GameQuestion.objects.filter(game=game).order_by('order')
            questions_data = GameQuestionSerializer(questions, many=True).data
            
            bundled_games["games_data"][str(game.id)] = {
                "id": game.id,
                "game_type": game.game_type,
                "questions": questions_data
            }

    # Write files
    frontend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'frontend', 'public', 'data'))
    os.makedirs(frontend_path, exist_ok=True)
    
    with open(os.path.join(frontend_path, 'bundled_stories.json'), 'w', encoding='utf-8') as f:
        json.dump(bundled_stories, f, ensure_ascii=False, indent=2)
        
    with open(os.path.join(frontend_path, 'bundled_games.json'), 'w', encoding='utf-8') as f:
        json.dump(bundled_games, f, ensure_ascii=False, indent=2)
        
    print(f"Extracted {len(stories)} stories and their games.")
    print("Done!")

if __name__ == "__main__":
    main()
