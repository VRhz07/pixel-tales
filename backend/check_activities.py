import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'storybookapi.settings')
django.setup()

from storybook.models import Story, Like, Comment, SavedStory, User, Friendship
from django.db.models import Q

# Get user 5
user = User.objects.get(id=5)

print('=== USER 5 STORIES ===')
my_stories = Story.objects.filter(author=user)
print(f'Total stories by user 5: {my_stories.count()}')
print(f'Published stories: {my_stories.filter(is_published=True).count()}')

print('\n=== LIKES ON USER 5 STORIES ===')
likes = Like.objects.filter(story__author=user).exclude(user=user)
print(f'Total likes on user 5 stories (excluding self): {likes.count()}')
for like in likes[:5]:
    print(f'  - {like.user.username} liked "{like.story.title}" at {like.date_created}')

print('\n=== COMMENTS ON USER 5 STORIES ===')
comments = Comment.objects.filter(story__author=user).exclude(author=user)
print(f'Total comments on user 5 stories (excluding self): {comments.count()}')
for comment in comments[:5]:
    print(f'  - {comment.author.username} commented on "{comment.story.title}" at {comment.date_created}')

print('\n=== SAVED STORIES ===')
try:
    saves = SavedStory.objects.filter(story__author=user).exclude(user=user)
    print(f'Total saves on user 5 stories (excluding self): {saves.count()}')
    for save in saves[:5]:
        print(f'  - {save.user.username} saved "{save.story.title}" at {save.date_created}')
except Exception as e:
    print(f'Error fetching saves: {e}')

print('\n=== FRIEND PUBLISHED STORIES ===')
friendships = Friendship.objects.filter(
    Q(sender=user, status='accepted') | Q(receiver=user, status='accepted')
)
friend_ids = [f.sender_id if f.receiver_id == user.id else f.receiver_id for f in friendships]
print(f'User 5 has {len(friend_ids)} friends: {friend_ids}')

friend_stories = Story.objects.filter(author_id__in=friend_ids, is_published=True).order_by('-date_created')[:5]
print(f'Recent published stories from friends: {friend_stories.count()}')
for story in friend_stories:
    print(f'  - {story.author.username} published "{story.title}" at {story.date_created}')

print('\n=== TOTAL ACTIVITIES THAT SHOULD SHOW ===')
total = likes.count() + comments.count() + friend_stories.count()
try:
    total += saves.count()
except:
    pass
print(f'Total activities: {total}')
