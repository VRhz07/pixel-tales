import os, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'storybookapi.settings')
django.setup()

from storybook.models import Story

stories = Story.objects.filter(is_published=True)
print(f"Published stories with covers:\n")

for story in stories:
    has_cover = bool(story.cover_image)
    status = "✅" if has_cover else "❌"
    print(f"{status} {story.title}")
    if has_cover:
        print(f"   {story.cover_image[:80]}...")
