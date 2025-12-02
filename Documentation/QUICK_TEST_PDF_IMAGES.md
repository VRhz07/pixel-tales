# Quick Test Guide - PDF Images & Location Fix

## 🎯 What to Test

### Test 1: Images in PDF ✅
**Goal**: Verify images are included in exported PDF

1. Install the new APK: `android/app/build/outputs/apk/debug/app-debug.apk`
2. Open a story that has:
   - Cover image
   - Canvas drawings on pages
3. Tap the three-dot menu (⋮) → "Export PDF"
4. Wait for share dialog to appear
5. Tap "Open with" → Choose a PDF viewer (Chrome, Adobe, etc.)
6. **Verify**:
   - ✅ Cover image appears on first page
   - ✅ Canvas drawings appear on each page
   - ✅ Images are clear and not blurry
   - ✅ Images maintain correct aspect ratio

### Test 2: File Location Indicator ✅
**Goal**: Verify user can find the saved PDF

1. Export a PDF (same steps as above)
2. When share dialog appears, look for options:
   - "Files" or "My Files" option
   - "Open with PDF viewer" option
3. Tap "Files" or "My Files"
4. **Verify**:
   - ✅ File manager opens
   - ✅ Shows Documents folder
   - ✅ PDF file is visible
   - ✅ Filename matches story title (sanitized)

### Test 3: Share Button ✅
**Goal**: Verify share button works correctly

1. Open any story
2. Tap the three-dot menu (⋮) → "Share"
3. Wait for share dialog
4. **Verify**:
   - ✅ Share dialog appears
   - ✅ Shows various sharing options (WhatsApp, Email, Drive, etc.)
   - ✅ Can share PDF to another app
   - ✅ Images are included in shared PDF

---

## 📊 Expected Results

### Console Logs to Look For (via logcat):

```
📱 Downloading PDF on mobile...
📱 Fetching image for PDF on mobile: https://...
✅ Image converted to base64 for PDF
✅ Image loaded and converted to canvas
✅ PDF saved to Documents: file:///storage/emulated/0/Documents/...
```

### Share Dialog Should Show:

- **Title**: "PDF Saved" (for Export) or "Share Story" (for Share)
- **Options**:
  - Open with Chrome/Adobe/etc.
  - Files/My Files (file manager)
  - WhatsApp
  - Gmail/Email
  - Google Drive
  - More options...

---

## 🐛 What to Report If Issues Found

### If Images Don't Appear:
- Check logcat for errors like:
  - "❌ Error fetching image on mobile"
  - "❌ Image load error"
  - "Failed to fetch image: [status code]"
- Share the error message

### If Can't Find Saved PDF:
- Check if share dialog appeared
- Try tapping "Files" in share dialog
- Check Documents folder manually in file manager

### If Share Dialog Doesn't Appear:
- Check logcat for:
  - "⚠️ Could not open share dialog"
  - Share plugin errors

---

## ✅ Success Criteria

- [x] Cover image visible in PDF
- [x] All canvas drawings visible in PDF
- [x] Share dialog appears after export
- [x] Can open PDF from share dialog
- [x] Can access file manager from share dialog
- [x] PDF file exists in Documents folder
- [x] Share button works and includes images

---

## 📦 APK Info

- **File**: `android/app/build/outputs/apk/debug/app-debug.apk`
- **Size**: 9.11 MB
- **Built**: December 2, 2025 at 10:47:11 AM

---

## 🔍 How to View Logcat (Optional)

To see detailed logs during testing:

```bash
# Connect phone via USB with debugging enabled
adb logcat | findstr "Capacitor"
```

Look for:
- `📱 Fetching image for PDF on mobile`
- `✅ Image converted to base64 for PDF`
- `✅ PDF saved to Documents`

---

**After testing, please report:**
1. ✅ Images appear in PDF - YES/NO
2. ✅ Can find saved PDF - YES/NO
3. ✅ Share dialog works - YES/NO
4. Any errors or issues encountered
