from django.test import TestCase
from django.contrib.auth.models import User
from storybook.models import CollaborationSession, SessionParticipant, DrawingOperation

class CollaborationTestCase(TestCase):
    def setUp(self):
        self.host = User.objects.create_user(username='collab_host', password='password123')
        self.participant = User.objects.create_user(username='collab_participant', password='password123')

    def test_create_session(self):
        """Test creating a collaboration session and joining as participant."""
        session = CollaborationSession.objects.create(
            session_id="test_session_123",
            join_code="TEST1",
            host=self.host,
            canvas_name="Test Collaborative Canvas"
        )
        
        # Host joins automatically
        SessionParticipant.objects.create(
            session=session,
            user=self.host,
            role="host"
        )
        
        # Participant joins
        SessionParticipant.objects.create(
            session=session,
            user=self.participant,
            role="participant"
        )
        
        self.assertEqual(session.participants.count(), 2)
        self.assertTrue(session.can_join())

    def test_drawing_operation(self):
        """Test that drawing operations are recorded."""
        session = CollaborationSession.objects.create(
            session_id="test_session_draw",
            host=self.host
        )
        
        operation = DrawingOperation.objects.create(
            session=session,
            user=self.host,
            operation_type="path",
            operation_data={"points": [0,0, 10,10]}
        )
        
        self.assertEqual(session.operations.count(), 1)
        self.assertEqual(operation.operation_type, "path")
