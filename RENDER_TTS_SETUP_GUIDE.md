# 🎤 Setting Up Google Cloud TTS on Render

## Complete Guide for Render Deployment

You already have your JSON key file. Now let's deploy it to Render!

---

## Step 1: Convert Your JSON Key to Base64 (2 minutes)

You need to convert your JSON file into a base64 string that can be stored as an environment variable.

### Windows (PowerShell):

```powershell
# Replace with your actual JSON file path
$jsonPath = "C:\Users\YourName\Downloads\pixeltales-tts-key.json"

# Read and convert to base64
$base64 = [Convert]::ToBase64String([IO.File]::ReadAllBytes($jsonPath))

# Copy to clipboard
$base64 | Set-Clipboard

Write-Host "✅ Base64 string copied to clipboard!"
Write-Host "Length: $($base64.Length) characters"
```

### Mac/Linux:

```bash
# Replace with your actual JSON file path
cat /path/to/pixeltales-tts-key.json | base64 | tr -d '\n' | pbcopy

echo "✅ Base64 string copied to clipboard!"
```

### Alternative: Online Tool

If you prefer, use this online converter:
1. Go to: https://www.base64encode.org/
2. Open your JSON file in a text editor
3. Copy **ALL** the JSON content (it looks like this):
   ```json
   {
     "type": "service_account",
     "project_id": "your-project-id",
     "private_key_id": "abc123...",
     "private_key": "-----BEGIN PRIVATE KEY-----\n...",
     "client_email": "pixeltales-tts@your-project.iam.gserviceaccount.com",
     ...
   }
   ```
4. Paste it into the encoder
5. Click **"Encode"**
6. Copy the base64 output

---

## Step 2: Add Environment Variables to Render (3 minutes)

### Go to Render Dashboard:

1. **Login to Render**: https://dashboard.render.com/
2. **Select your service**: `pixeltales-backend`
3. **Click "Environment"** tab on the left sidebar

### Add the Base64 Credential:

1. Click **"Add Environment Variable"**
2. **Key**: `GOOGLE_CLOUD_CREDENTIALS_BASE64`
3. **Value**: Paste the base64 string you copied (it will be VERY long - that's normal!)
4. Click **"Save Changes"**

**Important Notes:**
- The value will be very long (3000-5000 characters) - this is normal!
- Make sure you copied the **entire** base64 string
- Don't add quotes around it, just paste the raw base64 string

### Verify Your Entry:

After saving, you should see:
```
GOOGLE_CLOUD_CREDENTIALS_BASE64 = ••••••••••••••••••••••••••••
```

The dots (••••) mean it's hidden for security - that's correct!

---

## Step 3: Redeploy Your Service (1 minute)

After adding the environment variable:

1. **Render will automatically redeploy** (you'll see "Deploying..." in the header)
2. **Or manually trigger**: Click **"Manual Deploy"** → **"Deploy latest commit"**
3. **Wait for deployment** to complete (2-5 minutes)

---

## Step 4: Verify the Setup (2 minutes)

### Check the Logs:

1. In your Render dashboard, click **"Logs"** tab
2. Look for this message in the startup logs:
   ```
   ✅ Google Cloud credentials loaded from base64 (production mode)
   ✅ Google Cloud TTS client initialized successfully
   ```

### If you see this instead:
```
⚠️ Google Cloud TTS credentials not configured
```

**Troubleshooting:**
- Make sure you saved the environment variable
- Check that the key is named exactly: `GOOGLE_CLOUD_CREDENTIALS_BASE64`
- Verify the base64 string is complete (no truncation)
- Redeploy the service

---

## Step 5: Test TTS in Your App (3 minutes)

### Test from your frontend:

1. **Open your app** (deployed version)
2. **Go to Story Reader** page
3. **Click the speaker icon** 🔊
4. **Select a voice** (male/female, English/Filipino)
5. **Click Play** ▶️

### Expected Result:
- You should hear high-quality Google WaveNet/Neural2 voice
- No errors in browser console
- Smooth playback

---

## Local Development Setup (Optional)

If you also want to test TTS locally on your development machine:

### Create/Update `backend/.env`:

```env
# Your existing variables
DEBUG=True
SECRET_KEY=your-secret-key
GOOGLE_AI_API_KEY=AIzaSy...

# Add this NEW line for TTS
GOOGLE_APPLICATION_CREDENTIALS=C:\path\to\pixeltales-tts-key.json
```

**Examples:**
- Windows: `GOOGLE_APPLICATION_CREDENTIALS=C:\Users\YourName\Downloads\pixeltales-tts-key.json`
- Mac/Linux: `GOOGLE_APPLICATION_CREDENTIALS=/home/yourname/pixeltales-tts-key.json`

### Test Locally:

```bash
cd backend
python manage.py runserver
```

Check the console output:
```
✅ Google Cloud credentials loaded from file: C:\path\to\pixeltales-tts-key.json
✅ Google Cloud TTS client initialized successfully
```

---

## How It Works

### Your settings.py now handles TWO scenarios:

1. **Local Development** (your computer):
   - Reads `GOOGLE_APPLICATION_CREDENTIALS` env var
   - Points to JSON file on your disk
   - Example: `C:\Users\You\pixeltales-tts-key.json`

2. **Production** (Render):
   - Reads `GOOGLE_CLOUD_CREDENTIALS_BASE64` env var
   - Decodes base64 → JSON
   - Writes to `/tmp/google-credentials.json`
   - Google Cloud SDK uses this temp file

### Why Base64?

Render environment variables only accept **text strings**, not files. Base64 converts your JSON file into a long text string that can be stored as an environment variable.

---

## Security Best Practices

✅ **DO:**
- Keep your JSON key file secure and private
- Add `*-key.json` to `.gitignore`
- Use environment variables (never hardcode)
- Use base64 encoding for Render deployment

❌ **DON'T:**
- Commit JSON key files to Git
- Share your base64 string publicly
- Hardcode credentials in your code
- Upload JSON files to GitHub

---

## Troubleshooting

### ❌ "Failed to decode Google Cloud credentials"

**Cause**: Invalid or incomplete base64 string

**Fix**:
1. Re-convert your JSON file to base64
2. Make sure you copied the **entire** string
3. Don't add quotes or extra spaces
4. Re-save the environment variable in Render

---

### ❌ "TTS client not initialized"

**Cause**: Credentials not loaded or API not enabled

**Fix**:
1. Check Render logs for credential loading message
2. Verify `GOOGLE_CLOUD_CREDENTIALS_BASE64` is set in Render
3. Make sure "Cloud Text-to-Speech API" is enabled in Google Cloud Console
4. Verify service account has "Cloud Text-to-Speech User" role

---

### ❌ "Permission denied" errors

**Cause**: Service account doesn't have the right permissions

**Fix**:
1. Go to Google Cloud Console
2. IAM & Admin → Service Accounts
3. Find your service account
4. Edit → Add Role → "Cloud Text-to-Speech User"
5. Save

---

### ❌ "Quota exceeded"

**Cause**: You've used up your free tier limits

**Free Tier Limits:**
- 1 million characters/month for Neural2/WaveNet voices
- 4 million characters/month for Standard voices

**Fix**:
- Wait until next month for quota reset
- Upgrade to paid plan (if needed)
- Monitor usage in Google Cloud Console

---

## Quick Reference

### Environment Variables:

**Local Development (.env):**
```env
GOOGLE_APPLICATION_CREDENTIALS=/path/to/pixeltales-tts-key.json
```

**Render Production:**
```env
GOOGLE_CLOUD_CREDENTIALS_BASE64=eyJ0eXBlIjoic2VydmljZV9hY2NvdW50IiwicHJvamVjdF9pZCI6InlvdXItcHJvamVjdCIs...
```

### Convert JSON to Base64:

**PowerShell:**
```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("path\to\key.json")) | Set-Clipboard
```

**Bash:**
```bash
cat path/to/key.json | base64 | tr -d '\n'
```

### Success Messages in Logs:

```
✅ Google Cloud credentials loaded from base64 (production mode)
✅ Google Cloud TTS client initialized successfully
🎤 Selected voice: en-US-Neural2-C (language: en, gender: female)
✅ Speech synthesis successful: 15360 bytes
```

---

## What's Next?

After successful setup, you'll have:

- ✅ Premium Google WaveNet/Neural2 voices
- ✅ Support for English and Filipino languages
- ✅ Male and female voice options
- ✅ High-quality audio for story narration
- ✅ Automatic fallback if credentials aren't configured

---

## Cost Estimate

**Free Tier (per month):**
- Neural2/WaveNet: 1 million characters = ~16 hours of audio
- Standard: 4 million characters = ~66 hours of audio

**For a personal/small app, this is MORE than enough!**

Example: 
- 100 stories × 500 words × 5 characters per word = 250,000 characters
- Still within free tier! 🎉

---

## Need Help?

**Common Issues:**
1. Base64 string too long? → That's normal! It should be 3000-5000 characters
2. Not hearing voices? → Check browser console for errors
3. "Permission denied"? → Verify service account role in Google Cloud
4. "API not enabled"? → Enable "Cloud Text-to-Speech API" in Google Cloud Console

**Resources:**
- Google Cloud TTS Docs: https://cloud.google.com/text-to-speech/docs
- Render Environment Variables: https://render.com/docs/environment-variables

---

*Status: ✅ Ready for deployment*
*Updated: 2024*
