# Quick Test Guide - Notification Preferences

## How to Test the Notification Settings

### 1. Start the Application

**Backend:**
```bash
cd backend
python manage.py runserver
```

**Frontend:**
```bash
cd frontend
npm run dev
```

### 2. Test as Parent

1. **Login as Parent Account**
   - Go to http://localhost:5173/auth
   - Login with a parent account

2. **Navigate to Settings**
   - Click on parent dashboard
   - Go to Settings (gear icon in top bar or bottom nav)

3. **Open Notifications Tab**
   - Click "Notifications" in the left sidebar
   - You should see 4 toggle switches

4. **Test Each Toggle**
   - ✅ **Weekly Progress Reports** - Toggle ON/OFF
   - ✅ **Achievement Alerts** - Toggle ON/OFF
   - ✅ **Goal Completion** - Toggle ON/OFF
   - ✅ **Real-time Updates** - Toggle ON/OFF

5. **Verify Success Message**
   - After each toggle, you should see:
   - "Notification preferences saved!" message
   - Message disappears after 2 seconds

6. **Test Persistence**
   - Reload the page (F5)
   - Settings should remain as you set them
   - If they reset, check browser console for errors

### 3. Test as Teacher

1. **Login as Teacher Account**
   - Logout from parent account
   - Login with a teacher account

2. **Navigate to Settings**
   - Click on teacher dashboard
   - Go to Settings

3. **Test Notifications Tab**
   - Same 4 toggles as parent
   - Test each one
   - Verify persistence

### 4. Check Browser Console

**Open Developer Tools (F12)**
- Look for these log messages:
  - ✅ "Notification preferences response: ..."
  - ✅ "Update preferences response: ..."
  - ❌ No red errors

### 5. Verify Database

**Check preferences were saved:**
```bash
cd backend
python manage.py shell
```

```python
from storybook.models import NotificationPreferences
from django.contrib.auth.models import User

# Check specific user
user = User.objects.get(username='your_username')
prefs = NotificationPreferences.objects.get(user=user)
print(f"Weekly Reports: {prefs.weekly_reports}")
print(f"Achievement Alerts: {prefs.achievement_alerts}")
print(f"Goal Completion: {prefs.goal_completion}")
print(f"Realtime Updates: {prefs.realtime_updates}")
```

### 6. Test Error Handling

**Test with backend stopped:**
1. Stop the Django backend server
2. Try toggling a setting
3. Should see an error in console
4. Toggle should revert to previous state

## Expected Results

### ✅ Success Indicators
- Toggle switches respond immediately
- Success message appears after each change
- Settings persist after page reload
- No errors in browser console
- Database contains correct values

### ❌ Common Issues

**Settings Don't Persist:**
- Check if migration ran: `python manage.py migrate`
- Check browser console for 401 (authentication) errors
- Verify user is logged in

**Toggle Doesn't Change:**
- Check if `savingPreferences` is stuck at true
- Look for JavaScript errors in console
- Verify backend API is running

**"Network Error":**
- Backend server not running
- Wrong API URL in frontend
- CORS issues (check backend logs)

## API Testing with curl

**Get Preferences:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8000/api/notifications/preferences/
```

**Update Preferences:**
```bash
curl -X PUT \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"weekly_reports": false}' \
  http://localhost:8000/api/notifications/preferences/update/
```

## Android APK Testing

### Build the APK
```bash
npm run build:mobile
cd ..
npx cap sync
npx cap open android
```

### Test in Android Studio
1. Run on emulator or device
2. Login as parent/teacher
3. Navigate to Settings > Notifications
4. Toggle each setting
5. Close app completely
6. Reopen app
7. Check if settings persisted

### Expected Android Behavior
- ✅ Toggles work smoothly
- ✅ Settings save to backend
- ✅ Settings persist across app restarts
- ✅ No crashes or freezes

## Troubleshooting

### Issue: "No changes detected" during migration
**Solution:** Model already exists, migration not needed

### Issue: Settings reset after reload
**Solution:** Check if API returns correct data
```javascript
// In browser console:
fetch('http://localhost:8000/api/notifications/preferences/', {
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('access_token')
  }
}).then(r => r.json()).then(console.log)
```

### Issue: 401 Unauthorized
**Solution:** User not authenticated or token expired
- Logout and login again
- Check localStorage for 'access_token'

## Success! ✅

If all tests pass, the notification preferences system is working correctly! The settings are now:
- ✅ Saved to database
- ✅ Persistent across sessions
- ✅ Working on both parent and teacher dashboards
- ✅ Ready for Android APK deployment
