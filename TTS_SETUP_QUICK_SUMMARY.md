# 🎤 TTS Setup - Quick Summary

## ✅ What You Have Now

1. **Google Cloud JSON Key** - Your service account credentials file
2. **Updated Backend Code** - `settings.py` now handles base64 credentials
3. **Helper Script** - `convert_json_to_base64.ps1` to convert your key
4. **Complete Guides** - Documentation for setup

---

## 🚀 3 Simple Steps to Deploy on Render

### Step 1: Convert JSON to Base64 (1 minute)

**Option A - Use the helper script (Easiest):**
```powershell
# Right-click convert_json_to_base64.ps1 → Run with PowerShell
# Follow the prompts
```

**Option B - Manual command:**
```powershell
$jsonPath = "C:\path\to\your\pixeltales-tts-key.json"
[Convert]::ToBase64String([IO.File]::ReadAllBytes($jsonPath)) | Set-Clipboard
```

✅ Base64 string is now in your clipboard!

---

### Step 2: Add to Render (2 minutes)

1. Go to: https://dashboard.render.com/
2. Select: **pixeltales-backend**
3. Click: **"Environment"** tab
4. Click: **"Add Environment Variable"**
5. Enter:
   - **Key**: `GOOGLE_CLOUD_CREDENTIALS_BASE64`
   - **Value**: Paste (Ctrl+V)
6. Click: **"Save Changes"**

✅ Render will automatically redeploy!

---

### Step 3: Verify (2 minutes)

1. Wait for deployment to complete (2-5 minutes)
2. Click **"Logs"** tab
3. Look for:
   ```
   ✅ Google Cloud credentials loaded from base64 (production mode)
   ✅ Google Cloud TTS client initialized successfully
   ```

✅ Done! TTS is now working!

---

## 📝 Local Development (Optional)

If you want to test TTS on your local machine:

### Add to `backend/.env`:

```env
GOOGLE_APPLICATION_CREDENTIALS=C:\path\to\pixeltales-tts-key.json
```

**Example paths:**
- Windows: `C:\Users\YourName\Downloads\pixeltales-tts-key.json`
- Mac: `/Users/yourname/Downloads/pixeltales-tts-key.json`
- Linux: `/home/yourname/pixeltales-tts-key.json`

---

## 🎯 Important Notes

### ✅ Do:
- Keep your JSON key file secure and private
- Use the base64 method for Render
- Use the file path method for local development

### ❌ Don't:
- Commit the JSON key file to Git
- Share the base64 string publicly
- Hardcode credentials in your code

### Already Protected:
Your `.gitignore` should include:
```
*-key.json
*.json (for credentials)
.env
```

---

## 🧪 Test Your Setup

### On Your Deployed App:

1. Open your app: `https://your-app.onrender.com`
2. Go to **Story Reader**
3. Click the **speaker icon** 🔊
4. Select a voice (male/female, English/Filipino)
5. Click **Play** ▶️
6. You should hear high-quality Google voice!

### Expected Results:
- ✅ Clear, natural-sounding voice
- ✅ No errors in browser console
- ✅ Works for both English and Filipino

---

## 📊 Free Tier Limits

**What You Get Free (per month):**
- **Neural2/WaveNet voices**: 1 million characters
  - ≈ 16 hours of audio
  - Perfect for personal/small apps
- **Standard voices**: 4 million characters
  - ≈ 66 hours of audio

**Cost**: $0 for most personal projects! 🎉

---

## 🔧 Troubleshooting

### Problem: Base64 string is very long (3000-5000 characters)
**Solution**: This is normal! Just paste it all.

### Problem: "Credentials not configured" in logs
**Solution**: 
- Check the env var name: `GOOGLE_CLOUD_CREDENTIALS_BASE64`
- Make sure you saved changes in Render
- Redeploy the service

### Problem: "Permission denied"
**Solution**: 
- Go to Google Cloud Console
- IAM & Admin → Service Accounts
- Make sure your account has "Cloud Text-to-Speech User" role

### Problem: Not hearing voice in app
**Solution**:
- Check browser console for errors
- Verify deployment completed successfully
- Check Render logs for initialization messages

---

## 📚 Full Documentation

- **Detailed Setup**: `GOOGLE_TTS_SERVICE_ACCOUNT_SETUP.md`
- **Render Deployment**: `RENDER_TTS_SETUP_GUIDE.md`
- **Conversion Script**: `convert_json_to_base64.ps1`

---

## ✨ What You'll Get

After setup, your app will have:

- 🎙️ **Premium Google voices** (WaveNet/Neural2)
- 🌏 **Multi-language support** (English + Filipino)
- 👥 **Voice options** (male/female)
- 🎵 **High audio quality** (better than browser default)
- 🔄 **Automatic fallback** (if credentials aren't set)

---

## 🎉 You're All Set!

Your answer to "**What do I put in service account ID?**":

1. **For Local Dev**: File path to your JSON key
   - `GOOGLE_APPLICATION_CREDENTIALS=C:\path\to\key.json`

2. **For Render**: Base64 encoded string
   - `GOOGLE_CLOUD_CREDENTIALS_BASE64=eyJ0eXBlIjo...` (very long string)

**Run the converter script and follow the 3 steps above!**

---

*Need help? Check the full guides or ask questions!*
