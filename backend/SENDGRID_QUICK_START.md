# 🚀 SendGrid Quick Start (5 Minutes)

## Step-by-Step Setup

### 1️⃣ Sign Up for SendGrid (FREE)
1. Go to: **https://signup.sendgrid.com/**
2. Fill in your details (no credit card required!)
3. Verify your email address
4. Complete the onboarding questions

**Free Tier:** 100 emails/day forever! Perfect for your app.

---

### 2️⃣ Get Your API Key
1. Login to SendGrid dashboard
2. Go to: **Settings** → **API Keys**
3. Click: **"Create API Key"**
4. Name it: `Imaginary Worlds`
5. Choose: **Restricted Access**
6. Enable: **Mail Send** → **Full Access**
7. Click: **Create & View**
8. **COPY THE KEY** (you'll only see it once!)

Your key looks like: `SG.xxxxxxxxxxxxxxxxxxx.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

---

### 3️⃣ Verify Your Sender Email
1. Go to: **Settings** → **Sender Authentication**
2. Click: **"Verify a Single Sender"**
3. Fill in the form:
   - From Name: `Imaginary Worlds`
   - From Email: Your email (e.g., `yourname@gmail.com`)
   - Reply To: Same email
   - Company Address: Your address
4. Click: **Create**
5. **Check your email** and click the verification link
6. ✅ Your sender email is now verified!

---

### 4️⃣ Update Your .env File

Open `backend/.env` and add:

```env
SENDGRID_API_KEY=SG.your-actual-key-here
FROM_EMAIL=yourverified@email.com
EMAIL_VERIFICATION_EXPIRY_MINUTES=15
```

**Replace:**
- `SG.your-actual-key-here` → Your copied API key
- `yourverified@email.com` → The email you just verified

---

### 5️⃣ Install & Test

```bash
# Install SendGrid
cd backend
pip install sendgrid==6.11.0

# Run migrations
python manage.py migrate

# Test the system
python tmp_rovodev_test_email_verification.py

# Start server
python manage.py runserver
```

---

## ✅ You're Done!

Now when users register, they'll receive a beautiful email with a 6-digit verification code!

---

## 🧪 Test It Now

1. Start your backend: `python manage.py runserver`
2. Register a new user with YOUR email
3. Check your inbox (and spam folder!)
4. You'll see a beautiful email with a 6-digit code
5. Enter the code to verify

---

## 📧 What the Email Looks Like

Users receive a professional HTML email with:
- **Beautiful gradient header** with your app logo
- **Large 6-digit code** (easy to read)
- **Expiry timer** (15 minutes)
- **Security warnings**
- **Mobile responsive** design

---

## 🆘 Troubleshooting

### Email not arriving?
- ✅ Check spam/junk folder
- ✅ Verify your FROM_EMAIL in SendGrid
- ✅ Check Django console for errors
- ✅ Make sure API key is correct

### "Invalid API Key" error?
- ✅ Copy the FULL key (starts with `SG.`)
- ✅ No spaces or quotes in .env file
- ✅ Restart your Django server after updating .env

### Email says "via sendgrid.net"?
- This is normal for free tier
- Upgrade to domain authentication to remove it (optional)

---

## 💰 Pricing (All Plans Support Email Verification)

- **Free:** 100 emails/day forever ✅ **Recommended**
- **Essentials:** $19.95/month - 50,000 emails
- **Pro:** $89.95/month - 100,000 emails

For your app, the **free tier is perfect!**

---

## 🎉 That's It!

You now have professional email verification powered by SendGrid!

**Questions?** Check `EMAIL_VERIFICATION_SETUP_GUIDE.md` for detailed API documentation.
