"""
Clean up old collaboration sessions with truncated IDs
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'storybookapi.settings')
django.setup()

from storybook.models import CollaborationSession, SessionParticipant

# Delete all sessions
session_count = CollaborationSession.objects.all().count()
participant_count = SessionParticipant.objects.all().count()

print(f"Found {session_count} sessions and {participant_count} participants")
print("Deleting...")

CollaborationSession.objects.all().delete()
SessionParticipant.objects.all().delete()

print("✅ Done! All old collaboration sessions deleted.")
print("You can now create a new session with full UUID.")
