# ⚡ URGENT: Check Backend Terminal

The phone is trying to create a collaboration session but failing.

## 🔍 Look at Your Backend Terminal RIGHT NOW

When you clicked "Invite" from the phone, the backend terminal should show:

**Example of what you should see:**
```
[05/Jan/2025 21:29:24] "POST /api/collaboration/sessions/create/ HTTP/1.1" 400 123
```

Or:
```
[05/Jan/2025 21:29:24] "POST /api/collaboration/sessions/create/ HTTP/1.1" 500 456
Internal Server Error: /api/collaboration/sessions/create/
Traceback (most recent call last):
  ... (error details)
```

---

## 🎯 What I Need:

**Copy and paste everything from your backend terminal** when you:

1. Click "Invite friend" on phone
2. Watch the terminal
3. Copy ALL the output (even if it's long!)

**Without the backend logs, I can't see what's actually failing!**

---

## ⚡ Quick Check:

**Is your backend even running?**
```bash
cd backend
python manage.py runserver 0.0.0.0:8000
```

**You should see:**
```
Django version 4.x.x
Starting development server at http://0.0.0.0:8000/
Quit the server with CTRL-BREAK.
```

---

## 📸 Or Take a Screenshot

If copying is hard, just take a screenshot of your backend terminal and describe what you see!

---

**The backend terminal has the answer!** 🔍
