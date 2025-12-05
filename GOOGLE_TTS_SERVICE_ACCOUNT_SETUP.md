# 🎤 Google Cloud Text-to-Speech Service Account Setup

## Complete Step-by-Step Guide

### Prerequisites
- A Google account (Gmail)
- 5-10 minutes of your time

---

## Step 1: Create Google Cloud Project (2 minutes)

1. **Open Google Cloud Console**
   - Go to: https://console.cloud.google.com
   - Sign in with your Google account

2. **Create a New Project**
   - Click on the project dropdown at the top (next to "Google Cloud")
   - Click **"NEW PROJECT"**
   - **Project Name**: `PixelTales-TTS` (or any name you prefer)
   - **Organization**: Leave as default (or select if you have one)
   - Click **"CREATE"**
   - Wait for the project to be created (10-30 seconds)
   - Make sure your new project is selected in the dropdown

---

## Step 2: Enable Text-to-Speech API (1 minute)

1. **Navigate to APIs & Services**
   - In the left sidebar, click **"APIs & Services"** → **"Library"**
   - Or use the search bar at the top: "API Library"

2. **Search for Text-to-Speech**
   - In the search box, type: `text to speech`
   - Click on **"Cloud Text-to-Speech API"**

3. **Enable the API**
   - Click the blue **"ENABLE"** button
   - Wait for it to enable (5-10 seconds)
   - You should see "API enabled" message

---

## Step 3: Create Service Account (2 minutes)

1. **Go to Service Accounts**
   - In the left sidebar, click **"IAM & Admin"** → **"Service Accounts"**
   - Or search for "Service Accounts" in the top search bar

2. **Create Service Account**
   - Click **"+ CREATE SERVICE ACCOUNT"** at the top
   
3. **Service Account Details**
   - **Service account name**: `pixeltales-tts`
   - **Service account ID**: (auto-generated, usually `pixeltales-tts@your-project.iam.gserviceaccount.com`)
   - **Description**: `Service account for PixelTales Text-to-Speech`
   - Click **"CREATE AND CONTINUE"**

4. **Grant Permissions**
   - In "Grant this service account access to project"
   - Click the **"Select a role"** dropdown
   - Search for: `Text-to-Speech`
   - Select: **"Cloud Text-to-Speech User"**
   - Click **"CONTINUE"**

5. **Grant User Access (Optional)**
   - Skip this step (not needed)
   - Click **"DONE"**

---

## Step 4: Create and Download JSON Key (2 minutes)

1. **Find Your Service Account**
   - You should now see your `pixeltales-tts` service account in the list
   - Click on the **email address** of your service account

2. **Go to Keys Tab**
   - Click on the **"KEYS"** tab at the top

3. **Create New Key**
   - Click **"ADD KEY"** → **"Create new key"**
   - Select **"JSON"** (should be selected by default)
   - Click **"CREATE"**

4. **Save the File**
   - A JSON file will automatically download (e.g., `pixeltales-tts-abc123.json`)
   - **IMPORTANT**: Save this file in a safe location
   - **Rename it** to something simple like: `pixeltales-tts-key.json`
   - **Suggested locations**:
     - Windows: `C:\Users\YourName\pixeltales-tts-key.json`
     - Mac/Linux: `/home/yourname/pixeltales-tts-key.json`
     - Or in your project root: `backend/pixeltales-tts-key.json` (make sure it's in `.gitignore`!)

---

## Step 5: Configure Your Application (3 minutes)

### Option A: Set Environment Variable

**Windows (PowerShell):**
```powershell
$env:GOOGLE_APPLICATION_CREDENTIALS="C:\Users\YourName\pixeltales-tts-key.json"
```

**Windows (Command Prompt):**
```cmd
set GOOGLE_APPLICATION_CREDENTIALS=C:\Users\YourName\pixeltales-tts-key.json
```

**Mac/Linux (Terminal):**
```bash
export GOOGLE_APPLICATION_CREDENTIALS="/home/yourname/pixeltales-tts-key.json"
```

### Option B: Add to .env File (Recommended)

1. **Open your backend `.env` file**
   - Location: `backend/.env`
   - If it doesn't exist, create it from `backend/.env.example`

2. **Add this line:**
   ```env
   GOOGLE_APPLICATION_CREDENTIALS=/path/to/pixeltales-tts-key.json
   ```

3. **Example values:**
   ```env
   # Windows
   GOOGLE_APPLICATION_CREDENTIALS=C:\Users\YourName\pixeltales-tts-key.json
   
   # Mac/Linux
   GOOGLE_APPLICATION_CREDENTIALS=/home/yourname/pixeltales-tts-key.json
   
   # Or relative to project
   GOOGLE_APPLICATION_CREDENTIALS=./pixeltales-tts-key.json
   ```

---

## Step 6: Install Required Package

In your backend directory:

```bash
cd backend
pip install google-cloud-texttospeech==2.16.3
```

---

## Step 7: Test the Setup

### Quick Test (Python):

Create a test file `backend/test_tts.py`:

```python
import os
from google.cloud import texttospeech

# Check if credentials are set
creds_path = os.environ.get('GOOGLE_APPLICATION_CREDENTIALS')
print(f"Credentials path: {creds_path}")
print(f"File exists: {os.path.exists(creds_path) if creds_path else 'No path set'}")

# Try to initialize client
try:
    client = texttospeech.TextToSpeechClient()
    print("✅ SUCCESS! Google Cloud TTS client initialized!")
    
    # Try a quick synthesis test
    synthesis_input = texttospeech.SynthesisInput(text="Hello from PixelTales!")
    voice = texttospeech.VoiceSelectionParams(
        language_code="en-US",
        name="en-US-Neural2-C"
    )
    audio_config = texttospeech.AudioConfig(
        audio_encoding=texttospeech.AudioEncoding.MP3
    )
    
    response = client.synthesize_speech(
        input=synthesis_input,
        voice=voice,
        audio_config=audio_config
    )
    
    print(f"✅ Speech synthesis successful! Generated {len(response.audio_content)} bytes")
    
except Exception as e:
    print(f"❌ ERROR: {e}")
```

Run the test:
```bash
cd backend
python test_tts.py
```

### Expected Output:
```
Credentials path: /path/to/pixeltales-tts-key.json
File exists: True
✅ SUCCESS! Google Cloud TTS client initialized!
✅ Speech synthesis successful! Generated 15360 bytes
```

---

## Troubleshooting

### ❌ "Could not load credentials"
- **Fix**: Check that the file path in `GOOGLE_APPLICATION_CREDENTIALS` is correct
- Verify the file exists at that location
- Use absolute path instead of relative path

### ❌ "Permission denied"
- **Fix**: Make sure you granted "Cloud Text-to-Speech User" role
- Go back to IAM & Admin → Service Accounts
- Click on your service account → Permissions
- Verify the role is assigned

### ❌ "API not enabled"
- **Fix**: Go to APIs & Services → Library
- Search for "Cloud Text-to-Speech API"
- Make sure it shows "API enabled"

### ❌ "Cannot find module google.cloud"
- **Fix**: Install the package:
  ```bash
  pip install google-cloud-texttospeech==2.16.3
  ```

---

## Security Best Practices

1. **Never commit the JSON key file to Git**
   - Add to `.gitignore`:
     ```
     # Google Cloud credentials
     *-key.json
     pixeltales-tts-key.json
     *.json
     ```

2. **Keep the key file secure**
   - Don't share it publicly
   - Don't upload it to GitHub or any public repository
   - Store it in a secure location

3. **Use environment variables**
   - Never hardcode the path in your code
   - Always use `os.environ.get('GOOGLE_APPLICATION_CREDENTIALS')`

---

## Free Tier Limits

Google Cloud TTS offers a generous free tier:

- **4 million characters/month** of Standard voices
- **1 million characters/month** of WaveNet/Neural2 voices

For a personal storytelling app, this is more than enough!

---

## What's Next?

After setup, you can:

1. ✅ Start your backend server
2. ✅ Test TTS in your Story Reader
3. ✅ Choose between male/female voices
4. ✅ Enjoy premium quality voices in Filipino and English!

---

## Quick Reference

**Service Account Email Format:**
```
pixeltales-tts@your-project-id.iam.gserviceaccount.com
```

**Required Role:**
```
Cloud Text-to-Speech User
```

**Environment Variable:**
```env
GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json
```

**Test Command:**
```bash
python backend/test_tts.py
```

---

## Need Help?

- Google Cloud TTS Documentation: https://cloud.google.com/text-to-speech/docs
- Service Account Guide: https://cloud.google.com/iam/docs/service-accounts-create

---

*Created: 2024*
*Status: ✅ Ready to use*
