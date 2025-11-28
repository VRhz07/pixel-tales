# 📧 Email Verification Setup Guide - SendGrid Integration

## ✅ What's Been Implemented

Your Django backend now has a **complete email verification system** using **SendGrid**! Here's what's included:

### 🎯 Features:
1. ✅ **SendGrid integration** for professional email delivery
2. ✅ **6-digit verification codes** sent to user emails
3. ✅ **Email verification model** to track verification status
4. ✅ **Automatic expiry** (15 minutes by default)
5. ✅ **Beautiful HTML email templates**
6. ✅ **Resend verification code** functionality
7. ✅ **User remains inactive** until email is verified

---

## 🚀 Setup Instructions

### Step 1: Install SendGrid Package

```bash
cd backend
pip install sendgrid==6.11.0
```

Or install all requirements:
```bash
pip install -r requirements.txt
```

---

### Step 2: Get Your SendGrid API Key (100% FREE!)

1. **Sign up for SendGrid**: https://signup.sendgrid.com/
   - Free tier: **100 emails/day forever**
   - No credit card required

2. **Create an API Key**:
   - Go to Settings → API Keys
   - Click "Create API Key"
   - Choose "Restricted Access"
   - Give it "Mail Send" permissions (Full Access)
   - Copy the API key (you'll only see it once!)

3. **Verify a Sender Email** (Important!):
   - Go to Settings → Sender Authentication
   - Click "Verify a Single Sender"
   - Add your email address (e.g., `yourname@gmail.com`)
   - Check your email and click the verification link
   - This email will be your `FROM_EMAIL`

---

### Step 3: Configure Environment Variables

Edit your `backend/.env` file and add:

```env
# SendGrid Email Settings
SENDGRID_API_KEY=SG.your-api-key-here
FROM_EMAIL=yourverified@email.com
EMAIL_VERIFICATION_EXPIRY_MINUTES=15
```

**Replace:**
- `SG.your-api-key-here` with your actual SendGrid API key
- `yourverified@email.com` with the email you verified in SendGrid

---

### Step 4: Run Database Migrations

```bash
cd backend
python manage.py makemigrations
python manage.py migrate
```

---

## 📡 API Endpoints

### 1. Register (Sends Verification Email)
```http
POST /api/auth/register/
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123",
  "confirm_password": "SecurePass123",
  "user_type": "child"
}
```

**Response:**
```json
{
  "message": "Registration successful! Please check your email for the verification code.",
  "user_id": 123,
  "email": "john@example.com",
  "requires_verification": true,
  "email_sent": true
}
```

---

### 2. Verify Email
```http
POST /api/auth/verify-email/
Content-Type: application/json

{
  "email": "john@example.com",
  "verification_code": "123456"
}
```

**Response:**
```json
{
  "message": "Email verified successfully! You can now log in.",
  "verified": true,
  "user_id": 123,
  "email": "john@example.com"
}
```

---

### 3. Resend Verification Code
```http
POST /api/auth/resend-verification/
Content-Type: application/json

{
  "email": "john@example.com"
}
```

**Response:**
```json
{
  "message": "Verification code sent successfully! Please check your email.",
  "email_sent": true,
  "expires_in_minutes": 15
}
```

---

### 4. Login (After Verification)
```http
POST /api/auth/login/
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

---

## 🎨 Email Template Preview

Users will receive a beautiful HTML email with:
- 📚 Imaginary Worlds branding
- 🔢 Large, easy-to-read verification code
- ⏰ Expiry time display
- ⚠️ Security warnings
- 📱 Mobile-responsive design

---

## 🧪 Testing Guide

### Test with Real Email:
1. Use your own email during registration
2. Check your inbox (and spam folder!)
3. Enter the 6-digit code
4. Verify successful login

### Test with SendGrid Sandbox (Development):
SendGrid automatically uses sandbox mode for unverified domains. Emails won't actually send but you'll see the code in your Django logs.

---

## 🛠️ Frontend Integration

### Update Your Registration Flow:

```typescript
// 1. Register User
const registerResponse = await fetch('http://localhost:8000/api/auth/register/', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'John Doe',
    email: 'john@example.com',
    password: 'SecurePass123',
    confirm_password: 'SecurePass123',
    user_type: 'child'
  })
});

const data = await registerResponse.json();

if (data.requires_verification) {
  // Show verification code input form
  showVerificationModal(data.email);
}

// 2. Verify Email
const verifyResponse = await fetch('http://localhost:8000/api/auth/verify-email/', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'john@example.com',
    verification_code: '123456'
  })
});

const verifyData = await verifyResponse.json();

if (verifyData.verified) {
  // Redirect to login
  redirectToLogin();
}

// 3. Resend Code (if needed)
const resendResponse = await fetch('http://localhost:8000/api/auth/resend-verification/', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'john@example.com'
  })
});
```

---

## 🔒 Security Features

✅ **6-digit codes** - Easy to type, hard to guess
✅ **15-minute expiry** - Codes auto-expire for security
✅ **One-time use** - Codes can only be used once
✅ **Inactive until verified** - Users can't login without verification
✅ **Old codes invalidated** - Previous codes become invalid when resending

---

## 📊 Admin Panel

View all email verifications in Django Admin:
- Go to: `http://localhost:8000/admin/`
- Navigate to: **Email Verifications**
- See: codes, status, expiry times, etc.

---

## 🐛 Troubleshooting

### Issue: Email not sending
**Solution:** 
- Check your SendGrid API key is correct
- Verify your FROM_EMAIL in SendGrid dashboard
- Check Django logs for detailed errors

### Issue: "Invalid verification code"
**Solution:**
- Code may have expired (15 minutes)
- Use the resend endpoint to get a new code
- Check for typos in the 6-digit code

### Issue: User can't login after verification
**Solution:**
- Verify the email verification was successful
- Check `user.is_active = True` in Django admin
- Clear any cached authentication

---

## 🎉 Next Steps

1. **Install SendGrid**: `pip install -r requirements.txt`
2. **Get API Key**: Sign up at sendgrid.com
3. **Configure .env**: Add your API key and from email
4. **Run Migrations**: `python manage.py migrate`
5. **Test Registration**: Try registering a new account!

---

## 💡 Production Tips

For production deployment:
- Use environment variables for sensitive data
- Set up SendGrid domain authentication for better deliverability
- Monitor SendGrid dashboard for email delivery stats
- Consider upgrading to higher SendGrid tier if needed (still very affordable)
- Add rate limiting to prevent abuse

---

## 📚 Resources

- SendGrid Docs: https://docs.sendgrid.com/
- SendGrid Python Library: https://github.com/sendgrid/sendgrid-python
- API Key Management: https://app.sendgrid.com/settings/api_keys

---

**Need help?** Check the error messages in your Django console - they're very detailed!
