# Google Cloud TTS Pricing Information

## Free Tier (Always Free)

Google Cloud offers a **generous free tier** for Text-to-Speech:

### Free Quota (Per Month)
- **Standard voices:** 0 to 4 million characters FREE
- **WaveNet voices:** 0 to 1 million characters FREE
- **Neural2 voices:** 0 to 1 million characters FREE
- **Studio/Journey/Chirp voices:** **NOT included in free tier** ❌

## Voice Pricing Breakdown

### 1. Standard Voices (Basic Quality)
- **Free tier:** First 0-4 million characters/month
- **After free tier:** $4 per 1 million characters
- **Examples:** `en-US-Standard-A`, `fil-PH-Standard-A`

### 2. WaveNet Voices (High Quality)
- **Free tier:** First 0-1 million characters/month ✅
- **After free tier:** $16 per 1 million characters
- **Examples:** `fil-PH-Wavenet-A`, `fil-PH-Wavenet-D`
- **Our Filipino voices use this** ✅

### 3. Neural2 Voices (Premium)
- **Free tier:** First 0-1 million characters/month ✅
- **After free tier:** $16 per 1 million characters
- **Examples:** `en-US-Neural2-C`, `en-US-Neural2-D`

### 4. Studio Voices (Premium)
- **Free tier:** NONE ❌
- **Cost:** $16 per 1 million characters from first character
- **Examples:** `en-US-Studio-O`, `en-US-Studio-Q`

### 5. Journey Voices (Premium)
- **Free tier:** NONE ❌
- **Cost:** $16 per 1 million characters from first character
- **Examples:** `en-US-Journey-D`, `en-US-Journey-F`

### 6. Chirp3-HD Voices (Latest Premium) ⚠️
- **Free tier:** NONE ❌
- **Cost:** $16-20 per 1 million characters from first character
- **Examples:** `en-US-Chirp3-HD-Erinome`, `en-US-Chirp3-HD-Puck`
- **This is what we just configured!**

## ⚠️ IMPORTANT: Chirp3-HD is NOT Free!

### Current Configuration (Chirp3-HD):
```python
'female_english': 'en-US-Chirp3-HD-Erinome'  # ❌ NOT in free tier
'male_english': 'en-US-Chirp3-HD-Puck'       # ❌ NOT in free tier
'female_filipino': 'fil-PH-Wavenet-A'        # ✅ 1M chars/month FREE
'male_filipino': 'fil-PH-Wavenet-D'          # ✅ 1M chars/month FREE
```

**Cost Impact:**
- English stories: **Charged from first character** (no free tier)
- Filipino stories: **First 1M characters FREE**, then $16/1M

## Recommended Configuration Options

### Option 1: Stay 100% Free (Recommended for Testing)
Use **Neural2** for English (has 1M free quota):

```python
VOICES = {
    'female_english': {
        'name': 'en-US-Neural2-C',  # ✅ 1M chars/month FREE
        'language_code': 'en-US',
        'label': 'Female (English Accent)',
        'accent': 'english'
    },
    'male_english': {
        'name': 'en-US-Neural2-D',  # ✅ 1M chars/month FREE
        'language_code': 'en-US',
        'label': 'Male (English Accent)',
        'accent': 'english'
    },
    'female_filipino': {
        'name': 'fil-PH-Wavenet-A',  # ✅ 1M chars/month FREE
        'language_code': 'fil-PH',
        'label': 'Female (Filipino Accent)',
        'accent': 'filipino'
    },
    'male_filipino': {
        'name': 'fil-PH-Wavenet-D',  # ✅ 1M chars/month FREE
        'language_code': 'fil-PH',
        'label': 'Male (Filipino Accent)',
        'accent': 'filipino'
    }
}
```

**Benefits:**
- ✅ 1 million characters FREE per month
- ✅ Good quality (Neural2 and WaveNet)
- ✅ No surprise charges
- ✅ Perfect for development and testing

### Option 2: Best Quality (Chirp3-HD) - Paid Only
Keep current configuration with Chirp3-HD:

```python
# Current configuration (pays from first character)
'female_english': 'en-US-Chirp3-HD-Erinome'  # $16-20 per 1M chars
'male_english': 'en-US-Chirp3-HD-Puck'       # $16-20 per 1M chars
```

**Benefits:**
- ✅ Highest quality available
- ✅ Most natural voices
- ❌ No free tier (costs from first use)

### Option 3: Hybrid Approach
Use WaveNet for English (has free tier) + WaveNet for Filipino:

```python
VOICES = {
    'female_english': {
        'name': 'en-US-Wavenet-F',  # ✅ 1M chars/month FREE
        'language_code': 'en-US',
        'label': 'Female (English Accent)',
        'accent': 'english'
    },
    'male_english': {
        'name': 'en-US-Wavenet-J',  # ✅ 1M chars/month FREE
        'language_code': 'en-US',
        'label': 'Male (English Accent)',
        'accent': 'english'
    },
    'female_filipino': {
        'name': 'fil-PH-Wavenet-A',  # ✅ 1M chars/month FREE
        'language_code': 'fil-PH',
        'label': 'Female (Filipino Accent)',
        'accent': 'filipino'
    },
    'male_filipino': {
        'name': 'fil-PH-Wavenet-D',  # ✅ 1M chars/month FREE
        'language_code': 'fil-PH',
        'label': 'Male (Filipino Accent)',
        'accent': 'filipino'
    }
}
```

**Benefits:**
- ✅ 1 million characters FREE per month
- ✅ High quality (WaveNet)
- ✅ Consistent quality across all languages

## Cost Estimates

### Scenario: 100,000 Characters/Month

#### With Chirp3-HD (Current):
- English stories: 100,000 chars × $16/1M = **$1.60/month** 💰
- Filipino stories: FREE (under 1M limit) = **$0/month** ✅
- **Total: $1.60/month**

#### With Neural2 (Recommended):
- English stories: FREE (under 1M limit) = **$0/month** ✅
- Filipino stories: FREE (under 1M limit) = **$0/month** ✅
- **Total: $0/month** 🎉

#### With WaveNet (Hybrid):
- English stories: FREE (under 1M limit) = **$0/month** ✅
- Filipino stories: FREE (under 1M limit) = **$0/month** ✅
- **Total: $0/month** 🎉

### Scenario: 2 Million Characters/Month (Heavy Usage)

#### With Chirp3-HD:
- English stories: 2M chars × $16/1M = **$32/month** 💰💰
- Filipino stories: 1M FREE + 1M × $16/1M = **$16/month** 💰
- **Total: $48/month**

#### With Neural2:
- English stories: 1M FREE + 1M × $16/1M = **$16/month** 💰
- Filipino stories: 1M FREE + 1M × $16/1M = **$16/month** 💰
- **Total: $32/month**

## Recommendations

### For Development/Testing: Use Neural2 ✅
- 1 million FREE characters/month
- Good quality
- No surprise charges
- Easy to upgrade later

### For Production (Low Usage): Use Neural2 or WaveNet ✅
- If usage < 1M chars/month: **Completely FREE**
- Good quality for most users
- Budget-friendly

### For Production (Premium Experience): Use Chirp3-HD 💰
- Only if budget allows
- Best quality available
- No free tier (pays from first character)
- Best for paid/premium app versions

## How to Check Your Usage

1. Go to: https://console.cloud.google.com/
2. Navigate to: **Billing** → **Reports**
3. Filter by: **Cloud Text-to-Speech API**
4. View: Character count by voice type

## Billing Protection

### Set Budget Alerts:
1. Go to: **Billing** → **Budgets & alerts**
2. Create budget: e.g., $5/month
3. Set alerts at: 50%, 90%, 100%
4. Get email notifications before overspending

## Summary

| Voice Type | Free Tier | Cost After Free | Quality | Recommended? |
|------------|-----------|-----------------|---------|--------------|
| **Neural2** | 1M chars/month | $16/1M | Good | ✅ Yes (for free) |
| **WaveNet** | 1M chars/month | $16/1M | High | ✅ Yes (for free) |
| **Chirp3-HD** | NONE | $16-20/1M | Highest | ⚠️ Only if budget allows |
| **Standard** | 4M chars/month | $4/1M | Basic | ⚠️ Lower quality |

## Current Risk ⚠️

**You are currently configured with Chirp3-HD voices**, which means:
- ❌ **No free tier for English voices**
- 💰 **You will be charged from the first character**
- 📈 **Could get unexpected bills**

**Recommendation:** Change back to Neural2 or WaveNet for free tier access!

---

**Reference:** https://cloud.google.com/text-to-speech/pricing
