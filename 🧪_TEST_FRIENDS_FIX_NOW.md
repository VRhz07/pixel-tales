# 🧪 Quick Test Guide - Friends List Fix

## 🚀 Quick Start (Test in 3 Steps)

### Step 1: Restart Backend
```bash
cd backend
python manage.py runserver
```

### Step 2: Restart Frontend
```bash
cd frontend
npm run dev
```

### Step 3: Test in Browser
1. Open `http://localhost:5173`
2. **Login** with an account that has friends
3. Go to **Social** page
4. **Check the Friends List**

---

## ✅ What You Should See

### CORRECT Behavior (Fixed):
```
Friends (3)
├─ 🧑 Emma Johnson
│  └─ 12 stories published
│  └─ [Message] [Unfriend]
├─ 🤖 Alex Smith  
│  └─ 8 stories published
│  └─ [Message] [Unfriend]
└─ 🎭 Sofia Martinez
   └─ 15 stories published
   └─ [Message] [Unfriend]
```

### WRONG Behavior (Bug):
```
Friends (3)
├─ 📚 YourOwnName  ← ❌ Your own name repeated
├─ 📚 YourOwnName  ← ❌ Your own name repeated
└─ 📚 YourOwnName  ← ❌ Your own name repeated
```

---

## 🔍 Debug Console Logs

Open **Browser DevTools** (F12) and check Console:

### ✅ Expected Logs (Fixed):
```
🔍 Friends API response: {friends: Array(3)}
✅ Found 3 friends
👤 Friend: Emma Johnson (ID: 8)
👤 Friend: Alex Smith (ID: 12)
👤 Friend: Sofia Martinez (ID: 15)
```

### ❌ Wrong Logs (Bug):
```
👤 Friend: YourOwnName (ID: 5)  ← Same ID as current user
```

---

## 🧪 Advanced Testing

### Test Different Scenarios:

1. **Multiple Friends**: Should show all different friend names
2. **Online Status**: Green dot = online, Gray = offline
3. **Message Button**: Opens chat with that specific friend
4. **Unfriend**: Removes that friend from the list
5. **Notifications**: Friend requests still work

### Test with Multiple Accounts:

1. Create 2 test accounts (Account A & Account B)
2. Send friend request from A to B
3. Accept on B
4. Both should see each other (not themselves) in friends list

---

## 🐛 Troubleshooting

### Still seeing your own name?
1. **Hard Refresh**: `Ctrl+Shift+R` (or `Cmd+Shift+R` on Mac)
2. **Clear Storage**: DevTools → Application → Clear Site Data
3. **Restart Servers**: Stop and restart both backend and frontend

### No friends showing?
1. **Check friendships exist**: Make sure you have accepted friendships
2. **Check API**: Open DevTools Network tab, look for `/api/friends/` call
3. **Check response**: Should return `{success: true, friends: [...]}`

### API Error?
1. **Backend running?**: Check `http://127.0.0.1:8000/api/friends/` 
2. **Logged in?**: Check localStorage for `auth-storage`
3. **Valid token?**: Token might be expired, try logging out and back in

---

## 📊 API Test (Direct)

### Test API Directly:
```bash
# Get your auth token from browser localStorage
# Then test the API:

curl http://127.0.0.1:8000/api/friends/ \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Expected Response:
```json
{
  "success": true,
  "friends": [
    {
      "id": 8,
      "name": "Friend Name",
      "avatar": "🧑",
      "username": "friendusername",
      "is_online": true,
      "story_count": 5
    }
  ]
}
```

**Key Check**: `id` in response should **NOT** match your user ID!

---

## ✅ Success Criteria

- [ ] Friends list shows **other users' names**, not your own
- [ ] Each friend has correct **avatar emoji**
- [ ] **Online status** displays correctly (green/gray dot)
- [ ] **Story count** shows for each friend
- [ ] **Message button** works for each friend
- [ ] **Unfriend button** works
- [ ] Console shows **different friend IDs** (not your ID)

---

## 🎉 When It's Working

You should be able to:
1. ✅ See your friends' names in the list
2. ✅ Click message to chat with each friend
3. ✅ See who's online vs offline
4. ✅ See how many stories each friend published
5. ✅ Unfriend someone if needed

---

**Need Help?** Check the full documentation in `✅_FRIENDS_LIST_FIXED.md`
