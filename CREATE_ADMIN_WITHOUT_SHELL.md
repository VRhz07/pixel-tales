# 🔐 Create Admin User on Render (Without Shell Access)

## Problem
Render's Shell feature requires a paid plan, but you need to create an admin user on your production database.

---

## ✅ Solution: Use Django Management Command via Deploy Hook

We can create an admin user automatically during deployment or trigger it via a one-time job.

---

## 🎯 Method 1: One-Time Job (Recommended)

Render allows you to run one-time jobs for free!

### Step 1: Create a Script to Create Admin

**File: `backend/create_render_admin.py`**

This script will create an admin user with environment variables.

```python
#!/usr/bin/env python
"""
Create admin user on Render without shell access.
Run this as a one-time job on Render.
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'storybookapi.settings')
django.setup()

from django.contrib.auth.models import User

# Get credentials from environment variables
ADMIN_USERNAME = os.environ.get('ADMIN_USERNAME', 'admin')
ADMIN_EMAIL = os.environ.get('ADMIN_EMAIL', 'admin@example.com')
ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD')

if not ADMIN_PASSWORD:
    print("❌ ERROR: ADMIN_PASSWORD environment variable is required!")
    exit(1)

# Check if admin already exists
if User.objects.filter(username=ADMIN_USERNAME).exists():
    print(f"✅ Admin user '{ADMIN_USERNAME}' already exists!")
    admin = User.objects.get(username=ADMIN_USERNAME)
    print(f"   Email: {admin.email}")
    print(f"   Is superuser: {admin.is_superuser}")
    print(f"   Is staff: {admin.is_staff}")
else:
    # Create admin user
    admin = User.objects.create_superuser(
        username=ADMIN_USERNAME,
        email=ADMIN_EMAIL,
        password=ADMIN_PASSWORD
    )
    print(f"✅ Admin user '{ADMIN_USERNAME}' created successfully!")
    print(f"   Email: {admin.email}")
    print(f"   Username: {ADMIN_USERNAME}")
    print(f"   Password: [hidden]")
    print("\n🎉 You can now login to the admin dashboard!")
```

### Step 2: Commit the Script

```bash
git add backend/create_render_admin.py
git commit -m "Add script to create admin on Render"
git push origin main
```

### Step 3: Run as One-Time Job on Render

1. **Go to Render Dashboard**: https://dashboard.render.com/
2. **Click "New +"** → **"Job"**
3. **Connect your repository**
4. **Configure the Job:**
   ```
   Name: create-admin
   Environment: Same as your backend (Python)
   Build Command: pip install -r backend/requirements.txt
   Start Command: cd backend && python create_render_admin.py
   ```

5. **Add Environment Variables** (click "Advanced"):
   ```
   DATABASE_URL: [Copy from your backend service]
   ADMIN_USERNAME: admin
   ADMIN_EMAIL: admin@yourdomain.com
   ADMIN_PASSWORD: YourSecurePassword123!
   SECRET_KEY: [Copy from your backend service]
   ```

6. **Click "Create Job"**

7. **Job will run once** and create the admin user!

8. **Check logs** to confirm success

---

## 🎯 Method 2: Add to Existing Script

If you already have a `create_admin.py` script in your backend, we can modify it to use environment variables.

### Update `backend/create_admin.py`:

```python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'storybookapi.settings')
django.setup()

from django.contrib.auth.models import User

def create_admin():
    # Try to get from environment first, fallback to input
    username = os.environ.get('ADMIN_USERNAME') or input('Username: ')
    email = os.environ.get('ADMIN_EMAIL') or input('Email: ')
    password = os.environ.get('ADMIN_PASSWORD')
    
    if not password:
        from getpass import getpass
        password = getpass('Password: ')
        password_confirm = getpass('Password (again): ')
        if password != password_confirm:
            print("❌ Passwords don't match!")
            return
    
    if User.objects.filter(username=username).exists():
        print(f"✅ User '{username}' already exists!")
        return
    
    User.objects.create_superuser(
        username=username,
        email=email,
        password=password
    )
    print(f"✅ Admin user '{username}' created!")

if __name__ == '__main__':
    create_admin()
```

Then run as a one-time job (same as Method 1).

---

## 🎯 Method 3: Use Django Admin API Endpoint

Create an endpoint that creates admin users (with strong security).

### Step 1: Create a Secure Admin Creation Endpoint

**File: `backend/storybook/admin_setup_views.py`**

```python
from django.contrib.auth.models import User
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
import os

SETUP_SECRET_KEY = os.environ.get('ADMIN_SETUP_SECRET')

@csrf_exempt
@require_http_methods(["POST"])
def create_admin_user(request):
    """
    One-time endpoint to create admin user.
    Requires ADMIN_SETUP_SECRET environment variable to match.
    """
    import json
    
    # Security check
    data = json.loads(request.body)
    provided_secret = data.get('secret')
    
    if not SETUP_SECRET_KEY:
        return JsonResponse({'error': 'Setup not enabled'}, status=400)
    
    if provided_secret != SETUP_SECRET_KEY:
        return JsonResponse({'error': 'Invalid secret'}, status=403)
    
    username = data.get('username', 'admin')
    email = data.get('email', 'admin@example.com')
    password = data.get('password')
    
    if not password:
        return JsonResponse({'error': 'Password required'}, status=400)
    
    # Check if admin exists
    if User.objects.filter(username=username).exists():
        return JsonResponse({
            'status': 'exists',
            'message': f'User {username} already exists'
        })
    
    # Create admin
    User.objects.create_superuser(
        username=username,
        email=email,
        password=password
    )
    
    return JsonResponse({
        'status': 'created',
        'message': f'Admin user {username} created successfully'
    })
```

**Add to `backend/storybook/urls.py`:**

```python
from .admin_setup_views import create_admin_user

urlpatterns = [
    # ... existing patterns ...
    path('setup/create-admin/', create_admin_user, name='setup_create_admin'),
]
```

### Step 2: Deploy with Setup Secret

Add to your backend environment variables on Render:
```
ADMIN_SETUP_SECRET=your-very-long-random-secret-key-here
```

### Step 3: Call the Endpoint

Use curl or Postman:

```bash
curl -X POST https://your-backend.onrender.com/api/setup/create-admin/ \
  -H "Content-Type: application/json" \
  -d '{
    "secret": "your-very-long-random-secret-key-here",
    "username": "admin",
    "email": "admin@yourdomain.com",
    "password": "YourSecurePassword123!"
  }'
```

### Step 4: Remove the Endpoint (Security)

After creating the admin:
1. Remove the `ADMIN_SETUP_SECRET` environment variable
2. Comment out or delete the endpoint
3. Redeploy

---

## 🎯 Method 4: Use Render's Build Hook

### Add Admin Creation to Build Process

**Update `backend/render.yaml` or build command:**

Add this to your build script:

```yaml
services:
  - type: web
    name: pixeltales-backend
    env: python
    buildCommand: |
      pip install -r requirements.txt
      python manage.py migrate
      python -c "
      import os, django
      os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'storybookapi.settings')
      django.setup()
      from django.contrib.auth.models import User
      if not User.objects.filter(username='admin').exists():
          User.objects.create_superuser('admin', os.environ.get('ADMIN_EMAIL', 'admin@example.com'), os.environ.get('ADMIN_PASSWORD', 'changeme'))
          print('✅ Admin created')
      else:
          print('✅ Admin exists')
      "
```

Add environment variables:
```
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=YourSecurePassword123!
```

This creates admin automatically on each deploy if it doesn't exist.

---

## 📋 Recommended Approach

**For your situation, I recommend Method 1 (One-Time Job):**

✅ **Free** - One-time jobs are free on Render  
✅ **Secure** - Uses environment variables  
✅ **Simple** - Just create and run once  
✅ **No code changes** - Can use existing script  

---

## 🚀 Quick Steps (Method 1 Summary)

1. Create `backend/create_render_admin.py` (script provided above)
2. Commit and push to GitHub
3. Go to Render → New → Job
4. Configure job with database credentials
5. Add `ADMIN_PASSWORD` environment variable
6. Run job once
7. Check logs for success
8. Login to admin dashboard!

---

**Would you like me to:**
1. Create the `create_render_admin.py` script file for you?
2. Help you set up the one-time job on Render?
3. Use a different method that suits your needs better?

Let me know which method you prefer!
