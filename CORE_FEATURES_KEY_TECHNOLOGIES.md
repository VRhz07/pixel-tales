# Key Technologies & Additional Information

## Key Technologies

### Frontend Stack
- **React 19** with TypeScript
- **Vite** - Fast build tool
- **Zustand** - Lightweight state management
- **React Router** - Client-side routing
- **TailwindCSS** - Utility-first CSS
- **Framer Motion** - Animations
- **Paper.js** - Advanced canvas operations

### Mobile (Capacitor Plugins)
- `@capacitor/core` - Core native functionality
- `@capacitor/preferences` - Native storage
- `@capacitor/status-bar` - Status bar styling
- `@capacitor/keyboard` - Keyboard management
- `@capacitor/share` - Native share dialog
- `@capacitor-community/text-to-speech` - Device TTS

### Backend Stack
- **Django 5.0** - Web framework
- **Django Channels** - WebSocket support
- **Django REST Framework** - API framework
- **PostgreSQL** - Database
- **Redis** - Channel layer for WebSockets
- **Daphne** - ASGI server

### AI & Services
- **Google Gemini AI 2.5 Flash** - Story generation
- **Pollinations.ai** - Image generation
- **Google Cloud Text-to-Speech** - Premium voices
- **Tesseract.js** - OCR (handwriting recognition)

### Infrastructure
- **Capacitor** - Native mobile wrapper
- **Android Studio** - APK building
- **WebSocket** - Real-time communication
- **JWT** - Authentication tokens

---

## API Endpoints Overview

### Authentication
```
POST   /api/auth/login/          # Login user
POST   /api/auth/register/       # Register new user
POST   /api/auth/refresh/        # Refresh JWT token
GET    /api/auth/user/           # Get current user
POST   /api/auth/logout/         # Logout user
```

### Stories
```
GET    /api/stories/             # List all stories
POST   /api/stories/             # Create new story
GET    /api/stories/:id/         # Get story details
PUT    /api/stories/:id/         # Update story
DELETE /api/stories/:id/         # Delete story
POST   /api/stories/:id/publish/ # Publish story
GET    /api/stories/:id/pages/   # Get story pages
```

### Collaboration
```
WS     /ws/collaborate/:sessionId/  # WebSocket for real-time collaboration
POST   /api/collaborate/create/     # Create collaboration session
POST   /api/collaborate/invite/     # Invite user to session
GET    /api/collaborate/invites/    # Get pending invites
```

### Gamification
```
GET    /api/profile/xp/              # Get user XP and level
POST   /api/achievements/unlock/     # Unlock achievement
GET    /api/achievements/            # List all achievements
GET    /api/leaderboard/             # Get top users by XP
```

### TTS
```
POST   /api/tts/synthesize/      # Synthesize speech (cloud TTS)
GET    /api/tts/voices/          # List available voices
```

---

## Environment Variables

### Frontend (.env)
```bash
VITE_API_BASE_URL=http://localhost:8000/api
VITE_WS_BASE_URL=ws://localhost:8000
VITE_GEMINI_API_KEY=your_gemini_api_key_here
VITE_POLLINATIONS_API_URL=https://image.pollinations.ai/prompt
```

### Backend (.env)
```bash
# Django
SECRET_KEY=your_secret_key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/pixeltales

# Redis (for Channels)
REDIS_URL=redis://localhost:6379/0

# Google Cloud TTS
GOOGLE_APPLICATION_CREDENTIALS=/path/to/credentials.json

# Email (SendGrid)
SENDGRID_API_KEY=your_sendgrid_key
DEFAULT_FROM_EMAIL=noreply@pixeltales.com
```

---

## Building & Running

### Development

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

**Backend:**
```bash
cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

**Run Daphne (for WebSocket):**
```bash
daphne -b 0.0.0.0 -p 8000 storybookapi.asgi:application
```

### Mobile Build

**Build for Android:**
```bash
# Build frontend
cd frontend
npm run build

# Sync with Capacitor
npm run cap:sync

# Open in Android Studio
npm run cap:android

# Or build APK directly
cd ../
./build-beta-apk.sh
```

**APK Output:**
```
android/app/build/outputs/apk/release/app-release.apk
```

---

## Performance Optimizations

### Frontend
- **Code splitting** with React.lazy()
- **Image optimization** with base64 encoding for small images
- **Service worker** for offline caching
- **Debounced** collaboration updates (300ms)
- **Virtualized lists** for large story collections
- **Memoized components** with React.memo()

### Backend
- **Database indexing** on frequently queried fields
- **Query optimization** with select_related() and prefetch_related()
- **Cached responses** for public stories
- **Pagination** for large datasets (50 items per page)
- **Async WebSocket** handlers with Django Channels

### Mobile
- **Native storage** with Capacitor Preferences (faster than localStorage)
- **Image compression** before upload (max 1MB)
- **Lazy loading** of story pages
- **Background sync** for offline stories
- **Memory cleanup** on canvas operations

---

## Security Features

### Authentication
- **JWT tokens** with 24-hour expiration
- **Refresh tokens** for seamless re-authentication
- **Password hashing** with Django's PBKDF2
- **Rate limiting** on login attempts

### Data Protection
- **Input sanitization** with profanity filter
- **XSS prevention** with React's automatic escaping
- **CSRF protection** on all POST requests
- **Content moderation** with AI safety checks (Gemini)

### Parental Controls
- **Parent accounts** can monitor child activity
- **Story visibility** settings (private/public)
- **Friend request** approval system
- **Age-appropriate** content filtering

---

## Testing

### Frontend Tests
```bash
cd frontend
npm run test
npm run test:e2e  # End-to-end tests
```

### Backend Tests
```bash
cd backend
python manage.py test
python manage.py test storybook.tests.test_auth
python manage.py test storybook.tests.test_collaboration
```

### Key Test Files
- `frontend/src/__tests__/` - Component tests
- `backend/storybook/tests/` - API and model tests
- `test-achievements.js` - Achievement system tests

---

## Deployment

### Frontend (Netlify/Vercel)
```bash
npm run build
# Deploy dist/ folder
```

### Backend (Render/Railway)
```bash
# Set environment variables
# Run migrations on first deploy
python manage.py migrate
python manage.py collectstatic --noinput

# Start with Daphne
daphne -b 0.0.0.0 -p $PORT storybookapi.asgi:application
```

### Database
- **PostgreSQL** on Render/Supabase
- **Redis** on Render/Upstash for WebSocket

---

## Troubleshooting

### Common Issues

**1. WebSocket Connection Failed**
- Check Redis is running: `redis-cli ping`
- Verify Daphne is running on correct port
- Check firewall allows WebSocket connections

**2. TTS Not Working**
- Verify Google Cloud credentials are set
- Check API quota hasn't been exceeded
- Fall back to device TTS if cloud fails

**3. Canvas Performance Issues**
- Reduce canvas resolution for mobile
- Clear undo history after 20 operations
- Use requestAnimationFrame for smooth drawing

**4. Story Images Not Loading**
- Check Pollinations.ai is accessible
- Verify image URLs are HTTPS
- Implement retry logic for failed requests

**5. Mobile App Crashes**
- Check Android minSdk version (24+)
- Clear app cache and data
- Rebuild with `./rebuild-apk-fresh.sh`

---

## Contributing

### Code Style
- **Frontend:** ESLint + Prettier
- **Backend:** PEP 8 (Black formatter)
- **Commits:** Conventional Commits format

### Pull Request Process
1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

---

## License & Credits

**Pixel Tales** - Children's Storytelling App

**Technologies Used:**
- React, TypeScript, Django, Capacitor
- Google Gemini AI, Pollinations.ai
- Google Cloud Text-to-Speech

**Documentation:** For more details, see `/Documentation` folder

**Last Updated:** January 6, 2026
