# 🚀 Quick Start: Build Beta APK with Custom Icon

## ✅ Step 1: Icons Generated
Your custom icon from `frontend/public/app-icon.jpg` has been generated in all required Android sizes!

## 📝 Step 2: Create Keystore (One-time setup)

Run this command:
```batch
setup-keystore.bat
```

You'll need to provide:
- Keystore password (min 6 chars)
- Key password (can be same)
- Key alias (e.g., `pixeltales-key`)
- Your name/organization

**⚠️ CRITICAL:** Back up the keystore file that gets created! You'll need it for all future updates.

## 🔨 Step 3: Build Your Beta APK

Run this command:
```batch
build-beta-apk.bat
```

This will create a **signed release APK** ready for distribution!

## 📱 Step 4: Install and Test

Your APK will be in:
- `apk-builds/PixelTales-beta-YYYYMMDD_HHMMSS.apk`

Copy to your Android device and install!

---

## 🆚 Debug APK vs Beta APK

| Feature | Debug APK | Beta APK (Release) |
|---------|-----------|-------------------|
| Command | `build-secure-apk.bat` | `build-beta-apk.bat` |
| Signing | Debug keystore | **Your release keystore** |
| Icon | Default Capacitor icon | **Your custom icon** ✨ |
| Distribution | Testing only | **Beta testers & Production** |
| Updatable | ❌ No | ✅ Yes (with same keystore) |
| Google Play | ❌ Cannot upload | ✅ Can upload |
| Size | Larger | Optimized & smaller |

---

## 🎯 What Makes Beta APK Special?

1. **Signed with YOUR keystore** - You can update it later
2. **Uses your custom icon** - Professional branding
3. **Production-ready** - Can be uploaded to Google Play
4. **Optimized build** - Smaller size, better performance

---

## ⚠️ IMPORTANT: Keystore Safety

The keystore file is like the **key to your app**:
- 🔐 Back it up to multiple secure locations
- 📝 Save your passwords securely
- ❌ Never commit to Git (already in .gitignore)
- 🚫 Without it, you CANNOT update your app on Google Play

**Files to backup:**
- `android/app/pixeltales-release.keystore`
- `android/keystore.properties` (contains passwords)

---

## 📚 More Details

See `BETA_APK_BUILD_GUIDE.md` for:
- Troubleshooting
- Version management
- Security best practices
- Google Play publishing guide

---

**That's it!** You now have everything set up to build professional beta APKs with your custom icon! 🎉
