# 🚀 Installation & Testing Instructions

## ⚡ Quick Install (2 Minutes)

### Step 1: Install SendGrid Package
```bash
cd backend
pip install sendgrid==6.11.0
```

Or install all requirements at once:
```bash
pip install -r requirements.txt
```

---

### Step 2: Get Your FREE SendGrid API Key

1. **Sign up** (no credit card!): https://signup.sendgrid.com/
2. **Create API Key**:
   - Settings → API Keys → Create API Key
   - Name: "Imaginary Worlds"
   - Permissions: Mail Send (Full Access)
   - Copy the key (starts with `SG.`)

3. **Verify Sender Email**:
   - Settings → Sender Authentication
   - Verify a Single Sender
   - Use your Gmail or any email
   - Check email and click verification link

---

### Step 3: Update .env File

Open `backend/.env` and add these lines:

```env
# SendGrid Email Settings
SENDGRID_API_KEY=SG.paste-your-actual-key-here
FROM_EMAIL=your-verified@email.com
EMAIL_VERIFICATION_EXPIRY_MINUTES=15
```

**Important:** Replace the placeholder values with your actual SendGrid credentials!

---

### Step 4: Run Database Migration

```bash
cd backend
python manage.py makemigrations
python manage.py migrate
```

---

### Step 5: Test the System

```bash
python tmp_rovodev_test_email_verification.py
```

You should see a success report showing all components are working!

---

### Step 6: Start Your Server

```bash
python manage.py runserver
```

---

## 🧪 Test the Full Flow

### Test Registration & Verification:

1. **Register a new user** with YOUR real email:
```bash
curl -X POST http://localhost:8000/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "YOUR_EMAIL@gmail.com",
    "password": "TestPass123",
    "confirm_password": "TestPass123",
    "user_type": "child"
  }'
```

2. **Check your email** (inbox or spam folder)
   - You'll receive a beautiful email with a 6-digit code
   - Example: `123456`

3. **Verify your email**:
```bash
curl -X POST http://localhost:8000/api/auth/verify-email/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "YOUR_EMAIL@gmail.com",
    "verification_code": "123456"
  }'
```

4. **Login** (now you can login!):
```bash
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "YOUR_EMAIL@gmail.com",
    "password": "TestPass123"
  }'
```

---

## ✅ What You Should See

### After Registration:
```json
{
  "message": "Registration successful! Please check your email for the verification code.",
  "user_id": 1,
  "email": "your@email.com",
  "requires_verification": true,
  "email_sent": true
}
```

### After Verification:
```json
{
  "message": "Email verified successfully! You can now log in.",
  "verified": true,
  "user_id": 1,
  "email": "your@email.com"
}
```

### After Login:
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {
    "id": 1,
    "username": "testuser",
    "email": "your@email.com",
    ...
  }
}
```

---

## 🎨 Email Preview

Users receive a beautiful HTML email that looks like this:

```
┌─────────────────────────────────────────┐
│                                         │
│   📚 Imaginary Worlds                   │
│   Email Verification                    │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│   Hello Test User! 👋                   │
│                                         │
│   Welcome to Imaginary Worlds!          │
│                                         │
│   Your Verification Code                │
│   ┌───────────────────────────────┐    │
│   │        1  2  3  4  5  6       │    │
│   └───────────────────────────────┘    │
│   Valid for 15 minutes                  │
│                                         │
│   ⚠️ Never share this code             │
│                                         │
└─────────────────────────────────────────┘
```

---

## 🐛 Troubleshooting

### Issue: ModuleNotFoundError: No module named 'sendgrid'
**Solution:**
```bash
pip install sendgrid==6.11.0
```

### Issue: Email not received
**Solutions:**
- ✅ Check spam/junk folder
- ✅ Verify FROM_EMAIL in SendGrid dashboard
- ✅ Check SENDGRID_API_KEY is correct
- ✅ Make sure sender email is verified in SendGrid

### Issue: "Invalid verification code"
**Solutions:**
- ✅ Code expires after 15 minutes
- ✅ Use the resend endpoint: `/api/auth/resend-verification/`
- ✅ Check for typos in the code

### Issue: Authentication failed after verification
**Solutions:**
- ✅ Check Django admin: is user.is_active = True?
- ✅ Restart Django server
- ✅ Try logging in again

---

## 📊 Check Admin Panel

1. Create a superuser (if you haven't):
```bash
python manage.py createsuperuser
```

2. Login to admin:
```
http://localhost:8000/admin/
```

3. View Email Verifications:
- See all verification codes
- Check verification status
- Monitor expiry times

---

## 🎯 API Endpoints Summary

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/auth/register/` | POST | Register + Send verification email |
| `/api/auth/verify-email/` | POST | Verify 6-digit code |
| `/api/auth/resend-verification/` | POST | Resend verification code |
| `/api/auth/login/` | POST | Login (after verification) |

---

## 📚 Documentation

- **SENDGRID_QUICK_START.md** - 5-minute setup guide
- **EMAIL_VERIFICATION_SETUP_GUIDE.md** - Complete API documentation
- **EMAIL_VERIFICATION_COMPLETE.md** - Implementation summary

---

## 🎉 You're All Set!

Once you complete these steps, your email verification system is **production-ready**!

**Next:** Integrate with your frontend to show verification code input after registration.

---

## 💡 Pro Tips

1. **Development:** Use your personal email for testing
2. **Production:** Set up domain authentication in SendGrid
3. **Security:** Add rate limiting to prevent abuse
4. **Monitoring:** Check SendGrid dashboard regularly
5. **Backup:** Keep your API key secure

---

**Need help?** Check the detailed guides or Django error logs!
