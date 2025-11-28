# 📚 Pixel Tales - AI-Powered Storytelling App

An interactive mobile application that empowers children to create, illustrate, and share their own stories using AI assistance.

## ✨ Features

### Story Creation
- 📝 **Manual Story Creation** - Write your own stories with drawing tools
- 🤖 **AI-Assisted Generation** - Generate stories with Google Gemini AI
- 🎨 **Canvas Drawing** - Draw illustrations for your story pages
- 📸 **Photo Stories** - Create stories from photos with OCR
- 🎭 **Character Library** - Design and save reusable characters

### Collaboration
- 👥 **Real-time Collaboration** - Co-author stories with friends
- 💬 **Messaging System** - Chat with other creators
- 🔔 **Notifications** - Stay updated on story interactions
- 🤝 **Social Features** - Follow friends, like and comment on stories

### Content & Safety
- 🛡️ **Profanity Filter** - Keep content child-friendly
- 👨‍👩‍👧 **Parent Dashboard** - Monitor and manage child accounts
- 📧 **Email Verification** - Secure account creation
- 🎯 **Achievement System** - Unlock rewards as you create

### Personalization
- 🌓 **Dark Mode** - Easy on the eyes
- 🌍 **Multi-language Support** - Automatic translation
- 🎵 **Sound Effects** - Immersive audio experience
- 📖 **Text-to-Speech** - Listen to stories
- 🎤 **Speech-to-Text** - Voice input for story creation

### Offline Support
- 📴 **Offline Mode** - Access your stories anywhere
- 🔄 **Auto-sync** - Seamlessly sync when back online
- 💾 **Local Storage** - Your stories are always available

## 🏗️ Tech Stack

### Frontend
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Mobile**: Capacitor (iOS & Android)
- **State Management**: Zustand
- **UI**: TailwindCSS
- **Canvas**: Fabric.js
- **AI Integration**: Google Gemini API

### Backend
- **Framework**: Django 4.2.7
- **API**: Django REST Framework
- **Database**: SQLite (production-ready) / PostgreSQL (optional)
- **Real-time**: Django Channels + WebSockets
- **Authentication**: JWT (SimpleJWT)
- **Email**: SendGrid
- **Deployment**: Render.com

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- Git

### Backend Setup

```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your API keys

# Run migrations
python manage.py migrate

# Create admin user
python manage.py createsuperuser

# Start server
python manage.py runserver
```

### Frontend Setup

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your API keys

# Start development server
npm run dev
```

Visit: http://localhost:3100

## 📱 Mobile Build

### Android

```bash
# Build frontend
cd frontend
npm run build

# Sync with Capacitor
cd ..
npx cap sync android

# Open in Android Studio
npx cap open android

# Build APK from Android Studio
# Build → Build Bundle(s) / APK(s) → Build APK(s)
```

See `APK_BUILD_GUIDE.md` for detailed instructions.

## 🌐 Deployment

### Deploy Backend to Render.com

See `RENDER_DEPLOYMENT_STEPS.md` for complete deployment guide.

Quick steps:
1. Push code to GitHub
2. Connect repository to Render.com
3. Deploy with one click
4. Add environment variables
5. Add persistent disk for database

### Environment Variables

**Backend (.env)**:
```env
DEBUG=False
SECRET_KEY=your-secret-key
ALLOWED_HOSTS=your-domain.com
GOOGLE_AI_API_KEY=your-gemini-key
SENDGRID_API_KEY=your-sendgrid-key
DATABASE_URL=sqlite:///data/db.sqlite3
```

**Frontend (.env)**:
```env
VITE_API_BASE_URL=https://your-api.com/api
VITE_GEMINI_API_KEY=your-gemini-key
VITE_OCR_SPACE_API_KEY=your-ocr-key
```

## 📖 Documentation

- 📋 **[Deployment Checklist](DEPLOYMENT_CHECKLIST.md)** - Track deployment progress
- 🚀 **[Quick Deploy Guide](QUICK_DEPLOY.md)** - 5-minute deployment
- 🌐 **[Render Deployment](RENDER_DEPLOYMENT_STEPS.md)** - Step-by-step backend deployment
- 📱 **[APK Build Guide](APK_BUILD_GUIDE.md)** - Build Android app
- 📚 **[Full Documentation](Documentation/)** - Complete feature documentation

## 🧪 Testing

```bash
# Backend tests
cd backend
python manage.py test

# Frontend tests
cd frontend
npm run test

# Test deployment
python backend/test_deployment.py https://your-api.com
```

## 🔒 Security Features

- JWT authentication with long-lived tokens
- CORS protection
- CSRF protection
- SQL injection prevention
- XSS protection
- Profanity filtering
- Parent controls
- Email verification

## 📊 Database

### SQLite (Default)
- Perfect for MVP and testing
- Handles 100k+ users
- Easy backup and restore
- Single file database

### PostgreSQL (Optional)
- Recommended for 10k+ active users
- Better for concurrent writes
- Advanced query optimization
- Easy migration path

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📝 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Google Gemini AI for story generation
- Pollinations.ai for image generation
- SendGrid for email services
- Render.com for hosting

## 📞 Support

- **Documentation**: See `/Documentation` folder
- **Issues**: Open an issue on GitHub
- **Email**: support@pixeltales.com

## 🗺️ Roadmap

- [ ] iOS app release
- [ ] Advanced AI illustration generation
- [ ] Story templates marketplace
- [ ] Collaborative story contests
- [ ] Print-on-demand integration
- [ ] Voice narration with character voices
- [ ] AR story experiences

---

**Built with ❤️ for young storytellers everywhere**

Version: 1.0.0
Last Updated: 2024
