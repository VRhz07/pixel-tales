# Upstash Redis Setup for DigitalOcean

## ✅ Why Upstash?

DigitalOcean App Platform **does not offer managed Redis**, so we use Upstash:
- ✅ **Free tier**: 10,000 commands/day
- ✅ **Global edge network** (fast worldwide)
- ✅ **No credit card required** for free tier
- ✅ **Easy integration** with DigitalOcean

---

## 🚀 Setup Steps (5 Minutes)

### Step 1: Create Upstash Account

1. Go to: **https://upstash.com**
2. Click **"Get Started"** or **"Sign Up"**
3. Sign up with:
   - Email
   - GitHub
   - Google

### Step 2: Create Redis Database

1. After login, click **"Create Database"**
2. **Configuration**:
   - **Name**: `pixeltales-redis`
   - **Type**: Select **"Regional"** (cheapest for free tier)
   - **Region**: Choose closest to your DigitalOcean app (likely **US East**)
   - **Eviction**: Keep default
3. Click **"Create"**

### Step 3: Get Redis URL

1. Click on your newly created database
2. Scroll to **"REST API"** section
3. Look for **"Redis Connect URL"** - it looks like:
   ```
   redis://default:AabBccXxYyZz123@us1-magical-whale-12345.upstash.io:6379
   ```
4. **Copy this URL** (you'll need it next)

### Step 4: Add to DigitalOcean

1. Go to **DigitalOcean Dashboard**: https://cloud.digitalocean.com
2. Navigate to your app: **`pixel-tales-yu7cx`**
3. Go to **Settings** → **App-Level Environment Variables**
4. Click **"Edit"** or **"Add Variable"**
5. Add:
   - **Key**: `REDIS_URL`
   - **Value**: `redis://default:AabBccXxYyZz123@us1-magical-whale-12345.upstash.io:6379`
   - *(Paste your Upstash URL from Step 3)*
6. Click **"Save"**

### Step 5: Deploy

DigitalOcean will automatically redeploy your app with the new environment variable.

**Wait 2-5 minutes** for deployment to complete.

### Step 6: Verify Redis is Working

1. Go to your app → **Runtime Logs**
2. Look for:
   ```
   ✅ Using Redis for Channels (Production)
   ```

If you see this, **Redis is connected!** ✅

---

## 🧪 Test Collaboration

Now test if collaboration works:

### Test 1: Two Devices
1. Open APK on Device 1
2. Open APK on Device 2
3. Start collaboration
4. Draw on Device 1 → Device 2 should see it instantly ✅

### Test 2: Check Upstash Dashboard
1. Go back to Upstash dashboard
2. Click on your database
3. Go to **"Data Browser"** tab
4. You should see keys like:
   - `asgi:group:collaboration_session_*`
   - `asgi:channel:*`

This confirms WebSocket messages are being stored in Redis! ✅

---

## 💰 Cost & Limits

### Free Tier (What You Get):
- **10,000 commands/day** (~333/hour)
- **256 MB max data size**
- **1 database**
- **100 concurrent connections**

**Is this enough?**
- For **testing & development**: ✅ Yes!
- For **small production** (< 50 concurrent users): ✅ Yes!
- For **larger scale**: Upgrade to $10/month

### Paid Plans:
- **Pay as you go**: $0.2 per 100K commands
- **Fixed**: $10/month for unlimited commands

---

## 🆘 Troubleshooting

### Issue: Still seeing "Using InMemory Channels"

**Solutions**:
1. Verify `REDIS_URL` is set correctly in DigitalOcean
2. Check the URL has NO spaces or typos
3. Verify `DEBUG=False` in production
4. Check deployment logs for Redis connection errors

### Issue: "Connection refused" in logs

**Solutions**:
1. Verify Upstash database is **active** (not paused)
2. Check Upstash dashboard for IP restrictions
3. Ensure you copied the **full URL** including password

### Issue: Collaboration still doesn't work

**Debug steps**:
1. Open Chrome DevTools on mobile (USB debugging)
2. Check Console for WebSocket errors
3. Check Network tab for WebSocket connection status
4. Share logs with me for debugging

---

## 🔄 Alternative: Redis Labs

If you prefer Redis Labs instead:

1. **Sign up**: https://redis.com/try-free/
2. **Create database** (30MB free)
3. **Copy Redis URL**: `redis://default:pass@redis-12345.cloud.redislabs.com:12345`
4. **Add to DigitalOcean** same as Step 4 above

---

## ✅ Summary

**What you did:**
1. ✅ Created free Upstash Redis account
2. ✅ Created Redis database
3. ✅ Added `REDIS_URL` to DigitalOcean
4. ✅ Deployed and verified

**What happens now:**
- Your app uses **Upstash Redis** for WebSockets
- Collaboration works across multiple devices
- PostgreSQL still stores all your data
- Both databases work together seamlessly

---

## 📚 Related Files

- `REDIS_SETUP_DIGITALOCEAN.md` - Original guide (outdated - assumed DO had Redis)
- `MOBILE_COLLABORATION_DIAGNOSIS.md` - Technical deep dive
- `backend/storybookapi/settings.py` - Redis configuration code

---

## 🎉 You're Done!

Once you see "✅ Using Redis for Channels (Production)" in your logs, collaboration should work perfectly!

**Questions? Let me know!**
