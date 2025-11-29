# 🔒 Security Setup Guide - API Key Protection

## ⚠️ CRITICAL: API Keys Have Been Moved to Backend

**Your API keys are now secure!** They are no longer exposed in the frontend code.

---

## 🎯 What Changed?

### ❌ **Old Architecture (INSECURE)**
```
Frontend → Direct API Calls → External Services (Gemini, OCR, etc.)
         ↑ API keys embedded in JavaScript bundle (EXPOSED!)
```

### ✅ **New Architecture (SECURE)**
```
Frontend → Backend API Proxy → External Services
                ↑ API keys stay on server (SECURE!)
```

---

## 🛠️ Setup Instructions

### 1. **Backend Configuration (Render/Production)**

Add these environment variables to your **backend** server only:

```bash
# Required for AI story generation
GOOGLE_AI_API_KEY=your-gemini-api-key-here

# Optional for email features
SENDGRID_API_KEY=your-sendgrid-key-here
```

**Where to add them:**
- **Render.com**: Dashboard → Environment Variables
- **Heroku**: Settings → Config Vars
- **Vercel**: Settings → Environment Variables
- **Local Development**: `backend/.env` file (NOT committed to Git)

### 2. **Frontend Configuration**

**Remove ALL API keys from frontend `.env` file!**

The following variables are **NO LONGER NEEDED** in frontend:
```bash
# ❌ REMOVE THESE - No longer used
VITE_GEMINI_API_KEY=xxx        # Now handled by backend
VITE_OCR_SPACE_API_KEY=xxx     # Now handled by backend
VITE_HUGGING_FACE_API_KEY=xxx  # Not currently used
```

**Keep only these frontend variables:**
```bash
# ✅ Safe to keep - these are public URLs, not secrets
VITE_API_BASE_URL=https://your-backend-url.com/api
```

---

## 🔑 Getting Your API Keys

### Gemini API (Required for AI Features)
1. Visit: https://makersuite.google.com/app/apikey
2. Sign in with Google account
3. Click "Create API Key"
4. Copy the key
5. Add to **backend** environment variables only

**Cost:** Free tier includes:
- 60 requests per minute
- 1,500 requests per day
- Perfect for development!

### SendGrid API (Optional - for Email Verification)
1. Visit: https://sendgrid.com/
2. Create free account
3. Go to Settings → API Keys
4. Create new API key
5. Add to **backend** environment variables only

**Cost:** Free tier includes 100 emails/day

---

## 🔒 Security Checklist

- [x] **API keys moved to backend**
- [x] **Frontend calls backend proxy endpoints**
- [x] **Backend validates all requests with JWT authentication**
- [x] **API keys never exposed in JavaScript bundles**
- [ ] **Regenerate ALL previously exposed API keys**
- [ ] **Remove API keys from Git history (see below)**
- [ ] **Update documentation to remove hardcoded keys**
- [ ] **Add `.env` to `.gitignore` (already done)**

---

## 🚨 IMPORTANT: Regenerate Your API Keys

**Your old API keys were committed to Git and may be exposed!**

### For Gemini API:
1. Go to https://makersuite.google.com/app/apikey
2. Find your existing key
3. Click "Revoke" or "Delete"
4. Create a new API key
5. Update backend environment variables with new key

### For Other Services:
Follow similar steps to regenerate keys in their respective dashboards.

---

## 🧹 Clean Up Git History (Advanced)

If you want to remove API keys from Git history:

```bash
# WARNING: This rewrites Git history - coordinate with your team first!

# Install BFG Repo-Cleaner
# Download from: https://rtyley.github.io/bfg-repo-cleaner/

# Create a file with strings to remove
echo "AIzaSyDZ5fzoP5fy03Y4NibRGL_XG2SzpTXvZR8" > secrets.txt
echo "K83029623188957" >> secrets.txt

# Run BFG to remove secrets from history
bfg --replace-text secrets.txt

# Force push (CAREFUL!)
git reflog expire --expire=now --all && git gc --prune=now --aggressive
git push --force
```

**Note:** This is optional and should only be done if you understand Git history rewriting.

---

## 📝 API Endpoints Reference

### Backend Proxy Endpoints (Secure)

All these endpoints require authentication (JWT token):

```typescript
// Story Generation
POST /api/ai/gemini/generate-story/
Body: { prompt: string, generationConfig?: {...} }

// Character Generation
POST /api/ai/gemini/generate-character/
Body: { prompt: string }

// Image Analysis
POST /api/ai/gemini/analyze-image/
Body: { image: string, prompt: string }

// OCR Processing
POST /api/ai/ocr/process/
Body: { image: string, detectHandwriting: boolean }

// Check Service Status
GET /api/ai/status/
Returns: { gemini_available: boolean, ocr_available: boolean }
```

---

## 🎨 Frontend Usage Examples

### Story Generation (Secure)
```typescript
import { generateStoryWithGemini } from '../../services/geminiProxyService';

const story = await generateStoryWithGemini(
  "Create a story about a brave little mouse",
  { temperature: 0.9, maxOutputTokens: 2048 }
);
```

### OCR Processing (Secure)
```typescript
import { processImageWithOCR } from '../../services/ocrProxyService';

const result = await processImageWithOCR(imageDataUrl, detectHandwriting);
console.log(result.text);
```

---

## 🐛 Troubleshooting

### "Gemini API not configured on server"
- Check backend environment variables
- Ensure `GOOGLE_AI_API_KEY` is set
- Restart backend server after adding variables

### "Authentication required"
- Frontend must send JWT token in Authorization header
- User must be logged in
- Token format: `Bearer <token>`

### "Service unavailable"
- Check if backend is running
- Verify API keys are valid
- Check API rate limits

---

## 📚 Additional Resources

- [Backend API Proxy Code](backend/storybook/ai_proxy_views.py)
- [Frontend Proxy Services](frontend/src/services/geminiProxyService.ts)
- [Gemini API Documentation](https://ai.google.dev/docs)
- [Django REST Framework](https://www.django-rest-framework.org/)

---

## ✅ Benefits of This Architecture

1. **Security**: API keys never leave the server
2. **Control**: Rate limiting and usage monitoring on backend
3. **Flexibility**: Easy to switch AI providers without frontend changes
4. **Cost Management**: Track and limit API usage per user
5. **Compliance**: Easier to meet security audit requirements

---

**Last Updated:** January 2025  
**Status:** ✅ Secure Architecture Implemented
