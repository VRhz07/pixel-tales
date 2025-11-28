# Account State Persistence Implementation

## Overview
This document describes the implementation of account state persistence to ensure that when a parent switches to a child account, the app remembers which account is active when reopened. This prevents children from accidentally accessing the parent dashboard.

## Problem Statement
Previously, when a parent switched to view the app as their child:
1. The child account would remain active when the app was closed and reopened
2. However, there was no persistent tracking of which account type was active
3. Children could potentially access parent dashboard routes if they knew the URL
4. The `parent_session` localStorage item persisted, but account state was not tracked

## Solution

### 1. Account Switch Store (`accountSwitchStore.ts`)
Created a new Zustand store with persistence to track:
- `activeAccountType`: Whether currently viewing as 'parent' or 'child'
- `activeChildId`: The ID of the active child account (if viewing as child)
- `activeChildName`: The name of the active child for display purposes

```typescript
{
  activeAccountType: 'parent' | 'child' | null,
  activeChildId: number | null,
  activeChildName: string | null
}
```

This store persists to localStorage using Zustand's persist middleware, ensuring the account state survives app restarts.

### 2. Parent Route Protection (`ParentRoute.tsx`)
Created a new route protection component that:
- Checks if user is authenticated
- Verifies user has parent/teacher privileges
- **Critically**: Checks if `activeAccountType === 'child'` and blocks access
- Prevents children from accessing parent routes even if they have the URL

### 3. State Tracking in Key Components

#### ParentDashboardPage
- Sets `activeAccountType` to 'parent' when viewing dashboard
- When switching to child view, sets `activeAccountType` to 'child' with child info
- Persists across app restarts

#### SettingsPage
- Checks `activeAccountType` to determine if viewing as child
- Shows "Back to Parent Dashboard" button only when appropriate
- When switching back to parent, updates `activeAccountType` to 'parent'

#### HomePage
- On mount, checks current user type and sets `activeAccountType` appropriately
- Handles both direct child login and parent-viewing-as-child scenarios

### 4. Cleanup on Sign Out
Updated `authStore.signOut()` to:
- Clear the account switch store
- Remove parent session from localStorage
- Reset all authentication state

## Security Features

### Multi-Layer Protection
1. **Route Level**: `ParentRoute` component prevents navigation to parent routes
2. **State Level**: `activeAccountType` persists and is checked on every app load
3. **Session Level**: `parent_session` localStorage item tracks parent credentials
4. **Password Protection**: Switching back to parent requires password verification

### Children Cannot Access Parent Dashboard
Even if a child:
- Manually types `/parent-dashboard` in the URL
- Has a parent_session in localStorage
- Attempts to navigate via browser history

They will be automatically redirected to `/home` because:
- `ParentRoute` checks `activeAccountType === 'child'`
- `ParentRoute` checks for parent_session combined with child account type
- Only when `activeAccountType === 'parent'` can parent routes be accessed

## User Experience

### When Parent Switches to Child View
1. Parent clicks "Switch to [Child Name]" in parent dashboard
2. App stores parent credentials in `parent_session`
3. App updates tokens to child's tokens
4. **App sets `activeAccountType = 'child'`** ← New behavior
5. App navigates to home page as child
6. Child can use app normally but cannot access parent routes

### When App is Closed and Reopened
1. App loads persisted `activeAccountType` from localStorage
2. If `activeAccountType === 'child'`:
   - Child sees their account and can use all child features
   - Parent routes are blocked
   - "Back to Parent Dashboard" button appears in Settings
3. If `activeAccountType === 'parent'`:
   - Parent can access parent dashboard and all features

### When Switching Back to Parent
1. Child (or parent viewing as child) clicks "Back to Parent Dashboard" in Settings
2. App prompts for parent password verification
3. After verification:
   - Restores parent tokens from `parent_session`
   - **Sets `activeAccountType = 'parent'`** ← New behavior
   - Removes `parent_session` from localStorage
   - Navigates to parent dashboard

### When Parent Signs Out (While Viewing as Child)
1. All account state is cleared
2. `parent_session` is removed
3. `activeAccountType` is reset
4. User is redirected to auth page

## Implementation Files

### New Files
- `frontend/src/stores/accountSwitchStore.ts` - Account state management
- `frontend/src/components/auth/ParentRoute.tsx` - Route protection component
- `Documentation/ACCOUNT_STATE_PERSISTENCE.md` - This document

### Modified Files
- `frontend/src/App.tsx` - Use ParentRoute for parent-only routes
- `frontend/src/pages/ParentDashboardPage.tsx` - Set account state when switching
- `frontend/src/components/pages/SettingsPage.tsx` - Check account state, update on switch
- `frontend/src/components/pages/HomePage.tsx` - Set account state on page load
- `frontend/src/stores/authStore.ts` - Clear account state on sign out

## Testing

### Test Scenarios

#### Scenario 1: Parent Switches to Child
1. ✅ Login as parent
2. ✅ Navigate to parent dashboard
3. ✅ Click "Switch to Child"
4. ✅ Verify app shows child's home page
5. ✅ Close and reopen app
6. ✅ Verify still viewing as child
7. ✅ Attempt to navigate to `/parent-dashboard`
8. ✅ Verify redirected to `/home`

#### Scenario 2: Child Direct Login
1. ✅ Login as child account
2. ✅ Verify child sees appropriate pages
3. ✅ Close and reopen app
4. ✅ Verify still logged in as child
5. ✅ Attempt to navigate to `/parent-dashboard`
6. ✅ Verify redirected to `/home`

#### Scenario 3: Switch Back to Parent
1. ✅ Parent switches to child view
2. ✅ Close and reopen app
3. ✅ Go to Settings
4. ✅ Click "Back to Parent Dashboard"
5. ✅ Enter parent password
6. ✅ Verify returned to parent dashboard
7. ✅ Close and reopen app
8. ✅ Verify viewing as parent (can access parent dashboard)

#### Scenario 4: Sign Out While Viewing as Child
1. ✅ Parent switches to child view
2. ✅ Go to Settings as parent
3. ✅ Click "Sign Out"
4. ✅ Verify redirected to auth page
5. ✅ Verify all account state cleared
6. ✅ Login again as parent
7. ✅ Verify can access parent dashboard normally

## Benefits

### Security
- Children cannot accidentally or intentionally access parent features
- Parent password always required to switch back
- Account state persists across app restarts

### User Experience
- App remembers which account you were using
- No need to switch accounts every time you open the app
- Clear visual indicators of which account is active

### Parental Control
- Parents can confidently hand device to children
- Children stay in their protected environment
- Easy to switch back when parent needs dashboard access

## Future Enhancements

Possible improvements:
1. Auto-lock after certain time period when viewing as child
2. Biometric authentication for switching back to parent
3. Usage time limits that automatically switch back to parent
4. Notification to parent when child attempts to access parent routes
