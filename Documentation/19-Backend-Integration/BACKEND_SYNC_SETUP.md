# Backend Sync Setup Guide

## ✅ What's Been Done

I've set up the infrastructure to sync your stories from localStorage to your Django SQLite backend!

### Files Created/Modified

1. **`/services/storyApiService.ts`** - New API service for story operations
   - `getUserStories()` - Fetch all user stories from backend
   - `createStory()` - Create story on backend
   - `updateStory()` - Update story on backend
   - `deleteStory()` - Delete story from backend
   - `syncLocalStories()` - Bulk sync localStorage stories to backend

2. **`/stores/storyStore.ts`** - Added API sync methods
   - `syncStoriesToBackend()` - Sync all local stories to backend
   - `loadStoriesFromBackend()` - Load stories from backend
   - `syncStoryToBackend(id)` - Sync single story to backend

---

## 🚀 How to Use

### Step 1: Start Your Django Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

Backend will run at: `http://localhost:8000`

### Step 2: Test API Connection

Open browser console and run:

```javascript
// Check if backend is running
fetch('http://localhost:8000/api/stories/')
  .then(r => r.json())
  .then(console.log)
```

### Step 3: Sync Your Stories

In your React app, open browser console and run:

```javascript
// Import the store
import { useStoryStore } from './stores/storyStore';

// Get the store
const store = useStoryStore.getState();

// Sync all local stories to backend
await store.syncStoriesToBackend();

// Or load stories from backend
await store.loadStoriesFromBackend();
```

---

## 🔧 Quick Sync Button (Temporary)

Add this to your Library page for testing:

```tsx
import { useStoryStore } from '../../stores/storyStore';

// In your component
const { syncStoriesToBackend, loadStoriesFromBackend, isLoading } = useStoryStore();

// Add buttons
<button onClick={syncStoriesToBackend} disabled={isLoading}>
  Sync to Backend
</button>
<button onClick={loadStoriesFromBackend} disabled={isLoading}>
  Load from Backend
</button>
```

---

## 📝 Next Steps

### Option 1: Automatic Sync (Recommended)

Modify `storyStore.ts` to automatically sync on every change:

```typescript
updateStory: (id: string, updates: Partial<Story>) => {
  // ... existing code ...
  
  // Auto-sync to backend
  get().syncStoryToBackend(id).catch(console.error);
}
```

### Option 2: Manual Sync Button

Add a "Sync" button in the Library page that users can click.

### Option 3: Periodic Sync

Set up automatic sync every 5 minutes:

```typescript
useEffect(() => {
  const interval = setInterval(() => {
    syncStoriesToBackend();
  }, 5 * 60 * 1000); // 5 minutes
  
  return () => clearInterval(interval);
}, []);
```

---

## 🔍 How It Works

### Current Flow

1. **User creates/edits story** → Saved to localStorage
2. **User clicks "Sync"** → Stories sent to Django backend
3. **Backend saves to SQLite** → Data persisted in database
4. **Other browsers/devices** → Load from backend on login

### Data Flow

```
Frontend (localStorage) 
    ↓ syncStoriesToBackend()
Django Backend (SQLite)
    ↓ loadStoriesFromBackend()
Frontend (localStorage)
```

---

## 🐛 Troubleshooting

### CORS Errors

If you see CORS errors, make sure your Django backend has CORS configured:

```python
# backend/storybookapi/settings.py
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:5173",  # Vite default
]
```

### 401 Unauthorized

Make sure you're logged in with a real account (not mock auth):

```typescript
// Check if using real backend auth
const token = localStorage.getItem('access_token');
console.log('Token:', token);
```

### Stories Not Syncing

Check browser console for errors:

```javascript
// Enable detailed logging
localStorage.setItem('debug', 'storybook:*');
```

---

## 📊 Migration Strategy

### One-Time Migration

For existing users with localStorage data:

1. **Login to account**
2. **Click "Sync to Backend"** button
3. **Verify stories appear** in backend admin
4. **Clear localStorage** (optional)
5. **Reload page** - stories load from backend

### Gradual Migration

1. Keep localStorage as backup
2. Sync on every save
3. Load from backend on login
4. After 30 days, remove localStorage fallback

---

## 🎯 Production Checklist

- [ ] Backend deployed (Heroku, Railway, DigitalOcean)
- [ ] Database migrated to PostgreSQL (recommended)
- [ ] CORS configured for production domain
- [ ] JWT authentication working
- [ ] Auto-sync on story save/update
- [ ] Load from backend on login
- [ ] Error handling for offline mode
- [ ] Conflict resolution for simultaneous edits

---

## 💡 Tips

1. **Test with a new account first** - Don't risk your existing data
2. **Keep localStorage as backup** - Until backend is proven stable
3. **Add loading indicators** - Users should know when syncing
4. **Handle offline mode** - Queue changes when offline
5. **Add conflict resolution** - Handle simultaneous edits

---

## 📞 Support

If you need help:
1. Check Django logs: `python manage.py runserver` output
2. Check browser console for errors
3. Test API endpoints with Postman
4. Verify database with Django admin

---

**Status**: ✅ Ready to test!  
**Next Action**: Start Django backend and test sync
