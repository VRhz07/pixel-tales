# 🔑 Render Environment Variables - Complete List

## ⚠️ Important Note About Disks

**The "Disks" option appears AFTER you create the service!**

Steps:
1. Create web service with environment variables (below)
2. Wait for service to be created
3. Go to service Settings
4. Scroll down - you'll see "Disks" section
5. Add disk there

---

## 📋 Environment Variables to Add

When creating your web service, click **"Add Environment Variable"** and add these:

### REQUIRED Variables:

#### 1. DEBUG
```
Key:   DEBUG
Value: False
```
**What it does:** Runs Django in production mode (more secure, better performance)

---

#### 2. SECRET_KEY
```
Key:   SECRET_KEY
Value: <leave empty - Render auto-generates>
```
**What it does:** Django secret key for security. Render will create a secure random key automatically.

**OR** click "Generate" button if you see one.

---

#### 3. ALLOWED_HOSTS
```
Key:   ALLOWED_HOSTS
Value: your-app-name.onrender.com
```
**⚠️ IMPORTANT:** Replace `your-app-name` with your ACTUAL Render URL!

**Example:** If your service name is `pixeltales-backend`, use:
```
pixeltales-backend.onrender.com
```

You can also add multiple hosts separated by commas:
```
pixeltales-backend.onrender.com,localhost,127.0.0.1
```

---

#### 4. GOOGLE_AI_API_KEY
```
Key:   GOOGLE_AI_API_KEY
Value: your-gemini-api-key-here (⚠️ Backend only - see SECURITY_SETUP.md)
```
**What it does:** Your Gemini API key for AI story generation

---

#### 5. DATABASE_URL
```
Key:   DATABASE_URL
Value: sqlite:///data/db.sqlite3
```
**What it does:** Tells Django to use SQLite database in the persistent disk

---

#### 6. RENDER
```
Key:   RENDER
Value: True
```
**What it does:** Tells Django it's running on Render (enables Render-specific settings)

---

#### 7. FROM_EMAIL
```
Key:   FROM_EMAIL
Value: noreply@pixeltales.com
```
**What it does:** Email address used for sending emails (you can use any email)

---

#### 8. JWT_ACCESS_TOKEN_LIFETIME_DAYS
```
Key:   JWT_ACCESS_TOKEN_LIFETIME_DAYS
Value: 30
```
**What it does:** How long users stay logged in (30 days)

---

#### 9. JWT_REFRESH_TOKEN_LIFETIME_DAYS
```
Key:   JWT_REFRESH_TOKEN_LIFETIME_DAYS
Value: 365
```
**What it does:** How long refresh tokens last (1 year)

---

## 📝 OPTIONAL Variables (Skip for Now):

#### SENDGRID_API_KEY (For Email Verification)
```
Key:   SENDGRID_API_KEY
Value: your-sendgrid-api-key-here
```
**What it does:** Enables email verification for users (can add later)

---

## 📊 Summary Table

Copy these exactly:

| Key | Value | Required |
|-----|-------|----------|
| `DEBUG` | `False` | ✅ Yes |
| `SECRET_KEY` | (auto-generated) | ✅ Yes |
| `ALLOWED_HOSTS` | `your-app-name.onrender.com` | ✅ Yes |
| `GOOGLE_AI_API_KEY` | `your-gemini-api-key-here` | ✅ Yes (Backend only!) |
| `DATABASE_URL` | `sqlite:///data/db.sqlite3` | ✅ Yes |
| `RENDER` | `True` | ✅ Yes |
| `FROM_EMAIL` | `noreply@pixeltales.com` | ✅ Yes |
| `JWT_ACCESS_TOKEN_LIFETIME_DAYS` | `30` | ✅ Yes |
| `JWT_REFRESH_TOKEN_LIFETIME_DAYS` | `365` | ✅ Yes |
| `SENDGRID_API_KEY` | (your key) | ❌ Optional |

---

## 🎯 After Adding Variables

1. Click **"Create Web Service"** (at the bottom)
2. Render will start building (5-10 minutes)
3. Watch the "Logs" tab
4. Wait for status: "Building" → "Live"

---

## 💾 Then Add Persistent Disk

**After service is created:**

1. Go to your service dashboard
2. Click **"Settings"** (or it might be on the main page)
3. Scroll down to **"Disks"** section
4. Click **"Add Disk"**
5. Fill in:
   - **Name**: `pixeltales-data`
   - **Mount Path**: `/opt/render/project/src/data`
   - **Size**: `1` GB
6. Click **"Save"**
7. Service will restart automatically

---

## 🔍 How to Find Your App Name

Your Render URL will be based on the service name you chose:

**Service Name:** `pixeltales-backend`
**↓**
**URL:** `https://pixeltales-backend.onrender.com`

Use the **URL** (without https://) for `ALLOWED_HOSTS`

---

## ✅ Verification

After adding all variables, you should see something like this in your Environment tab:

```
✓ DEBUG = False
✓ SECRET_KEY = ***************************
✓ ALLOWED_HOSTS = pixeltales-backend.onrender.com
✓ GOOGLE_AI_API_KEY = AIza**********************
✓ DATABASE_URL = sqlite:///data/db.sqlite3
✓ RENDER = True
✓ FROM_EMAIL = noreply@pixeltales.com
✓ JWT_ACCESS_TOKEN_LIFETIME_DAYS = 30
✓ JWT_REFRESH_TOKEN_LIFETIME_DAYS = 365
```

---

## 🆘 Troubleshooting

### "Where is my app name?"
- Look at the top of your service page
- It's in the URL: `dashboard.render.com/web/srv-XXXXX`
- Or in the service name field

### "Can I change ALLOWED_HOSTS later?"
- Yes! Go to Environment tab → Edit the variable
- Save and service will restart

### "What if I skip SENDGRID_API_KEY?"
- No problem! Email verification won't work, but everything else will
- Users can still register and use the app
- Add it later when needed

---

## 🎉 Next Steps

After adding environment variables:
1. ✅ Create service
2. ⏳ Wait for deployment (watch Logs)
3. 💾 Add persistent disk
4. 🧪 Test your API
5. 📱 Build APK!
