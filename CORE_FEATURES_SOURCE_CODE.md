# Pixel Tales Mobile App - Core Features Source Code Documentation

**Last Updated:** January 6, 2026  
**App Name:** Pixel Tales  
**Platform:** Mobile (Android via Capacitor) + Web  
**Tech Stack:** React + TypeScript (Frontend), Django + Channels (Backend)

---

## Table of Contents

1. [App Overview](#app-overview)
2. [Architecture](#architecture)
3. [Main Features](#main-features)
4. [Core Source Code](#core-source-code)
5. [Key Technologies](#key-technologies)

---

## App Overview

**Pixel Tales** is a children's storytelling mobile application that allows kids (ages 4-12) to:
- Create stories using AI assistance (Gemini AI)
- Draw illustrations with advanced canvas tools
- Read stories with Text-to-Speech (TTS)
- Collaborate with friends in real-time
- Play educational games based on stories
- Earn XP and achievements

The app supports **English** and **Tagalog** languages and includes parental controls.

---

## Architecture

### Frontend Architecture
```
frontend/
├── src/
│   ├── pages/           # Main page components
│   ├── components/      # Reusable UI components
│   ├── services/        # API and business logic services
│   ├── stores/          # Zustand state management
│   ├── hooks/           # Custom React hooks
│   └── types/           # TypeScript type definitions
```

### Backend Architecture
```
backend/
├── storybook/
│   ├── models.py        # Database models
│   ├── views.py         # API endpoints
│   ├── serializers.py   # Data serialization
│   ├── consumers.py     # WebSocket handlers
│   └── services/        # Business logic
```

---

## Main Features

### 1. **Authentication System**
- Multi-user support (Child, Parent, Teacher)
- JWT-based authentication
- Persistent login with Capacitor storage
- Anonymous browsing mode

### 2. **AI Story Generation**
- Powered by Google Gemini AI
- Generates complete stories with illustrations
- Support for multiple genres and art styles
- Page-by-page narrative structure

### 3. **Canvas Drawing System**
- Advanced drawing tools (brush, shapes, eraser)
- Real-time collaboration
- Smart guides and layers
- Export to PNG/PDF

### 4. **Text-to-Speech (TTS)**
- Hybrid TTS (Cloud + Device)
- Premium voices via Google Cloud TTS
- Progress tracking and playback controls
- Multi-language support (EN/TL)

### 5. **Real-time Collaboration**
- WebSocket-based collaboration
- Live cursor tracking
- Voting system for story decisions
- Presence indicators

### 6. **Gamification & XP System**
- Experience points for activities
- Level progression (500 XP per level)
- Achievements and rewards
- Avatar borders and customization

### 7. **Offline Support**
- Local story storage
- Offline game caching
- Background sync when online
- Capacitor Preferences API

---

## Core Source Code

### 1. App Entry Point & Routing

**File:** `frontend/src/main.tsx`

```typescript
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { Capacitor } from '@capacitor/core'
import { StatusBar, Style } from '@capacitor/status-bar'
import { Keyboard } from '@capacitor/keyboard'
import { initializeSafeArea } from './utils/safeAreaHelper'

// Detect if running in Capacitor and apply body class for safe areas
if (Capacitor.isNativePlatform()) {
  document.body.classList.add('capacitor');
  
  // Initialize status bar for mobile
  const initializeStatusBar = async () => {
    try {
      await StatusBar.setOverlaysWebView({ overlay: false });
      await StatusBar.setBackgroundColor({ color: '#1a0d2e' });
      await StatusBar.setStyle({ style: Style.Dark });
    } catch (error) {
      console.error('Error initializing status bar:', error);
    }
  };
  
  initializeStatusBar();
  initializeSafeArea();
  
  // Fix keyboard gray gap
  Keyboard.setResizeMode({ mode: 'none' });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

**Key Routes (from App.tsx):**
```typescript
<Routes>
  <Route path="/auth" element={<AuthPage />} />
  <Route path="/home" element={<HomePage />} />
  <Route path="/create-story-manual" element={<ManualStoryCreationPage />} />
  <Route path="/canvas-drawing" element={<CanvasDrawingPage />} />
  <Route path="/story/:storyId" element={<StoryReaderPage />} />
  <Route path="/social" element={<EnhancedSocialPage />} />
  <Route path="/games" element={<GamesPage />} />
  <Route path="/parent-dashboard" element={<ParentDashboardPage />} />
</Routes>
```

---

### 2. Authentication System

**Frontend Store:** `frontend/src/stores/authStore.ts`

```typescript
export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  
  checkAuth: async () => {
    const token = await storage.getItem('access_token');
    if (!token) return false;
    
    try {
      const response = await api.get('/auth/user/');
      set({ user: response.data, isAuthenticated: true });
      return true;
    } catch (error) {
      await get().logout();
      return false;
    }
  },
  
  login: async (username: string, password: string) => {
    const response = await authService.login(username, password);
    await storage.setItem('access_token', response.access);
    await storage.setItem('refresh_token', response.refresh);
    set({ user: response.user, isAuthenticated: true });
  },
  
  logout: async () => {
    await storage.removeItem('access_token');
    await storage.removeItem('refresh_token');
    set({ user: null, isAuthenticated: false });
  }
}));
```

**Backend:** `backend/storybook/jwt_auth.py`

```python
from rest_framework_simplejwt.tokens import RefreshToken

def login_user(request):
    user = authenticate(
        username=request.data.get('username'),
        password=request.data.get('password')
    )
    
    if not user:
        return Response({'error': 'Invalid credentials'}, status=400)
    
    refresh = RefreshToken.for_user(user)
    
    return Response({
        'access': str(refresh.access_token),
        'refresh': str(refresh),
        'user': UserSerializer(user).data
    })
```

---

### 3. AI Story Generation (Gemini AI)

**File:** `frontend/src/services/geminiService.ts`

```typescript
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

export const generateStory = async (params: StoryGenerationParams) => {
  const { prompt, genres, ageGroup, artStyle, pageCount = 5, language = 'en' } = params;
  
  const fullPrompt = `Create a children's story:
  
Story Idea: ${prompt}
Genres: ${genres.join(', ')}
Age Group: ${ageGroup}
Pages: ${pageCount}
Language: ${language === 'tl' ? 'TAGALOG' : 'ENGLISH'}

GUIDELINES:
- CHARACTER CONSISTENCY: Detailed character descriptions used in every page
- VISUAL CONTINUITY: Consistent color scheme and art style
- COMPOSITION: Vary camera angles for visual interest

Return JSON:
{
  "title": "Story Title",
  "description": "2-3 sentence summary",
  "characterDescription": "Detailed character appearance",
  "pages": [
    {
      "pageNumber": 1,
      "text": "Story text",
      "imagePrompt": "Detailed prompt for AI image generation"
    }
  ]
}`;

  const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: fullPrompt }] }],
      generationConfig: {
        temperature: 0.9,
        maxOutputTokens: 16384
      }
    })
  });

  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
};
```

---

### 4. Canvas Drawing Engine

**File:** `frontend/src/components/canvas/DrawingEngine.ts`

```typescript
export class DrawingEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private isDrawing = false;
  private currentPath: DrawingPath | null = null;
  private tool = 'brush';
  private color = '#000000';
  private size = 5;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.setupCanvas();
    this.bindEvents();
  }

  private bindEvents() {
    // Mouse and touch events
    this.canvas.addEventListener('mousedown', this.handleStart.bind(this));
    this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this));
    this.canvas.addEventListener('mousemove', this.handleMove.bind(this));
    this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this));
  }

  private startDrawing(point: Point) {
    this.isDrawing = true;
    this.currentPath = {
      id: Date.now().toString(),
      tool: this.tool,
      color: this.color,
      size: this.size,
      points: [point]
    };
    
    this.ctx.beginPath();
    this.ctx.moveTo(point.x, point.y);
  }

  private continueDrawing(point: Point) {
    if (!this.currentPath) return;
    this.currentPath.points.push(point);
    this.ctx.lineTo(point.x, point.y);
    this.ctx.stroke();
  }

  private endDrawing() {
    if (!this.isDrawing) return;
    this.isDrawing = false;
    this.drawingState.paths.push(this.currentPath!);
  }

  // Public API
  setTool(tool: string) { this.tool = tool; }
  setColor(color: string) { this.color = color; }
  setSize(size: number) { this.size = size; }
  
  undo() {
    if (this.drawingState.paths.length > 0) {
      const lastPath = this.drawingState.paths.pop()!;
      this.drawingState.redoPaths.push(lastPath);
      this.redrawCanvas();
    }
  }

  getCanvasData(): string {
    return this.canvas.toDataURL('image/png');
  }
}
```

---

### 5. Text-to-Speech System

**File:** `frontend/src/hooks/useTextToSpeech.ts`

```typescript
export const useTextToSpeech = (options?: UseTextToSpeechOptions) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [progress, setProgress] = useState(0);
  const [useCloudTTS, setUseCloudTTS] = useState(true);
  const isOnline = useOnlineStatus();
  const isNativePlatform = Capacitor.isNativePlatform();

  // Cloud TTS with premium voices
  const speakWithCloudTTS = async (text: string) => {
    const response = await fetch(`${API_BASE_URL}/tts/synthesize/`, {
      method: 'POST',
      body: JSON.stringify({
        text,
        voice_id: cloudVoiceId,
        language: language === 'tl' ? 'fil' : 'en',
        rate, pitch, volume
      })
    });
    
    const audioBlob = await response.blob();
    const audio = new Audio(URL.createObjectURL(audioBlob));
    
    audio.ontimeupdate = () => {
      setProgress((audio.currentTime / audio.duration) * 100);
    };
    
    await audio.play();
    setIsSpeaking(true);
  };

  // Main speak function
  const speak = async (text: string) => {
    if (!text.trim()) return;
    
    // Try cloud TTS first if online
    if (useCloudTTS && isOnline) {
      const success = await speakWithCloudTTS(text);
      if (success) return;
    }
    
    // Fallback to device TTS
    if (isNativePlatform) {
      await TextToSpeech.speak({
        text,
        lang: language === 'tl' ? 'fil-PH' : 'en-US',
        rate, pitch, volume
      });
    } else {
      // Web Speech API
      const utterance = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(utterance);
    }
    setIsSpeaking(true);
  };

  return { speak, pause, resume, stop, isSpeaking, progress };
};
```

**Backend:** `backend/storybook/tts_service.py`

```python
from google.cloud import texttospeech

def synthesize_speech(text, voice_id, language, rate, pitch):
    client = texttospeech.TextToSpeechClient()
    
    voice = texttospeech.VoiceSelectionParams(
        language_code=f"{language}-PH" if language == 'fil' else "en-US",
        name=VOICE_MAP[voice_id]
    )
    
    audio_config = texttospeech.AudioConfig(
        audio_encoding=texttospeech.AudioEncoding.MP3,
        speaking_rate=rate,
        pitch=pitch
    )
    
    response = client.synthesize_speech(
        input=texttospeech.SynthesisInput(text=text),
        voice=voice,
        audio_config=audio_config
    )
    
    return response.audio_content
```

---

### 6. Real-time Collaboration

**Frontend WebSocket:** `frontend/src/services/collaborationService.ts`

```typescript
export class CollaborationService {
  private ws: WebSocket | null = null;

  connect(sessionId: string, token: string) {
    const wsUrl = `${WS_BASE_URL}/ws/collaborate/${sessionId}/?token=${token}`;
    this.ws = new WebSocket(wsUrl);
    
    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case 'user_joined':
          this.handleUserJoined(data);
          break;
        case 'canvas_update':
          this.handleCanvasUpdate(data);
          break;
        case 'cursor_move':
          this.handleCursorMove(data);
          break;
      }
    };
  }

  sendCanvasUpdate(canvasData: string) {
    this.ws?.send(JSON.stringify({
      type: 'canvas_update',
      canvas_data: canvasData,
      timestamp: Date.now()
    }));
  }
}
```

**Backend Consumer:** `backend/storybook/consumers.py`

```python
class CollaborationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.session_id = self.scope['url_route']['kwargs']['session_id']
        self.room_group_name = f'collab_{self.session_id}'
        
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()

    async def receive(self, text_data):
        data = json.loads(text_data)
        
        # Broadcast to all users
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': data['type'],
                'data': data,
                'sender_id': self.scope['user'].id
            }
        )
```

---

### 7. Database Models

**File:** `backend/storybook/models.py`

```python
class UserProfile(models.Model):
    USER_TYPES = [
        ('child', 'Child'),
        ('parent', 'Parent'),
        ('teacher', 'Teacher'),
    ]
    
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    user_type = models.CharField(max_length=10, choices=USER_TYPES)
    display_name = models.CharField(max_length=50)
    avatar_emoji = models.CharField(max_length=10, default='📚')
    
    # Gamification
    experience_points = models.PositiveIntegerField(default=0)
    level = models.PositiveIntegerField(default=1)
    
    def add_experience(self, amount):
        """Add XP and level up (500 XP per level)"""
        self.experience_points += amount
        new_level = (self.experience_points // 500) + 1
        leveled_up = new_level > self.level
        self.level = new_level
        self.save()
        return {'xp_gained': amount, 'leveled_up': leveled_up}


class Story(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField()
    author = models.ForeignKey(User, on_delete=models.CASCADE)
    category = models.CharField(max_length=50)
    language = models.CharField(max_length=10, default='en')
    cover_image = models.TextField(blank=True)
    is_published = models.BooleanField(default=False)
    is_collaborative = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)


class StoryPage(models.Model):
    story = models.ForeignKey(Story, on_delete=models.CASCADE, related_name='pages')
    page_number = models.PositiveIntegerField()
    text = models.TextField()
    image_data = models.TextField(blank=True)  # Canvas drawing
    image_url = models.URLField(blank=True)    # AI-generated image
    
    class Meta:
        ordering = ['page_number']
```

---

### 8. State Management (Zustand)

**File:** `frontend/src/stores/storyStore.ts`

```typescript
export const useStoryStore = create<StoryState>((set, get) => ({
  currentStory: null,
  stories: [],
  isLoading: false,
  
  fetchStories: async () => {
    set({ isLoading: true });
    const response = await storyApiService.getStories();
    set({ stories: response.data, isLoading: false });
  },
  
  createStory: async (story: CreateStoryRequest) => {
    const response = await storyApiService.createStory(story);
    set(state => ({ 
      stories: [...state.stories, response.data],
      currentStory: response.data
    }));
    return response.data;
  },
  
  updateStory: async (id: string, updates: UpdateStoryRequest) => {
    await storyApiService.updateStory(id, updates);
    set(state => ({
      stories: state.stories.map(s => 
        s.id === id ? { ...s, ...updates } : s
      )
    }));
  }
}));
```

---

### 9. Capacitor Mobile Integration

**File:** `capacitor.config.ts`

```typescript
const config: CapacitorConfig = {
  appId: 'com.pixeltales.app',
  appName: 'Pixel Tales',
  webDir: 'frontend/dist',
  server: {
    androidScheme: 'http',
    cleartext: true
  },
  plugins: {
    StatusBar: {
      style: 'dark',
      backgroundColor: '#1a0d2e'
    },
    Keyboard: {
      resize: 'none',
      style: 'dark'
    },
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#1a0d2e'
    }
  }
};
```

**Storage Wrapper:** `frontend/src/utils/capacitorStorage.ts`

```typescript
import { Preferences } from '@capacitor/preferences';
import { Capacitor } from '@capacitor/core';

class CapacitorStorage {
  private isNative = Capacitor.isNativePlatform();

  async setItem(key: string, value: string) {
    if (this.isNative) {
      await Preferences.set({ key, value });
    } else {
      localStorage.setItem(key, value);
    }
  }

  async getItem(key: string) {
    if (this.isNative) {
      const { value } = await Preferences.get({ key });
      return value;
    }
    return localStorage.getItem(key);
  }
}

export const storage = new CapacitorStorage();
```

---

### 10. XP & Gamification System

**Backend Service:** `backend/storybook/xp_service.py`

```python
class XPService:
    XP_REWARDS = {
        'story_created': 100,
        'story_published': 150,
        'story_read': 10,
        'friend_added': 50,
        'collaboration_completed': 200,
        'game_completed': 75,
    }
    
    @staticmethod
    def award_xp(user, action_type, amount=None):
        if amount is None:
            amount = XPService.XP_REWARDS.get(action_type, 0)
        
        profile = user.profile
        result = profile.add_experience(amount)
        
        if result['leveled_up']:
            XPService.check_level_achievements(user, result['level'])
        
        return result
```

---

