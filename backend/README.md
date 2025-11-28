# Pixel Tales API Backend

Django REST API backend for the Pixel Tales storytelling platform.

## Features

- 🔐 **JWT Authentication** - Secure user authentication with refresh tokens
- 👥 **User Management** - Child, Parent, and Teacher account types
- 📚 **Story Management** - Create, edit, publish, and manage stories
- 🎨 **Character Creation** - Design and save custom characters
- 🏆 **Achievement System** - Gamified progress tracking
- 🔔 **Notifications** - Real-time user notifications
- 👨‍👩‍👧‍👦 **Parental Controls** - Parent-child account linking
- 🎯 **Canvas Integration** - Story and character illustration support

## Quick Start

### 1. Setup Virtual Environment

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# Mac/Linux
source venv/bin/activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Environment Configuration

Copy `.env.example` to `.env` and update the values:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:
- Set a secure `SECRET_KEY`
- Add your `GOOGLE_AI_API_KEY` for AI features
- Configure other settings as needed

### 4. Database Setup

```bash
python manage.py makemigrations
python manage.py migrate
```

### 5. Create Superuser

```bash
python manage.py createsuperuser
```

### 6. Run Development Server

```bash
python manage.py runserver
```

The API will be available at `http://localhost:8000/api/`

## API Endpoints

### Authentication
- `POST /api/auth/login/` - User login
- `POST /api/auth/register/` - User registration
- `POST /api/auth/refresh/` - Refresh JWT token
- `POST /api/auth/logout/` - User logout
- `GET /api/auth/profile/` - Get user profile

### Stories
- `GET /api/stories/` - List published stories
- `POST /api/stories/create/` - Create new story
- `GET /api/stories/{id}/` - Get story details
- `PUT /api/stories/{id}/update/` - Update story
- `DELETE /api/stories/{id}/delete/` - Delete story

### Characters
- `GET /api/characters/` - List user's characters
- `POST /api/characters/create/` - Create new character
- `GET /api/characters/{id}/` - Get character details
- `PUT /api/characters/{id}/update/` - Update character

### Comments & Ratings
- `GET /api/stories/{id}/comments/` - Get story comments
- `POST /api/stories/{id}/comments/create/` - Add comment
- `POST /api/stories/{id}/rate/` - Rate story

### Achievements & Notifications
- `GET /api/achievements/` - List all achievements
- `GET /api/achievements/user/` - Get user achievements
- `GET /api/notifications/` - Get user notifications
- `PUT /api/notifications/{id}/read/` - Mark notification as read

## Project Structure

```
backend/
├── manage.py                 # Django management script
├── requirements.txt          # Python dependencies
├── .env                     # Environment variables
├── storybookapi/            # Django project settings
│   ├── settings.py          # Main settings file
│   ├── urls.py             # URL routing
│   ├── wsgi.py             # WSGI configuration
│   └── asgi.py             # ASGI configuration
└── storybook/              # Main Django app
    ├── models.py           # Database models
    ├── views.py            # API views
    ├── serializers.py      # DRF serializers
    ├── urls.py             # App URL routing
    ├── admin.py            # Django admin config
    ├── jwt_auth.py         # JWT authentication
    └── jwt_decorators.py   # Custom decorators
```

## Database Models

### Core Models
- **UserProfile** - Extended user information and account types
- **Story** - User-created stories with canvas data
- **Character** - Custom character designs
- **Comment** - Story comments and discussions
- **Rating** - Story rating system

### Social Features
- **Friendship** - Friend connections between users
- **Notification** - User notification system

### Gamification
- **Achievement** - Available achievements
- **UserAchievement** - User progress tracking

### Family Features
- **ParentChildRelationship** - Parent-child account linking
- **TeacherStudentRelationship** - Teacher-student connections

## Admin Interface

Access the Django admin at `http://localhost:8000/admin/` with your superuser credentials.

The admin interface provides:
- User management with profile information
- Content moderation tools
- Achievement system management
- Relationship management (parent-child, teacher-student)

## Development Notes

### CORS Configuration
The API is configured to accept requests from `http://localhost:3000` (React frontend). Update `FRONTEND_URL` in `.env` if using a different port.

### File Uploads
Media files (avatars, story covers, character images) are stored in the `media/` directory during development.

### JWT Tokens
- Access tokens expire after 60 minutes (configurable)
- Refresh tokens expire after 24 hours (configurable)
- Tokens are automatically blacklisted on logout

## Production Deployment

For production deployment:

1. Set `DEBUG=False` in `.env`
2. Configure a production database (PostgreSQL recommended)
3. Set up proper media file serving (AWS S3, etc.)
4. Configure CORS for your production frontend URL
5. Use a proper WSGI server (gunicorn, uWSGI)
6. Set up HTTPS with proper SSL certificates

## API Testing

Use tools like Postman, curl, or the Django REST framework browsable API to test endpoints:

```bash
# Register a new user
curl -X POST http://localhost:8000/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "testpassword123",
    "confirm_password": "testpassword123",
    "user_type": "child"
  }'

# Login
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpassword123"
  }'
```
