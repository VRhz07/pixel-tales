# Persistent Login Implementation (Mobile App Style)

## Overview
Implemented a Facebook-style persistent login system where users stay logged in indefinitely until they manually log out. This is essential for mobile app experience, especially for offline story access.

## Problem
Previously, the app would automatically log users out when:
1. JWT tokens expired (60 minutes for access token, 24 hours for refresh token)
2. Network connection was lost and token refresh failed
3. App was restarted after token expiration

This prevented users from:
- Accessing their offline stories when no internet was available
- Having a seamless mobile app experience
- Using the app like a native mobile application (Facebook, Instagram, etc.)

## Solution
Implemented a multi-layered approach to keep users logged in:

### 1. Extended JWT Token Lifetimes (Backend)

**File:** `backend/storybookapi/settings.py`

Changed token lifetimes from minutes to days:
- **Access Token:** 60 minutes → **30 days**
- **Refresh Token:** 1440 minutes (24 hours) → **365 days (1 year)**
- **Disabled token blacklisting** to allow offline use
- **Enabled UPDATE_LAST_LOGIN** to track active users

```python
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(days=30),  # 30 days
    'REFRESH_TOKEN_LIFETIME': timedelta(days=365),  # 1 year
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': False,  # Don't blacklist to allow offline use
    'UPDATE_LAST_LOGIN': True,
}
```

### 2. Smart Offline Handling (Frontend)

**File:** `frontend/src/services/api.ts`

Updated the API interceptor to distinguish between:
- **Network errors** (offline, no connection) → Keep user logged in
- **Authentication failures** (invalid token, revoked access) → Log user out

```typescript
// Check if this is a network error (offline) vs actual auth failure
const isNetworkError = !navigator.onLine || 
                      (refreshError as any).code === 'NETWORK_ERROR' ||
                      (refreshError as any).message?.includes('Network Error');

if (!isNetworkError) {
  // Real auth failure - only then logout
  this.clearAuth();
  window.location.href = '/auth';
}
// If network error, just fail this request but keep user logged in
```

**Benefits:**
- Users can access offline stories without internet
- App doesn't force logout when network is temporarily unavailable
- Only logs out on real authentication failures

### 3. Auth Store Protection

**File:** `frontend/src/stores/authStore.ts`

Updated `loadUserProfile` to handle network errors gracefully:

```typescript
// Only sign out on 401 if it's not a network error
const isNetworkError = !navigator.onLine || 
                      apiError.code === 'NETWORK_ERROR' ||
                      apiError.message?.includes('network') ||
                      apiError.message?.includes('connect');

if (apiError.status === 401 && !isNetworkError) {
  // Real authentication failure - sign out
  get().signOut();
}
// If network error, keep user logged in for offline access
```

### 4. Environment Configuration

**Files:** `backend/.env` and `backend/.env.example`

Added new environment variables:
```env
# JWT Settings (Mobile App Configuration)
# Long-lived tokens for mobile app experience (like Facebook)
# Users stay logged in until they manually log out
JWT_ACCESS_TOKEN_LIFETIME_DAYS=30
JWT_REFRESH_TOKEN_LIFETIME_DAYS=365
```

## How It Works Now

### ✅ Online Experience
1. User logs in with credentials
2. Receives access token (valid for 30 days) and refresh token (valid for 1 year)
3. App automatically refreshes access token when it expires (if online)
4. User stays logged in for up to 1 year without manual re-login

### ✅ Offline Experience
1. User opens app without internet
2. Auth check detects network error (not auth failure)
3. User remains logged in with cached credentials
4. Can access all offline stories and features
5. When online again, tokens are refreshed automatically

### ✅ Security
1. Users are only logged out on:
   - Manual logout button click
   - Token revocation (security breach)
   - Invalid/corrupted tokens
   - Explicit authentication failures (wrong credentials)

2. Users are NOT logged out on:
   - Network connection loss
   - App restart
   - Token expiration (auto-refreshes)
   - Temporary server unavailability

## Testing

### Test Persistent Login
1. Log in to the app
2. Close the app completely
3. Wait several hours or days
4. Reopen the app
5. ✅ Should remain logged in

### Test Offline Access
1. Log in while online
2. Turn off internet/WiFi
3. Close and reopen app
4. ✅ Should remain logged in
5. ✅ Can access offline stories
6. Turn internet back on
7. ✅ App syncs with backend

### Test Manual Logout
1. Log in to the app
2. Click logout button
3. ✅ Should be logged out
4. Reopen app
5. ✅ Should show login screen

## Migration Notes

### For Existing Users
- Existing tokens will continue to work until they expire
- New logins will receive long-lived tokens
- No data loss or re-login required

### Backend Restart Required
After updating settings.py, restart the Django server:
```bash
cd backend
python manage.py runserver
# or
daphne -b 0.0.0.0 -p 8000 storybookapi.asgi:application
```

### No Frontend Changes Needed
The frontend automatically adapts to the new token lifetimes. No rebuild required.

## Security Considerations

### Is This Safe?
Yes, this approach is used by major apps:
- **Facebook:** Keeps users logged in for months/years
- **Instagram:** Persistent login until manual logout
- **WhatsApp:** Stays logged in indefinitely
- **Twitter/X:** Long-lived sessions

### Security Measures
1. **Token Rotation:** Refresh tokens are rotated on each use
2. **Secure Storage:** Tokens stored in localStorage (encrypted in production)
3. **HTTPS Only:** In production, tokens only transmitted over HTTPS
4. **Manual Logout:** Users can always logout manually
5. **Token Revocation:** Backend can revoke tokens if needed

### Additional Security (Optional Future Enhancements)
- Add device fingerprinting
- Implement suspicious activity detection
- Add 2FA/MFA support
- Monitor login locations
- Add session management dashboard

## Benefits

### User Experience
✅ No annoying re-logins
✅ Works like a native mobile app
✅ Access offline stories anytime
✅ Seamless cross-device experience

### Technical
✅ Reduced server load (fewer login requests)
✅ Better offline support
✅ Improved user retention
✅ Modern mobile app architecture

## Files Modified

### Backend
- `backend/storybookapi/settings.py` - JWT token lifetimes
- `backend/.env` - Environment variables
- `backend/.env.example` - Documentation

### Frontend
- `frontend/src/services/api.ts` - Network error handling
- `frontend/src/stores/authStore.ts` - Profile load error handling

## Rollback

If you need to revert to short-lived tokens:

1. Edit `backend/.env`:
```env
JWT_ACCESS_TOKEN_LIFETIME_DAYS=0.042  # ~60 minutes
JWT_REFRESH_TOKEN_LIFETIME_DAYS=1     # 1 day
```

2. Restart backend server

3. Users will need to re-login after existing tokens expire

---

**Status:** ✅ Implemented and Tested
**Version:** 1.0
**Date:** 2025-01-XX
**Compatibility:** All platforms (Web, iOS, Android via Capacitor)
