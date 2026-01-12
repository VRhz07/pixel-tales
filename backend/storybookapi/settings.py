"""
Django settings for Imaginary Worlds API
Optimized for API-only backend with React frontend
"""

import os
from pathlib import Path
from dotenv import load_dotenv
from datetime import timedelta

# Load environment variables
load_dotenv()

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.getenv('SECRET_KEY', 'django-insecure-change-this-in-production')

# SECURITY WARNING: don't run with debug turned on in production!
# Default to False for safety - explicitly set DEBUG=True in local .env only
DEBUG = os.getenv('DEBUG', 'False').lower() == 'true'

# Allow all hosts in development for mobile testing
if DEBUG:
    ALLOWED_HOSTS = ['*']
else:
    ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', 'localhost,127.0.0.1').split(',')

# Application definition
# Daphne must be first for WebSocket support
INSTALLED_APPS = [
    'daphne',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'channels',
    'storybook',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',  # CORS first
    'storybook.cors_middleware.CorsPreflightMiddleware',  # Handle OPTIONS before auth
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',  # Serve static files
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'storybook.middleware.UpdateLastSeenMiddleware',  # Track user activity for real-time analytics
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'storybookapi.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'storybookapi.wsgi.application'
ASGI_APPLICATION = 'storybookapi.asgi.application'

# Database
# Use DATABASE_URL for production (Render.com) or fallback to SQLite for local
import dj_database_url

DATABASE_URL = os.getenv('DATABASE_URL')
if DATABASE_URL and DATABASE_URL.startswith('sqlite'):
    # Extract the path from sqlite:///path format
    db_path = DATABASE_URL.replace('sqlite:///', '')
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': db_path if os.path.isabs(db_path) else BASE_DIR / db_path,
        }
    }
elif DATABASE_URL:
    # PostgreSQL or other database URL
    db_config = dj_database_url.parse(DATABASE_URL, conn_max_age=0)
    
    # Close connections immediately to avoid exhausting DigitalOcean connection limit
    db_config['CONN_MAX_AGE'] = 0  # Close connections immediately (no pooling)
    db_config['CONN_HEALTH_CHECKS'] = False  # Disable health checks
    
    # Add PostgreSQL-specific optimizations
    if 'postgres' in DATABASE_URL:
        db_config['OPTIONS'] = {
            'connect_timeout': 10,
            'options': '-c statement_timeout=30000',
        }
        # No connection pooling - close immediately
        db_config['CONN_MAX_AGE'] = 0
    
    DATABASES = {
        'default': db_config
    }
else:
    # Local development default
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# Static files (CSS, JavaScript, Images)
STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

# WhiteNoise configuration for serving static files
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# Media files
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# Ensure media directory exists in production
os.makedirs(MEDIA_ROOT, exist_ok=True)

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Django REST Framework
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
}

# JWT Settings
# Long-lived tokens for mobile app experience (like Facebook)
# Users stay logged in until they manually log out
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(days=int(os.getenv('JWT_ACCESS_TOKEN_LIFETIME_DAYS', 30))),  # 30 days
    'REFRESH_TOKEN_LIFETIME': timedelta(days=int(os.getenv('JWT_REFRESH_TOKEN_LIFETIME_DAYS', 365))),  # 1 year
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': False,  # Don't blacklist to allow offline use
    'UPDATE_LAST_LOGIN': True,
}

# CORS Settings for React Frontend
CORS_ALLOWED_ORIGINS = [
    os.getenv('FRONTEND_URL', 'http://localhost:3000'),
    'http://localhost:3001',  # Alternative dev port
    'http://localhost:3100',  # Current frontend port
    'http://192.168.1.8:3000',  # Network access
    'http://192.168.1.8:3001',  # Network access
    'http://192.168.56.1:3000',  # Network access
    'http://192.168.56.1:3001',  # Network access
    'http://192.168.56.1:8000',  # Network access - backend
    'http://192.168.1.8:3001',  # Network access
    'http://26.163.247.72:3000',  # Alternative network interface
    'http://26.163.247.72:3001',
    'https://pixeltales-admin.onrender.com',
    'https://pixeltales-backend.onrender.com',
    'https://pixel-tales-yu7cx.ondigitalocean.app',  # DigitalOcean production
    'capacitor://localhost',  # Capacitor mobile app
    'ionic://localhost',  # Ionic mobile app
    'http://localhost',  # Mobile app without port
]

# Allow all origins in development OR for mobile app compatibility
if DEBUG:
    CORS_ALLOW_ALL_ORIGINS = True
else:
    # In production, allow all origins for mobile app (Capacitor uses dynamic origins)
    # This is safe because authentication is handled via JWT tokens
    CORS_ALLOW_ALL_ORIGINS = True

CORS_ALLOW_CREDENTIALS = True

# Explicit CORS settings to ensure headers are sent
CORS_ALLOW_METHODS = [
    'DELETE',
    'GET',
    'OPTIONS',
    'PATCH',
    'POST',
    'PUT',
]

CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]

# Preflight request cache (24 hours)
CORS_PREFLIGHT_MAX_AGE = 86400

# Google AI API
GOOGLE_AI_API_KEY = os.getenv('GOOGLE_AI_API_KEY')

# OCR.space API Configuration
OCR_SPACE_API_KEY = os.getenv('OCR_SPACE_API_KEY')

# Pollinations AI API Configuration
POLLINATIONS_API_KEY = os.getenv('POLLINATIONS_API_KEY')

# Replicate API Configuration
REPLICATE_API_TOKEN = os.getenv('REPLICATE_API_TOKEN')

# SendGrid Email Configuration
SENDGRID_API_KEY = os.getenv('SENDGRID_API_KEY')
FROM_EMAIL = os.getenv('FROM_EMAIL', 'noreply@pixeltales.com')
EMAIL_VERIFICATION_EXPIRY_MINUTES = int(os.getenv('EMAIL_VERIFICATION_EXPIRY_MINUTES', 15))

# Google Cloud Text-to-Speech Configuration
# Handle both local development (file path) and production (base64 encoded JSON)
import base64
import json
import tempfile

GOOGLE_CLOUD_CREDENTIALS_BASE64 = os.getenv('GOOGLE_CLOUD_CREDENTIALS_BASE64')
GOOGLE_APPLICATION_CREDENTIALS = os.getenv('GOOGLE_APPLICATION_CREDENTIALS')

if GOOGLE_CLOUD_CREDENTIALS_BASE64:
    # Production: Decode base64 and write to temp file
    try:
        credentials_json = base64.b64decode(GOOGLE_CLOUD_CREDENTIALS_BASE64).decode('utf-8')
        credentials_dict = json.loads(credentials_json)
        
        # Write to temporary file (cross-platform)
        import tempfile
        temp_dir = tempfile.gettempdir()
        temp_credentials_path = os.path.join(temp_dir, 'google-credentials.json')
        
        with open(temp_credentials_path, 'w') as f:
            json.dump(credentials_dict, f)
        
        # Set environment variable for Google Cloud libraries
        os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = temp_credentials_path
        print(f"✅ Google Cloud credentials loaded from base64: {temp_credentials_path}")
    except Exception as e:
        print(f"❌ Failed to decode Google Cloud credentials: {e}")
elif GOOGLE_APPLICATION_CREDENTIALS and os.path.exists(GOOGLE_APPLICATION_CREDENTIALS):
    # Local development: Use file path directly
    os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = GOOGLE_APPLICATION_CREDENTIALS
    print(f"✅ Google Cloud credentials loaded from file: {GOOGLE_APPLICATION_CREDENTIALS}")
else:
    print("⚠️ Google Cloud TTS credentials not configured. TTS features will be disabled.")

# Cache configuration for memory efficiency - MINIMAL for WebSocket mode
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        'LOCATION': 'unique-snowflake',
        'OPTIONS': {
            'MAX_ENTRIES': 300,  # REDUCED to 300 entries for WebSocket mode
            'CULL_FREQUENCY': 3,  # Cull cache more frequently
        }
    }
}

# Channels Configuration - ULTRA MINIMAL for free tier
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels.layers.InMemoryChannelLayer',
        'CONFIG': {
            'capacity': 50,  # REDUCED: Only 50 messages in memory
            'expiry': 30,  # REDUCED: Messages expire after 30 seconds
        },
    },
}

# ASGI application timeout settings for memory efficiency
ASGI_APPLICATION = 'storybookapi.asgi.application'
ASGI_THREADS = 1  # Single thread for ASGI to reduce memory

# Render.com specific settings
RENDER = os.getenv('RENDER', 'False').lower() == 'true'
if RENDER:
    # Get the Render service URL
    RENDER_EXTERNAL_HOSTNAME = os.getenv('RENDER_EXTERNAL_HOSTNAME')
    if RENDER_EXTERNAL_HOSTNAME:
        ALLOWED_HOSTS.append(RENDER_EXTERNAL_HOSTNAME)
        # Allow CORS from any origin in production (you can restrict this later)
        CORS_ALLOW_ALL_ORIGINS = True
    
    # CSRF settings for Render
    CSRF_TRUSTED_ORIGINS = [
        f'https://{RENDER_EXTERNAL_HOSTNAME}' if RENDER_EXTERNAL_HOSTNAME else '',
        'https://pixeltales-admin.onrender.com',
        'https://pixeltales-backend.onrender.com',
        'https://pixel-tales-yu7cx.ondigitalocean.app',
    ]
    # Filter out empty strings
    CSRF_TRUSTED_ORIGINS = [origin for origin in CSRF_TRUSTED_ORIGINS if origin]

# DigitalOcean specific settings
DIGITALOCEAN = os.getenv('DIGITALOCEAN', 'False').lower() == 'true'
if DIGITALOCEAN or not DEBUG:
    # Ensure DigitalOcean URL is in CSRF trusted origins
    if 'https://pixel-tales-yu7cx.ondigitalocean.app' not in CSRF_TRUSTED_ORIGINS:
        CSRF_TRUSTED_ORIGINS = getattr(locals(), 'CSRF_TRUSTED_ORIGINS', [])
        CSRF_TRUSTED_ORIGINS.append('https://pixel-tales-yu7cx.ondigitalocean.app')

# Logging Configuration
# Memory-efficient logging for production
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'simple': {
            'format': '{levelname} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'simple',
            'level': 'WARNING' if not DEBUG else 'INFO',  # Reduce logs in production
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'WARNING' if not DEBUG else 'INFO',
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': 'WARNING' if not DEBUG else 'INFO',
            'propagate': False,
        },
        'django.server': {
            'handlers': ['console'],
            'level': 'WARNING' if not DEBUG else 'INFO',
            'propagate': False,
        },
        'storybook': {
            'handlers': ['console'],
            'level': 'WARNING' if not DEBUG else 'INFO',
            'propagate': False,
        },
    },
}

# Security Settings
if not DEBUG:
    SECURE_BROWSER_XSS_FILTER = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    X_FRAME_OPTIONS = 'DENY'
    # Don't force SSL redirect on Render - Render's proxy handles HTTPS
    if not RENDER:
        SECURE_SSL_REDIRECT = True
        SESSION_COOKIE_SECURE = True
        CSRF_COOKIE_SECURE = True
        SECURE_HSTS_SECONDS = 31536000
        SECURE_HSTS_INCLUDE_SUBDOMAINS = True
        SECURE_HSTS_PRELOAD = True
