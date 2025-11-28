# Account State Persistence - Manual Test Guide

## Prerequisites
- Backend server running
- At least one parent account with one child account created
- Frontend dev server running

## Test 1: Parent Switches to Child Account

### Steps:
1. **Login as Parent**
   - Go to `http://localhost:5173/auth`
   - Login with parent credentials
   - Expected: Redirected to `/home`

2. **Navigate to Parent Dashboard**
   - Click on profile/settings
   - Navigate to `/parent-dashboard` (or use bottom nav if available)
   - Expected: See parent dashboard with children list

3. **Switch to Child Account**
   - In parent dashboard, click "Switch to [Child Name]" or use account switcher
   - Expected: 
     - App navigates to `/home`
     - You see the child's perspective
     - Check localStorage: should see `parent_session` and `activeAccountType: 'child'`

4. **Verify Child Cannot Access Parent Routes**
   - Manually navigate to `/parent-dashboard` in browser address bar
   - Expected: Automatically redirected to `/home`
   - Try `/parent-settings`
   - Expected: Automatically redirected to `/home`

5. **Close and Reopen App**
   - Close browser tab completely
   - Open new tab to `http://localhost:5173`
   - Expected: 
     - Still logged in as child
     - See child's home page
     - Account state preserved

6. **Verify Parent Dashboard Still Blocked**
   - Try to navigate to `/parent-dashboard`
   - Expected: Still redirected to `/home`

## Test 2: Switch Back to Parent Account

### Steps:
1. **Continue from Test 1** (viewing as child)

2. **Go to Settings**
   - Navigate to `/settings`
   - Expected: See "Back to Parent Dashboard" button/section

3. **Switch Back to Parent**
   - Click "Back to Parent Dashboard"
   - Expected: Password verification modal appears

4. **Enter Parent Password**
   - Enter parent's password
   - Click "Verify" or "Continue"
   - Expected:
     - Navigates to `/parent-dashboard`
     - Can access parent features
     - `parent_session` removed from localStorage
     - `activeAccountType` set to 'parent'

5. **Verify Parent Access Restored**
   - Navigate to `/parent-dashboard`
   - Expected: Can access without redirect
   - Close and reopen app
   - Expected: Still in parent mode

## Test 3: Direct Child Login

### Steps:
1. **Sign Out** (if logged in)

2. **Login Directly as Child**
   - Go to `/auth`
   - Login with child credentials (if children can have direct logins)
   - OR create a new child account
   - Expected: Redirected to `/home`

3. **Check Account State**
   - Check localStorage
   - Expected: `activeAccountType: 'child'`
   - No `parent_session` in localStorage

4. **Verify Cannot Access Parent Routes**
   - Navigate to `/parent-dashboard`
   - Expected: Redirected to `/home`

5. **Close and Reopen**
   - Close and reopen app
   - Expected: Still viewing as child
   - Still cannot access parent routes

## Test 4: Sign Out While Viewing as Child

### Steps:
1. **Parent Switches to Child View** (Test 1, steps 1-3)

2. **Open Settings**
   - Go to `/settings`
   - Note: If viewing as child from parent account, may need to switch back to parent first

3. **Sign Out**
   - Click "Sign Out" button
   - Expected:
     - Redirected to `/auth`
     - All localStorage cleared including `parent_session` and `activeAccountType`

4. **Verify Clean State**
   - Check localStorage
   - Expected: No user data, no parent_session, no activeAccountType

5. **Login Again as Parent**
   - Login with parent credentials
   - Navigate to `/parent-dashboard`
   - Expected: Works normally, no leftover child state

## Test 5: Multiple Browser Tabs

### Steps:
1. **Login as Parent in Tab 1**
   - Open Tab 1: `http://localhost:5173`
   - Login as parent

2. **Open Tab 2**
   - Open new tab to `http://localhost:5173`
   - Expected: Also shows as parent (shared localStorage)

3. **Switch to Child in Tab 1**
   - In Tab 1, switch to child view
   - Expected: Tab 1 shows child view

4. **Refresh Tab 2**
   - Refresh Tab 2
   - Expected: Also switches to child view (shared state)

5. **Try Parent Dashboard in Tab 2**
   - Navigate to `/parent-dashboard` in Tab 2
   - Expected: Blocked, redirected to `/home`

## Expected localStorage State at Different Stages

### After Parent Login:
```json
{
  "access_token": "...",
  "refresh_token": "...",
  "user_data": "{...parent user data...}",
  "auth-storage": "{\"state\":{\"user\":{...},\"isAuthenticated\":true}}",
  "account-switch-storage": "{\"state\":{\"activeAccountType\":\"parent\",\"activeChildId\":null,\"activeChildName\":null}}"
}
```

### After Switching to Child:
```json
{
  "access_token": "...(child tokens)",
  "refresh_token": "...(child tokens)",
  "user_data": "{...child user data...}",
  "parent_session": "{\"id\":123,\"name\":\"Parent Name\",\"tokens\":{...parent tokens...},\"userData\":{...}}",
  "auth-storage": "{\"state\":{\"user\":{...child...},\"isAuthenticated\":true}}",
  "account-switch-storage": "{\"state\":{\"activeAccountType\":\"child\",\"activeChildId\":456,\"activeChildName\":\"Child Name\"}}"
}
```

### After Switching Back to Parent:
```json
{
  "access_token": "...(parent tokens restored)",
  "refresh_token": "...(parent tokens restored)",
  "user_data": "{...parent user data...}",
  "auth-storage": "{\"state\":{\"user\":{...parent...},\"isAuthenticated\":true}}",
  "account-switch-storage": "{\"state\":{\"activeAccountType\":\"parent\",\"activeChildId\":null,\"activeChildName\":null}}"
}
// Note: parent_session is removed
```

## Developer Tools Inspection

### Check Account State in Console:
```javascript
// Check current account type
console.log(localStorage.getItem('account-switch-storage'));

// Check if parent session exists
console.log(localStorage.getItem('parent_session'));

// Check current user
console.log(localStorage.getItem('user_data'));
```

### Force State (for testing):
```javascript
// WARNING: Only for testing! Don't use in production

// Force to child mode
localStorage.setItem('account-switch-storage', JSON.stringify({
  state: {
    activeAccountType: 'child',
    activeChildId: 123,
    activeChildName: 'Test Child'
  }
}));

// Force to parent mode
localStorage.setItem('account-switch-storage', JSON.stringify({
  state: {
    activeAccountType: 'parent',
    activeChildId: null,
    activeChildName: null
  }
}));

// Then refresh page
window.location.reload();
```

## Troubleshooting

### Issue: Child can still access parent dashboard
- Check if `ParentRoute` is being used in `App.tsx` for parent routes
- Verify `activeAccountType` is set correctly in localStorage
- Check browser console for any errors

### Issue: Account state not persisting after refresh
- Verify Zustand persist middleware is working
- Check browser localStorage in DevTools
- Ensure `accountSwitchStore.ts` has persist configured

### Issue: "Back to Parent Dashboard" not showing
- Check if `parent_session` exists in localStorage
- Verify `isViewingAsChild` logic in SettingsPage
- Check console for errors

### Issue: Parent password verification not working
- Check backend API is accessible
- Verify parent password is correct
- Check network tab for API errors

## Success Criteria

All tests pass if:
- ✅ Parent can switch to child view
- ✅ Child view persists after app restart
- ✅ Child cannot access parent routes under any circumstances
- ✅ Parent can switch back with password verification
- ✅ Parent mode persists after switching back
- ✅ Sign out clears all account state properly
- ✅ Account state is consistent across browser tabs
