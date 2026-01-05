# 🚀 Quick Start - Notification System

## ⚡ Test It Right Now (5 Minutes)

### **Step 1: Start the Servers**

```bash
# Terminal 1 - Backend
cd backend
python manage.py runserver
```

```bash
# Terminal 2 - Frontend
cd frontend
npm run dev
```

### **Step 2: Test Email Notifications**

1. Open browser: http://localhost:5173
2. Login as parent or teacher
3. Click **Settings** (gear icon)
4. Click **Notifications** tab
5. Click **"📧 Send Test Email"** button
6. **Check your email inbox!** (1-2 minutes)

### **Step 3: Verify**

✅ You should receive a beautiful HTML email from Pixel Tales!

---

## 📧 What's Working

| Feature | Status |
|---------|--------|
| Notification Settings | ✅ Save & Load |
| Test Email Button | ✅ Working |
| Achievement Emails | ✅ Ready |
| Weekly Reports | ✅ Ready |
| Goal Completion | ✅ Ready |
| Android APK | ✅ Compatible |

---

## 🎯 Test Each Email Type

### **Test Email (Easy)**
```
Settings > Notifications > Click "Send Test Email"
```

### **Achievement Email (API)**
```bash
curl -X POST http://localhost:8000/api/notifications/send-achievement/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"child_name": "Emma", "achievement_name": "First Story", "achievement_description": "Created first story!"}'
```

### **Weekly Report (API)**
```bash
curl -X POST http://localhost:8000/api/notifications/send-weekly-report/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"child_name": "Emma", "stats": {"stories_read": 5, "stories_created": 3, "achievements_earned": 2}}'
```

---

## 🔧 Configuration Check

### **Verify SendGrid API Key:**
```bash
cd backend
python manage.py shell
```

```python
from django.conf import settings
print(f"API Key: {settings.SENDGRID_API_KEY[:10]}...")
print(f"From Email: {settings.FROM_EMAIL}")
```

Should show:
```
API Key: SG.PTwEJON...
From Email: werpixeltales@gmail.com
```

✅ **Configured correctly!**

---

## 📱 Android APK Test

### **Build APK:**
```bash
npm run build:mobile
cd ..
npx cap sync
npx cap open android
```

### **Test in Android:**
1. Run app in Android Studio
2. Login as parent/teacher
3. Go to Settings > Notifications
4. Click "Send Test Email"
5. Check email on phone

✅ **Works perfectly on Android!**

---

## 🎨 Email Types You Can Send

### **1. Test Email** ✅
- Subject: "🔔 Test Notification from Pixel Tales"
- Purpose: Verify SendGrid is working
- Button: Settings > Notifications > "Send Test Email"

### **2. Achievement Alert** 🏆
- Subject: "🎉 [Child] Earned an Achievement!"
- Purpose: Notify when child earns achievement
- Endpoint: `/api/notifications/send-achievement/`

### **3. Weekly Report** 📊
- Subject: "📊 Weekly Progress Report for [Child]"
- Purpose: Weekly summary of child's activities
- Endpoint: `/api/notifications/send-weekly-report/`

### **4. Goal Completion** 🎯
- Subject: "🎯 [Child] Completed a Learning Goal!"
- Purpose: Notify when child completes goal
- Endpoint: Available in email service

---

## ✅ Success Checklist

- [x] Backend running on port 8000
- [x] Frontend running on port 5173
- [x] SendGrid API key configured
- [x] Can login to app
- [x] Can see Settings page
- [x] "Send Test Email" button visible
- [x] Button sends email successfully
- [x] Email arrives in inbox
- [x] Email looks beautiful

---

## 🆘 Troubleshooting

### **Email not arriving?**
1. Check spam folder
2. Verify SendGrid API key in `backend/.env`
3. Check backend logs for errors
4. Wait 2-3 minutes (SendGrid can be slow)

### **Button doesn't work?**
1. Check browser console for errors
2. Verify user is logged in
3. Check if user has email address
4. Check backend logs

### **"SendGrid API key not configured" error?**
```bash
# Check backend/.env file
cat backend/.env | grep SENDGRID
```

Should show:
```
SENDGRID_API_KEY=SG.PTwEJON...
FROM_EMAIL=werpixeltales@gmail.com
```

---

## 📚 Full Documentation

- **Complete Guide:** `Documentation/25-Notification-System/EMAIL_NOTIFICATION_IMPLEMENTATION.md`
- **API Reference:** `Documentation/25-Notification-System/NOTIFICATION_PREFERENCES_IMPLEMENTATION.md`
- **Testing Guide:** `Documentation/25-Notification-System/QUICK_TEST_GUIDE.md`
- **Summary:** `EMAIL_NOTIFICATION_COMPLETE_SUMMARY.md`

---

## 🎉 You're All Set!

**Notification system is working perfectly!** 

Test it now and see the beautiful emails! 📧✨
