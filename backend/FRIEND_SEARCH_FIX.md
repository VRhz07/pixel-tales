# Friend Search 500 Error Fix

## Problem Identified
When searching for friends on DigitalOcean, the `/api/users/search/` endpoint returns a **500 Internal Server Error**.

### Root Cause
The `search_users` function in `backend/storybook/views.py` (line 947) tries to filter users with:
```python
users_query = users_query.exclude(profile__user_type='parent')
```

This query fails when:
1. Some users don't have a UserProfile created
2. The database query tries to join the User and UserProfile tables
3. Users without profiles cause the query to fail

## Solution
Add proper error handling and use Q objects to handle missing profiles gracefully.

### Changes Needed in `backend/storybook/views.py`

Replace the `search_users` function (lines 914-989) with this fixed version:

```python
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def search_users(request):
    """Search for users by name or username. Returns all users (friends and non-friends) with their relationship status."""
    try:
        query = request.GET.get('q', '').strip()
        offset = int(request.GET.get('offset', 0))
        limit = int(request.GET.get('limit', 10))
        
        # Get current user's friends and pending requests first
        friend_ids = set()
        pending_sent_ids = set()
        pending_received_ids = set()
        
        friendships = Friendship.objects.filter(
            Q(sender=request.user) | Q(receiver=request.user)
        )
        
        for friendship in friendships:
            if friendship.status == 'accepted':
                friend_ids.add(friendship.sender_id if friendship.receiver_id == request.user.id else friendship.receiver_id)
            elif friendship.status == 'pending':
                if friendship.sender_id == request.user.id:
                    pending_sent_ids.add(friendship.receiver_id)
                else:
                    pending_received_ids.add(friendship.sender_id)
        
        # Build base query - exclude current user, admins/staff, and parent accounts
        users_query = User.objects.exclude(id=request.user.id).select_related('profile')
        
        # Exclude admin and staff users
        users_query = users_query.exclude(is_staff=True).exclude(is_superuser=True)
        
        # Exclude parent accounts (only show child accounts) - handle missing profiles
        # Use Q objects to safely exclude parents OR users without profiles
        from django.db.models import Q as QueryQ
        users_query = users_query.exclude(
            QueryQ(profile__isnull=False) & QueryQ(profile__user_type='parent')
        )
        
        # Apply search filter if query provided
        if query:
            users_query = users_query.filter(
                Q(username__icontains=query) | 
                Q(profile__display_name__icontains=query)
            )
        
        # Get total count before pagination
        total_count = users_query.count()
        
        # Apply pagination
        users = users_query[offset:offset + limit]
        
        # Build user list with relationship status
        user_list = []
        for user in users:
            try:
                # Safely access profile attributes
                user_data = {
                    'id': user.id,
                    'username': user.username,
                    'name': user.profile.display_name if hasattr(user, 'profile') and user.profile else user.username,
                    'avatar': user.profile.avatar_emoji if hasattr(user, 'profile') and user.profile and user.profile.avatar_emoji else '📚',
                    'bio': user.profile.bio if hasattr(user, 'profile') and user.profile and user.profile.bio else '',
                    'is_friend': user.id in friend_ids,
                    'request_sent': user.id in pending_sent_ids,
                    'request_received': user.id in pending_received_ids,
                    'story_count': user.stories.filter(is_published=True).count(),
                }
                user_list.append(user_data)
            except Exception as user_error:
                # Log the error but continue with other users
                print(f"⚠️ Error processing user {user.id}: {str(user_error)}")
                continue
        
        return Response({
            'success': True,
            'users': user_list,
            'total': total_count,
            'offset': offset,
            'limit': limit,
            'has_more': (offset + limit) < total_count
        })
        
    except Exception as e:
        import traceback
        print(f"❌ Error in search_users: {str(e)}")
        print(traceback.format_exc())
        return Response({
            'success': False,
            'error': 'Failed to search users',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
```

## Key Changes:
1. **Added try-catch wrapper** around the entire function to catch any unexpected errors
2. **Fixed the profile exclusion query** using `QueryQ(profile__isnull=False) & QueryQ(profile__user_type='parent')` to only exclude users who HAVE a profile AND are parents
3. **Added safe profile access** with multiple checks: `hasattr(user, 'profile') and user.profile`
4. **Added per-user error handling** to continue processing other users even if one fails
5. **Added detailed error logging** with traceback for debugging

## Testing
After deploying this fix to DigitalOcean:
1. Try searching for friends (empty search)
2. Try searching with a query
3. Check that the endpoint returns 200 OK instead of 500 Error

## Deployment
1. Update the code in `backend/storybook/views.py`
2. Commit and push to your repository
3. Deploy to DigitalOcean
4. Test the friend search functionality
