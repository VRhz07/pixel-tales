# PixelTales Backend - DigitalOcean App Platform Deployment Guide

## 🎯 Quick Start

**Choose: App Platform → Deploy Repository**

---

## Step 1: Connect Your GitHub Repository

1. Click **"Deploy Repository"** on the App Platform card
2. **Authorize DigitalOcean** to access your GitHub account
3. Select repository: `VRhz07/pixel-tales`
4. Select branch: `main`
5. Click **"Next"**

---

## Step 2: Configure Your App

### Basic Settings:
- **Name**: `pixeltales-backend` (or your preferred name)
- **Region**: Choose closest to your users (e.g., New York, San Francisco, London)
- **Branch**: `main`
- **Source Directory**: `/backend`

### Build Settings:
- **Build Command**: 
  ```bash
  pip install -r requirements.txt && python manage.py collectstatic --noinput
  ```
- **Run Command**: 
  ```bash
  daphne -b 0.0.0.0 -p 8080 storybookapi.asgi:application
  ```

### Environment Variables (Click "Edit" and add these):

#### Required - Core Settings:
```bash
PYTHON_VERSION=3.11.9
SECRET_KEY=<generate-a-long-random-string>
DEBUG=False
ALLOWED_HOSTS=.ondigitalocean.app,.digitaloceanspaces.com
DATABASE_URL=<will-add-database-later>
```

#### Required - Frontend Configuration:
```bash
FRONTEND_URL=https://your-frontend-url.netlify.app
```

#### Required - API Keys:
```bash
GOOGLE_AI_API_KEY=<your-google-ai-api-key>
SENDGRID_API_KEY=<your-sendgrid-api-key>
FROM_EMAIL=werpixeltales@gmail.com
REPLICATE_API_TOKEN=<your-replicate-api-key>
OCR_SPACE_API_KEY=<your-ocr-space-api-key>
```

#### Optional - Advanced Settings:
```bash
JWT_ACCESS_TOKEN_LIFETIME_DAYS=30
JWT_REFRESH_TOKEN_LIFETIME_DAYS=365
EMAIL_VERIFICATION_EXPIRY_MINUTES=15
```

---

## Step 3: Choose Your Plan

### Free Trial ($200 credit for 60 days):
- **Basic Plan**: $5/month (512 MB RAM, 1 vCPU)
  - Perfect for testing and small projects
  - Covers Django + small database

### Recommended for Production:
- **Professional Plan**: $12/month (1 GB RAM, 1 vCPU)
  - Better performance
  - Handle more concurrent users

**Select**: Basic Plan (use free credits)

---

## Step 4: Add PostgreSQL Database

1. In the app configuration, click **"Add Resource"**
2. Select **"Database"**
3. Choose **"PostgreSQL"**
4. Select **"Dev Database"** ($7/month, covered by free trial)
5. Name it: `pixeltales-db`

**Important**: DigitalOcean will automatically set the `DATABASE_URL` environment variable for you!

---

## Step 5: Deploy!

1. Review all settings
2. Click **"Create Resources"**
3. Wait 5-10 minutes for first deployment
4. Watch the build logs for any errors

---

## Step 6: Post-Deployment Setup

Once deployed, you need to run migrations and create a superuser:

### Access the Console:
1. Go to your app in DigitalOcean dashboard
2. Click **"Console"** tab
3. Click **"Launch Console"**

### Run These Commands:
```bash
# Run database migrations
python manage.py migrate

# Create admin user
python manage.py createsuperuser

# Populate initial data (optional)
python manage.py populate_achievements
python manage.py populate_genres
```

---

## Step 7: Get Your Backend URL

After deployment:
1. Go to your app in the dashboard
2. Copy the URL (looks like: `https://pixeltales-backend-xxxxx.ondigitalocean.app`)
3. **Update your frontend** with this URL in `frontend/src/services/api.ts`

---

## 🔧 Troubleshooting

### Build Fails - Missing Dependencies:
**Solution**: Make sure `requirements.txt` is in the `/backend` directory

### Database Connection Error:
**Solution**: Check that PostgreSQL database is attached and `DATABASE_URL` is set

### Static Files Not Loading:
**Solution**: Make sure build command includes `collectstatic`

### CORS Errors:
**Solution**: Update `FRONTEND_URL` environment variable with your actual frontend URL

---

## 💰 Cost Breakdown (Free Trial)

Your $200 credit covers:
- **App Platform (Basic)**: $5/month × 4 months = $20
- **PostgreSQL (Dev)**: $7/month × 4 months = $28
- **Total for 4 months**: $48
- **Remaining credit**: $152 (can upgrade or use for other services)

---

## 🔒 Security Checklist

- ✅ `DEBUG=False` in production
- ✅ Strong `SECRET_KEY` (generate with: `python -c "import secrets; print(secrets.token_urlsafe(50))"`)
- ✅ `ALLOWED_HOSTS` properly configured
- ✅ Database uses PostgreSQL (not SQLite)
- ✅ API keys stored in environment variables (never in code)

---

## 📊 Monitoring Your App

DigitalOcean App Platform provides:
- **Real-time logs**: View application logs
- **Metrics**: CPU, Memory, Request rate
- **Alerts**: Set up notifications for errors
- **Automatic SSL**: HTTPS enabled by default

---

## 🚀 Next Steps

1. **Deploy**: Follow steps above
2. **Test**: Visit `https://your-app.ondigitalocean.app/api/health/`
3. **Update Frontend**: Point your frontend to the new backend URL
4. **Monitor**: Check logs and metrics regularly

---

## 📝 Quick Commands Reference

### Generate SECRET_KEY:
```bash
python -c "import secrets; print(secrets.token_urlsafe(50))"
```

### Access App Console:
Dashboard → Your App → Console → Launch Console

### View Logs:
Dashboard → Your App → Runtime Logs

### Manual Deploy:
Dashboard → Your App → Settings → Force Rebuild

---

## 🆘 Need Help?

- **DigitalOcean Docs**: https://docs.digitalocean.com/products/app-platform/
- **Django Deployment**: https://docs.djangoproject.com/en/4.2/howto/deployment/
- **Community**: https://www.digitalocean.com/community/

---

**Ready to deploy? Click "Deploy Repository" on the App Platform card!** 🎉
