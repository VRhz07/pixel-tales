# Photo Story Modal Troubleshooting Guide

## Issue: Modal Not Showing

### Quick Checks:

1. **Open Browser Console** (F12 or Right-click → Inspect → Console)
   - Look for any error messages
   - Check if you see: `"Photo Story button clicked!"`
   - Check if you see: `"PhotoStoryModal rendered"`

2. **Restart Dev Server**
   ```bash
   # Stop the current server (Ctrl+C)
   # Then restart:
   npm run dev
   ```

3. **Clear Browser Cache**
   - Press `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
   - Or clear cache in browser settings

4. **Check for Build Errors**
   - Look at the terminal where `npm run dev` is running
   - Check for TypeScript or compilation errors

## Common Issues & Solutions:

### 1. Modal Opens But Nothing Inside
**Symptoms**: Black screen or empty modal
**Solution**: Check CSS is loaded
```bash
# Restart dev server
npm run dev
```

### 2. Button Click Does Nothing
**Check Console For**:
- `"Photo Story button clicked!"` - Button works
- `"PhotoStoryModal rendered"` - Modal is rendering
- Any error messages

**If no console logs appear**:
- Component might not be imported correctly
- Check HomePage.tsx has: `import PhotoStoryModal from '../creation/PhotoStoryModal';`

### 3. Camera Permission Issues
**Symptoms**: Alert saying "Unable to access camera"
**Solutions**:
- Grant camera permission when browser asks
- Check browser settings → Site settings → Camera
- Make sure you're on HTTPS or localhost
- Try a different browser (Chrome works best)

### 4. TypeScript Errors
**Check terminal for errors like**:
- Module not found
- Type errors
- Import errors

**Solution**: Make sure all files are saved and restart dev server

## Step-by-Step Debug Process:

### Step 1: Verify Button Click
1. Open browser console (F12)
2. Click "Start Photo Story" button
3. **Expected**: See `"Photo Story button clicked!"` in console
4. **If not**: Button event not working, check HomePage.tsx

### Step 2: Verify Modal Renders
1. After clicking button
2. **Expected**: See `"PhotoStoryModal rendered"` with `{ isOpen: true, ... }`
3. **If not**: Modal component not rendering, check import

### Step 3: Verify Modal Visible
1. Modal should appear with purple gradient
2. Should see "Create Story from Photo" title
3. Should see two buttons: "Take Photo" and "Upload Photo"
4. **If not**: CSS not loaded, restart dev server

### Step 4: Verify Camera Works
1. Click "Take Photo" button
2. **Expected**: Browser asks for camera permission
3. **Expected**: See `"Starting camera..."` in console
4. **Expected**: See `"Camera stream obtained:"` in console
5. **Expected**: See live video feed
6. **If not**: Check camera permissions or try file upload

## Manual Test:

### Test 1: Modal Opens
```
1. Go to homepage
2. Click "Start Photo Story"
3. ✅ Modal should slide up from bottom (mobile) or center (desktop)
4. ✅ Should see purple gradient header with camera icon
5. ✅ Should see "Create Story from Photo" title
```

### Test 2: Photo Options Visible
```
1. Inside modal
2. ✅ Should see two large buttons:
   - "Take Photo" with camera icon
   - "Upload Photo" with photo icon
3. ✅ Buttons should have dashed borders
4. ✅ Hover should show purple border
```

### Test 3: Camera Opens
```
1. Click "Take Photo"
2. ✅ Browser asks for camera permission
3. ✅ Grant permission
4. ✅ See live video feed
5. ✅ See purple dashed frame overlay
6. ✅ See "Position your subject in the frame" text
7. ✅ See "Capture Photo" and "Cancel" buttons
```

### Test 4: Photo Capture
```
1. With camera open
2. Position subject in frame
3. Click "Capture Photo"
4. ✅ Camera stops
5. ✅ See captured photo preview
6. ✅ See "Remove Photo" button
7. ✅ See "Additional Context" textarea
8. ✅ See art style grid
9. ✅ See story length slider
```

## Browser Compatibility:

### ✅ Recommended Browsers:
- Chrome 90+ (Best support)
- Edge 90+
- Safari 14.1+
- Opera 75+

### ⚠️ Limited Support:
- Firefox (camera may not work)
- Older browsers

### ❌ Not Supported:
- Internet Explorer
- Browsers without camera API support

## Still Not Working?

### Check These Files Exist:
```
✅ /frontend/src/components/creation/PhotoStoryModal.tsx
✅ /frontend/src/services/geminiService.ts (with analyzeImageAndGenerateStory)
✅ /frontend/src/index.css (with .modal-overlay styles)
```

### Verify Imports in HomePage.tsx:
```typescript
import PhotoStoryModal from '../creation/PhotoStoryModal';
```

### Verify State in HomePage.tsx:
```typescript
const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
```

### Verify Modal Render in HomePage.tsx:
```typescript
<PhotoStoryModal 
  isOpen={isPhotoModalOpen} 
  onClose={() => setIsPhotoModalOpen(false)} 
/>
```

## Quick Fix Commands:

```bash
# 1. Stop dev server (Ctrl+C)

# 2. Clear node modules cache (if needed)
rm -rf node_modules/.vite

# 3. Restart dev server
npm run dev

# 4. Hard refresh browser
# Press Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
```

## What to Check in Console:

### Expected Console Logs (in order):
```
1. "Photo Story button clicked!" - When you click the button
2. "PhotoStoryModal rendered" - Modal is rendering
3. "Starting camera..." - When you click Take Photo
4. "Camera stream obtained:" - Camera access granted
5. "Camera state set to true" - Camera should be visible
6. "Video metadata loaded, playing..." - Video should play
```

### If You See Errors:
- **"Module not found"**: File path issue, check imports
- **"getUserMedia is not defined"**: Browser doesn't support camera
- **"Permission denied"**: Grant camera permission
- **"NotAllowedError"**: Camera blocked in browser settings
- **"NotFoundError"**: No camera detected on device

## Need More Help?

1. **Share console logs**: Copy all console messages
2. **Share terminal output**: Copy any error messages from npm run dev
3. **Share browser**: Which browser and version you're using
4. **Share device**: Desktop, mobile, tablet?

---

**Most Common Solution**: Restart dev server and hard refresh browser! 🔄
