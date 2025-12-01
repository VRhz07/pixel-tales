#!/usr/bin/env python
"""
Create admin user on Render without shell access.
Run this as a one-time job on Render.

Usage:
    Set these environment variables in Render:
    - ADMIN_USERNAME (optional, defaults to 'admin')
    - ADMIN_EMAIL (optional, defaults to 'admin@example.com')
    - ADMIN_PASSWORD (required!)
    
    Then run: python create_render_admin.py
"""
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'storybookapi.settings')
django.setup()

from django.contrib.auth.models import User

def create_admin():
    """Create admin user from environment variables."""
    
    # Get credentials from environment variables
    username = os.environ.get('ADMIN_USERNAME', 'admin')
    email = os.environ.get('ADMIN_EMAIL', 'admin@example.com')
    password = os.environ.get('ADMIN_PASSWORD')
    
    # Validate password
    if not password:
        print("❌ ERROR: ADMIN_PASSWORD environment variable is required!")
        print("\nUsage:")
        print("  Set ADMIN_PASSWORD in Render environment variables")
        print("  Optional: ADMIN_USERNAME, ADMIN_EMAIL")
        sys.exit(1)
    
    # Check if admin already exists
    if User.objects.filter(username=username).exists():
        admin = User.objects.get(username=username)
        print(f"✅ Admin user '{username}' already exists!")
        print(f"   Email: {admin.email}")
        print(f"   Is superuser: {admin.is_superuser}")
        print(f"   Is staff: {admin.is_staff}")
        
        # Update password if provided
        if password:
            admin.set_password(password)
            admin.save()
            print(f"   Password updated!")
        
        return admin
    
    # Create new admin user
    try:
        admin = User.objects.create_superuser(
            username=username,
            email=email,
            password=password
        )
        print(f"\n🎉 SUCCESS! Admin user created!")
        print(f"   Username: {username}")
        print(f"   Email: {email}")
        print(f"   Password: [hidden]")
        print(f"\n✅ You can now login to the admin dashboard at:")
        print(f"   https://your-admin.onrender.com/admin")
        
        return admin
        
    except Exception as e:
        print(f"❌ ERROR creating admin user: {e}")
        sys.exit(1)

if __name__ == '__main__':
    print("=" * 60)
    print("Creating Admin User on Render")
    print("=" * 60)
    create_admin()
    print("=" * 60)
