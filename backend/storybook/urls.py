"""
URL configuration for Storybook API
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from .jwt_auth import CustomTokenObtainPairView, jwt_register, jwt_logout, jwt_user_profile, jwt_create_session, verify_email, resend_verification_code, verify_password, send_password_reset_code, verify_password_reset_code, reset_password, change_password, delete_account
from . import views, admin_views, admin_auth, admin_features, admin_profanity, ai_proxy_views, tts_views

# Create a router for ViewSets (we'll add these later)
router = DefaultRouter()

urlpatterns = [
    # Include router URLs
    path('', include(router.urls)),
    
    # Authentication endpoints
    path('auth/login/', CustomTokenObtainPairView.as_view(), name='jwt_login'),
    path('auth/register/', jwt_register, name='jwt_register'),
    path('auth/verify-email/', verify_email, name='verify_email'),
    path('auth/resend-verification/', resend_verification_code, name='resend_verification_code'),
    path('auth/verify-password/', verify_password, name='verify_password'),
    path('auth/password-reset/send/', send_password_reset_code, name='send_password_reset_code'),
    path('auth/password-reset/verify/', verify_password_reset_code, name='verify_password_reset_code'),
    path('auth/password-reset/reset/', reset_password, name='reset_password'),
    path('auth/change-password/', change_password, name='change_password'),
    path('auth/delete-account/', delete_account, name='delete_account'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='jwt_refresh'),
    path('auth/logout/', jwt_logout, name='jwt_logout'),
    path('auth/profile/', jwt_user_profile, name='jwt_user_profile'),
    path('auth/create-session/', jwt_create_session, name='jwt_create_session'),
    
    # User endpoints
    path('users/profile/', views.get_user_profile, name='get_user_profile'),
    path('users/profile/update/', views.update_user_profile, name='update_user_profile'),
    
    # Story endpoints
    path('stories/', views.story_list, name='story_list'),
    path('stories/create/', views.create_story, name='create_story'),
    path('stories/<int:story_id>/', views.story_detail, name='story_detail'),
    path('stories/<int:story_id>/stats/', views.story_stats, name='story_stats'),
    path('stories/<int:story_id>/update/', views.update_story, name='update_story'),
    path('stories/<int:story_id>/delete/', views.delete_story, name='delete_story'),
    path('stories/<int:story_id>/publish/', views.publish_story, name='publish_story'),
    path('stories/<int:story_id>/unpublish/', views.unpublish_story, name='unpublish_story'),
    path('stories/user/<int:user_id>/', views.user_stories, name='user_stories'),
    
    # Character endpoints
    path('characters/', views.character_list, name='character_list'),
    path('characters/create/', views.create_character, name='create_character'),
    path('characters/<int:character_id>/', views.character_detail, name='character_detail'),
    path('characters/<int:character_id>/update/', views.update_character, name='update_character'),
    path('characters/<int:character_id>/delete/', views.delete_character, name='delete_character'),
    
    # Comment endpoints
    path('stories/<int:story_id>/comments/', views.story_comments, name='story_comments'),
    path('stories/<int:story_id>/comments/create/', views.create_comment, name='create_comment'),
    
    # Like endpoints
    path('stories/<int:story_id>/like/', views.like_story, name='like_story'),
    
    # Save endpoints
    path('stories/<int:story_id>/save/', views.save_story, name='save_story'),
    path('stories/saved/', views.saved_stories, name='saved_stories'),
    
    # Rating endpoints
    path('stories/<int:story_id>/rate/', views.rate_story, name='rate_story'),
    
    # Achievement endpoints
    path('achievements/', views.achievement_list, name='achievement_list'),
    path('achievements/user/', views.user_achievements, name='user_achievements'),
    path('achievements/progress/', views.achievement_progress, name='achievement_progress'),
    
    # Notification endpoints
    path('notifications/', views.notification_list, name='notification_list'),
    path('notifications/<int:notification_id>/read/', views.mark_notification_read, name='mark_notification_read'),
    path('notifications/mark-all-read/', views.mark_all_notifications_read, name='mark_all_notifications_read'),
    
    # Friendship endpoints (if needed)
    path('users/search/', views.search_users, name='search_users'),
    path('friends/', views.friend_list, name='friend_list'),
    path('friends/requests/', views.friend_requests, name='friend_requests'),
    path('friends/send-request/', views.send_friend_request, name='send_friend_request'),
    path('friends/respond/<int:request_id>/', views.respond_friend_request, name='respond_friend_request'),
    path('friends/unfriend/<int:user_id>/', views.unfriend_user, name='unfriend_user'),
    
    # Messaging endpoints
    path('messages/conversations/', views.get_conversations, name='get_conversations'),
    path('messages/<int:user_id>/', views.get_messages, name='get_messages'),
    path('messages/send/', views.send_message, name='send_message'),
    path('messages/mark-read/<int:user_id>/', views.mark_messages_read, name='mark_messages_read'),
    path('messages/<int:message_id>/delete/', views.delete_message, name='delete_message'),
    path('messages/<int:message_id>/edit/', views.edit_message, name='edit_message'),
    
    # Comment endpoints
    path('comments/<int:comment_id>/delete/', views.delete_comment, name='delete_comment'),
    path('comments/<int:comment_id>/edit/', views.edit_comment, name='edit_comment'),
    
    # Social features endpoints
    path('social/activity-feed/', views.get_activity_feed, name='get_activity_feed'),
    path('social/leaderboard/', views.get_leaderboard, name='get_leaderboard'),
    path('social/profile/<int:user_id>/', views.get_friend_profile, name='get_friend_profile'),
    
    # Collaborative drawing endpoints
    path('collaborate/create/', views.create_collaboration_session, name='create_collaboration_session'),
    path('collaborate/join-by-code/', views.join_session_by_code, name='join_session_by_code'),
    path('collaborate/sessions/list/', views.list_user_sessions, name='list_user_sessions'),
    
    # Collaboration invitation endpoints (MUST come before <session_id> pattern)
    path('collaborate/invite/', views.send_collaboration_invite, name='send_collaboration_invite'),
    path('collaborate/invites/', views.get_collaboration_invites, name='get_collaboration_invites'),
    path('collaborate/invites/<int:notification_id>/respond/', views.respond_to_collaboration_invite, name='respond_to_collaboration_invite'),
    
    # Session-specific endpoints (MUST come after specific paths)
    path('collaborate/<str:session_id>/', views.get_collaboration_session, name='get_collaboration_session'),
    path('collaborate/<str:session_id>/start/', views.start_collaboration_session, name='start_collaboration_session'),
    path('collaborate/<str:session_id>/vote/', views.initiate_collaboration_vote, name='initiate_collaboration_vote'),
    path('collaborate/<str:session_id>/vote/cast/', views.cast_collaboration_vote, name='cast_collaboration_vote'),
    path('collaborate/<str:session_id>/end/', views.end_collaboration_session, name='end_collaboration_session'),
    path('collaborate/sessions/<str:session_id>/participants/', views.get_collaboration_participants, name='get_collaboration_participants'),
    
    # New Collaboration REST API Endpoints (Phase 1)
    path('collaborate/<str:session_id>/kick/', views.kick_participant, name='kick_participant'),
    path('collaborate/<str:session_id>/presence/', views.get_session_presence, name='get_session_presence'),
    path('collaborate/<str:session_id>/draft/update/', views.update_session_draft, name='update_session_draft'),
    path('collaborate/<str:session_id>/draft/', views.get_session_draft, name='get_session_draft'),
    path('collaborate/<str:session_id>/lobby/close/', views.close_lobby, name='close_lobby'),
    path('collaborate/<str:session_id>/operations/', views.get_session_operations, name='get_session_operations'),
    path('collaborate/invites/list/', views.get_collaboration_invites_new, name='get_collaboration_invites_new'),
    path('collaborate/invites/<int:invite_id>/respond/', views.respond_to_collaboration_invite_new, name='respond_to_collaboration_invite_new'),
    path('collaborate/sessions/user/', views.get_user_sessions, name='get_user_sessions'),
    path('collaborate/stories/', views.get_collaborative_stories, name='get_collaborative_stories'),
    path('stories/<int:story_id>/publish-collaborative/', views.publish_collaborative_story, name='publish_collaborative_story'),
    
    # Admin authentication endpoints (separate from user auth)
    path('admin/auth/login/', admin_auth.admin_login, name='admin_login'),
    path('admin/auth/verify/', admin_auth.admin_verify_token, name='admin_verify_token'),
    path('admin/auth/logout/', admin_auth.admin_logout, name='admin_logout'),
    
    # Admin endpoints - Dashboard & Users
    path('admin/dashboard/stats/', admin_views.admin_dashboard_stats, name='admin_dashboard_stats'),
    path('admin/users/', admin_views.admin_list_users, name='admin_list_users'),
    path('admin/users/archived/', admin_views.admin_list_archived_users, name='admin_list_archived_users'),
    path('admin/users/<int:user_id>/', admin_views.admin_get_user, name='admin_get_user'),
    path('admin/users/<int:user_id>/update/', admin_views.admin_update_user, name='admin_update_user'),
    path('admin/users/<int:user_id>/delete/', admin_views.admin_delete_user, name='admin_delete_user'),
    path('admin/users/<int:user_id>/restore/', admin_views.admin_restore_user, name='admin_restore_user'),
    path('admin/relationships/add/', admin_views.admin_add_parent_child, name='admin_add_parent_child'),
    path('admin/relationships/<int:parent_id>/<int:child_id>/remove/', admin_views.admin_remove_parent_child, name='admin_remove_parent_child'),
    
    # Admin endpoints - Content Moderation
    path('admin/moderation/flagged/', admin_features.get_flagged_content, name='get_flagged_content'),
    path('admin/moderation/story/<int:story_id>/', admin_features.moderate_story, name='moderate_story'),
    path('admin/moderation/comment/<int:comment_id>/', admin_features.delete_comment, name='delete_comment'),
    
    # Admin endpoints - User Management
    path('admin/users/<int:user_id>/suspend/', admin_features.suspend_user, name='suspend_user'),
    path('admin/users/<int:user_id>/unsuspend/', admin_features.unsuspend_user, name='unsuspend_user'),
    path('admin/users/<int:user_id>/activity/', admin_features.get_user_activity, name='get_user_activity'),
    
    # Admin endpoints - Analytics
    path('admin/analytics/', admin_features.get_platform_analytics, name='get_platform_analytics'),
    path('admin/system/health/', admin_features.get_system_health, name='get_system_health'),
    
    # Admin endpoints - System Management
    path('admin/announcement/', admin_features.send_announcement, name='send_announcement'),
    path('admin/export/', admin_features.export_data, name='export_data'),
    
    # Admin endpoints - Profanity Management
    path('admin/profanity/', admin_profanity.get_profanity_words, name='get_profanity_words'),
    path('admin/profanity/add/', admin_profanity.add_profanity_word, name='add_profanity_word'),
    path('admin/profanity/<int:word_id>/update/', admin_profanity.update_profanity_word, name='update_profanity_word'),
    path('admin/profanity/<int:word_id>/delete/', admin_profanity.delete_profanity_word, name='delete_profanity_word'),
    path('admin/profanity/bulk-add/', admin_profanity.bulk_add_profanity_words, name='bulk_add_profanity_words'),
    path('admin/profanity/stats/', admin_profanity.get_profanity_stats, name='get_profanity_stats'),
    path('admin/profanity/import/', admin_profanity.import_profanity_words_from_file, name='import_profanity_words_from_file'),
    
    # Public endpoint for frontend profanity filter
    path('profanity/active/', admin_profanity.get_active_profanity_words, name='get_active_profanity_words'),
    
    # AI Service Proxy Endpoints (Secure - API keys stay on backend)
    path('ai/gemini/generate-story/', ai_proxy_views.generate_story_with_gemini, name='generate_story_with_gemini'),
    path('ai/gemini/generate-character/', ai_proxy_views.generate_character_with_gemini, name='generate_character_with_gemini'),
    path('ai/gemini/analyze-image/', ai_proxy_views.analyze_image_with_gemini, name='analyze_image_with_gemini'),
    path('ai/ocr/process/', ai_proxy_views.ocr_image, name='ocr_image'),
    path('ai/status/', ai_proxy_views.check_ai_service_status, name='check_ai_service_status'),
    
    # Text-to-Speech Endpoints
    path('tts/synthesize/', tts_views.synthesize_speech, name='synthesize_speech'),
    path('tts/voices/', tts_views.get_available_voices, name='get_available_voices'),
    path('tts/status/', tts_views.check_tts_status, name='check_tts_status'),
    
    # Parent/Teacher Dashboard endpoints
    path('parent/children/', views.get_parent_children, name='get_parent_children'),
    path('parent/children/create/', views.create_child_account, name='create_child_account'),
    path('parent/children/add/', views.add_child_relationship, name='add_child_relationship'),
    path('parent/children/<int:child_id>/remove/', views.remove_child_relationship, name='remove_child_relationship'),
    path('parent/children/<int:child_id>/stats/', views.get_child_statistics, name='get_child_statistics'),
    path('parent/children/<int:child_id>/activities/', views.get_child_activities, name='get_child_activities'),
    path('parent/children/<int:child_id>/goals/', views.get_child_goals, name='get_child_goals'),
    path('parent/children/<int:child_id>/analytics/', views.get_child_analytics, name='get_child_analytics'),
    path('parent/children/<int:child_id>/stories/', views.get_child_stories, name='get_child_stories'),
    path('parent/children/<int:child_id>/switch-view/', views.switch_to_child_view, name='switch_to_child_view'),
    path('teacher/students/', views.get_teacher_students, name='get_teacher_students'),
    path('teacher/students/<int:student_id>/stats/', views.get_child_statistics, name='get_student_statistics'),
]
