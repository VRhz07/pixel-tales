from django.core.management.base import BaseCommand
from storybook.models import Achievement
import json
import os

class Command(BaseCommand):
    help = 'Populate database with 100 dynamic achievements'

    def handle(self, *args, **kwargs):
        # Clear existing achievements
        Achievement.objects.all().delete()
        self.stdout.write('Cleared existing achievements')
        
        # Load achievements from JSON file
        json_path = os.path.join(os.path.dirname(__file__), 'achievements_data.json')
        with open(json_path, 'r', encoding='utf-8') as f:
            achievements = json.load(f)
        
        # Create achievements
        for ach in achievements:
            Achievement.objects.create(**ach)
        
        self.stdout.write(self.style.SUCCESS(f'Successfully created {len(achievements)} achievements'))
